// Community Monetization Types
// Types for paid communities with Stripe integration

import type { DbCommunity, DbMembership } from '../../core/supabase/database.types';

// ============================================================================
// PRICING TYPES
// ============================================================================

/**
 * How a community is priced
 * - free: No payment required to join
 * - one_time: Single payment for lifetime access
 * - monthly: Recurring monthly subscription
 */
export type CommunityPricingType = 'free' | 'one_time' | 'monthly';

/**
 * Payment status for a membership
 * - none: Free community, no payment needed
 * - pending: Payment initiated but not completed
 * - paid: Payment successful, access granted
 * - failed: Payment failed
 * - canceled: Subscription canceled by user
 * - expired: Subscription expired (past due or ended)
 */
export type MembershipPaymentStatus = 'none' | 'pending' | 'paid' | 'failed' | 'canceled' | 'expired';

// ============================================================================
// COMMUNITY PRICING
// ============================================================================

/**
 * Pricing configuration for a community
 */
export interface CommunityPricing {
  pricing_type: CommunityPricingType;
  price_cents: number | null;        // null for free communities
  currency: string;                   // ISO 4217 currency code (e.g., 'EUR', 'USD')
  stripe_product_id: string | null;   // Stripe product ID for paid communities
  stripe_price_id: string | null;     // Stripe price ID for paid communities
}

/**
 * Community with pricing fields (extends base DbCommunity)
 */
export interface CommunityWithPricing extends DbCommunity {
  pricing_type: CommunityPricingType;
  price_cents: number | null;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

// ============================================================================
// MEMBERSHIP PAYMENT
// ============================================================================

/**
 * Membership with payment tracking fields (extends base DbMembership)
 */
export interface MembershipWithPayment extends DbMembership {
  payment_status: MembershipPaymentStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;      // For monthly subscriptions
  stripe_payment_intent_id: string | null;    // For one-time payments
  paid_at: string | null;                     // ISO timestamp when payment completed
  expires_at: string | null;                  // For subscriptions: when access expires
  canceled_at: string | null;                 // When subscription was canceled
}

// ============================================================================
// PURCHASE TRACKING
// ============================================================================

/**
 * Community purchase record for tracking sales and analytics
 */
export interface CommunityPurchase {
  id: string;
  community_id: string;
  user_id: string;                            // profile.id of the buyer
  creator_id: string;                         // profile.id of the community owner
  pricing_type: CommunityPricingType;
  amount_cents: number;
  currency: string;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  stripe_charge_id: string | null;
  platform_fee_cents: number;                 // Our platform fee
  stripe_fee_cents: number;                   // Stripe processing fee
  net_amount_cents: number;                   // Amount creator receives
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  refunded_at: string | null;
  created_at: string;
  completed_at: string | null;
}

// ============================================================================
// UI DISPLAY TYPES
// ============================================================================

/**
 * Formatted pricing info for UI display
 */
export interface CommunityPricingDisplay {
  type: CommunityPricingType;
  price: string;                              // Formatted price string (e.g., "€29.99", "Free")
  interval: string | null;                    // null for free/one-time, "month" for monthly
  buttonText: string;                         // CTA button text (e.g., "Join Free", "Subscribe", "Buy Access")
}

// ============================================================================
// CHECKOUT TYPES
// ============================================================================

/**
 * Request payload for community checkout
 */
export interface CommunityCheckoutRequest {
  communityId: string;
  successUrl: string;                         // Redirect URL after successful payment
  cancelUrl: string;                          // Redirect URL if user cancels
}

/**
 * Result from checkout session creation
 */
export interface CommunityCheckoutResult {
  success: boolean;
  checkoutUrl?: string;                       // Stripe Checkout URL to redirect user to
  sessionId?: string;                         // Stripe Checkout Session ID
  error?: string;                             // Error message if success is false
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format price for display
 */
export function formatCommunityPrice(
  priceCents: number | null,
  currency: string,
  pricingType: CommunityPricingType
): CommunityPricingDisplay {
  if (pricingType === 'free' || priceCents === null || priceCents === 0) {
    return {
      type: 'free',
      price: 'Free',
      interval: null,
      buttonText: 'Join Free',
    };
  }

  const formatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  });

  const formattedPrice = formatter.format(priceCents / 100);

  if (pricingType === 'one_time') {
    return {
      type: 'one_time',
      price: formattedPrice,
      interval: null,
      buttonText: 'Buy Access',
    };
  }

  // monthly
  return {
    type: 'monthly',
    price: formattedPrice,
    interval: 'month',
    buttonText: 'Subscribe',
  };
}

/**
 * Check if a membership has valid paid access
 */
export function hasValidPaidAccess(membership: MembershipWithPayment): boolean {
  // Free communities always have access
  if (membership.payment_status === 'none') {
    return true;
  }

  // Must be paid
  if (membership.payment_status !== 'paid') {
    return false;
  }

  // Check expiration for subscriptions
  if (membership.expires_at) {
    const expiresAt = new Date(membership.expires_at);
    if (expiresAt < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * Determine if a community requires payment to join
 */
export function requiresPayment(community: CommunityWithPricing): boolean {
  return community.pricing_type !== 'free' &&
         community.price_cents !== null &&
         community.price_cents > 0;
}
