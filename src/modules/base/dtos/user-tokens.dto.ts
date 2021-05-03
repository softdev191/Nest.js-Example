import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UserTokensDto {
  @ApiProperty()
  @IsNotEmpty()
  public refreshToken: string;

  @ApiProperty()
  @IsNotEmpty()
  public accessToken: string;
}
