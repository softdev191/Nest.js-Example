import { EntityRepository, Repository } from 'typeorm';

import { Address, Bid } from '../entities';

@EntityRepository(Address)
export class AddressRepository extends Repository<Address> {
  public async findByBidId(bidId: number): Promise<Address> {
    return this.createQueryBuilder('address')
      .innerJoin(Bid, 'bids', 'address.id = bids.address')
      .where('bids.id = :id', { id: bidId })
      .getOne();
  }
}
