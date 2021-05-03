import { Controller, Post, Body } from '@nestjs/common';

import { AuthenticatedRole } from '../../base/roles';
import { Roles } from '../../../decorators';
import { Plans } from '../entities';
import { PlanCreateDto } from '../dtos';
import { PlansService } from '../services';

@Controller('plans')
export class PlanController {
  public constructor(private readonly planService: PlansService) {}

  @Roles(AuthenticatedRole)
  @Post()
  public async create(@Body() plan: PlanCreateDto): Promise<Plans> {
    return this.planService.createPlan(plan);
  }
}
