import { supabase } from '../../core/supabase/client';

// ============================================================================
// COMMUNITY PAYMENT SERVICE
// Handles community checkout, pricing updates, and subscription management
// ============================================================================

export interface CommunityCheckoutRequest {
  communityId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CommunityCheckoutResponse {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  error?: string;
}

export interface CommunityPricing {
  type: 'free' | 'one_time' | 'monthly';
  priceCents: number;
}

export interface UpdatePricingResponse {
  success: boolean;
  error?: string;
}

export interface CommunityPortalResponse {
  success: boolean;
  portalUrl?: string;
  error?: string;
}

/**
 * Creates a Stripe Checkout session for a community purchase/subscription.
 * Calls the community-checkout edge function.
 */
export async function createCommunityCheckout(
  request: CommunityCheckoutRequest
): Promise<CommunityCheckoutResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('community-checkout', {
      body: request,
    });

    if (error) {
      console.error('Error creating community checkout:', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session',
      };
    }

    if (!data) {
      console.error('No data returned from community-checkout');
      return {
        success: false,
        error: 'No response from checkout service',
      };
    }

    // Handle error response from edge function
    if (data.error) {
      console.error('Community checkout error:', data.error);
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      checkoutUrl: data.checkoutUrl || data.url,
      sessionId: data.sessionId || data.session_id,
    };
  } catch (err) {
    console.error('Exception in createCommunityCheckout:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Updates the pricing configuration for a community.
 * Clears Stripe product/price IDs so they get regenerated on next checkout.
 */
export async function updateCommunityPricing(
  communityId: string,
  pricing: CommunityPricing
): Promise<UpdatePricingResponse> {
  try {
    const { error } = await supabase
      .from('communities')
      .update({
        pricing_type: pricing.type,
        price_cents: pricing.priceCents,
        // Clear Stripe IDs so they get regenerated with new pricing
        stripe_product_id: null,
        stripe_price_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', communityId);

    if (error) {
      console.error('Error updating community pricing:', error);
      return {
        success: false,
        error: error.message || 'Failed to update pricing',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Exception in updateCommunityPricing:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Gets the Stripe Customer Portal URL for managing a community subscription.
 * Calls the community-portal edge function.
 */
export async function getCommunityPortalUrl(
  communityId: string
): Promise<CommunityPortalResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('community-portal', {
      body: {
        communityId,
        returnUrl: window.location.href,
      },
    });

    if (error) {
      console.error('Error getting community portal URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to get portal URL',
      };
    }

    if (!data) {
      console.error('No data returned from community-portal');
      return {
        success: false,
        error: 'No response from portal service',
      };
    }

    // Handle error response from edge function
    if (data.error) {
      console.error('Community portal error:', data.error);
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      portalUrl: data.portalUrl || data.url,
    };
  } catch (err) {
    console.error('Exception in getCommunityPortalUrl:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}
