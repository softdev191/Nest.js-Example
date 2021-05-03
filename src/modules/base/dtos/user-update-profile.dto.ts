import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BusinessType, SubcontractorCategory } from '../../bid/enums';
import { Media } from '../entities';

export class UserUpdateProfileDto {
  @IsOptional()
  @IsString()
  public firstName?: string;

  @IsOptional()
  @IsString()
  public lastName?: string;

  @IsNotEmpty()
  @IsEmail()
  public email: string;

  @IsOptional()
  @IsString()
  public phone?: string;

  @IsOptional()
  public businessType?: BusinessType;

  @IsOptional()
  @IsString()
  public subContractorName?: string;

  @IsOptional()
  public subContractorCategory?: SubcontractorCategory;

  @IsOptional()
  public companyLogo?: Media;

  @IsOptional()
  @IsString()
  public newPassword?: string;

  @IsOptional()
  @IsString()
  public currentPassword?: string;
}
