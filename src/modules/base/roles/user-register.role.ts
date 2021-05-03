import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { User, Role } from '../entities';
import { RoleResolver } from '../../../guards/roles.guard';

@Injectable()
export class UserRegisterRole extends RoleResolver {
  public async resolve(user: User, request: Request): Promise<boolean> {
    const adminCheck = (role: Role) => role.name === 'Admin' || role.id === 1;
    if (request.body.roles && request.body.roles.some(adminCheck)) {
      if (user && user.roles.some(adminCheck)) {
        return true;
      } else return false;
    } else return true;
  }
}
