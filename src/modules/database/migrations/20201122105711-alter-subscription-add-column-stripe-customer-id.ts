import { MigrationInterface, QueryRunner } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

export class AlterSubscriptionAddColumnStripeCustomerId20201122105711 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(
      __dirname,
      'sqls/20201122105711-alter-subscription-add-column-stripe-customer-id.up.sql'
    );
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const filePath = path.join(
      __dirname,
      'sqls/20201122105711-alter-subscription-add-column-stripe-customer-id.down.sql'
    );
    const sql = fs.readFileSync(filePath, { encoding: 'utf-8' });
    return queryRunner.query(sql);
  }
}
