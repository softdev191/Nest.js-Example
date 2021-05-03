import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public subscriptionType: number;

  // TODO: delete after stripe integration
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public last4: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public expMonth: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  public expYear: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public zipcode: string;
}
