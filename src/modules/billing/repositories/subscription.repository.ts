import { EntityRepository, Repository } from 'typeorm';
import { isNil } from 'lodash';

import { Subscription } from '../entities';
import { SubscriptionStatus } from '../../bid/enums';
import { SubscriptionType } from '../enums';

@EntityRepository(Subscription)
export class SubscriptionRepository extends Repository<Subscription> {
  public async findByUserId(userId: number, type?: SubscriptionType): Promise<Subscription> {
    const query = this.createQueryBuilder('subscription')
      .where('subscription.user_id = :userId', { userId })
      .andWhere('subscription.deleted = false');

    if (!isNil(type) && type in SubscriptionType) {
      query.andWhere('subscription.type = :type', { type });
    }

    return query.getOne();
  }

  public async getActiveSubscription(userId: number): Promise<Subscription> {
    return this.createQueryBuilder('subscription')
      .where('subscription.user_id = :id', { id: userId })
      .andWhere('subscription.deleted = false')
      .andWhere('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .leftJoinAndSelect('subscription.user', 'user')
      .getOne();
  }

  public async findById(id: number): Promise<Subscription> {
    return this.createQueryBuilder('subscription')
      .where('subscription.id = :id ', { id })
      .andWhere('subscription.deleted = false')
      .getOne();
  }
}
