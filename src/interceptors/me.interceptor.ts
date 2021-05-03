import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';

@Injectable()
export class MeInterceptor implements NestInterceptor {
  public async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest();
    const token = request.token;

    if (token && token.sub) {
      // perform 'me' substitution
      const keys = Object.keys(request.params || {});

      if (keys.length > 0) {
        for (const key of keys) {
          if (request.params[key] === 'me') {
            // TODO do we need to make model and primarykey configurable/discoverable?
            request.params[key] = token.sub.toString();
          }
        }
      }
    }

    return next.handle();
  }
}
