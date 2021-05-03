import TestFactory, { TestingModuleMetadata } from '../../src/test.factory';
import { UserMock, BidMock, SubscriptionMock } from '.';
import { EmailService } from '../../src/modules/base/services';
import { EmailServiceMock } from '../services/email.service-mock';

describe('InitMocks', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    module = await TestFactory.createTestModule({
      overrideProviders: [{ provider: EmailService, mock: new EmailServiceMock() }]
    });
  });

  it('should load mock users', async () => {
    let error = null;
    try {
      const mock = new UserMock(module);
      await mock.generate();
      expect(mock.count).toBeGreaterThan(0);
    } catch (err) {
      error = err;
      console.error('ERROR', err); // tslint:disable
    }
    expect(error).toBeFalsy();
  });

  it('should load mock subscriptions for users', async () => {
    let error = null;
    try {
      const mock = new SubscriptionMock(module);
      await mock.generate();
      expect(mock.count).toBeGreaterThan(0);
    } catch (err) {
      error = err;
      console.error('ERROR', err); // tslint:disable
    }
    expect(error).toBeFalsy();
  });

  it('should load mock bids for users', async () => {
    let error = null;
    try {
      const mock = new BidMock(module);
      await mock.generate();
      expect(mock.count).toBeGreaterThan(0);
    } catch (err) {
      error = err;
      console.error('ERROR', err); // tslint:disable
    }
    expect(error).toBeFalsy();
  });
});
