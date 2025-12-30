// ============================================================================
// STRIPE CONNECT EDGE FUNCTION
// Handles Connect account operations for creator payouts
// ============================================================================
//
// Endpoints:
// POST /stripe-connect
//   - action: 'create-account' - Create a new Connect account
//   - action: 'onboarding-link' - Get onboarding/refresh link
//   - action: 'dashboard-link' - Get Express dashboard link
//   - action: 'account-status' - Check account status
//   - action: 'delete-account' - Delete Connect account
//
// Security:
// - All operations require valid JWT authentication
// - STRIPE_SECRET_KEY is never exposed to client
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { handleCors } from '../_shared/cors.ts';
import { getUserFromToken, createServiceClient } from '../_shared/supabase.ts';
import { getStripeClient } from '../_shared/stripe.ts';
import { jsonResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from '../_shared/response.ts';

interface ConnectRequest {
  action: 'create-account' | 'onboarding-link' | 'dashboard-link' | 'account-status' | 'delete-account';
  // For onboarding-link
  refreshUrl?: string;
  returnUrl?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Only accept POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromToken(authHeader);

    if (!user) {
      return unauthorizedResponse('Invalid or missing authentication token');
    }

    // Parse request body
    const body: ConnectRequest = await req.json();
    const { action } = body;

    if (!action) {
      return errorResponse('Missing action parameter');
    }

    // Initialize clients
    const stripe = getStripeClient();
    const supabase = createServiceClient();

    switch (action) {
      case 'create-account': {
        return await handleCreateAccount(stripe, supabase, user.userId);
      }
      case 'onboarding-link': {
        return await handleOnboardingLink(stripe, supabase, user.userId, body);
      }
      case 'dashboard-link': {
        return await handleDashboardLink(stripe, supabase, user.userId);
      }
      case 'account-status': {
        return await handleAccountStatus(stripe, supabase, user.userId);
      }
      case 'delete-account': {
        return await handleDeleteAccount(stripe, supabase, user.userId);
      }
      default: {
        return errorResponse(`Unknown action: ${action}`);
      }
    }
  } catch (error) {
    console.error('Connect error:', error);
    return serverErrorResponse(
      error instanceof Error ? error.message : 'Failed to process Connect request'
    );
  }
});

// ============================================================================
// CREATE CONNECT ACCOUNT
// Creates a new Stripe Connect Express account for the creator
// ============================================================================

async function handleCreateAccount(
  stripe: ReturnType<typeof getStripeClient>,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<Response> {
  // Check if account already exists
  const { data: billing } = await supabase
    .from('creator_billing')
    .select('stripe_account_id, stripe_account_status')
    .eq('creator_id', userId)
    .single();

  if (billing?.stripe_account_id) {
    return jsonResponse({
      accountId: billing.stripe_account_id,
      status: billing.stripe_account_status,
      alreadyExists: true,
    });
  }

  // Get creator profile for account details
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!profile?.email) {
    return errorResponse('Profile not found or missing email');
  }

  // Create Express Connect account
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'BG', // Bulgaria - adjust based on creator's country
    email: profile.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      creator_id: userId,
      platform: 'creator_club',
    },
  });

  // Save to database
  await supabase
    .from('creator_billing')
    .update({
      stripe_account_id: account.id,
      stripe_account_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('creator_id', userId);

  return jsonResponse({
    accountId: account.id,
    status: 'pending',
  });
}

// ============================================================================
// ONBOARDING LINK
// Creates an Account Link for onboarding or refresh
// ============================================================================

async function handleOnboardingLink(
  stripe: ReturnType<typeof getStripeClient>,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  body: ConnectRequest
): Promise<Response> {
  const { refreshUrl, returnUrl } = body;

  if (!refreshUrl || !returnUrl) {
    return errorResponse('Missing refreshUrl or returnUrl');
  }

  // Get Connect account ID
  const { data: billing } = await supabase
    .from('creator_billing')
    .select('stripe_account_id')
    .eq('creator_id', userId)
    .single();

  if (!billing?.stripe_account_id) {
    return errorResponse('No Connect account found. Create one first.');
  }

  // Create account link
  const accountLink = await stripe.accountLinks.create({
    account: billing.stripe_account_id,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return jsonResponse({
    url: accountLink.url,
    expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
  });
}

// ============================================================================
// DASHBOARD LINK
// Creates a login link to the Express dashboard
// ============================================================================

async function handleDashboardLink(
  stripe: ReturnType<typeof getStripeClient>,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<Response> {
  // Get Connect account ID
  const { data: billing } = await supabase
    .from('creator_billing')
    .select('stripe_account_id, stripe_account_status')
    .eq('creator_id', userId)
    .single();

  if (!billing?.stripe_account_id) {
    return errorResponse('No Connect account found');
  }

  if (billing.stripe_account_status !== 'active') {
    return errorResponse('Account onboarding not complete. Cannot access dashboard.');
  }

  // Create login link
  const loginLink = await stripe.accounts.createLoginLink(billing.stripe_account_id);

  return jsonResponse({
    url: loginLink.url,
  });
}

// ============================================================================
// ACCOUNT STATUS
// Retrieves current Connect account status and capabilities
// ============================================================================

async function handleAccountStatus(
  stripe: ReturnType<typeof getStripeClient>,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<Response> {
  // Get Connect account ID
  const { data: billing } = await supabase
    .from('creator_billing')
    .select('stripe_account_id, stripe_account_status')
    .eq('creator_id', userId)
    .single();

  if (!billing?.stripe_account_id) {
    return jsonResponse({
      hasAccount: false,
      status: null,
    });
  }

  // Retrieve account from Stripe
  const account = await stripe.accounts.retrieve(billing.stripe_account_id);

  // Determine status
  const status = (account.payouts_enabled && account.charges_enabled)
    ? 'active'
    : account.details_submitted
      ? 'restricted'
      : 'pending';

  // Update database if status changed
  if (status !== billing.stripe_account_status) {
    await supabase
      .from('creator_billing')
      .update({
        stripe_account_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('creator_id', userId);
  }

  return jsonResponse({
    hasAccount: true,
    accountId: account.id,
    status,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    requirements: {
      currentlyDue: account.requirements?.currently_due || [],
      eventuallyDue: account.requirements?.eventually_due || [],
      pendingVerification: account.requirements?.pending_verification || [],
      disabledReason: account.requirements?.disabled_reason || null,
    },
  });
}

// ============================================================================
// DELETE ACCOUNT
// Deletes the Connect account (rarely used, but available)
// ============================================================================

async function handleDeleteAccount(
  stripe: ReturnType<typeof getStripeClient>,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<Response> {
  // Get Connect account ID
  const { data: billing } = await supabase
    .from('creator_billing')
    .select('stripe_account_id')
    .eq('creator_id', userId)
    .single();

  if (!billing?.stripe_account_id) {
    return errorResponse('No Connect account found');
  }

  // Delete the account in Stripe
  await stripe.accounts.del(billing.stripe_account_id);

  // Update database
  await supabase
    .from('creator_billing')
    .update({
      stripe_account_id: null,
      stripe_account_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq('creator_id', userId);

  return jsonResponse({
    success: true,
  });
}
