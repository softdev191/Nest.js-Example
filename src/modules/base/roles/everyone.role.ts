import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { User } from '../entities';
import { RoleResolver } from '../../../guards/roles.guard';

@Injectable()
export class EveryoneRole extends RoleResolver {
  async resolve(user: User, request: Request): Promise<boolean> {
    return true;
  }
}
