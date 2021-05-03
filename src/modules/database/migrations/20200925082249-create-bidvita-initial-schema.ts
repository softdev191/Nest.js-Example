import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class CreateBidvitaInitialSchema20200925082249 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20200925082249-create-bidvita-initial-schema.up.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20200925082249-create-bidvita-initial-schema.down.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }
}
