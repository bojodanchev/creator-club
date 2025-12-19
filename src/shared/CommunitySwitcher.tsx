import React from 'react';
import { Users, Search, ChevronRight, Plus } from 'lucide-react';
import { useCommunity } from '../core/contexts/CommunityContext';
import { useAuth } from '../core/contexts/AuthContext';

interface CommunitySwitcherProps {
  onBrowseMore: () => void;
  onCreateCommunity?: () => void;
}

const CommunitySwitcher: React.FC<CommunitySwitcherProps> = ({ onBrowseMore, onCreateCommunity }) => {
  const { communities, selectedCommunity, setSelectedCommunity, isLoading } = useCommunity();
  const { role } = useAuth();

  const isCreator = role === 'creator' || role === 'superadmin';

  if (isLoading) {
    return (
      <div className="px-4 py-2">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-slate-700 rounded"></div>
          <div className="h-8 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 py-3">
      {/* Section Header */}
      <div className="px-4 mb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {isCreator ? 'Your Communities' : 'My Communities'}
        </h3>
      </div>

      {/* Communities List */}
      <div className="space-y-0.5 px-2">
        {communities.length === 0 ? (
          <div className="px-2 py-3 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              {isCreator ? 'No communities yet' : 'Not part of any community'}
            </p>
          </div>
        ) : (
          communities.map((community) => {
            const isSelected = selectedCommunity?.id === community.id;
            return (
              <button
                key={community.id}
                onClick={() => setSelectedCommunity(community)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  ${isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {/* Community Thumbnail */}
                {community.thumbnail_url ? (
                  <img
                    src={community.thumbnail_url}
                    alt={community.name}
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}>
                    <span className="text-xs font-semibold">
                      {community.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Community Name */}
                <span className="flex-1 text-left truncate font-medium">
                  {community.name}
                </span>

                {/* Selection Indicator */}
                {isSelected && (
                  <ChevronRight size={16} className="shrink-0 opacity-70" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 px-2 space-y-1">
        {/* Create Community (creators only) */}
        {isCreator && onCreateCommunity && (
          <button
            onClick={onCreateCommunity}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>New Community</span>
          </button>
        )}

        {/* Browse More */}
        <button
          onClick={onBrowseMore}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-300 rounded-lg transition-colors"
        >
          <Search size={18} />
          <span>Browse More</span>
        </button>
      </div>
    </div>
  );
};

export default CommunitySwitcher;
