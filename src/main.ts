import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  // Same configured/not_configured pattern as Razorpay/S3/Twilio — no DSN
  // means this is a no-op and AllExceptionsFilter's captureException calls
  // go nowhere; set SENTRY_DSN in the environment to activate it live.
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase request body size limit. verify: stashes the exact raw bytes
  // onto req.rawBody — needed by the Razorpay webhook, whose signature is
  // computed over the raw body, not the parsed/re-serialized JSON (which can
  // differ in key order/whitespace and would break HMAC verification).
  app.use(
    express.json({
      limit: '50mb',
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve uploaded images (events, announcements, ...) back out as static files.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS — allow all origins
  app.enableCors({ origin: true, credentials: true });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('School ERP Backend Engine')
    .setDescription(
      'Secure REST APIs managing Roles, Staff Access Lists, Audit Logging, and Geofenced Biometric Check-ins.',
    )
    .setVersion('1.0.0')
    .addTag('Authentication Portal')
    .addTag('Role Settings')
    .addTag('Staff Onboarding')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  console.log(`Backend Engine running on http://localhost:${port}`);
}
void bootstrap();
