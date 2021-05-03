import { EntityRepository, OrderByCondition, Repository } from 'typeorm';

import { Bid, Plans, ProjectEstimate } from '../entities';
import { BidCostDto } from '../dtos/bid-cost.dto';

@EntityRepository(Bid)
export class BidRepository extends Repository<Bid> {
  public async findById(id: number): Promise<Bid> {
    return this.createQueryBuilder('bid')
      .where('bid.id = :id', { id })
      .leftJoinAndSelect('bid.user', 'user')
      .leftJoinAndSelect('user.profileMedia', 'profileMedia')
      .leftJoinAndSelect('user.userDetail', 'userDetail')
      .leftJoinAndSelect('bid.address', 'address')
      .leftJoinAndSelect('address.state', 'state')
      .andWhere('bid.deleted = false')
      .getOne();
  }

  public async getAllOwned(page: number, limit: number, sortString: string, userId: number): Promise<BidCostDto[]> {
    const query = this.createQueryBuilder('bid')
      .select([
        'bid.id as id',
        'bid.name as name',
        'bid.created as created',
        'address.city as city',
        'state.abbreviation as state',
        'estimate.cost as cost'
      ])
      .addSelect(
        qb =>
          qb
            .select(`COUNT(DISTINCT(plans.id))`, `count`)
            .from('plans', 'plans')
            .where(`plans.bid_id = bid.id AND plans.deleted = 0`),
        `plansCount`
      )
      .leftJoin('bid.address', 'address')
      .leftJoin('address.state', 'state')
      .where('bid.user = :userId', { userId })
      .andWhere('bid.deleted = false');

    const latestEstimatesQuery = subquery =>
      subquery
        .addSelect(['MAX(estimate.id) as "maxId"'])
        .from(ProjectEstimate, 'estimate')
        .groupBy('estimate.bid_id');
    const estimatesQuery = subquery =>
      subquery
        .addSelect(['estimate.bid_id as "bidId"', 'estimate.total_cost as cost'])
        .from(ProjectEstimate, 'estimate')
        .innerJoin(latestEstimatesQuery, 'latestEstimate', 'estimate.id = latestEstimate.maxId');
    query.leftJoin(estimatesQuery, 'estimate', 'bid.id = estimate.bidId');

    const [sortKey, sortValue] = sortString.split(' ');

    switch (sortKey) {
      case 'location':
        query.orderBy({ ['city']: sortValue } as OrderByCondition);
        break;
      case 'cost':
        query.orderBy({ ['cost IS NULL']: 'ASC', ['cost']: sortValue } as OrderByCondition);
        break;
      default:
        query.orderBy({ [`bid.${sortKey || 'id'}`]: sortValue || 'DESC' } as OrderByCondition);
        break;
    }

    query.limit(limit).offset(page * limit);

    return query.getRawMany();
  }

  public async getOwnedCount(userId: number): Promise<number> {
    const query = this.createQueryBuilder('bid')
      .where('bid.user = :userId', { userId })
      .andWhere('bid.deleted = false');

    return query.getCount();
  }
}
