import { Injectable } from '@nestjs/common';

const delayedPromise = new Promise(resolve => setTimeout(resolve.bind(null), 100));

@Injectable()
export class EmailServiceMock {
  public async sendTemplate(
    from: string,
    to: string,
    subject: string,
    template: string,
    variables: any
  ): Promise<void> {
    console.log('EMAIL SERVICE MOCK send activated: ' + template);
    await delayedPromise;
    return;
  }
}
