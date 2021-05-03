import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { TokenVerificationDto } from './token-verification.dto';

export class ResetPasswordDto extends TokenVerificationDto {
  @ApiProperty()
  @IsNotEmpty()
  public password: string;
}
