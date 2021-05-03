import { ApiProperty } from '@nestjs/swagger';

/** Stripe already has builtin types with Stripe.* namespace.
 * These are to augment those with our own billing-related shapes.
 */

export class BillingPortalDto {
  @ApiProperty()
  url: string;
}

export const StripeSecretHeader = 'Stripe-Signature';
