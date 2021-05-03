import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

@Injectable()
export class TestService {
  public constructor(private readonly connection: Connection) {}

  public async resetDatabase() {
    if (!['test', 'development'].includes(process.env.NODE_ENV)) {
      throw new Error('resetDatabase() is only available in NODE_ENV `test` or `development`');
    }

    if (this.connection.options.type === 'postgres') {
      const tables = await this.connection.query(`
        SELECT string_agg(table_name,'", "') AS tables
        FROM (SELECT table_name
              FROM information_schema.tables
              WHERE table_schema = 'public' AND
                    table_type = 'BASE TABLE' AND
                    table_name != 'spatial_ref_sys') AS table_names`);
      if (tables && tables[0] && tables[0].tables) {
        await this.connection.query(`DROP TABLE "${tables[0].tables}" CASCADE`);
      }
    } else if (this.connection.options.type === 'mysql') {
      // Different version of MySQL return table_name in different case
      // We alias it here to a specific case.
      const tables = await this.connection.query(`
        SELECT table_name as "TABLE_NAME"
        FROM information_schema.tables
        WHERE table_schema='${this.connection.options.database}'`);
      if (tables.length > 0) {
        const tableStr = tables.map(t => '`' + t['TABLE_NAME'] + '`').join(', ');
        await this.connection.query(`
          SET FOREIGN_KEY_CHECKS=0;
          DROP TABLE IF EXISTS ${tableStr} CASCADE;
          SET FOREIGN_KEY_CHECKS=1;`);
      }
    } else {
      console.log('TestService#resetDatabase - Unsupported database type:', this.connection.options.type);
    }
    await this.connection.runMigrations();
  }
}
