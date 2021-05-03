import { EntityRepository, Repository } from 'typeorm';

import { EstimateData } from '../entities';

@EntityRepository(EstimateData)
export class EstimateDataRepository extends Repository<EstimateData> {
  public async getLatest(): Promise<EstimateData> {
    return this.createQueryBuilder('estimateData')
      .orderBy('id', 'DESC')
      .getOne();
  }
}
