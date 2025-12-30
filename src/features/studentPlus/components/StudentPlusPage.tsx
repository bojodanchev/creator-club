// =============================================================================
// StudentPlusPage Component
// Main entry point for Student Plus subscription and loyalty program
// =============================================================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStudentSubscription } from '../hooks/useStudentSubscription';
import { studentPlusService } from '../studentPlusService';
import { STUDENT_PLUS_CONFIG, formatPrice } from '../studentPlusTypes';
import { LoyaltyDashboard } from './LoyaltyDashboard';
import { SubscriptionStatus } from './SubscriptionStatus';
import { CheckCircle, XCircle } from 'lucide-react';

export function StudentPlusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscription, isLoading, isSubscribed, refetch } = useStudentSubscription();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelMessage, setShowCancelMessage] = useState(false);

  // Handle URL params for checkout success/cancel
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setShowSuccessMessage(true);
      // Clear the URL params
      setSearchParams({});
      // Refresh subscription status
      refetch();
      // Auto-hide after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }

    if (canceled === 'true') {
      setShowCancelMessage(true);
      // Clear the URL params
      setSearchParams({});
      // Auto-hide after 5 seconds
      setTimeout(() => setShowCancelMessage(false), 5000);
    }
  }, [searchParams, setSearchParams, refetch]);

  const handleSubscribe = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      const { checkoutUrl } = await studentPlusService.createCheckoutSession(
        `${window.location.origin}/student-plus?success=true`,
        `${window.location.origin}/student-plus?canceled=true`
      );
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutError('Failed to start checkout. Please try again.');
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Subscriber view - show dashboard
  if (isSubscribed && subscription) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Success notification */}
        {showSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800">Welcome to Student Plus!</p>
              <p className="text-emerald-700 text-sm">Your subscription is now active. Start earning loyalty points!</p>
            </div>
          </div>
        )}
        <SubscriptionStatus subscription={subscription} onUpdate={refetch} />
        <LoyaltyDashboard consecutiveMonths={subscription.consecutive_months} />
      </div>
    );
  }

  // Non-subscriber view - sales page
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Cancel notification */}
      {showCancelMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 mb-8">
          <XCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Checkout Canceled</p>
            <p className="text-amber-700 text-sm">No worries! Your subscription was not started. Feel free to subscribe when you're ready.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold px-4 py-1 rounded-full mb-4">
          Exclusive Membership
        </div>
        <h1 className="text-4xl font-bold mb-4 text-gray-900">Student Plus</h1>
        <p className="text-xl text-gray-600 mb-6">
          Your membership to entrepreneurial success
        </p>
        <div className="text-4xl font-bold text-gray-900">
          {formatPrice(STUDENT_PLUS_CONFIG.product.amount)}
          <span className="text-lg font-normal text-gray-500">/month</span>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <BenefitCard
          icon="📬"
          title="Exclusive Newsletter"
          description="Private entrepreneurship & business practical insights delivered to your inbox weekly"
        />
        <BenefitCard
          icon="🎯"
          title="Community Perks"
          description="Exclusive access to premium community features, content, and member-only events"
        />
        <BenefitCard
          icon="🏆"
          title="Loyalty Rewards"
          description="Earn points every month and unlock milestone rewards at 3, 6, 9, and 12 months"
        />
        <BenefitCard
          icon="🎁"
          title="Redeem Rewards"
          description="Use your points for course discounts, template packs, priority support, and more"
        />
      </div>

      {/* Milestone Preview */}
      <div className="bg-gray-50 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900">Loyalty Milestones</h2>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          {STUDENT_PLUS_CONFIG.milestones.map((milestone, index) => (
            <div key={milestone.months} className="flex items-center">
              <MilestonePreview
                emoji={milestone.emoji}
                months={milestone.months}
                bonus={milestone.bonus}
                name={milestone.name}
              />
              {index < STUDENT_PLUS_CONFIG.milestones.length - 1 && (
                <div className="h-1 w-12 md:w-16 bg-gray-200 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* What You Get Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">What's Included</h2>
        <ul className="space-y-4">
          <FeatureItem text="Weekly exclusive newsletter with actionable business insights" />
          <FeatureItem text="50 loyalty points earned every month (auto-accumulated)" />
          <FeatureItem text="Milestone badges: Bronze (3mo), Silver (6mo), Gold (9mo), Diamond (12mo)" />
          <FeatureItem text="Bonus points at each milestone (100 to 1,000 points)" />
          <FeatureItem text="Redeem points for course discounts, templates, and priority support" />
          <FeatureItem text="Member-only community perks and early access to new features" />
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center">
        {checkoutError && (
          <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
            {checkoutError}
          </div>
        )}
        <button
          onClick={handleSubscribe}
          disabled={isCheckingOut}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCheckingOut ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              Redirecting to checkout...
            </span>
          ) : (
            'Start Your Journey'
          )}
        </button>
        <p className="text-sm text-gray-500 mt-4">
          Cancel anytime. No questions asked.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function BenefitCard({
  icon,
  title,
  description
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="font-semibold text-lg mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function MilestonePreview({
  emoji,
  months,
  bonus,
  name
}: {
  emoji: string;
  months: number;
  bonus: number;
  name: string;
}) {
  return (
    <div className="text-center">
      <span className="text-3xl md:text-4xl block mb-2">{emoji}</span>
      <div className="font-semibold text-gray-900">{name}</div>
      <div className="text-xs text-gray-500">{months} months</div>
      <div className="text-xs text-purple-600 font-medium">+{bonus} pts</div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="text-green-500 mt-0.5">✓</span>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}

export default StudentPlusPage;
