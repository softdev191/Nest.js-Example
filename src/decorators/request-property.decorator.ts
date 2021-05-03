import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RequestProperty = createParamDecorator((data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req[data];
});
