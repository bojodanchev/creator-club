import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, Bot, AlertTriangle } from 'lucide-react';
import { DbCommunityChatbot } from '../../core/supabase/database.types';
import { getRoleDefaults, ChatbotRole } from './chatbotService';

interface ChatbotEditModalProps {
  chatbot?: DbCommunityChatbot | null; // null for create mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    role: 'qa' | 'motivation' | 'support';
    systemPrompt: string;
    personality: string;
    greetingMessage: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const ROLE_OPTIONS: { value: ChatbotRole; label: string; emoji: string }[] = [
  { value: 'qa', label: 'QA Bot', emoji: '🤖' },
  { value: 'motivation', label: 'Motivation Coach', emoji: '💪' },
  { value: 'support', label: 'Tech Support', emoji: '🛠️' },
];

const ChatbotEditModal: React.FC<ChatbotEditModalProps> = ({
  chatbot,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = !!chatbot;

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<ChatbotRole>('qa');
  const [personality, setPersonality] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form values when modal opens or chatbot changes
  useEffect(() => {
    if (isOpen) {
      if (chatbot) {
        // Edit mode - populate with existing chatbot data
        setName(chatbot.name);
        setRole(chatbot.role);
        setPersonality(chatbot.personality || '');
        setSystemPrompt(chatbot.system_prompt || '');
        setGreetingMessage(chatbot.greeting_message || '');
      } else {
        // Create mode - use defaults for initial role
        const defaults = getRoleDefaults('qa');
        setName('');
        setRole('qa');
        setPersonality(defaults.personality);
        setSystemPrompt(defaults.systemPrompt);
        setGreetingMessage(defaults.greeting);
      }
      setErrorMessage(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, chatbot]);

  // Handle role change in create mode - update fields to role defaults
  const handleRoleChange = (newRole: ChatbotRole) => {
    setRole(newRole);

    // Only auto-populate defaults in create mode
    if (!isEditMode) {
      const defaults = getRoleDefaults(newRole);
      setPersonality(defaults.personality);
      setSystemPrompt(defaults.systemPrompt);
      setGreetingMessage(defaults.greeting);
    }
  };

  const handleSave = async () => {
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage('Bot name is required');
      return;
    }

    if (!systemPrompt.trim()) {
      setErrorMessage('System prompt is required');
      return;
    }

    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        role,
        systemPrompt: systemPrompt.trim(),
        personality: personality.trim(),
        greetingMessage: greetingMessage.trim(),
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to save chatbot. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to delete chatbot. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-900">
              {isEditMode ? 'Edit Chatbot' : 'Create Chatbot'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Bot Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bot Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Course Helper"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleRoleChange(option.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    role === option.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Personality
            </label>
            <input
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Friendly and knowledgeable"
            />
            <p className="text-xs text-slate-500 mt-1">
              A brief description of the bot's personality traits
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              System Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-28 resize-none"
              placeholder="Instructions for the AI..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Instructions that tell the AI how to behave and respond
            </p>
          </div>

          {/* Greeting Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Greeting Message
            </label>
            <textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20 resize-none"
              placeholder="First message shown to students..."
            />
            <p className="text-xs text-slate-500 mt-1">
              The first message students see when they start a conversation
            </p>
          </div>
        </div>

        {/* Delete Section (only in edit mode) */}
        {isEditMode && onDelete && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">Delete this chatbot?</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={14} />
                Delete Chatbot
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !systemPrompt.trim() || isSaving}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Chatbot'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotEditModal;
