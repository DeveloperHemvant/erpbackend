import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

/**
 * Global catch-all — same configured/not_configured pattern already proven
 * for Razorpay/S3/Twilio (see storage.service.ts): Sentry.captureException
 * is a harmless no-op when Sentry.init was never called (no SENTRY_DSN),
 * so this always reports, and just does nothing extra until a real DSN is
 * supplied. Every exception is also logged locally regardless, since that
 * shouldn't depend on an external service being configured. Response
 * shaping is untouched — delegates to Nest's own BaseExceptionFilter so
 * existing status codes/error bodies across the app don't change.
 */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('UnhandledException');

  constructor(httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const isClientError =
      exception instanceof HttpException && exception.getStatus() < 500;

    if (!isClientError) {
      const request = host.switchToHttp().getRequest();
      this.logger.error(
        `${request?.method ?? ''} ${request?.url ?? ''} — ${
          exception instanceof Error ? exception.message : String(exception)
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
