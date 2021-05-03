import { EntityRepository, Repository } from 'typeorm';

import { ProjectEstimate } from '../entities';

@EntityRepository(ProjectEstimate)
export class ProjectEstimateRepository extends Repository<ProjectEstimate> {
  public async findByBidId(id: number): Promise<ProjectEstimate> {
    return this.createQueryBuilder('estimate')
      .innerJoin('estimate.bid', 'bid')
      .where('bid.id = :id', { id })
      .andWhere('bid.deleted = false AND estimate.deleted = false')
      .getOne();
  }
}
