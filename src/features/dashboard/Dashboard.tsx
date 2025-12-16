import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, Users, DollarSign, ArrowUpRight, ArrowDownRight, Loader2, X, Mail, BookOpen, Calendar, Plus, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  getDashboardStats,
  getAtRiskStudents,
  getWeeklyActivityData,
  DashboardStats,
  AtRiskStudent,
  ActivityDataPoint,
} from './dashboardService';
import TasksPanel from './TasksPanel';
import { getCreatorCommunities, createCommunity, seedDefaultChannels, joinCommunity } from '../community/communityService';
import { DbCommunity } from '../../core/supabase/database.types';

const StatCard = ({ title, value, change, icon: Icon, color, isPositive = true }: {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  isPositive?: boolean;
}) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={`font-medium flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
        {change}
      </span>
      <span className="text-slate-400 ml-2">vs last week</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    completionRate: 0,
    atRiskCount: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);

  // Onboarding state
  const [hasCommunity, setHasCommunity] = useState<boolean | null>(null);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      checkCreatorCommunity();
    }
  }, [user?.id]);

  const checkCreatorCommunity = async () => {
    if (!user?.id) return;
    const communities = await getCreatorCommunities(user.id);
    setHasCommunity(communities.length > 0);
  };

  const handleCreateCommunity = async () => {
    if (!user?.id || !newCommunityName.trim()) return;

    setCreatingCommunity(true);
    try {
      const community = await createCommunity(user.id, newCommunityName.trim());
      if (community) {
        await seedDefaultChannels(community.id);
        await joinCommunity(user.id, community.id, 'admin');
        setHasCommunity(true);
        setShowCreateCommunityModal(false);
        setNewCommunityName('');
        showToast('Community created! Head to the Community tab to customize it.');
      }
    } finally {
      setCreatingCommunity(false);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [statsData, riskData, activity] = await Promise.all([
        getDashboardStats(user.id),
        getAtRiskStudents(user.id),
        getWeeklyActivityData(user.id),
      ]);

      setStats(statsData);
      setAtRiskStudents(riskData);
      setActivityData(activity);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Creator';

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Creator Dashboard</h1>
          <p className="text-slate-500">Welcome back, {displayName}. Here's what's happening today.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          Generate Report
        </button>
      </div>

      {/* Onboarding Banner for new creators without a community */}
      {hasCommunity === false && (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Welcome to Creator Club!</h2>
              <p className="text-white/90 mb-4">
                Get started by creating your community. This is where your students will connect, share wins, and engage with your content.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateCommunityModal(true)}
                  className="bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  Create Your Community
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Community Hub</h3>
                <p className="text-sm text-white/80">Engage with students in channels</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Course Content</h3>
                <p className="text-sm text-white/80">Create courses and modules</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-semibold">Events & Calls</h3>
                <p className="text-sm text-white/80">Schedule live sessions</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents.toString()}
          change="+5%"
          icon={Users}
          color="bg-indigo-500"
        />
        <StatCard
          title="Active Students"
          value={stats.activeStudents.toString()}
          change="+12%"
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          change="+2%"
          icon={DollarSign}
          color="bg-blue-500"
        />
        <StatCard
          title="At Risk"
          value={stats.atRiskCount.toString()}
          change={stats.atRiskCount > 0 ? `-${stats.atRiskCount}` : '0'}
          icon={AlertTriangle}
          color="bg-rose-500"
          isPositive={stats.atRiskCount === 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Engagement Activity</h2>
          <div className="h-80 w-full">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" stroke="#4f46e5" fillOpacity={1} fill="url(#colorActive)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No activity data available yet
              </div>
            )}
          </div>
        </div>

        {/* At Risk List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">At-Risk Students</h2>
            <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
              {atRiskStudents.length} Needs Attention
            </span>
          </div>
          <div className="space-y-4">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map(student => (
                <div key={student.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-semibold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{student.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                        ${student.risk_score >= 80 ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}
                      `}>
                        {student.risk_score >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{student.reason}</p>
                    {student.course_title && (
                      <p className="text-xs text-indigo-500 mt-1">{student.course_title}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs py-1 rounded hover:bg-slate-50"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowMessageModal(true);
                        }}
                        className="flex-1 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs py-1 rounded hover:bg-indigo-100"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No at-risk students</p>
                <p className="text-xs mt-1">All your students are doing great!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TasksPanel />
      </div>

      {/* Student Profile Modal */}
      {selectedStudent && !showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {selectedStudent.avatar_url ? (
                    <img src={selectedStudent.avatar_url} alt={selectedStudent.name} className="w-16 h-16 rounded-full border-2 border-white/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                    <p className="text-white/80 text-sm">{selectedStudent.course_title || 'No course'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Risk Score</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                  selectedStudent.risk_score >= 80 ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {selectedStudent.risk_score}/100
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`text-sm font-bold ${
                  selectedStudent.risk_score >= 80 ? 'text-rose-600' : 'text-orange-600'
                }`}>
                  {selectedStudent.risk_score >= 80 ? 'Critical' : 'At Risk'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Reason for Risk</span>
                <p className="text-sm text-slate-900 mt-1">{selectedStudent.reason}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowMessageModal(true);
                  }}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  <Mail size={16} />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {selectedStudent.avatar_url ? (
                    <img src={selectedStudent.avatar_url} alt={selectedStudent.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">Message {selectedStudent.name}</h3>
                    <p className="text-xs text-slate-500">Send a personalized message to this student</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">
                  <strong>Risk reason:</strong> {selectedStudent.reason}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Message</label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write an encouraging message to help this student get back on track..."
                  className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessageText('');
                  }}
                  className="flex-1 py-2 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!messageText.trim()) return;
                    setSendingMessage(true);
                    // Simulate sending (in a real app, this would call an API)
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    setSendingMessage(false);
                    setShowMessageModal(false);
                    setSelectedStudent(null);
                    setMessageText('');
                    showToast(`Message sent to ${selectedStudent.name}!`);
                  }}
                  disabled={!messageText.trim() || sendingMessage}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <h3 className="text-xl font-bold">Create Your Community</h3>
              <p className="text-white/80 text-sm mt-1">This is where your students will connect and engage</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Community Name</label>
                <input
                  type="text"
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="e.g., My Awesome Community"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  You can always change this later in settings
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-2">What you'll get:</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Default channels (General, Wins, Help, Announcements, Introductions)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Gamification with points & leaderboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-500">✓</span> Post, comment, and like features
                  </li>
                </ul>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowCreateCommunityModal(false);
                    setNewCommunityName('');
                  }}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCommunity}
                  disabled={!newCommunityName.trim() || creatingCommunity}
                  className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingCommunity ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                  Create Community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in z-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
