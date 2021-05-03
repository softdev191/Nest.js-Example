import { EntityRepository, Repository } from 'typeorm';
import { BidPricing } from '../entities';

@EntityRepository(BidPricing)
export class BidPricingRepository extends Repository<BidPricing> {
  public async findByBidId(id: number): Promise<BidPricing> {
    return this.createQueryBuilder('pricing')
      .innerJoin('pricing.bid', 'bid')
      .where('bid.id = :id', { id })
      .andWhere('bid.deleted = false AND pricing.deleted = false')
      .getOne();
  }
}
