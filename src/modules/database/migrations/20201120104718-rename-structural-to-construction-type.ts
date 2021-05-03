import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class RenameStructuralToConstructionType20201120104718 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20201120104718-rename-structural-to-construction-type.up.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20201120104718-rename-structural-to-construction-type.down.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }
}
