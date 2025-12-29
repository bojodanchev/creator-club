// ============================================================================
// PRICING PAGE
// Public-facing pricing page showing all available plans
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Calculator, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import PlanCard from '../components/PlanCard';
import UpgradeModal from '../components/UpgradeModal';
import type { BillingPlan, PlanTier, CreatorBilling } from '../stripeTypes';
import { getPlans, getCreatorBilling, changePlan } from '../stripeService';

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();

  // State
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [billing, setBilling] = useState<CreatorBilling | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Check if user is a creator
  const isCreator = role === 'creator' || role === 'superadmin';

  // Load plans and billing info
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all plans
        const plansData = await getPlans();
        setPlans(plansData);

        // If logged in creator, fetch their billing
        if (user && profile && isCreator) {
          const billingData = await getCreatorBilling(profile.id);
          setBilling(billingData);
        }
      } catch (err) {
        console.error('Error loading pricing data:', err);
        setError('Failed to load pricing information');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, profile, isCreator]);

  // Get current plan tier
  const currentPlanTier = billing?.plan?.tier;

  // Handle plan selection
  const handlePlanSelect = (tier: PlanTier) => {
    if (!user) {
      // Not logged in - redirect to signup
      navigate(`/signup?plan=${tier}`);
      return;
    }

    if (!isCreator) {
      // Logged in but not a creator
      navigate('/settings');
      return;
    }

    // Find the selected plan
    const plan = plans.find((p) => p.tier === tier);
    if (!plan) return;

    // If same as current plan, do nothing
    if (tier === currentPlanTier) return;

    // Show upgrade/downgrade modal
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  // Handle plan change confirmation
  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || !profile) return;

    setIsChangingPlan(true);
    try {
      const result = await changePlan(profile.id, selectedPlan.tier);

      if (result.success) {
        // Refresh billing data
        const updatedBilling = await getCreatorBilling(profile.id);
        setBilling(updatedBilling);
        setShowUpgradeModal(false);
        setSelectedPlan(null);
      } else {
        setError(result.error || 'Failed to change plan');
      }
    } catch (err) {
      console.error('Error changing plan:', err);
      setError('An error occurred while changing your plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button if logged in */}
        {user && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start free, scale as you grow. Pay only based on your success.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Current Plan Banner (for logged in creators) */}
        {isCreator && billing && (
          <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center gap-3">
            <CheckCircle size={20} className="text-indigo-600" />
            <span className="text-indigo-900">
              You are currently on the <strong>{billing.plan?.name || 'Starter'}</strong> plan
              {billing.has_first_sale
                ? billing.monthly_fee_active
                  ? ' (monthly billing active)'
                  : ''
                : billing.plan?.tier !== 'starter'
                ? ' (monthly fee starts after first sale)'
                : ''
              }
            </span>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlanTier === plan.tier}
              isRecommended={plan.tier === 'pro'}
              onSelect={handlePlanSelect}
              currentPlanTier={currentPlanTier}
              showFirstSaleNote={!billing?.has_first_sale}
            />
          ))}
        </div>

        {/* Break-Even Calculator */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calculator size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">When Should You Upgrade?</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Starter to Pro */}
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Starter to Pro</h3>
              <p className="text-slate-600 text-sm mb-4">
                Pro becomes more cost-effective when your monthly revenue exceeds approximately{' '}
                <strong className="text-indigo-600">750/month</strong>.
              </p>
              <div className="text-xs text-slate-500">
                <p>At 750/mo: Starter = 51.75 (6.9%) vs Pro = 59.25 (30 + 3.9%)</p>
                <p>At 1,000/mo: Starter = 69 vs Pro = 69 (break-even)</p>
                <p>At 2,000/mo: Starter = 138 vs Pro = 108</p>
              </div>
            </div>

            {/* Pro to Scale */}
            <div className="p-6 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-3">Pro to Scale</h3>
              <p className="text-slate-600 text-sm mb-4">
                Scale becomes more cost-effective when your monthly revenue exceeds approximately{' '}
                <strong className="text-indigo-600">6,900/month</strong>.
              </p>
              <div className="text-xs text-slate-500">
                <p>At 5,000/mo: Pro = 225 (30 + 3.9%) vs Scale = 194 (99 + 1.9%)</p>
                <p>At 7,000/mo: Pro = 303 vs Scale = 232</p>
                <p>At 10,000/mo: Pro = 420 vs Scale = 289</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                What is the activation fee?
              </h3>
              <p className="text-slate-600 text-sm">
                All creators pay a one-time 2.90 activation fee to set up their account.
                This helps ensure committed creators and covers initial setup costs.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                When do monthly fees start?
              </h3>
              <p className="text-slate-600 text-sm">
                For Pro and Scale plans, the monthly subscription fee only begins after you make
                your first sale. This means you can set up everything risk-free before you
                start earning.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-slate-600 text-sm">
                Yes! Upgrades take effect immediately with prorated billing. Downgrades take
                effect at the end of your current billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 text-sm">
                We accept all major credit cards through Stripe. Your payments are secure and
                you can manage your billing through the Stripe customer portal.
              </p>
            </div>
          </div>
        </div>

        {/* CTA for non-logged in users */}
        {!user && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/signup')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-lg"
            >
              Get Started Today
            </button>
            <p className="text-slate-500 mt-4">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && billing && (
        <UpgradeModal
          currentPlan={billing.plan!}
          newPlan={selectedPlan}
          hasFirstSale={billing.has_first_sale}
          onConfirm={handleConfirmPlanChange}
          onCancel={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
          isLoading={isChangingPlan}
        />
      )}
    </div>
  );
};

export default PricingPage;
