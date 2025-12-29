// =============================================================================
// RedemptionCard Component
// Shows a user's reward redemption with status and details
// =============================================================================

import type { RewardRedemption, RedemptionStatus, RewardType } from '../studentPlusTypes';

interface RedemptionCardProps {
  redemption: RewardRedemption;
}

const statusColors: Record<RedemptionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  used: 'bg-gray-100 text-gray-600',
  expired: 'bg-red-100 text-red-800',
  revoked: 'bg-red-100 text-red-800',
};

const statusLabels: Record<RedemptionStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  used: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
};

const rewardTypeIcons: Record<RewardType, string> = {
  voucher: '🎟️',
  template_pack: '📦',
  fee_discount: '💸',
  priority_support: '🚀',
  exclusive_content: '🔒',
  badge: '🏅',
};

export function RedemptionCard({ redemption }: RedemptionCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpiringSoon = () => {
    if (!redemption.valid_until || redemption.status !== 'active') return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(redemption.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getDaysRemaining = () => {
    if (!redemption.valid_until) return null;
    const days = Math.ceil(
      (new Date(redemption.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 ? days : 0;
  };

  const rewardName = redemption.reward?.name || 'Reward';
  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{rewardTypeIcons[redemption.reward_type]}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{rewardName}</h3>
            <p className="text-sm text-gray-500 mt-1">
              Redeemed on {formatDate(redemption.created_at)}
            </p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[redemption.status]}`}>
          {statusLabels[redemption.status]}
        </span>
      </div>

      {/* Voucher Code Display */}
      {redemption.voucher_code && redemption.status === 'active' && (
        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-xs text-purple-600 font-medium mb-1">Your Voucher Code</div>
          <div className="flex items-center gap-2">
            <code className="text-lg font-mono font-bold text-purple-800">
              {redemption.voucher_code}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(redemption.voucher_code!)}
              className="text-purple-600 hover:text-purple-700 text-sm"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Validity Info */}
      {redemption.valid_until && redemption.status === 'active' && (
        <div className={`mt-4 p-3 rounded-lg ${isExpiringSoon() ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isExpiringSoon() ? 'text-yellow-700' : 'text-gray-600'}`}>
              {isExpiringSoon() ? 'Expires soon!' : 'Valid until'}
            </span>
            <span className={`font-medium ${isExpiringSoon() ? 'text-yellow-800' : 'text-gray-900'}`}>
              {formatDate(redemption.valid_until)}
              {daysRemaining !== null && daysRemaining > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-1">
                  ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Used Info */}
      {redemption.status === 'used' && redemption.used_at && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Used on</span>
            <span className="font-medium text-gray-900">{formatDate(redemption.used_at)}</span>
          </div>
          {redemption.used_for_reference && (
            <div className="text-xs text-gray-500 mt-1">
              Reference: {redemption.used_for_reference}
            </div>
          )}
        </div>
      )}

      {/* Points Spent */}
      {redemption.points_spent > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Points spent: {redemption.points_spent.toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default RedemptionCard;
