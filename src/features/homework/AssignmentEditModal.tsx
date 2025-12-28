import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { DbHomeworkAssignment } from '../../core/supabase/database.types';

interface AssignmentEditModalProps {
  assignment?: DbHomeworkAssignment | null; // null for create mode
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    maxPoints: number;
    dueDate: string | null;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;
const MIN_POINTS = 1;
const MAX_POINTS = 10;
const DEFAULT_POINTS = 10;

const AssignmentEditModal: React.FC<AssignmentEditModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = !!assignment;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPoints, setMaxPoints] = useState(DEFAULT_POINTS);
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form when modal opens or assignment changes
  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        setTitle(assignment.title);
        setDescription(assignment.description || '');
        setMaxPoints(assignment.max_points);
        // Convert ISO date to YYYY-MM-DD format for input
        setDueDate(assignment.due_date ? assignment.due_date.split('T')[0] : '');
      } else {
        // Create mode - reset to defaults
        setTitle('');
        setDescription('');
        setMaxPoints(DEFAULT_POINTS);
        setDueDate('');
      }
      setErrorMessage(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, assignment]);

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
    if (maxPoints < MIN_POINTS || maxPoints > MAX_POINTS) {
      setErrorMessage(`Points must be between ${MIN_POINTS} and ${MAX_POINTS}`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        maxPoints,
        dueDate: dueDate || null,
      });
    } catch (error) {
      setErrorMessage('Failed to save assignment. Please try again.');
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
      setErrorMessage('Failed to delete assignment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setMaxPoints(Math.min(MAX_POINTS, Math.max(MIN_POINTS, value)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditMode ? 'Edit Assignment' : 'Create Assignment'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Form Content */}
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
              placeholder="Assignment title"
              maxLength={MAX_TITLE_LENGTH}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Instructions
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
              placeholder="Describe what students need to do..."
              maxLength={MAX_DESCRIPTION_LENGTH}
            />
            <p className="text-xs text-slate-400 mt-1">
              {description.length}/{MAX_DESCRIPTION_LENGTH} characters
            </p>
          </div>

          {/* Max Points */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Maximum Points
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={maxPoints}
                onChange={handlePointsChange}
                min={MIN_POINTS}
                max={MAX_POINTS}
                className="w-24 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-sm text-slate-500">
                ({MIN_POINTS}-{MAX_POINTS} points)
              </span>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Due Date <span className="text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pl-10"
              />
              <Calendar
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
            {dueDate && (
              <button
                onClick={() => setDueDate('')}
                className="text-xs text-slate-500 hover:text-slate-700 mt-1"
              >
                Clear due date
              </button>
            )}
          </div>
        </div>

        {/* Delete Section - Only show in edit mode */}
        {isEditMode && onDelete && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">Delete this assignment?</span>
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
                Delete Assignment
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
              'Create Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentEditModal;
