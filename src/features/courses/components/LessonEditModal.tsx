import React, { useState } from 'react';
import { X, Loader2, Trash2, AlertTriangle, PlayCircle, FileText, File, HelpCircle } from 'lucide-react';
import { DbLesson, LessonType } from '../../../core/supabase/database.types';
import { createLesson, updateLesson, deleteLesson } from '../courseService';

interface LessonEditModalProps {
  lesson: DbLesson | null; // null for create mode
  moduleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: DbLesson) => void;
  onDelete?: () => void;
}

const lessonTypeConfig: { type: LessonType; label: string; icon: React.ReactNode }[] = [
  { type: 'video', label: 'Video', icon: <PlayCircle size={18} /> },
  { type: 'text', label: 'Text', icon: <FileText size={18} /> },
  { type: 'file', label: 'File', icon: <File size={18} /> },
  { type: 'quiz', label: 'Quiz', icon: <HelpCircle size={18} /> },
];

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_DURATION_MINUTES = 1440; // 24 hours

const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const LessonEditModal: React.FC<LessonEditModalProps> = ({
  lesson,
  moduleId,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = lesson !== null;

  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [type, setType] = useState<LessonType>(lesson?.type || 'video');
  const [contentUrl, setContentUrl] = useState(lesson?.content_url || '');
  const [durationMinutes, setDurationMinutes] = useState<string>(
    lesson?.duration_minutes?.toString() || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage('Title is required');
      return;
    }
    if (title.trim().length > MAX_TITLE_LENGTH) {
      setErrorMessage(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setErrorMessage(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }
    if (contentUrl && !isValidUrl(contentUrl.trim())) {
      setErrorMessage('Please enter a valid URL');
      return;
    }

    const duration = durationMinutes ? parseInt(durationMinutes, 10) : undefined;
    if (duration !== undefined && (duration < 0 || duration > MAX_DURATION_MINUTES)) {
      setErrorMessage(`Duration must be between 0 and ${MAX_DURATION_MINUTES} minutes`);
      return;
    }

    setIsSaving(true);

    if (isEditMode && lesson) {
      const updated = await updateLesson(lesson.id, {
        title: title.trim(),
        description: description.trim() || null,
        type,
        content_url: contentUrl.trim() || null,
        duration_minutes: duration || null,
      });
      if (updated) {
        onSave(updated);
      } else {
        setErrorMessage('Failed to save lesson. Please try again.');
      }
    } else {
      const created = await createLesson(
        moduleId,
        title.trim(),
        type,
        description.trim() || undefined,
        contentUrl.trim() || undefined,
        undefined, // position - auto-calculated
        duration
      );
      if (created) {
        onSave(created);
      } else {
        setErrorMessage('Failed to create lesson. Please try again.');
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!lesson || !onDelete) return;
    setIsDeleting(true);
    const success = await deleteLesson(lesson.id);
    if (success) {
      onDelete();
    }
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditMode ? 'Edit Lesson' : 'Add Lesson'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Lesson title"
              autoFocus
            />
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lesson Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {lessonTypeConfig.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border transition-colors ${
                    type === item.type
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Type-specific fields */}
          {type === 'video' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://youtube.com/watch?v=... or direct video URL"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Supports YouTube, Vimeo, or direct video file URLs
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-32 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="15"
                />
              </div>
            </>
          )}

          {type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Content URL or Embed
              </label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="URL to text content or Google Doc"
              />
              <p className="text-xs text-slate-500 mt-1">
                Link to a document, Google Doc, or Notion page
              </p>
            </div>
          )}

          {type === 'file' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File URL
              </label>
              <input
                type="url"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://example.com/file.pdf"
              />
              <p className="text-xs text-slate-500 mt-1">
                Link to a downloadable file (PDF, ZIP, etc.)
              </p>
            </div>
          )}

          {type === 'quiz' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                Quiz functionality coming soon. You can add a quiz lesson placeholder now and configure it later.
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
              placeholder="Brief description or notes for this lesson (shown to students)"
            />
          </div>
        </div>

        {/* Delete Section (edit mode only) */}
        {isEditMode && onDelete && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">Delete this lesson?</span>
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
                Delete Lesson
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
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
              'Add Lesson'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonEditModal;
