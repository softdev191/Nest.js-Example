import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserRequestResetPasswordDto {
  @ApiProperty()
  @IsString()
  public username: string;
}
