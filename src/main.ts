import 'source-map-support/register';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as morgan from 'morgan';
import * as json from 'morgan-json';

import { ApplicationModule } from './app.module';
import { ConfigService } from './modules/config/config.service';
import { LogService } from './modules/base/services/log.service';
import { RolesGuard } from './guards/roles.guard';
import { MeInterceptor } from './interceptors';

import * as path from 'path';
import * as express from 'express';

export function configureApp(app): void {
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

function configureClient(configService, expressServer): void {
  const apiConfig = configService.get('api');
  expressServer.get('/config.js', (req, res) => {
    const clientConfig = configService.load('client');
    res.set('Content-Type', 'application/javascript; charset=UTF-8');
    res.send(`window.config = ${JSON.stringify(clientConfig)};`);
  });

  const outDir = __dirname + '/../client';
  expressServer.use(express.static(outDir));
  expressServer.get('*', (req, res, next) => {
    if (req.path.indexOf(`${apiConfig.basePath}/`) === 0) {
      next();
    } else if (req.path.match(/\.(html|css|png|jpg|ttf|js|ico)$/)) {
      res.status(404).send('Not found');
    } else {
      res.sendFile(path.join(outDir, 'index.html'));
    }
  });
}

function configureSwagger(app): void {
  const configService = app.get(ConfigService);
  const apiConfig = configService.get('api');
  if (!apiConfig.explorer) {
    return;
  }

  const options = new DocumentBuilder().addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(apiConfig.explorerPath, app, document);
}

async function bootstrap(): Promise<void> {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  const expressServer = express();

  // configure logging
  const logger = isDevelopment ? new Logger() : new LogService();
  if (!isDevelopment) {
    const format = json(':remote-addr :method :url :status :res[content-length] :referrer :user-agent');
    expressServer.use(
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
    expressServer.use(morgan('dev'));
  }

  const app = await NestFactory.create(ApplicationModule, new ExpressAdapter(expressServer), { logger });

  const configService = app.get(ConfigService);

  // configureClient(expressServer);

  app.enableCors();
  configureApp(app);
  configureSwagger(app);
  await app.init();

  const port = configService.get('http.port');
  await app.listen(port);
  logger.log(`Listening on ${port}`);
}

declare let global: any;

if (require.main === module || global.PhusionPassenger) {
  bootstrap();
}
