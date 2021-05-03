import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

/** starts with alpha and contain numbers, underscores. */
const ALPHANUMERIC_UNDERSCORE = /^[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)*$/;

export class UserLoginDto {
  @ApiProperty()
  @IsNotEmpty()
  @Matches(ALPHANUMERIC_UNDERSCORE)
  public username: string;

  @ApiProperty()
  @IsNotEmpty()
  public password: string;
}
