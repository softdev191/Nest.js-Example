import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { User, Role } from '../entities';
import { RoleResolver } from '../../../guards/roles.guard';

@Injectable()
export class UserUpdateRole extends RoleResolver {
  public async resolve(user: User, request: Request): Promise<boolean> {
    if (request && request.params) {
      // check if user wants to update profile and add himself as an Admin
      const adminCheck = (role: Role) => role.name === 'Admin' || role.id === 1;
      if (request.body.roles && request.body.roles.some(adminCheck)) {
        if (!user.roles || !user.roles.some(adminCheck)) {
          return false;
        }
      }
      // user can only update his own profile
      return user && (parseInt(request.params.id, 10) === user.id || request.params.id === 'me');
    } else return false;
  }
}
