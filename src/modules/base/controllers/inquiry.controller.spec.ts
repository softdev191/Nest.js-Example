import { EmailService } from '../services/email.service';
import { EmailServiceMock } from '../../../../test/services/email.service-mock';
import TestFactory, { TestingModuleMetadata } from '../../../test.factory';
import { InquiryType } from '../enums';

describe('InquiryController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    module = await TestFactory.createTestModule({
      overrideProviders: [{ provider: EmailService, mock: new EmailServiceMock() }]
    });
  });

  afterAll(async () => {
    // close DB connection after this module's tests
    await module.connection.close();
  });

  describe('#sendInquiry', () => {
    it('should check for required parameters', async () => {
      await module.server
        .post('/api/inquiry')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@example.com',
          message: 'Message'
        })
        .expect(400);
    });
    it('ACL - should allow $everyone to send inquiry', async () => {
      await module.server
        .post('/api/inquiry')
        .send({
          inquiryType: InquiryType.GENERAL,
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@example.com',
          message: 'Message'
        })
        .expect(201);
    });
  });
});
