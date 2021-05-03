import { EntityRepository, Repository } from 'typeorm';

import { ProjectDetails } from '../entities';

@EntityRepository(ProjectDetails)
export class ProjectDetailsRepository extends Repository<ProjectDetails> {
  public async findByBidId(id: number): Promise<ProjectDetails> {
    return this.createQueryBuilder('details')
      .innerJoin('details.bid', 'bid')
      .where('bid.id = :id', { id })
      .andWhere('bid.deleted = false')
      .getOne();
  }
}
