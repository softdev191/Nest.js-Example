import { addDays, subDays } from 'date-fns';

import { TestingModuleMetadata } from '../../src/test.factory';
import { User } from '../../src/modules/base/entities';
import { SubscriptionStatus } from '../../src/modules/bid/enums';
import { Subscription } from '../../src/modules/billing/entities';
import { SubscriptionType, TRIAL_DURATION_DAYS } from '../../src/modules/billing/enums';
import { USERS } from './user.mock';

export function SubscriptionMock(module: TestingModuleMetadata): void {
  const subscriptionRepository = module.repositories.subscriptionRepository;
  const userRepository = module.repositories.userRepository;
  this.count = 0;

  const EXPIRED_END_DATE = subDays(new Date(), 10);
  const TRIAL_END_DATE = addDays(new Date(), TRIAL_DURATION_DAYS);

  const SUBSCRIPTIONS: Subscription[] = [
    {
      ...new Subscription(),
      user: { username: USERS[2].username } as User,
      type: SubscriptionType.MONTHLY,
      status: SubscriptionStatus.INACTIVE,
      isTrial: false,
      expirationDate: EXPIRED_END_DATE,
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[3].username } as User,
      type: SubscriptionType.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      isTrial: false,
      expirationDate: addDays(new Date(), 20),
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[4].username } as User,
      type: SubscriptionType.MONTHLY,
      status: SubscriptionStatus.EXPIRED,
      isTrial: false,
      expirationDate: EXPIRED_END_DATE,
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[5].username } as User,
      type: SubscriptionType.MONTHLY,
      status: SubscriptionStatus.NON_RENEWING,
      isTrial: true,
      expirationDate: TRIAL_END_DATE,
      trialEndDate: TRIAL_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[6].username } as User,
      type: SubscriptionType.ANNUAL,
      status: SubscriptionStatus.INACTIVE,
      isTrial: false,
      expirationDate: EXPIRED_END_DATE,
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[7].username } as User,
      type: SubscriptionType.ANNUAL,
      status: SubscriptionStatus.ACTIVE,
      isTrial: false,
      expirationDate: addDays(new Date(), 100),
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[8].username } as User,
      type: SubscriptionType.ANNUAL,
      status: SubscriptionStatus.EXPIRED,
      isTrial: false,
      expirationDate: EXPIRED_END_DATE,
      trialEndDate: EXPIRED_END_DATE
    },
    {
      ...new Subscription(),
      user: { username: USERS[9].username } as User,
      type: SubscriptionType.ANNUAL,
      status: SubscriptionStatus.NON_RENEWING,
      isTrial: true,
      expirationDate: TRIAL_END_DATE,
      trialEndDate: TRIAL_END_DATE
    }
  ];

  const setupSubscriptions = async (): Promise<void> => {
    for (const subscription of SUBSCRIPTIONS) {
      const user = await userRepository.findByUsername(subscription.user.username);
      await subscriptionRepository.save({ ...subscription, user });
    }
  };

  this.generate = async (): Promise<void> => {
    await setupSubscriptions();
    this.count = await subscriptionRepository.count();
  };
}
