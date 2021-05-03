import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { InquiryType } from '../enums';

export class InquiryDto {
  @ApiProperty()
  @IsNotEmpty()
  public inquiryType: InquiryType;

  @ApiPropertyOptional()
  @IsNotEmpty()
  public firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  public lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  public email: string;

  @ApiProperty()
  @IsNotEmpty()
  public message: string;
}
