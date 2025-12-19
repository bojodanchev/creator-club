import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getCreatorCommunities,
  getMemberCommunities,
  getCommunities,
} from '../../features/community/communityService';
import { DbCommunity } from '../supabase/database.types';

interface CommunityContextType {
  communities: DbCommunity[];
  selectedCommunity: DbCommunity | null;
  setSelectedCommunity: (community: DbCommunity | null) => void;
  isLoading: boolean;
  refreshCommunities: () => Promise<void>;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export const CommunityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const [communities, setCommunities] = useState<DbCommunity[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<DbCommunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCommunities = async () => {
    if (!user) {
      setCommunities([]);
      setSelectedCommunity(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let communityList: DbCommunity[] = [];

      // Creators see ONLY their own communities
      if (role === 'creator' || role === 'superadmin') {
        communityList = await getCreatorCommunities(user.id);
      } else {
        // Students/members see communities they're part of
        communityList = await getMemberCommunities(user.id);

        // Only students can fall back to seeing public communities (to join)
        if (communityList.length === 0) {
          communityList = await getCommunities();
        }
      }

      setCommunities(communityList);

      // Auto-select first community if none selected or current selection not in list
      if (communityList.length > 0) {
        const currentStillExists = selectedCommunity && communityList.some(c => c.id === selectedCommunity.id);
        if (!currentStillExists) {
          setSelectedCommunity(communityList[0]);
        }
      } else {
        setSelectedCommunity(null);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunities();
  }, [user, role]);

  const refreshCommunities = async () => {
    await loadCommunities();
  };

  return (
    <CommunityContext.Provider
      value={{
        communities,
        selectedCommunity,
        setSelectedCommunity,
        isLoading,
        refreshCommunities,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export const useCommunity = (): CommunityContextType => {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
};
