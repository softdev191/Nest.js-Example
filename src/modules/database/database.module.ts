import { Inject, Module, Global } from '@nestjs/common';
import { createConnection, Connection } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

import { ConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';

export function makeRepositoryToken(entity: Function) {
  return `${entity.name}RepositoryToken`;
}

export function InjectRepository(entity: Function) {
  return Inject(makeRepositoryToken(entity));
}

const databaseProviders = [
  {
    provide: Connection,
    useFactory: async (configService: ConfigService) => {
      const config = configService.get('database');
      return await createConnection({
        type: config.type,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: config.database,
        extra: {
          idleTimeoutMillis: config.poolIdleTimeout || undefined,
          max: config.poolMax, // Postgres
          connectionLimit: config.poolMax, // MySQL
          ssl: config.ssl,
          multipleStatements: true // used for MySQL
        },
        entities: [
          __dirname + '/../../**/*.entity{.ts,.js}',
        ],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        namingStrategy: new SnakeNamingStrategy(), // https://github.com/typeorm/typeorm/issues/2200
        synchronize: false,
        logging: false
      });
    },
    inject: [ConfigService]
  },
  DatabaseService
];

@Global()
@Module({
  exports: databaseProviders,
  providers: databaseProviders
})
export class DatabaseModule {}
