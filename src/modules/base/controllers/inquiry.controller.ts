import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../../decorators';
import { InquiryDto } from '../dtos';
import { EveryoneRole } from '../roles';
import { InquiryService } from '../services';

@Controller('inquiry')
export class InquiryController {
  public constructor(private readonly inquiryService: InquiryService) {}

  @Roles(EveryoneRole)
  @Post()
  public async sendInquiry(
    @Body()
    inquiry: InquiryDto
  ): Promise<void> {
    this.inquiryService.sendInquiry(inquiry);
  }
}
