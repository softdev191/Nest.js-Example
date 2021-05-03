import { Controller, Post, Get, Body, Param, ParseIntPipe, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { Request } from 'express';

import { Roles } from '../../../decorators';
import { CreateSubscriptionDto, UserGetSubscriptionDto } from '../../base/dtos';
import { AuthenticatedRole, EveryoneRole } from '../../base/roles';
import { BillingPortalDto, UpdateProductRequestDto } from '../dtos';
import { Subscription } from '../entities';
import { StripeWebhookGuard } from '../guards/stripe-webhook.guard';
import { SubscriptionService } from '../services/subscription.service';

@Controller('subscriptions')
export class SubscriptionController {
  public constructor(private readonly subscriptionService: SubscriptionService) {}

  @Roles(AuthenticatedRole)
  @Get(':userId([0-9]+)')
  public async getUserSubscription(@Param('userId', ParseIntPipe) userId: number): Promise<UserGetSubscriptionDto> {
    return this.subscriptionService.getUserSubscription(userId);
  }

  @Roles(AuthenticatedRole)
  @Get(':userId([0-9]+)/portal')
  public async getBillingPortalUrl(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() data: UpdateProductRequestDto
  ): Promise<BillingPortalDto> {
    const url = await this.subscriptionService.getPortalUrl(userId, +data.type);
    return { url };
  }

  // https://dashboard.stripe.com/test/products/prod_INhRHcy2lzGQR2
  // customer.updated — Check the invoice_settings.default_payment_method attribute to find the payment method that a customer selected as the new default.
  @Post('hook')
  @UseGuards(StripeWebhookGuard)
  @Roles(EveryoneRole)
  async incomingWebhook(@Req() request: Request) {
    await this.subscriptionService.processWebhooks(request);
  }
}
