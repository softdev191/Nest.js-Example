import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ReportCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  public userId: number;
}
