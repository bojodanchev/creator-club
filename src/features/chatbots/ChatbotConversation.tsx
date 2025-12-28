import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { DbCommunityChatbot } from '../../core/supabase/database.types';
import { useAuth } from '../../core/contexts/AuthContext';
import { getConversation, saveConversation, ConversationMessage } from './chatbotService';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

interface ChatbotConversationProps {
  chatbot: DbCommunityChatbot;
}

/**
 * Send a message to a chatbot using its custom system prompt
 */
async function sendChatbotMessage(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  systemPrompt: string,
  userName?: string
): Promise<string> {
  if (!apiKey) {
    return 'API Key is missing. Please check your environment configuration.';
  }

  try {
    // Build messages array for the AI
    const messages = [
      ...history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    // Call the Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: messages,
        systemInstruction: systemPrompt,
        apiKey: apiKey,
        userName: userName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Edge Function Error:', error);
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();
    return data.content || "I couldn't generate a response.";
  } catch (error) {
    console.error('Chatbot Error:', error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
}

const ChatbotConversation: React.FC<ChatbotConversationProps> = ({ chatbot }) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation on mount
  useEffect(() => {
    const loadConversation = async () => {
      if (!profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const existingConversation = await getConversation(chatbot.id, profile.id);

        if (existingConversation && existingConversation.messages.length > 0) {
          // Use existing conversation history
          setMessages(existingConversation.messages);
        } else if (chatbot.greeting_message) {
          // No history - show greeting message as first bot message
          const greetingMessage: ConversationMessage = {
            role: 'model',
            text: chatbot.greeting_message,
            timestamp: new Date().toISOString(),
          };
          setMessages([greetingMessage]);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        // On error, still show greeting if available
        if (chatbot.greeting_message) {
          const greetingMessage: ConversationMessage = {
            role: 'model',
            text: chatbot.greeting_message,
            timestamp: new Date().toISOString(),
          };
          setMessages([greetingMessage]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [chatbot.id, chatbot.greeting_message, profile?.id]);

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isSending || !profile?.id) return;

    // Create user message
    const userMessage: ConversationMessage = {
      role: 'user',
      text: trimmedMessage,
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsSending(true);

    try {
      // Build history for the API (excluding the new message we just added)
      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      // Get bot response using chatbot's system prompt
      const botResponseText = await sendChatbotMessage(
        trimmedMessage,
        history,
        chatbot.system_prompt || 'You are a helpful assistant.',
        profile.full_name || undefined
      );

      // Create bot response message
      const botMessage: ConversationMessage = {
        role: 'model',
        text: botResponseText,
        timestamp: new Date().toISOString(),
      };

      // Add bot response to messages
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Save conversation to database
      await saveConversation(chatbot.id, profile.id, finalMessages);
    } catch (error) {
      console.error('Error sending message:', error);

      // Add error message
      const errorMessage: ConversationMessage = {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <Loader2 size={32} className="animate-spin text-indigo-600 mb-3" />
        <p className="text-slate-500">Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            <Bot size={48} className="mx-auto mb-3 text-slate-300" />
            <p>Start a conversation with {chatbot.name}</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-2 max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Bot size={16} className="text-slate-600" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator for bot response */}
        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Bot size={16} className="text-slate-600" />
              </div>
              <div className="px-4 py-3 bg-slate-100 rounded-2xl rounded-bl-md">
                <Loader2 size={18} className="animate-spin text-slate-500" />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${chatbot.name}...`}
            disabled={isSending}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotConversation;
