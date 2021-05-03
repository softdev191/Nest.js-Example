import { Injectable } from '@nestjs/common';
import { State } from '../entities';
import { InjectRepository } from '../..';
import { Repository } from 'typeorm';

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
