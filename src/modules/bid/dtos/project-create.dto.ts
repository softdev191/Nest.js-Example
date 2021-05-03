import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BusinessType, PlansUploaded, ProjectType, Region } from '../enums';
import { AddressCreateDto } from './address-create.dto';

export class ProjectCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => AddressCreateDto)
  address: AddressCreateDto;

  @ApiProperty()
  @IsNotEmpty()
  projectType: ProjectType;

  @ApiPropertyOptional()
  @IsOptional()
  // @ApiProperty() // TODO: revert IsNotEmpty after bid enum revision
  // @IsNotEmpty()
  businessType?: BusinessType;

  @ApiPropertyOptional()
  @IsOptional()
  // @ApiProperty() // TODO: revert IsNotEmpty after bid enum revision
  // @IsNotEmpty()
  region?: Region;

  @ApiProperty()
  @IsNotEmpty()
  plansUploaded: PlansUploaded;
}
