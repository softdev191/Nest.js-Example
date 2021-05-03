import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsDate, IsNumber, IsString, IsBoolean } from 'class-validator';
import { SubscriptionStatus } from '../../bid/enums';
import { SubscriptionType } from '../../billing/enums';

export class UserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  public email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public bidCount: string;

  @ApiProperty()
  @IsNumber()
  public subscriptionType: SubscriptionType;

  @ApiProperty()
  @IsBoolean()
  public subscriptionTrial: boolean;

  @ApiProperty()
  @IsNumber()
  public subscriptionStatus: SubscriptionStatus;

  @ApiProperty()
  @IsDate()
  public renewalDate: Date;
}
