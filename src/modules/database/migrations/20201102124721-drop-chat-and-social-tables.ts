import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class DropChatAndSocialTables20201102124721 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20201102124721-drop-chat-and-social-tables.up.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(__dirname, 'sqls/20201102124721-drop-chat-and-social-tables.down.sql');
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }
}
