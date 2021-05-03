import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import {
  AcHvacUnits,
  BuildingType,
  FinishesType,
  FloorLevel,
  ConstructionType,
  StoreInfoType,
  Workscope
} from '../enums/project-details.enum';

export class ProjectDetailsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  squareFoot: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  profitMargin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  workscope: Workscope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  constructionType: ConstructionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buildingType: BuildingType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  floor: FloorLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storefront: StoreInfoType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  acHvacUnits: AcHvacUnits;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  finishes: FinishesType;
}
