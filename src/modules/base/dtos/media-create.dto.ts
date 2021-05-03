import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class MediaCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  public filename: string;

  @ApiPropertyOptional()
  @IsOptional()
  public originalUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  public smallUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  public mediumUrl: string;

  @ApiProperty()
  @IsNotEmpty()
  public largeUrl: string;
}
