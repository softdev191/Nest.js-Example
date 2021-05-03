import { Injectable } from '@nestjs/common';
import { InquiryDto } from '../dtos';
import { InquiryTypeDescription } from '../enums';
import { EmailService } from './email.service';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class InquiryService {
  public constructor(private readonly configService: ConfigService, private readonly emailService: EmailService) {}

  public async sendInquiry(inquiry: InquiryDto): Promise<void> {
    const { inquiryType, email } = inquiry;
    const toEmail = await this.configService.get('email.to');

    await this.emailService.sendTemplate(
      email,
      toEmail,
      `BidVita Support Ticket ${InquiryTypeDescription[inquiryType]}`,
      'inquiry',
      {
        ...inquiry,
        inquiryType: InquiryTypeDescription[inquiryType]
      }
    );
  }
}
