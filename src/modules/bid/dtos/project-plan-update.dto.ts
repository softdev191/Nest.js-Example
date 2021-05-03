import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { AMEPSheetsUpload, PlansUploaded } from '../enums';

export class ProjectPlanUpdateDto {
  @ApiProperty()
  @IsNotEmpty()
  plansUploaded: PlansUploaded;

  @ApiProperty()
  @IsNotEmpty()
  amepPlan: AMEPSheetsUpload;

  @ApiProperty()
  @IsNotEmpty()
  mPlan: AMEPSheetsUpload;

  @ApiProperty()
  @IsNotEmpty()
  ePlan: AMEPSheetsUpload;

  @ApiProperty()
  @IsNotEmpty()
  pPlan: AMEPSheetsUpload;
}
