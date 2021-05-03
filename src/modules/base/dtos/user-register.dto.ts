import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';
import { AccountType, BusinessType, SubcontractorCategory } from '../../bid/enums';
import { Media, Role } from '../entities';

export class UserRegisterDto {
  @ApiProperty()
  @IsNotEmpty()
  public username: string;

  @ApiProperty()
  @IsEmail()
  public email: string;

  @ApiProperty()
  @IsNotEmpty()
  public password: string;

  @ApiProperty()
  @IsOptional()
  public profileMedia: Media;

  @ApiProperty()
  @IsOptional()
  public roles: Role[];

  // UserDetail - personal info section
  @ApiPropertyOptional()
  @IsOptional()
  public firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  public businessType?: BusinessType;

  @ApiPropertyOptional()
  @IsOptional()
  public accountType?: AccountType;

  @ApiPropertyOptional()
  @IsOptional()
  subContractorCategory?: SubcontractorCategory;

  // TODO: for removal? already served by businessName column.
  @ApiPropertyOptional()
  @IsOptional()
  subContractorName?: string;
}
