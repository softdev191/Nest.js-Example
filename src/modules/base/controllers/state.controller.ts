import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../../decorators';
import { EveryoneRole } from '../roles';
import { State } from '../../bid/entities';
import { StateService } from '../services';

@Controller('states')
export class StateController {
  public constructor(private readonly stateService: StateService) {}

  @Roles(EveryoneRole)
  @Get()
  public async getStates(): Promise<State[]> {
    return this.stateService.getAll();
  }
}
