import React, { useState } from 'react';
import { LayoutDashboard, Users, GraduationCap, Calendar, BrainCircuit, Settings, LogOut, Menu, Plus, ClipboardList, Bot, UserCog } from 'lucide-react';
import { View } from '../core/types';
import { NAV_ITEMS, CREATOR_NAV_ITEMS } from '../core/constants';
import { useAuth } from '../core/contexts/AuthContext';
import CommunitySwitcher from './CommunitySwitcher';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onBrowseCommunities?: () => void;
  onCreateCommunity?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isOpen, setIsOpen, onBrowseCommunities, onCreateCommunity }) => {
  const { signOut, profile, role } = useAuth();
  const isCreator = role === 'creator' || role === 'superadmin';

  // Check if user is a student (not creator or superadmin)
  const isStudent = role === 'student' || role === 'member';

  const iconMap: Record<string, React.ReactNode> = {
    'LayoutDashboard': <LayoutDashboard size={20} />,
    'Users': <Users size={20} />,
    'GraduationCap': <GraduationCap size={20} />,
    'Calendar': <Calendar size={20} />,
    'BrainCircuit': <BrainCircuit size={20} />,
    'ClipboardList': <ClipboardList size={20} />,
    'Bot': <Bot size={20} />,
    'UserCog': <UserCog size={20} />,
  };

  // Filter and modify nav items based on role
  const getNavItems = () => {
    const baseItems = NAV_ITEMS
      .filter(item => {
        // Hide AI Success Manager for students
        if (isStudent && item.id === View.AI_MANAGER) return false;
        return true;
      })
      .map(item => {
        // Change Dashboard label to Home for students
        if (isStudent && item.id === View.DASHBOARD) {
          return { ...item, label: 'Home' };
        }
        return item;
      });

    // Add creator-only nav items for creators
    if (isCreator) {
      return [...baseItems, ...CREATOR_NAV_ITEMS];
    }

    return baseItems;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 z-20 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              C
            </div>
            <span>Creator Club™</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {getNavItems().map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${currentView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {iconMap[item.icon]}
              {item.label}
            </button>
          ))}

          {/* Community Switcher - Always visible */}
          <CommunitySwitcher
            onBrowseMore={() => {
              if (onBrowseCommunities) {
                onBrowseCommunities();
              }
              setIsOpen(false);
            }}
            onCreateCommunity={isCreator ? () => {
              // Navigate to community view first, then trigger create
              setCurrentView(View.COMMUNITY);
              if (onCreateCommunity) {
                onCreateCommunity();
              }
              setIsOpen(false);
            } : undefined}
          />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              setCurrentView(View.SETTINGS);
              setIsOpen(false);
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${currentView === View.SETTINGS
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            `}
          >
            <Settings size={20} />
            Settings
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
          <div className="mt-4 flex items-center gap-3 px-4">
            <img
              src={profile?.avatar_url || "https://picsum.photos/seed/creator/40/40"}
              alt={profile?.full_name || "User"}
              className="w-8 h-8 rounded-full border border-slate-600"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{profile?.role || 'Member'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
