import { Module } from '@nestjs/common';
import { Connection } from 'typeorm';

import { BaseModule } from '../base/base.module';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule, makeRepositoryToken } from '../database/database.module';
import { BidService, PlansService } from './services';
import { BidController, PlanController } from './controllers';
import { Plans } from './entities';
import {
  BidRepository,
  AddressRepository,
  EstimateDataRepository,
  ProjectDetailsRepository,
  ProjectEstimateRepository,
  BidPricingRepository
} from './repositories';

import { BidOwnerRole } from './guards/bid-owner-role';
import { UserRepository } from '../base/repositories';
import { TokenService } from '../base/services';
import { BidPricing } from './entities/bid-pricing.entity';

@Module({
  imports: [BaseModule, ConfigModule, DatabaseModule],
  controllers: [BidController, PlanController],
  providers: [
    BidService,
    BidOwnerRole,
    PlansService,
    TokenService,
    {
      provide: BidRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(BidRepository),
      inject: [Connection]
    },
    {
      provide: ProjectDetailsRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(ProjectDetailsRepository),
      inject: [Connection]
    },
    {
      provide: ProjectEstimateRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(ProjectEstimateRepository),
      inject: [Connection]
    },
    {
      provide: AddressRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(AddressRepository),
      inject: [Connection]
    },
    {
      provide: EstimateDataRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(EstimateDataRepository),
      inject: [Connection]
    },

    {
      provide: makeRepositoryToken(Plans),
      useFactory: (connection: Connection) => connection.getRepository(Plans),
      inject: [Connection]
    },
    {
      provide: UserRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(UserRepository),
      inject: [Connection]
    },
    {
      provide: BidPricingRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(BidPricingRepository),
      inject: [Connection]
    }
  ],
  exports: [BidOwnerRole, BidService]
})
export class BidModule {}
