import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { addDays, addMonths, addYears, isFuture } from 'date-fns';
import { Request } from 'express';
import { isEmpty, isNil } from 'lodash';
import Stripe from 'stripe';

import { Repository } from 'typeorm';
import { InjectRepository } from '../..';
import { UserGetSubscriptionDto } from '../../base/dtos';
import { UserService } from '../../base/services';
import { SubscriptionStatus } from '../../bid/enums';
import { Card, Subscription } from '../entities';
import { SubscriptionType, TRIAL_DURATION_DAYS } from '../enums';
import { SubscriptionRepository } from '../repositories';
import { StripeService } from './stripe.service';

@Injectable()
export class SubscriptionService {
  public constructor(
    @InjectRepository(Card) private readonly cardRepository: Repository<Card>,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly userService: UserService,
    private readonly stripeService: StripeService
  ) {}

  public async getUserSubscription(userId: number): Promise<UserGetSubscriptionDto> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    const trialEnded = (subscription && !subscription.isTrial) || false;
    const card = await this.cardRepository.findOne({
      where: {
        user: { id: user.id },
        deleted: false
      }
    });

    return { subscription, card, trialEnded };
  }

  async getActiveSubscription(userId: number, subType?: number): Promise<Subscription> {
    const subscription = await this.getOrSyncWithProvider(userId, subType);
    return subscription;
  }

  private async getOrSyncWithProvider(userId: number, subType?: number) {
    let user = await this.userService.findUserById(userId);
    if (!user.verified) {
      throw new BadRequestException('Error: Cannot setup Billing if your email is unverified.');
    }
    let subscription = await this.subscriptionRepository.findByUserId(userId);
    const trialEnded = subscription && !subscription.isTrial;
    const defaultCard = await this.cardRepository.findOne({ user: { id: user.id }, deleted: false });

    const newTrialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const TRIAL_SUB = {
      ...new Subscription(),
      user: { id: userId },
      type: subType in SubscriptionType ? subType : SubscriptionType.MONTHLY,
      isTrial: true,
      status: SubscriptionStatus.NON_RENEWING,
      expirationDate: newTrialEndDate /* full activation will be when Stripe upgrades the expirationDate */,
      trialEndDate: newTrialEndDate
    };

    // 1. Do we have an initial sub? should be already created by userService.verify(), but if not:
    if (!subscription) {
      subscription = trialEnded ? null : await this.subscriptionRepository.save(TRIAL_SUB);
    }
    const { type, expirationDate, trialEndDate } = subscription || {};

    if (!user.stripeCustomerId) {
      const { userDetail } = user;
      const customerId = await this.stripeService.enrollCustomer(user, userDetail, subscription);
      user = await this.userService.setStripeCustomerId(user.id, customerId);
    }

    // 2. Verify this sub's id is ok with Stripe
    if (user.stripeCustomerId) {
      let stripeConfirmCustomer;
      try {
        stripeConfirmCustomer = await this.stripeService.isCustomer(user.stripeCustomerId);
      } catch (e) {
        throw new InternalServerErrorException('Stripe failed on checking the customer status. Try again later.');
      }
      if (!stripeConfirmCustomer) {
        /* customer is already deleted, let's sync our db record,
          invalidate this current subscription still be ready for customer id in Step 3.
        */

        // trigger user to select a new plan (empty) or prepare a subscription with the same trial info.
        subscription = trialEnded
          ? await this.subscriptionRepository.save({
              id: subscription.id,
              status: SubscriptionStatus.INACTIVE,
              stripeSubscriptionId: ''
            })
          : await this.subscriptionRepository.save({ ...TRIAL_SUB, type, expirationDate });
      }

      // let's stop here because of trial ineligibility. Inform the user they need to select a new plan, else the next step will autocreate their trial plan as new
      // once they select a paid plan, and re-click this method, it goes to Step 3.
      if (!subType && !subscription.stripeSubscriptionId) {
        throw new BadRequestException(`Error: Please select a subscription plan to continue using BidVita features.`);
      }
    }

    // 3. Inform stripe of our subscription TRIAL.
    if (subscription && subscription.isTrial) {
      if (!subscription.stripeSubscriptionId) {
        const stripeSubscriptionId = await this.stripeService.createTrial(
          user.stripeCustomerId,
          subscription,
          subType,
          !!defaultCard
        );
        if (stripeSubscriptionId) {
          subscription = await this.subscriptionRepository.save({
            id: subscription.id,
            stripeSubscriptionId,
            type: subType
          });
        }
      }
    }

    // 4. User had selected a new subscription type from the UI
    if (subType in SubscriptionType && subType !== subscription.type && subscription.isTrial) {
      const allNewSub = await this.stripeService.updateCurrentPlan(subscription, subType, !!defaultCard);
      // webhooks will handle changes to db, so minimal update only and only for trial->paid changes.
      if (subscription.stripeSubscriptionId !== allNewSub.stripeSubscriptionId) {
        await this.subscriptionRepository.update(subscription.id, {
          type: subType,
          stripeSubscriptionId: allNewSub.stripeSubscriptionId
        });
        subscription = allNewSub;
      }
    }

    return subscription;
  }

  public async getPortalUrl(userId: number, subType?: number): Promise<string> {
    const subscription = await this.getActiveSubscription(userId, subType);
    const { stripeCustomerId } = await this.userService.findUserById(userId);
    if (isEmpty(subscription)) {
      throw new NotFoundException(`Error: You do not seem to be associated with any subscription.`);
    }
    const sessionUrl = await this.stripeService.getSessionUrl(stripeCustomerId);
    return sessionUrl || '';
  }

  public async processWebhooks(request: Request): Promise<any> {
    let event;
    try {
      event = request.body;
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle each event
    const eventType = `${event.type}`;
    const eventData = !isEmpty(event) && !isEmpty(event.data.object) ? event.data.object : null;
    console.log('HOOKED', {
      eventType
      // eventData
    });
    return this.handleHooks(eventType, eventData);
  }

  /**
   * Refs: https://stripe.com/docs/billing/subscriptions/integrating-customer-portal
   *
   * @param eventType: Event Types: https://stripe.com/docs/api/events/types
   * @param eventData: this changes depending on event.
   */
  private async handleHooks(eventType: string, eventData: Stripe.Event.Data.Object) {
    if (!eventType || isEmpty(eventData)) {
      throw new BadRequestException(`Webhook received insufficient data or wrong request.`);
    }

    const handlers = {
      'payment_method.detached': data => this.handleDetachCard(data),
      'customer.updated': data => this.handleChangeDefaultCard(data),
      'customer.subscription.created': data => this.handleSubscriptionStart(data),
      'customer.subscription.updated': data => this.handleSubscriptionUpdate(data),
      'customer.subscription.trial_will_end': data => this.handleSubscriptionTrialWillEnd(data),
      'customer.subscription.deleted': data => this.handleSubscriptionEnded(data)
    };
    if (isNil(handlers[eventType])) {
      throw new BadRequestException(`Error: Unhandled event type: ${eventType}.`);
    }

    try {
      await handlers[eventType](eventData);

      return 'Done';
    } catch (e) {
      throw e;
    }
  }

  /** should handle renewals. Note that Stripe has a 1-hour delay in invoice charging. */
  private async handleSubscriptionStart(object: Stripe.Subscription) {
    const stripeCustomerId = '' + object.customer;
    const stripeSubscriptionId = object.id;

    const user = await this.userService.findUserByStripeId(stripeCustomerId);
    if (!user) {
      console.error(`User ${stripeCustomerId} not found. Skipping webhook.`);
      return;
    }
    let subscription = await this.subscriptionRepository.findByUserId(user.id);

    if (object.status === 'trialing' && subscription.isTrial) {
      // Do nothing, as we've already saved to DB initially.
      subscription = await this.subscriptionRepository.save({
        id: subscription.id,
        expirationDate: new Date(object.current_period_end * 1000)
      });
      return subscription;
    }

    const { type, status } = await this.getTypeStatus(object.items.data[0].price.id);
    const newSub = await this.subscriptionRepository.save({
      id: subscription.id,
      user: { id: user.id },
      stripeSubscriptionId,
      type,
      status,
      isTrial: object.status === 'trialing',
      expirationDate: new Date(object.current_period_end * 1000),
      trialEndDate: new Date(object.trial_end * 1000)
    } as Subscription);
    return newSub;
  }

  /** possibly for renewed end dates or upgrade type? */
  private async handleSubscriptionUpdate(object: Stripe.Subscription) {
    const stripeCustomerId = '' + object.customer;
    const stripeSubscriptionId = '' + object.id;
    const user = await this.userService.findUserByStripeId(stripeCustomerId);
    if (!user) {
      console.error(`User ${stripeCustomerId} not found. Skipping webhook`);
      return;
    }
    const defaultCard = await this.cardRepository.findOne({ user: { id: user.id }, deleted: false });
    const { type, status } = await this.getTypeStatus(object.items.data[0].price.id);

    const subscription = await this.subscriptionRepository.findByUserId(user.id);
    if (!subscription) {
      console.error(`No subscription for ${user.username} to update. Skipping webhook.`);
      return;
    }

    const newStatus =
      status === SubscriptionStatus.ACTIVE
        ? ['incomplete', 'past_due', 'unpaid'].includes(object.status)
          ? SubscriptionStatus.INACTIVE
          : ['incomplete_expired'].includes(object.status)
          ? SubscriptionStatus.EXPIRED
          : !defaultCard || ['canceled'].includes(object.status)
          ? SubscriptionStatus.NON_RENEWING
          : status
        : status;

    return this.subscriptionRepository.update(subscription.id, {
      stripeSubscriptionId,
      type,
      isTrial: object.status === 'trialing',
      status: newStatus,
      expirationDate: new Date(object.current_period_end * 1000),
      ...(object.status === 'trialing' ? { trialEndDate: new Date(object.trial_end * 1000) } : {})
    } as Subscription);
  }

  private async handleSubscriptionTrialWillEnd(object: Stripe.Subscription) {
    const stripeCustomerId = '' + object.customer;
    const user = await this.userService.findUserByStripeId(stripeCustomerId);
    if (!user) {
      console.error(`Error: Trial will end, but user ${stripeCustomerId} not found. Skipping webhook.`);
      return;
    }
    const subscription = await this.subscriptionRepository.getActiveSubscription(user.id);
    if (!subscription) {
      return null; // do nothing
    }

    // ? disabled to avoid autocharging users who preferred to cancel. Remove later if Stripe confirms the failure to renew
    // if (subscription.isTrial && !object.cancel_at_period_end) {
    //   // If trial and now has payment method. update the current subscription to make trial continue automatically.
    //   const card = await this.cardRepository.findOne({ user: { id: user.id }, deleted: false });
    //   await this.stripeService.updateTrialToPaid(subscription, subscription.type, !!card);
    // }
    // TODO: also send email warning notice?
  }

  private async handleSubscriptionEnded(object: Stripe.Subscription) {
    const stripeCustomerId = '' + object.customer;
    const stripeSubscriptionId = '' + object.id;
    const cancelled = object.ended_at < object.current_period_end || object.status === 'canceled';

    const user = await this.userService.findUserByStripeId(stripeCustomerId);
    const subscription = await this.subscriptionRepository.findOne({ stripeSubscriptionId, deleted: false });
    if (!subscription) {
      console.error(`No active subscription for ${user.username} to delete. Skipping webhook.`);
      return;
    }

    const updated = await this.subscriptionRepository.save({
      id: subscription.id,
      status: cancelled && subscription.isTrial ? SubscriptionStatus.NON_RENEWING : SubscriptionStatus.EXPIRED,
      stripeSubscriptionId: '',
      expirationDate: new Date(object.current_period_end * 1000),
      ...(isNil(object.trial_end) ? {} : { trialEndDate: new Date(object.trial_end * 1000) })
    } as Subscription);
    return updated;
  }

  private async handleDetachCard(paymentMethod: Stripe.PaymentMethod): Promise<Card> {
    const paymentId = String(paymentMethod.id);
    const { id } = (await this.cardRepository.findOne({ stripePaymentId: paymentId, deleted: false })) || {};
    if (id) {
      return this.cardRepository.save({
        id,
        deleted: true
      });
    }
  }

  private async handleChangeDefaultCard(customer: Stripe.Customer): Promise<Card> {
    const user = await this.userService.findUserByStripeId(customer.id);
    if (!user) {
      console.error(`User ${customer.id} not found. Skipping webhook.`);
      return;
    }
    let defaultCard: Card;
    const updatedPaymentMethod = customer.invoice_settings.default_payment_method;

    if (typeof updatedPaymentMethod === 'string') {
      const paymentMethod = await this.stripeService.retrievePaymentMethod(updatedPaymentMethod);
      if (!paymentMethod) {
        // throw exception - to allow Stripe to retry this since the required data is also from Stripe, could be network error.
        throw new NotFoundException('No payment method was found for ' + updatedPaymentMethod);
      }

      const { id: stripePaymentId, card } = paymentMethod;
      const { brand, last4, exp_month: expMonth, exp_year: expYear } = card || {};

      const { id } = (await this.cardRepository.findOne({ user: { id: user.id }, deleted: false })) || {};
      const { postal_code: postalCode } = customer.address || {};
      const { firstName, lastName } = user.userDetail;
      const name = [firstName, lastName].join(' ');
      const zipcode = paymentMethod?.billing_details?.address?.['postal_code'] || postalCode;

      defaultCard = await this.cardRepository.save({
        id,
        stripePaymentId,
        user,
        name,
        brand,
        last4,
        zipcode,
        expMonth,
        expYear
      });
    }

    // Autocreate trial subscription to reduce visit to portal
    const subscription = await this.subscriptionRepository.findByUserId(user.id);
    if (!subscription) {
      await this.stripeService.createTrial(user.stripeCustomerId, null, null, !!defaultCard);
    } else if (subscription.isTrial && subscription.status !== SubscriptionStatus.ACTIVE) {
      await this.stripeService.updateCurrentPlan(subscription, subscription.type, !!defaultCard);
    }

    return defaultCard;
  }

  private async getTypeStatus(priceId: string): Promise<{ type: SubscriptionType; status: SubscriptionStatus }> {
    const byPriceId = await this.stripeService.getOfferedPlans('priceId');
    const type = byPriceId[priceId] as SubscriptionType;
    return {
      type,
      status: !isNil(type) ? SubscriptionStatus.ACTIVE : SubscriptionStatus.INACTIVE
    };
  }
}
