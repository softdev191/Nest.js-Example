import { HttpModule, Module } from '@nestjs/common';
import { Connection } from 'typeorm';

import { AuthenticatedRole, EveryoneRole, UserOwnerRole, UserRegisterRole, UserUpdateRole } from './roles';
import {
  TokenService,
  EmailService,
  MediaService,
  ReportService,
  TestService,
  UserService,
  StateService,
  InquiryService
} from './services';

import {
  MediaController,
  ReportController,
  UserController,
  RolesController,
  StateController,
  InquiryController
} from './controllers';
import { Device, Media, Report, Role } from './entities';
import { TokenRepository, UserRepository, UserRoleRepository } from './repositories';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule, makeRepositoryToken } from '../database/database.module';
import { UserDetail } from './entities/user-detail.entity';
import { State } from '../bid/entities';
import { BidPricingRepository } from '../bid/repositories';
import { SubscriptionRepository } from '../billing/repositories';

@Module({
  imports: [ConfigModule, DatabaseModule, HttpModule],
  controllers: [MediaController, ReportController, UserController, RolesController, StateController, InquiryController],
  providers: [
    TokenService,
    EmailService,
    MediaService,
    ReportService,
    UserService,
    TestService,
    StateService,
    InquiryService,
    AuthenticatedRole,
    EveryoneRole,
    UserOwnerRole,
    UserRegisterRole,
    UserUpdateRole,
    {
      provide: TokenRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(TokenRepository),
      inject: [Connection]
    },
    {
      provide: UserRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(UserRepository),
      inject: [Connection]
    },
    {
      provide: UserRoleRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(UserRoleRepository),
      inject: [Connection]
    },
    {
      provide: SubscriptionRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(SubscriptionRepository),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(Device),
      useFactory: (connection: Connection) => connection.getRepository(Device),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(Media),
      useFactory: (connection: Connection) => connection.getRepository(Media),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(Report),
      useFactory: (connection: Connection) => connection.getRepository(Report),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(Role),
      useFactory: (connection: Connection) => connection.getRepository(Role),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(State),
      useFactory: (connection: Connection) => connection.getRepository(State),
      inject: [Connection]
    },
    {
      provide: makeRepositoryToken(UserDetail),
      useFactory: (connection: Connection) => connection.getRepository(UserDetail),
      inject: [Connection]
    },
    {
      provide: BidPricingRepository,
      useFactory: (connection: Connection) => connection.getCustomRepository(BidPricingRepository),
      inject: [Connection]
    }
  ],
  exports: [
    AuthenticatedRole,
    EveryoneRole,
    UserOwnerRole,
    UserRegisterRole,
    UserUpdateRole,
    UserService,
    StateService,
    InquiryService,
    ReportService,
    TokenService,
    TokenRepository
  ]
})
export class BaseModule {}
