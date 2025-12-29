// =============================================================================
// PointsHistory Component
// Shows transaction history for loyalty points
// =============================================================================

import type { LoyaltyPointTransaction, PointTransactionType } from '../studentPlusTypes';

interface PointsHistoryProps {
  transactions: LoyaltyPointTransaction[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

const transactionTypeLabels: Record<PointTransactionType, string> = {
  subscription_payment: 'Monthly Payment',
  milestone_bonus: 'Milestone Bonus',
  referral: 'Referral Bonus',
  engagement: 'Engagement Reward',
  redemption: 'Reward Redeemed',
  adjustment: 'Adjustment',
  expiration: 'Points Expired',
};

const transactionTypeIcons: Record<PointTransactionType, string> = {
  subscription_payment: '💳',
  milestone_bonus: '🏆',
  referral: '🤝',
  engagement: '⭐',
  redemption: '🎁',
  adjustment: '🔧',
  expiration: '⏰',
};

export function PointsHistory({
  transactions,
  showLoadMore = false,
  onLoadMore,
  isLoadingMore = false,
}: PointsHistoryProps) {
  if (transactions.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{transactionTypeIcons[tx.transaction_type]}</span>
            <div>
              <div className="font-medium text-gray-900">
                {tx.description || transactionTypeLabels[tx.transaction_type]}
              </div>
              <div className="text-xs text-gray-500">{formatDate(tx.created_at)}</div>
            </div>
          </div>
          <div
            className={`font-semibold ${
              tx.points >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {tx.points >= 0 ? '+' : ''}
            {tx.points.toLocaleString()}
          </div>
        </div>
      ))}

      {showLoadMore && onLoadMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="w-full py-2 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
        >
          {isLoadingMore ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}

export default PointsHistory;
