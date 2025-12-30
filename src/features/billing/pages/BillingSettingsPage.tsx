// ============================================================================
// BILLING SETTINGS PAGE
// Creator billing management - shows plan, usage, transactions
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2,
  CreditCard,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Receipt,
  ExternalLink,
  AlertTriangle,
  XCircle,
  Wallet,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../../core/contexts/AuthContext';
import UpgradeModal from '../components/UpgradeModal';
import type {
  BillingPlan,
  BillingDashboardData,
  BillingTransaction,
  PlanTier,
  ConnectAccountStatus,
} from '../stripeTypes';
import {
  getBillingDashboard,
  getPlans,
  getPlanByTier,
  getBillingPortalUrl,
  changePlan,
  cancelSubscription,
  resumeSubscription,
  formatAmount,
  getTransactions,
  createConnectAccount,
  getConnectOnboardingLink,
  getConnectAccountStatus,
  createPlanSubscription,
} from '../stripeService';

const BillingSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // State
  const [dashboard, setDashboard] = useState<BillingDashboardData | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [connectStatus, setConnectStatus] = useState<ConnectAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnectLoading, setIsConnectLoading] = useState(false);

  // Load billing data
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const [dashboardData, plansData, transactionsData, connectData] = await Promise.all([
          getBillingDashboard(profile.id),
          getPlans(),
          getTransactions(profile.id, { limit: 20 }),
          getConnectAccountStatus(profile.id),
        ]);

        setDashboard(dashboardData);
        setPlans(plansData);
        setTransactions(transactionsData);
        setConnectStatus(connectData);
      } catch (err) {
        console.error('Error loading billing data:', err);
        setError('Failed to load billing information');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  // Handle opening Stripe billing portal
  const handleOpenBillingPortal = async () => {
    if (!profile?.id) return;

    setIsProcessing(true);
    try {
      const url = await getBillingPortalUrl(profile.id);
      if (url) {
        window.open(url, '_blank');
      } else {
        setError('Could not open billing portal');
      }
    } catch (err) {
      setError('Failed to open billing portal');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle plan change
  const handlePlanChange = async (tier: PlanTier) => {
    const plan = plans.find((p) => p.tier === tier);
    if (!plan) return;

    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  // Confirm plan change
  const handleConfirmPlanChange = async () => {
    if (!selectedPlan || !profile?.id) return;

    setIsProcessing(true);
    try {
      const result = await changePlan(profile.id, selectedPlan.tier);

      if (result.success) {
        // Check if subscription checkout is required (has first sale but no active subscription yet)
        if (result.requiresCheckout) {
          // Create subscription checkout session and redirect
          const checkoutResult = await createPlanSubscription(profile.id, selectedPlan.tier);
          if (checkoutResult.success && checkoutResult.checkoutUrl) {
            window.location.href = checkoutResult.checkoutUrl;
            return;
          } else {
            setError(checkoutResult.error || 'Failed to create checkout session');
            setIsProcessing(false);
            return;
          }
        }

        // Refresh dashboard
        const dashboardData = await getBillingDashboard(profile.id);
        setDashboard(dashboardData);
        setShowUpgradeModal(false);
        setSelectedPlan(null);
      } else {
        setError(result.error || 'Failed to change plan');
      }
    } catch (err) {
      setError('An error occurred while changing your plan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!profile?.id) return;

    setIsProcessing(true);
    try {
      const result = await cancelSubscription(profile.id);

      if (result.success) {
        // Refresh dashboard
        const dashboardData = await getBillingDashboard(profile.id);
        setDashboard(dashboardData);
        setShowCancelModal(false);
      } else {
        setError(result.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('An error occurred while canceling your subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resume subscription
  const handleResumeSubscription = async () => {
    if (!profile?.id) return;

    setIsProcessing(true);
    try {
      const result = await resumeSubscription(profile.id);

      if (result.success) {
        // Refresh dashboard
        const dashboardData = await getBillingDashboard(profile.id);
        setDashboard(dashboardData);
      } else {
        setError(result.error || 'Failed to resume subscription');
      }
    } catch (err) {
      setError('An error occurred while resuming your subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle setting up Stripe Connect for payouts
  const handleSetupPayouts = async () => {
    if (!profile?.id || !profile?.email) return;

    setIsConnectLoading(true);
    setError(null);

    try {
      // First, create the Connect account if it doesn't exist
      if (!connectStatus) {
        const createResult = await createConnectAccount(profile.id, profile.email);
        if (!createResult.success) {
          setError(createResult.error || 'Failed to create payout account');
          return;
        }
      }

      // Get the onboarding link
      const onboardingUrl = await getConnectOnboardingLink(profile.id);
      if (onboardingUrl) {
        window.location.href = onboardingUrl;
      } else {
        setError('Failed to get onboarding link');
      }
    } catch (err) {
      console.error('Error setting up payouts:', err);
      setError('An error occurred while setting up payouts');
    } finally {
      setIsConnectLoading(false);
    }
  };

  // Handle refreshing Connect account status
  const handleRefreshConnectStatus = async () => {
    if (!profile?.id) return;

    setIsConnectLoading(true);
    try {
      const status = await getConnectAccountStatus(profile.id);
      setConnectStatus(status);
    } catch (err) {
      console.error('Error refreshing connect status:', err);
    } finally {
      setIsConnectLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 size={32} className="text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // No billing record
  if (!dashboard) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Billing Not Set Up
        </h3>
        <p className="text-slate-600 mb-6">
          Complete your account activation to access billing settings.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Complete Setup
        </button>
      </div>
    );
  }

  const { currentPlan, billing } = dashboard;
  const currentTier = currentPlan.tier;

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Current Plan Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Current Plan</h2>
            <p className="text-slate-500 text-sm">
              Manage your subscription and billing
            </p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
          >
            View all plans
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <CreditCard size={24} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{currentPlan.name}</h3>
              <StatusBadge status={billing.status} />
            </div>
            <p className="text-sm text-slate-600">
              {currentPlan.price_monthly_cents === 0
                ? 'Free'
                : `${formatAmount(currentPlan.price_monthly_cents)}/month`}{' '}
              + {currentPlan.platform_fee_percent}% platform fee
            </p>
          </div>
          {currentTier !== 'scale' && (
            <button
              onClick={() => handlePlanChange(currentTier === 'starter' ? 'pro' : 'scale')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* Activation & First Sale Status */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {billing.activation_fee_paid ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <Clock size={18} className="text-amber-500" />
              )}
              <span className="font-medium text-slate-900">Activation Fee</span>
            </div>
            <p className="text-sm text-slate-600">
              {billing.activation_fee_paid
                ? `Paid on ${new Date(billing.activation_fee_paid_at!).toLocaleDateString()}`
                : 'Pending payment'}
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {billing.has_first_sale ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <Clock size={18} className="text-slate-400" />
              )}
              <span className="font-medium text-slate-900">First Sale</span>
            </div>
            <p className="text-sm text-slate-600">
              {billing.has_first_sale
                ? `Made on ${new Date(billing.first_sale_at!).toLocaleDateString()}`
                : currentTier === 'starter'
                ? 'Make your first sale to grow'
                : 'Monthly billing starts after first sale'}
            </p>
          </div>
        </div>

        {/* Cancellation Notice */}
        {billing.cancel_at_period_end && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Subscription Canceling</p>
                <p className="text-sm text-amber-700 mt-1">
                  Your subscription will end on{' '}
                  {billing.current_period_end
                    ? new Date(billing.current_period_end).toLocaleDateString()
                    : 'the end of your billing period'}
                  . You will be downgraded to the Starter plan.
                </p>
                <button
                  onClick={handleResumeSubscription}
                  disabled={isProcessing}
                  className="mt-3 text-sm font-medium text-amber-800 underline hover:no-underline disabled:opacity-50"
                >
                  Resume Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Billing Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenBillingPortal}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <ExternalLink size={16} />
            Manage Payment Method
          </button>
          {currentTier !== 'starter' && !billing.cancel_at_period_end && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Payouts Section (Stripe Connect) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payouts</h2>
            <p className="text-slate-500 text-sm">
              Receive your earnings directly to your bank account
            </p>
          </div>
          {connectStatus && (
            <button
              onClick={handleRefreshConnectStatus}
              disabled={isConnectLoading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw size={16} className={isConnectLoading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>

        {!connectStatus ? (
          // No Connect account - show setup prompt
          <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                <Wallet size={24} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 mb-1">Set Up Payouts</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Connect your bank account to receive payouts when students purchase your courses and memberships.
                </p>
                <button
                  onClick={handleSetupPayouts}
                  disabled={isConnectLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isConnectLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Set Up Payouts
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Has Connect account - show status
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Wallet size={24} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">Payout Account</h3>
                  <ConnectStatusBadge status={connectStatus.status} />
                </div>
                <p className="text-sm text-slate-600">
                  {connectStatus.status === 'active'
                    ? 'Your payout account is active and ready to receive funds'
                    : connectStatus.status === 'pending'
                    ? 'Complete onboarding to start receiving payouts'
                    : 'There are issues with your payout account that need attention'}
                </p>
              </div>
              {connectStatus.status !== 'active' && (
                <button
                  onClick={handleSetupPayouts}
                  disabled={isConnectLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isConnectLoading ? 'Loading...' : 'Complete Setup'}
                </button>
              )}
            </div>

            {/* Status details */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {connectStatus.chargesEnabled ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Clock size={18} className="text-amber-500" />
                  )}
                  <span className="font-medium text-slate-900">Accept Payments</span>
                </div>
                <p className="text-sm text-slate-600">
                  {connectStatus.chargesEnabled
                    ? 'You can accept payments from students'
                    : 'Complete verification to accept payments'}
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {connectStatus.payoutsEnabled ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Clock size={18} className="text-amber-500" />
                  )}
                  <span className="font-medium text-slate-900">Receive Payouts</span>
                </div>
                <p className="text-sm text-slate-600">
                  {connectStatus.payoutsEnabled
                    ? 'Payouts are automatically sent to your bank'
                    : 'Add bank details to receive payouts'}
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {connectStatus.detailsSubmitted ? (
                    <CheckCircle size={18} className="text-green-500" />
                  ) : (
                    <Clock size={18} className="text-amber-500" />
                  )}
                  <span className="font-medium text-slate-900">Identity Verified</span>
                </div>
                <p className="text-sm text-slate-600">
                  {connectStatus.detailsSubmitted
                    ? 'Your identity has been verified'
                    : 'Provide identity documents for verification'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Revenue Overview</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <TrendingUp size={16} />
              This Month
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(dashboard.currentPeriodRevenue)}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Fees: {formatAmount(dashboard.platformFeesThisPeriod)}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
              <Receipt size={16} />
              All Time
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {formatAmount(dashboard.totalRevenue)}
            </p>
          </div>

          {dashboard.nextInvoiceDate && dashboard.nextInvoiceAmount && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                <Clock size={16} />
                Next Invoice
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatAmount(dashboard.nextInvoiceAmount)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Due {new Date(dashboard.nextInvoiceDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
          <button
            onClick={handleOpenBillingPortal}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
          >
            View all in Stripe
            <ExternalLink size={14} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">
            No transactions yet. Make your first sale to see transaction history.
          </p>
        ) : (
          <div className="divide-y divide-slate-200">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal
          currentPlan={currentPlan}
          newPlan={selectedPlan}
          hasFirstSale={billing.has_first_sale}
          onConfirm={handleConfirmPlanChange}
          onCancel={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
          isLoading={isProcessing}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelModal
          planName={currentPlan.name}
          periodEnd={billing.current_period_end}
          onConfirm={handleCancelSubscription}
          onCancel={() => setShowCancelModal(false)}
          isLoading={isProcessing}
        />
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    trialing: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Trial' },
    past_due: { bg: 'bg-red-100', text: 'text-red-700', label: 'Past Due' },
    canceled: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Canceled' },
    incomplete: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Incomplete' },
    paused: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Paused' },
  };

  const { bg, text, label } = config[status] || config.incomplete;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

interface ConnectStatusBadgeProps {
  status: string;
}

const ConnectStatusBadge: React.FC<ConnectStatusBadgeProps> = ({ status }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    restricted: { bg: 'bg-red-100', text: 'text-red-700', label: 'Action Required' },
    disabled: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Disabled' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

interface TransactionRowProps {
  transaction: BillingTransaction;
}

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const typeLabels: Record<string, string> = {
    activation_fee: 'Activation Fee',
    subscription: 'Subscription',
    platform_fee: 'Platform Fee',
    refund: 'Refund',
    payout: 'Payout',
    adjustment: 'Adjustment',
  };

  const statusIcons: Record<string, React.ReactNode> = {
    completed: <CheckCircle size={16} className="text-green-500" />,
    pending: <Clock size={16} className="text-amber-500" />,
    failed: <XCircle size={16} className="text-red-500" />,
    refunded: <AlertCircle size={16} className="text-slate-500" />,
  };

  const isCredit = transaction.type === 'payout' || transaction.type === 'refund';

  return (
    <div className="flex items-center gap-4 py-4">
      <div className="shrink-0">{statusIcons[transaction.status]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900">
          {typeLabels[transaction.type] || transaction.type}
        </p>
        <p className="text-sm text-slate-500 truncate">
          {transaction.description || new Date(transaction.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-medium ${isCredit ? 'text-green-600' : 'text-slate-900'}`}>
          {isCredit ? '+' : ''}
          {formatAmount(transaction.amount_cents, transaction.currency)}
        </p>
        <p className="text-xs text-slate-500">
          {new Date(transaction.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

interface CancelModalProps {
  planName: string;
  periodEnd: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CancelModal: React.FC<CancelModalProps> = ({
  planName,
  periodEnd,
  onConfirm,
  onCancel,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Cancel Subscription?</h2>
        </div>

        <p className="text-slate-600 mb-4">
          Are you sure you want to cancel your {planName} subscription?
        </p>

        <ul className="space-y-2 mb-6 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-slate-400">-</span>
            <span>
              You will continue to have access until{' '}
              {periodEnd ? new Date(periodEnd).toLocaleDateString() : 'the end of your billing period'}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400">-</span>
            <span>After that, you will be downgraded to the Starter plan (6.9% fee)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-slate-400">-</span>
            <span>You can resubscribe anytime</span>
          </li>
        </ul>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Keep Subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Canceling...
              </>
            ) : (
              'Yes, Cancel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingSettingsPage;
