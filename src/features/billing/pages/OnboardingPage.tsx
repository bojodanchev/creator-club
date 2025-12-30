// ============================================================================
// ONBOARDING PAGE
// Creator activation fee payment and account setup
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Loader2,
  CheckCircle,
  CreditCard,
  Rocket,
  Shield,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import { createActivationCheckout, getCreatorBilling } from '../stripeService';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, role } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyActivated, setAlreadyActivated] = useState(false);

  // Check URL params for success/cancel from Stripe
  const checkoutSuccess = searchParams.get('success') === 'true';
  const checkoutCanceled = searchParams.get('canceled') === 'true';

  // Check if user is a creator
  const isCreator = role === 'creator' || role === 'superadmin';

  // Load existing billing status
  useEffect(() => {
    const checkStatus = async () => {
      if (!profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const billing = await getCreatorBilling(profile.id);
        if (billing?.activation_fee_paid) {
          setAlreadyActivated(true);
        }
      } catch (err) {
        console.error('Error checking billing status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [profile?.id]);

  // Handle checkout success - redirect to dashboard
  useEffect(() => {
    if (checkoutSuccess) {
      // Wait a moment for webhook to process, then redirect
      const timer = setTimeout(() => {
        navigate('/settings?tab=billing', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [checkoutSuccess, navigate]);

  // Handle activation checkout
  const handleActivate = async () => {
    if (!profile?.id) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await createActivationCheckout(profile.id);

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Sign In Required
          </h2>
          <p className="text-slate-600 mb-6">
            Please sign in or create an account to continue.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/login?return=/onboarding')}
              className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup?role=creator')}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not a creator
  if (!isCreator) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Creator Account Required
          </h2>
          <p className="text-slate-600 mb-6">
            This onboarding is for creator accounts. If you want to become a creator,
            please upgrade your account.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  // Already activated
  if (alreadyActivated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Already Activated!
          </h2>
          <p className="text-slate-600 mb-6">
            Your creator account is already activated. You can manage your billing
            in settings.
          </p>
          <button
            onClick={() => navigate('/settings?tab=billing')}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Billing
          </button>
        </div>
      </div>
    );
  }

  // Success state (from Stripe redirect)
  if (checkoutSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Account Activated!
          </h2>
          <p className="text-slate-600 mb-4">
            Your payment was successful. Redirecting to your dashboard...
          </p>
          <Loader2 size={24} className="text-indigo-600 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Canceled state
  if (checkoutCanceled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Payment Canceled
          </h2>
          <p className="text-slate-600 mb-6">
            No problem! You can complete the activation whenever you are ready.
          </p>
          <button
            onClick={handleActivate}
            disabled={isProcessing}
            className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main onboarding view
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Rocket size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Activate Your Creator Account
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Complete a one-time activation to unlock all creator features and start
            building your community.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Activation Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Price Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center text-white">
            <p className="text-indigo-100 text-sm mb-1">One-time activation fee</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">2.90</span>
              <span className="text-lg">EUR</span>
            </div>
          </div>

          {/* Features */}
          <div className="p-8">
            <h3 className="font-semibold text-slate-900 mb-4">What you get:</h3>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Create Unlimited Communities</p>
                  <p className="text-sm text-slate-500">Build multiple communities for different topics</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Course Builder</p>
                  <p className="text-sm text-slate-500">Create courses with modules, lessons, and quizzes</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Accept Payments</p>
                  <p className="text-sm text-slate-500">Sell courses and memberships with Stripe integration</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">AI Success Manager</p>
                  <p className="text-sm text-slate-500">AI-powered insights and student engagement tools</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Start on Starter Plan (Free)</p>
                  <p className="text-sm text-slate-500">6.9% platform fee only when you make sales</p>
                </div>
              </li>
            </ul>

            {/* CTA Button */}
            <button
              onClick={handleActivate}
              disabled={isProcessing}
              className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Pay 2.90 EUR and Activate
                </>
              )}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
              <Shield size={14} />
              <span>Secure payment via Stripe</span>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 p-6 bg-white/50 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900">Why is there an activation fee?</p>
              <p className="text-sm text-slate-600 mt-1">
                The small activation fee helps ensure committed creators and covers
                initial account setup costs. It is a one-time payment, not recurring.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">What are the monthly fees?</p>
              <p className="text-sm text-slate-600 mt-1">
                You start on our free Starter plan with a 6.9% fee per sale. No monthly
                fees until you choose to upgrade to Pro or Scale plans.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Can I upgrade later?</p>
              <p className="text-sm text-slate-600 mt-1">
                Yes! You can upgrade to Pro (3.9% fee) or Scale (1.9% fee) anytime from
                your billing settings. Monthly fees only start after your first sale.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
