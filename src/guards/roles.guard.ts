import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { Request } from 'express';

type Constructor<T = {}> = new (...args: any[]) => T;

export type RoleType = string | RoleResolver | Constructor<RoleResolver>;

export abstract class RoleResolver {
  abstract async resolve(user, request: Request): Promise<boolean>;
}

@Injectable()
export class RolesGuard implements CanActivate {
  public constructor(private readonly moduleRef: ModuleRef, private readonly reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const request = context.getArgByIndex(0); // this will be an Express Request or a Socket.io Socket
    const roles = this.reflector.get<RoleType[]>('roles', handler) || [];

    const user = request.token && { id: request.token.sub, username: request.token.name, roles: request.token.roles };
    const uRoles = (user && user.roles) || [];

    // first, test to see if any of the user's roles are in the acceptable roles
    for (const role of uRoles) {
      if (roles.indexOf(role.name) > -1) {
        return true;
      }
    }

    // second, test the programmatic roles
    // always run the programatic roles, maybe some don't depend on token (like $everyone)
    for (const pRole of roles) {
      if (typeof pRole === 'string') {
        continue;
      } else if (pRole instanceof RoleResolver) {
        if (await pRole.resolve(user, request)) {
          return true;
        }
      } else if (typeof pRole === 'function') {
        // function/class that needs to be resolved via DI
        const instance = this.moduleRef.get(pRole) as RoleResolver;
        if (instance) {
          if (await instance.resolve(user, request)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}
