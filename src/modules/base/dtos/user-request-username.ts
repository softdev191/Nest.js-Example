import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UserRequestUsernameDto {
  @ApiProperty()
  @IsEmail()
  public email: string;
}
