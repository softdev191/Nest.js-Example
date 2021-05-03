import { HttpStatus } from '@nestjs/common';
import { addMonths, addYears, format } from 'date-fns';

import { EmailServiceMock } from '../../../../test/services/email.service-mock';
import TestFactory, { TestingModuleMetadata } from '../../../test.factory';
import { User, UserDetail } from '../../base/entities';
import { EmailService } from '../../base/services';
import { SubscriptionStatus } from '../../bid/enums';
import { SubscriptionType } from '../enums';

let normalAccessToken;
let normalUser;
let normalUserDetail;
let annualExpDate;
let monthlyExpDate;

describe('SubscriptionController', () => {
  let module: TestingModuleMetadata;

  beforeAll(async () => {
    module = await TestFactory.createTestModule({
      overrideProviders: [{ provider: EmailService, mock: new EmailServiceMock() }]
    });

    // normal user
    normalUser = new User();
    normalUser.username = 'normal';
    normalUser.email = 'normal@example.com';
    normalUser.password = '$2a$14$x.V6i0bmERvdde/UJ/Fk3u41fIqDVMrn0VDP6JDIzbAShOFQqZ9PW'; // hashed 'Password123'
    normalUser.verified = true;
    normalUser.roles = [];
    await module.repositories.userRepository.save(normalUser);

    normalUserDetail = new UserDetail();
    normalUserDetail.user = normalUser;
    await module.repositories.userDetailRepository.save(normalUserDetail);

    const normalToken = await module.services.tokenService.generateNewTokens(normalUser);
    normalAccessToken = normalToken.accessToken;

    annualExpDate = format(addYears(new Date(), 1), 'MM/dd/yy');
    monthlyExpDate = format(addMonths(new Date(), 1), 'MM/dd/yy');
  });

  describe('#createUpdateSubscription', () => {
    it('ACL - should not allow $everyone to create a subscription', async () => {
      await module.server.post(`/api/subscriptions/${normalUser.id}`).expect(HttpStatus.FORBIDDEN);
    });

    it('Should not allow creation of subscription on non-existing user', async () => {
      await module.server.post(`/api/subscriptions/100000`).expect(HttpStatus.FORBIDDEN);
    });

    it('ACL - should allow $authenticated to create a subscription', async () => {
      const retval = await module.server
        .post(`/api/subscriptions/${normalUser.id}`)
        .send({
          subscriptionType: SubscriptionType.ANNUAL,
          name: 'Normal User',
          last4: '4242',
          expMonth: 8,
          expYear: 23,
          zipcode: '12345'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const body = retval.body;
      expect(body.type).toBe(SubscriptionType.ANNUAL);
      const formattedDate = format(new Date(body.expirationDate), 'MM/dd/yy');

      expect(formattedDate).toBe(annualExpDate);
      expect(body.card).toBeDefined();
      expect(body.card.name).toBe('Normal User');
      expect(body.card.last4).toBe(4242);
      expect(body.card.expMonth).toBe(8);
      expect(body.card.expYear).toBe(23);
      expect(body.card.zipcode).toBe(12345);
    });

    it('ACL - should allow $authenticated to update a subscription', async () => {
      const retval = await module.server
        .post(`/api/subscriptions/${normalUser.id}`)
        .send({
          subscriptionType: SubscriptionType.MONTHLY,
          name: 'Normal User edit',
          last4: '2222',
          expMonth: 8,
          expYear: 23,
          zipcode: '12345'
        })
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.CREATED);

      const body = retval.body;
      expect(body.type).toBe(SubscriptionType.MONTHLY);
      const formattedDate = format(new Date(body.expirationDate), 'MM/dd/yy');

      expect(formattedDate).toBe(monthlyExpDate);

      expect(body.card).toBeDefined();
      expect(body.card.name).toBe('Normal User edit');
      expect(body.card.last4).toBe(2222);
      expect(body.card.expMonth).toBe(8);
      expect(body.card.expYear).toBe(23);
      expect(body.card.zipcode).toBe(12345);
    });
  });

  describe('#getUserSubscription', () => {
    it('ACL - should not allow $everyone to get a subscription', async () => {
      await module.server.get(`/api/subscriptions/${normalUser.id}`).expect(HttpStatus.FORBIDDEN);
    });

    it('ACL - should allow $authenticated to get a subscription', async () => {
      const retval = await module.server
        .get(`/api/subscriptions/${normalUser.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const body = retval.body;
      expect(body.subscriptionType).toBe(SubscriptionType.MONTHLY);
      const formattedDate = format(new Date(body.subscriptionExpDate), 'MM/dd/yy');
      expect(formattedDate).toBe(monthlyExpDate);
      expect(body.name).toBe('Normal User edit');
      expect(body.last4).toBe(2222);
      expect(body.expMonth).toBe(8);
      expect(body.expYear).toBe(23);
      expect(body.zipcode).toBe(12345);
    });
  });

  describe('#cancelUserSubscription', () => {
    it('ACL - should not allow $everyone to cancel a subscription', async () => {
      await module.server.delete(`/api/subscriptions/${normalUser.id}`).expect(HttpStatus.FORBIDDEN);
    });

    it('ACL - should allow $authenticated to cancel a subscription', async () => {
      const retval = await module.server
        .delete(`/api/subscriptions/${normalUser.id}`)
        .set('Authorization', 'Bearer ' + normalAccessToken)
        .expect(HttpStatus.OK);

      const subscription = await module.repositories.subscriptionRepository.findOne({
        where: {
          user: { id: normalUser.id }
        }
      });

      expect(subscription).toBeTruthy();
      expect(subscription.status).not.toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
