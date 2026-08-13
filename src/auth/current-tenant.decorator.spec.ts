import { InternalServerErrorException } from '@nestjs/common';

// createParamDecorator wraps the factory in metadata plumbing that's awkward
// to invoke directly in a unit test; the codebase has no existing precedent
// for testing a param-decorator's factory in isolation (CurrentUser has no
// spec either). This test reaches the underlying factory the same way
// NestJS's own decorator-testing docs recommend: call the decorator with a
// no-op target to get the underlying param-decorator function, then invoke
// it directly with a mock ExecutionContext.
import { CurrentTenant } from './current-tenant.decorator';

function getParamDecoratorFactory(decorator: Function) {
  const Deco = decorator as (...args: any[]) => ParameterDecorator;
  class Test {
    public test(@Deco() _value: unknown) {}
  }
  const args = Reflect.getMetadata('__routeArguments__', Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentTenant decorator', () => {
  const factory = getParamDecoratorFactory(CurrentTenant);

  const makeContext = (request: any) =>
    ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;

  it('returns request.tenantContext when the interceptor populated it', () => {
    const tenantContext = { userId: 'staff-1', campusId: 'campus-a' };
    const result = factory(undefined, makeContext({ tenantContext }));
    expect(result).toBe(tenantContext);
  });

  it('throws loudly instead of returning undefined when the interceptor was forgotten', () => {
    expect(() => factory(undefined, makeContext({}))).toThrow(
      InternalServerErrorException,
    );
  });
});
