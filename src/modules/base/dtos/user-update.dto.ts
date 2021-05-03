import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

import { Media, Role } from '../entities';

export class UserUpdateDto {
  @ApiProperty()
  @IsOptional()
  public username: string;

  @ApiProperty()
  @IsOptional()
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsOptional()
  public newPassword: string;

  @ApiProperty()
  @IsOptional()
  public currentPassword: string;

  @ApiProperty()
  @IsOptional()
  public verified: boolean;

  @ApiProperty()
  @IsOptional()
  public profileMedia: Media;

  @ApiProperty()
  @IsOptional()
  public roles: Role[];
}
