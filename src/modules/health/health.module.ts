import { Module } from '@nestjs/common';

import { BaseModule } from '../base/base.module';
import { ConfigModule } from '../config/config.module';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [ConfigModule, BaseModule],
  controllers: [HealthController],
  providers: [],
  exports: []
})
export class HealthModule {}
