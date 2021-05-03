import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateProductRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  type: string;
}
