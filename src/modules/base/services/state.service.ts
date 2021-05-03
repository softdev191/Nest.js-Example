import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { State } from '../../bid/entities';
import { InjectRepository } from '../../database/database.module';

@Injectable()
export class StateService {
  public constructor(@InjectRepository(State) private readonly stateRepository: Repository<State>) {}

  public async getAll(): Promise<State[]> {
    return this.stateRepository.find();
  }

  public async findById(id: number): Promise<State> {
    return this.stateRepository.findOne({ id });
  }
}
