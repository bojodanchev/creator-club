// ============================================================================
// STRIPE CLIENT
// Shared Stripe configuration for Edge Functions
// ============================================================================

import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

/**
 * Get Stripe client instance
 * Uses STRIPE_SECRET_KEY from environment (never exposed to client)
 */
export function getStripeClient(): Stripe {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Get Stripe webhook secret for signature verification
 */
export function getWebhookSecret(): string {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return secret;
}

// ============================================================================
// STRIPE CONFIGURATION CONSTANTS
// ============================================================================

export const STRIPE_CONFIG = {
  activation: {
    productId: 'prod_ThBhGe4gwluiQ8',
    priceId: 'price_1SjnKmFbO001Rr4nTKadFx23',
    amount: 290, // in cents (EUR 2.90)
  },
  plans: {
    starter: {
      productId: null,
      priceId: null,
      monthlyAmount: 0,
      platformFeePercent: 6.9,
    },
    pro: {
      productId: 'prod_ThBhoMU9mCS03d',
      priceId: 'price_1SjnKnFbO001Rr4nE31ve9YU',
      monthlyAmount: 3000, // in cents (EUR 30)
      platformFeePercent: 3.9,
    },
    scale: {
      productId: 'prod_ThBhNjnTJAQEFi',
      priceId: 'price_1SjnKnFbO001Rr4nrgpXSf0h',
      monthlyAmount: 9900, // in cents (EUR 99)
      platformFeePercent: 1.9,
    },
  },
} as const;

export type PlanTier = 'starter' | 'pro' | 'scale';
