import React, { useState } from 'react';
import { X, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { DbModule, UnlockType } from '../../../core/supabase/database.types';
import { createModule, updateModule, deleteModule } from '../courseService';

interface ModuleEditModalProps {
  module: DbModule | null; // null for create mode
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (module: DbModule) => void;
  onDelete?: () => void;
}

const MAX_TITLE_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 1000;

const ModuleEditModal: React.FC<ModuleEditModalProps> = ({
  module,
  courseId,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditMode = module !== null;

  const [title, setTitle] = useState(module?.title || '');
  const [description, setDescription] = useState(module?.description || '');
  const [unlockType, setUnlockType] = useState<UnlockType>(module?.unlock_type || 'immediate');
  const [unlockValue, setUnlockValue] = useState(module?.unlock_value || '');
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

    setIsSaving(true);

    if (isEditMode && module) {
      const updated = await updateModule(module.id, {
        title: title.trim(),
        description: description.trim() || null,
        unlock_type: unlockType,
        unlock_value: unlockType !== 'immediate' ? unlockValue : null,
      });
      if (updated) {
        onSave(updated);
      } else {
        setErrorMessage('Failed to save module. Please try again.');
      }
    } else {
      const created = await createModule(
        courseId,
        title.trim(),
        description.trim() || undefined
      );
      if (created) {
        onSave(created);
      } else {
        setErrorMessage('Failed to create module. Please try again.');
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!module || !onDelete) return;
    setIsDeleting(true);
    const success = await deleteModule(module.id);
    if (success) {
      onDelete();
    }
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditMode ? 'Edit Module' : 'Add Module'}
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
              placeholder="Module title"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20 resize-none"
              placeholder="Brief description of this module"
            />
          </div>

          {/* Unlock Settings */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Unlock Condition
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnlockType('immediate')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  unlockType === 'immediate'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Immediate
              </button>
              <button
                type="button"
                onClick={() => setUnlockType('date')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  unlockType === 'date'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                On Date
              </button>
              <button
                type="button"
                onClick={() => setUnlockType('progress')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  unlockType === 'progress'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                After %
              </button>
            </div>

            {/* Unlock Value Input */}
            {unlockType === 'date' && (
              <div className="mt-2">
                <input
                  type="date"
                  value={unlockValue}
                  onChange={(e) => setUnlockValue(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
            {unlockType === 'progress' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={unlockValue}
                  onChange={(e) => setUnlockValue(e.target.value)}
                  className="w-24 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="50"
                />
                <span className="text-sm text-slate-500">% completion of previous module</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Section (edit mode only) */}
        {isEditMode && onDelete && (
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            {showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-medium">Delete this module?</span>
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
                Delete Module
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
              'Add Module'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleEditModal;
