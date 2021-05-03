import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { Role } from '../entities/role.entity';

export class TokenClaimDto {
  @ApiProperty()
  @IsNotEmpty()
  public sub: number;

  @ApiProperty()
  @IsNotEmpty()
  public name: string;

  @ApiProperty()
  @IsNotEmpty()
  public roles: Role[];

  @ApiProperty()
  @IsNotEmpty()
  public exp: Date;

  @ApiProperty()
  @IsNotEmpty()
  public type: string;

  @ApiProperty()
  @IsNotEmpty()
  public tokenString: string;
}
