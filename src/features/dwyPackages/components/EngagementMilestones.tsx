// =============================================================================
// EngagementMilestones Component
// Shows milestone/deliverable progress for an engagement
// =============================================================================

import type { DwyEngagementMilestone } from '../dwyTypes';

interface EngagementMilestonesProps {
  milestones: DwyEngagementMilestone[];
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-600', icon: 'circle' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: 'progress' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: 'check' },
};

export function EngagementMilestones({ milestones }: EngagementMilestonesProps) {
  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPercent = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Project Milestones</h4>
        <span className="text-sm text-gray-500">
          {completedCount} of {milestones.length} completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Milestones list */}
      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const config = statusConfig[milestone.status];

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                milestone.status === 'in_progress' ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              {/* Status icon */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${config.color}`}>
                {milestone.status === 'completed' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : milestone.status === 'in_progress' ? (
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                )}
              </div>

              {/* Milestone info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{milestone.name}</div>
                <div className="text-xs text-gray-500">
                  {milestone.status === 'completed' && milestone.completed_at && (
                    <>Completed {formatDate(milestone.completed_at)}</>
                  )}
                  {milestone.status === 'in_progress' && 'In progress'}
                  {milestone.status === 'pending' && milestone.due_at && (
                    <>Due {formatDate(milestone.due_at)}</>
                  )}
                  {milestone.status === 'pending' && !milestone.due_at && 'Upcoming'}
                </div>
              </div>

              {/* Status badge */}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EngagementMilestones;
