import * as crypto from 'crypto';
import { EntityRepository, Repository, DeleteResult } from 'typeorm';

import { Token } from '../entities';

@EntityRepository(Token)
export class TokenRepository extends Repository<Token> {
  public async findById(id: string): Promise<Token> {
    return this.createQueryBuilder('token')
      .innerJoinAndSelect('token.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('token.id = :id AND token.expiration > current_timestamp')
      .setParameters({ id: this.hash(id) })
      .getOne();
  }

  public async findByUserId(userId: number): Promise<Token> {
    return this.createQueryBuilder('token')
      .innerJoinAndSelect('token.user', 'user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('token.user_id = :userId AND token.expiration > current_timestamp')
      .setParameters({ userId })
      .getOne();
  }

  public async cleanExpired(): Promise<DeleteResult> {
    return this.createQueryBuilder('token')
      .delete()
      .where('token.expiration < current_timestamp')
      .execute();
  }

  public async clearOtherTokensForUserId(hashedToken: string, userId: number): Promise<DeleteResult> {
    return this.createQueryBuilder('token')
      .delete()
      .where('token.id <> :hashedToken AND token.user_id = :userId')
      .setParameters({ hashedToken, userId })
      .execute();
  }

  public async deleteToken(id: string): Promise<DeleteResult> {
    return this.createQueryBuilder('token')
      .delete()
      .where('token.id = :id AND token.expiration > current_timestamp')
      .setParameters({ id: this.hash(id) })
      .execute();
  }

  public async saveAsHash(refreshToken: Token): Promise<Token> {
    const token = {
      ...refreshToken,
      id: this.hash(refreshToken.id)
    };
    await this.save(token);
    return refreshToken;
  }

  private hash(input): string {
    return crypto
      .createHmac('sha256', '')
      .update(input)
      .digest('hex');
  }
}
