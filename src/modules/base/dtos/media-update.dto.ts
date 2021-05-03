import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class MediaUpdateDto {
  @ApiProperty()
  @IsOptional()
  public id: number;

  @ApiProperty()
  @IsOptional()
  public filename: string;

  @ApiPropertyOptional()
  @IsOptional()
  public originalUrl: string;

  @ApiProperty()
  @IsOptional()
  public smallUrl: string;

  @ApiProperty()
  @IsOptional()
  public mediumUrl: string;

  @ApiProperty()
  @IsOptional()
  public largeUrl: string;
}
