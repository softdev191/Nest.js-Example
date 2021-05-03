import { ApiProperty } from '@nestjs/swagger';
import { Card, Subscription } from '../../billing/entities';

/** Validations can be skipped, this is used for response only. */
export class UserGetSubscriptionDto {
  @ApiProperty()
  subscription: Subscription;

  @ApiProperty()
  card: Card;

  @ApiProperty()
  trialEnded: boolean;
}
