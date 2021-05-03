import { SetMetadata } from '@nestjs/common';

import { RoleType } from '../guards/roles.guard';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
