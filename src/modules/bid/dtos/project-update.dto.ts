import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BusinessType, PlansUploaded, ProjectType, Region } from '../enums';
import { AddressUpdateDto } from './address-update.dto';

export class ProjectUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AddressUpdateDto)
  address?: AddressUpdateDto;

  @ApiPropertyOptional()
  @IsOptional()
  projectType?: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  businessType?: BusinessType;

  @ApiPropertyOptional()
  @IsOptional()
  region?: Region;

  @ApiPropertyOptional()
  @IsOptional()
  plansUploaded?: PlansUploaded;
}
