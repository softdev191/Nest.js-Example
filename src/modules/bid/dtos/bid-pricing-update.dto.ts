import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { BidPricingSelection } from '../enums';

export class BidPricingUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  selected: BidPricingSelection;
}
