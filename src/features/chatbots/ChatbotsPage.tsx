import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, Loader2 } from 'lucide-react';
import { DbCommunityChatbot } from '../../core/supabase/database.types';
import { getActiveChatbots } from './chatbotService';
import ChatbotConversation from './ChatbotConversation';

interface ChatbotsPageProps {
  communityId: string;
}

// Role emoji mapping
const ROLE_EMOJIS: Record<string, string> = {
  qa: '🤖',
  motivation: '💪',
  support: '🛠️',
};

const ChatbotsPage: React.FC<ChatbotsPageProps> = ({ communityId }) => {
  const [chatbots, setChatbots] = useState<DbCommunityChatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<DbCommunityChatbot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load active chatbots on mount
  useEffect(() => {
    const loadChatbots = async () => {
      setIsLoading(true);
      try {
        const activeChatbots = await getActiveChatbots(communityId);
        setChatbots(activeChatbots);
        // Auto-select first chatbot if available
        if (activeChatbots.length > 0) {
          setSelectedChatbot(activeChatbots[0]);
        }
      } catch (error) {
        console.error('Error loading chatbots:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatbots();
  }, [communityId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // Empty state - no active chatbots
  if (chatbots.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <Bot className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">AI Chat</h1>
                <p className="text-slate-600">Chat with AI assistants</p>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No AI chatbots available yet
            </h2>
            <p className="text-slate-600 max-w-md mx-auto">
              The community creator hasn't set up any AI chatbots yet. Check back later!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Bot className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Chat</h1>
              <p className="text-slate-600">Chat with AI assistants</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {chatbots.map((chatbot) => (
              <button
                key={chatbot.id}
                onClick={() => setSelectedChatbot(chatbot)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedChatbot?.id === chatbot.id
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="mr-1.5">{ROLE_EMOJIS[chatbot.role] || '🤖'}</span>
                {chatbot.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-5">
        <div className="h-[calc(100vh-270px)] bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
          {selectedChatbot && (
            <ChatbotConversation
              key={selectedChatbot.id}
              chatbot={selectedChatbot}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatbotsPage;
