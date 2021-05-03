/* eslint-disable @typescript-eslint/no-explicit-any */
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';

import { ConfigModule, DatabaseModule, BaseModule, HealthModule, BidModule, BillingModule } from './modules';

import { RolesGuard } from './guards/roles.guard';
import { TokenMiddleware } from './modules/base/token.middleware';

import cookieParser = require('cookie-parser');
import helmet = require('helmet');
import { versionHeaderMiddleware } from './middleware/version-header.middleware';
import { ConfigService } from './modules/config/config.service';

@Module({
  imports: [ConfigModule, ConsoleModule, DatabaseModule, BaseModule, HealthModule, BidModule, BillingModule],
  providers: [RolesGuard]
})
export class ApplicationModule implements NestModule {
  public constructor(private readonly configService: ConfigService) {}

  public configure(consumer: MiddlewareConsumer): void {
    const cookieConfig = this.configService.get('cookie');
    consumer
      .apply([versionHeaderMiddleware, cookieParser(cookieConfig.secret), helmet(), TokenMiddleware] as any)
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL
      });
  }
}
