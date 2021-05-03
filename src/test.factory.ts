import { ExpressAdapter } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Connection } from 'typeorm';

import express = require('express');
import supertest = require('supertest');

import { ApplicationModule } from './app.module';
import { DatabaseModule } from './modules/database/database.module';
import { Device, Report, Role } from './modules/base/entities';
import { TokenRepository, UserRepository, UserRoleRepository } from './modules/base/repositories';
import { configureApp } from './main';
import { TestService, TokenService, UserService } from './modules/base/services';
import { UserDetail } from './modules/base/entities/user-detail.entity';
import { AddressRepository, BidRepository, ProjectDetailsRepository } from './modules/bid/repositories';
import { BidService } from './modules/bid/services';
import { EstimateData, State } from './modules/bid/entities';
import { SubscriptionRepository } from './modules/billing/repositories';

/** Used to inject mock services without test classes getting imported in production build. */
export type OverrideProviders = {
  /** Services, Controllers class */
  provider: any;
  /** Alternative mock instance. Example: new MockService(someargs)*/
  mock: any;
};

const TestFactory = {
  createTestModule: async (options?: { overrideProviders: OverrideProviders[] }) => {
    // instantiate server/app/supertest/
    const expressServer = express();

    const moduleBuilder = await Test.createTestingModule({ imports: [ApplicationModule] });
    if (options && options.overrideProviders.length > 0) {
      for (const override of options.overrideProviders) {
        moduleBuilder.overrideProvider(override.provider).useValue(override.mock);
      }
    }
    const module = await moduleBuilder.compile();

    const applicationModule = await module.createNestApplication(new ExpressAdapter(expressServer));
    configureApp(applicationModule);
    await applicationModule.init();
    const server = supertest(expressServer);

    // reset database
    const testService = applicationModule.select(ApplicationModule).get(TestService);
    await testService.resetDatabase();

    const databaseModule = applicationModule.select(DatabaseModule).get(Connection);

    return {
      repositories: {
        tokenRepository: databaseModule.getCustomRepository(TokenRepository),
        deviceRepository: databaseModule.getRepository(Device),
        reportRepository: databaseModule.getRepository(Report),
        roleRepository: databaseModule.getRepository(Role),
        userRepository: databaseModule.getCustomRepository(UserRepository),
        userRoleRepository: databaseModule.getCustomRepository(UserRoleRepository),
        userDetailRepository: databaseModule.getRepository(UserDetail),
        bidRepository: databaseModule.getCustomRepository(BidRepository),
        estimateDataRepository: databaseModule.getRepository(EstimateData),
        addressRepository: databaseModule.getCustomRepository(AddressRepository),
        stateRepository: databaseModule.getRepository(State),
        projectDetailsRepository: databaseModule.getCustomRepository(ProjectDetailsRepository),
        subscriptionRepository: databaseModule.getCustomRepository(SubscriptionRepository)
      },
      services: {
        tokenService: applicationModule.select(ApplicationModule).get(TokenService),
        userService: applicationModule.select(ApplicationModule).get(UserService),
        bidService: applicationModule.select(ApplicationModule).get(BidService)
      },
      connection: databaseModule,
      server
    };
  }
};

// will return object type if it is not a promise -or- will return the type that the promise is wrapping
type Unpacked<T> = T extends (infer U)[]
  ? U
  : T extends (...args: any[]) => infer U // eslint-disable-line @typescript-eslint/no-explicit-any
  ? U
  : T extends Promise<infer U>
  ? U
  : T;

export type TestingModuleMetadata = Unpacked<Unpacked<typeof TestFactory.createTestModule>>;
export default TestFactory;
