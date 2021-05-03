import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

const WILDCARD_CHARACTERS = /[%_]/; // SQL Wildcard Characters %, _
const filterWildCard = (value: any): string => (value + '').replace(WILDCARD_CHARACTERS, char => `\\${char}`).trim();

const isInteger = (value: any): boolean => /^\+?(0|[1-9]\d*)$/.test(value);
const toNumber = (value: any): number => (isInteger(value) ? parseInt(value) : value);

export class SearchParamsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Transform(toNumber)
  page: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Transform(toNumber)
  limit: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(filterWildCard)
  search?: string;
}

export const DEFAULT_SEARCH_PARAMS: SearchParamsDto = {
  page: 0,
  limit: 100,
  sort: ''
};
