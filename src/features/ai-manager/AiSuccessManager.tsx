import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertTriangle, FileText, Loader2, RefreshCw } from 'lucide-react';
import { sendMentorMessage, analyzeStudentRisks } from './geminiService';
import { AIMessage, Student, RiskLevel } from '../../core/types';
import { getAtRiskStudents, AtRiskStudent } from '../dashboard/dashboardService';
import { recalculateAllStudentHealth, getStudentHealthReport } from './studentHealthService';
import { useAuth } from '../../core/contexts/AuthContext';
import AiResponseText from '../../components/ui/AiResponseText';

const AiSuccessManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('chat');

  // Chat State
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: 'model', text: "Hello! I'm your AI Success Manager. I've analyzed your community data. How can I help you improve engagement today?", timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Report State
  const [report, setReport] = useState<string | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // At-Risk Students State
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load at-risk students on mount
  useEffect(() => {
    if (user) {
      loadAtRiskStudents();
    }
  }, [user]);

  const loadAtRiskStudents = async () => {
    if (!user) return;

    setIsLoadingStudents(true);
    try {
      const students = await getAtRiskStudents(user.id);
      setAtRiskStudents(students);
    } catch (error) {
      console.error('Error loading at-risk students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleRecalculateRiskScores = async () => {
    if (!user) return;

    setIsRecalculating(true);
    try {
      const result = await recalculateAllStudentHealth(user.id);
      console.log(`Recalculated health for ${result.updated} students (${result.errors} errors)`);

      // Reload at-risk students after recalculation
      await loadAtRiskStudents();

      // Show success message in chat
      const successMsg: AIMessage = {
        role: 'model',
        text: `I've recalculated risk scores for all students. Found ${atRiskStudents.length} students who need attention.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMsg]);
    } catch (error) {
      console.error('Error recalculating risk scores:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg: AIMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const originalInput = input;
    setInput('');
    setIsTyping(true);

    // Detect /stats command
    const isStatsCommand = originalInput.toLowerCase().trim() === '/stats' ||
                           originalInput.toLowerCase().includes('overview') ||
                           originalInput.toLowerCase().includes('dashboard');

    // Build context with real student data if available
    let contextMessage = userMsg.text;

    // If user is asking about students, add context
    if (atRiskStudents.length > 0 && (
      userMsg.text.toLowerCase().includes('student') ||
      userMsg.text.toLowerCase().includes('risk') ||
      userMsg.text.toLowerCase().includes('help') ||
      userMsg.text.toLowerCase().includes('at-risk') ||
      userMsg.text.toLowerCase().includes('engagement')
    )) {
      const studentContext = atRiskStudents
        .slice(0, 5) // Top 5 at-risk students
        .map(s =>
          `- ${s.name} (${s.email}): Risk Score ${s.risk_score}/100 | ${s.reason} | Course: ${s.course_title || 'N/A'} | Last Active: ${s.last_activity_at ? new Date(s.last_activity_at).toLocaleDateString() : 'Never'}`
        )
        .join('\n');

      contextMessage = `${userMsg.text}\n\n[CONTEXT: Current At-Risk Students]\n${studentContext}`;
    }

    const historyForApi = messages.map(m => ({ role: m.role, text: m.text }));

    // Call enhanced sendMentorMessage with creatorId, includeStats, and userName
    const response = await sendMentorMessage(
      contextMessage,
      historyForApi,
      user.id, // Pass creatorId for personalization
      isStatsCommand, // Include stats if /stats command or overview/dashboard keywords detected
      profile?.full_name // Pass user's name for personalized responses
    );

    const aiMsg: AIMessage = { role: 'model', text: response || "I encountered an error.", timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const generateReport = async () => {
    if (!user) return;

    setIsLoadingReport(true);

    // Convert AtRiskStudent to Student format for AI analysis
    const studentsForAnalysis: Student[] = atRiskStudents.map(s => {
      // Map risk_score to RiskLevel
      let riskLevel: RiskLevel;
      if (s.risk_score >= 80) riskLevel = RiskLevel.CRITICAL;
      else if (s.risk_score >= 60) riskLevel = RiskLevel.HIGH;
      else if (s.risk_score >= 30) riskLevel = RiskLevel.MEDIUM;
      else riskLevel = RiskLevel.LOW;

      // Format last login
      const lastLogin = s.last_activity_at
        ? new Date(s.last_activity_at).toLocaleDateString()
        : 'Never';

      // Estimate progress based on risk score (inverse relationship)
      const courseProgress = Math.max(0, 100 - s.risk_score);

      return {
        id: s.user_id,
        name: s.name,
        avatar: s.avatar_url || 'https://picsum.photos/100/100',
        email: s.email,
        joinDate: 'N/A', // Not tracked in current schema
        lastLogin: lastLogin,
        courseProgress: courseProgress,
        communityEngagement: Math.max(0, 100 - s.risk_score), // Estimate
        riskLevel: riskLevel,
        riskReason: s.reason,
      };
    });

    const result = await analyzeStudentRisks(studentsForAnalysis);
    setReport(result);
    setIsLoadingReport(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-500" />
            AI Success Manager™
          </h1>
          <p className="text-slate-500">Your intelligent partner for community growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateRiskScores}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isRecalculating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {isRecalculating ? 'Recalculating...' : 'Recalculate Risk Scores'}
          </button>
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Mentor Chat
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Success Report
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Chat Section */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'}`}>
                    {msg.role === 'model' ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div className={`max-w-[70%] p-4 rounded-2xl ${msg.role === 'model' ? 'bg-slate-50 text-slate-800 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                    {msg.role === 'model' ? (
                      <AiResponseText text={msg.text} />
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                 <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                     <Bot size={18} />
                   </div>
                   <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none flex gap-1">
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your AI mentor anything..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* At-Risk Students Sidebar */}
          <div className="w-80 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                At-Risk Students
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {atRiskStudents.length} students need attention
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingStudents ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              ) : atRiskStudents.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  <p>No at-risk students found.</p>
                  <p className="text-xs mt-2">All students are doing well!</p>
                </div>
              ) : (
                atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={student.avatar_url || 'https://picsum.photos/40/40'}
                        alt={student.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 text-sm truncate">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {student.email}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-600">Risk Score</span>
                            <span className={`text-xs font-semibold ${
                              student.risk_score >= 60 ? 'text-red-600' :
                              student.risk_score >= 30 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {student.risk_score}/100
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                student.risk_score >= 60 ? 'bg-red-500' :
                                student.risk_score >= 30 ? 'bg-orange-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${student.risk_score}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {student.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
          {!report ? (
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Generate Weekly Success Report</h3>
              <p className="text-slate-500 mb-8">
                The AI will analyze login patterns, course progress, and community sentiment to identify at-risk students and growth opportunities.
              </p>
              <button 
                onClick={generateReport}
                disabled={isLoadingReport}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-70"
              >
                {isLoadingReport ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {isLoadingReport ? 'Analyzing Data...' : 'Run Analysis'}
              </button>
            </div>
          ) : (
            <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-slate-900">Analysis Results</h2>
                 <button onClick={() => setReport(null)} className="text-sm text-indigo-600 font-medium hover:underline">Run New Analysis</button>
              </div>
              <div className="prose prose-slate max-w-none bg-slate-50 p-6 rounded-xl border border-slate-100">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiSuccessManager;
