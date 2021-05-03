import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { User } from '../entities';
import { RoleResolver } from '../../../guards/roles.guard';

@Injectable()
export class AuthenticatedRole extends RoleResolver {
  async resolve(user: User, request: Request): Promise<boolean> {
    const { query } = request;
    let userId = user ? user.id : null;
    if (!userId && query?.token) {
      const { sub: id } = jwt.decode(query.token);
      userId = parseInt(id, 10);
    }
    return !!userId;
  }
}
