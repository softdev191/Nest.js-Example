import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TokenVerificationDto {
  @ApiProperty()
  @IsNotEmpty()
  public tokenString: string;
}
