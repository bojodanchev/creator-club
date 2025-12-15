import React, { useState } from 'react';
import { User, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import ProfileSettings from './ProfileSettings';
import CreatorSettings from './CreatorSettings';
import AccountSettings from './AccountSettings';

type SettingsTab = 'profile' | 'creator' | 'account';

const Settings: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Check if user can access creator settings
  const canAccessCreatorSettings = role === 'creator' || role === 'superadmin';

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label: 'Profile',
      icon: User,
      visible: true,
    },
    {
      id: 'creator' as SettingsTab,
      label: 'Creator Settings',
      icon: Sparkles,
      visible: canAccessCreatorSettings,
    },
    {
      id: 'account' as SettingsTab,
      label: 'Account',
      icon: Shield,
      visible: true,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'creator':
        return <CreatorSettings />;
      case 'account':
        return <AccountSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs and Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="flex overflow-x-auto">
            {tabs
              .filter((tab) => tab.visible)
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-600 bg-white'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }
                    `}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default Settings;
