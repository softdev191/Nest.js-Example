import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class ProjectPlanDeleteDto {
  @ApiProperty()
  @IsNumber()
  planId: number;
}
