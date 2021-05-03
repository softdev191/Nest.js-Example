import 'source-map-support/register';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Context, Handler } from 'aws-lambda';
import * as serverless from 'aws-serverless-express';
import * as morgan from 'morgan';
import * as json from 'morgan-json';

import { ApplicationModule } from './app.module';
import { ConfigService } from './modules/config/config.service';
import { LogService } from './modules/base/services/log.service';
import { RolesGuard } from './guards/roles.guard';
import { MeInterceptor } from './interceptors';

const express = require('express')(); // eslint-disable-line @typescript-eslint/no-var-requires

export function configureApp(app) {
  const configService = app.get(ConfigService);
  const apiConfig = configService.get('api');
  app.setGlobalPrefix(apiConfig.basePath);

  const moduleRef = app.select(ApplicationModule);
  const reflector = moduleRef.get(Reflector);
  const rolesGuard = new RolesGuard(moduleRef, reflector);
  app.useGlobalGuards(rolesGuard);

  app.useGlobalInterceptors(new MeInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
}

let cachedServer;
const createServer = () => {
  const env = process.env.NODE_ENV || 'development';
  // configure logging
  const logger = env === 'development' ? new Logger() : new LogService();
  if (logger) {
    const format = json(':remote-addr :method :url :status :res[content-length] :referrer :user-agent');
    express.use(
      morgan(format, {
        stream: {
          write: (objString: string) => {
            // Yes, the JSON.parse() is terrible.
            // But morgan concatenates the obj with "\n" before calling write().
            logger.log({ ...JSON.parse(objString), tag: 'request' });
          }
        }
      })
    );
  } else {
    express.use(morgan('dev'));
  }

  return new Promise(resolve => {
    NestFactory.create(ApplicationModule, new ExpressAdapter(express), { logger }).then(app => {
      app.enableCors();
      configureApp(app);
      app.init().then(() => {
        resolve(serverless.createServer(express));
      });
    });
  });
};

export const handler: Handler = (event: any, context: Context) => {
  if (cachedServer) {
    serverless.proxy(cachedServer, event, context);
  } else {
    createServer().then(server => {
      cachedServer = server;
      return serverless.proxy(cachedServer, event, context);
    });
  }
};
