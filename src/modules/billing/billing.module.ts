import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { Connection } from 'typeorm';

import { BaseModule } from '../base/base.module';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule, makeRepositoryToken } from '../database/database.module';
import { SubscriptionController } from './controllers/subscription.controller';
import { Card } from './entities';
import { SubscriptionRepository } from './repositories';
import { StripeService } from './services/stripe.service';
import { SubscriptionService } from './services/subscription.service';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { JsonBodyMiddleware } from './middleware/json-body.middleware';

@Module({
  imports: [BaseModule, ConfigModule, DatabaseModule],
  controllers: [SubscriptionController],
  providers: [
    SubscriptionService,
    StripeService,
    {
      provide: SubscriptionRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(SubscriptionRepository),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(Card),
      useFactory: (connection: Connection) => connection.getRepository(Card),
      inject: [Connection]
    }
  ],
  exports: [SubscriptionService]
})
export class BillingModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({
        path: '/subscriptions/hook',
        method: RequestMethod.POST
      })
      .apply(JsonBodyMiddleware)
      .forRoutes('*');
  }
}
