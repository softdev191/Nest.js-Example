import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../decorators';
import { UserService } from '../services';
import { Role } from '../entities';

@ApiBearerAuth()
@ApiTags('Role')
@Controller('roles')
export class RolesController {
  public constructor(private readonly userService: UserService) {}

  @Roles('Admin')
  @Get()
  public async getAllRoles(): Promise<Role[]> {
    return await this.userService.getAllRoles();
  }
}
