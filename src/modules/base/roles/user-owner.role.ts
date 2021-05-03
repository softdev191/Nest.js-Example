import { Injectable } from '@nestjs/common';
import { Request } from 'express';

import { User } from '../entities';
import { RoleResolver } from '../../../guards/roles.guard';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class UserOwnerRole extends RoleResolver {
  constructor(
    // we don't actually need any dependencies, but this serves as an example too
    // Dependencies should be in the same module or an imported module.
    // Figuring out that dependency tree could get messy. For now we just put the Roles in app.module.
    private readonly configService: ConfigService
  ) {
    super();
  }

  async resolve(user: User, request: Request): Promise<boolean> {
    let retval = false;
    if (request && request.params) {
      retval = user && (parseInt(request.params.id, 10) === user.id || request.params.id === 'me');
    }

    return retval;
  }
}
