import { Console, Command } from 'nestjs-console';
import { Connection } from 'typeorm';

import * as dateFns from 'date-fns';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

@Console({
  name: 'db',
  description: 'Database related commands (migrations, etc)'
})
export class DatabaseService {
  constructor(private readonly connection: Connection) {}

  @Command({
    command: 'migrate:up',
    description: 'Run migrations up'
  })
  async migrateUp() {
    await this.connection.runMigrations();
    process.exit(0);
  }

  @Command({
    command: 'migrate:down',
    description: 'Run migration one migration down'
  })
  async migrateDown() {
    await this.connection.undoLastMigration();
    process.exit(0);
  }

  @Command({
    command: 'migrate:create <name>',
    description: 'Creates a new migration'
  })
  async create(name: string) {
    const migrationPath = path.resolve(
      __dirname,
      'migrations'
    );
    const sqlDir = path.resolve(
      migrationPath,
      'sqls'
    );
    try {
      fs.mkdirSync(sqlDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw(err);
      }
    }

    if (!name) {
      console.log(
        'Please specify a name for your migration in camelCase or kebab-case.'
      );
      return;
    }
    const date = dateFns.format(new Date(), 'yyyyMMddHHmmss');
    const kebabName = _.kebabCase(name);
    let camelName = _.camelCase(name);
    camelName = camelName.charAt(0).toUpperCase() + camelName.slice(1);

    const baseFilename = `${date}-${kebabName}`;
    const newFilename = path.resolve(
      migrationPath,
      `${baseFilename}.ts`
    );
    console.log(newFilename);
    const className = camelName + date;

    const template = `import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class ${className} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/${baseFilename}.up.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8'});
    return queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/${baseFilename}.down.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8'});
    return queryRunner.query(sql);
  }
}
`;
    await this.writeFile(newFilename, template);

    const upSql = '-- SQL statements for the UP migration';
    const upFilename = path.resolve(
      migrationPath,
      'sqls',
      `${date}-${kebabName}.up.sql`
    );
    console.log(upFilename);
    await this.writeFile(upFilename, upSql);

    const downSql = '-- SQL statements for the DOWN migration';
    const downFilename = path.resolve(
      migrationPath,
      'sqls',
      `${date}-${kebabName}.down.sql`
    );
    console.log(downFilename);
    await this.writeFile(downFilename, downSql);

    process.exit(0);
  }

  async writeFile(filename, data) {
    return new Promise((resolve, reject) => {
      fs.writeFile(filename, data, err => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
