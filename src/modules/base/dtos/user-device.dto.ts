import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserDeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  public type: string;

  @ApiProperty()
  @IsNotEmpty()
  public token: string;
}
