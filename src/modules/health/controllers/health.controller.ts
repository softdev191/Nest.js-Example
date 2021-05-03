import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../decorators';
import { EveryoneRole } from '../../base/roles';
import { TokenRepository } from '../../base/repositories';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  public constructor(private readonly tokenRepository: TokenRepository) {}

  @Roles(EveryoneRole)
  @Get()
  public async getHealth() {
    await this.tokenRepository.findOne();
    return { status: 'OK' };
  }
}
