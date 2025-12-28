import React, { useState } from 'react';
import { X, Loader2, FileText, Image, Film, ExternalLink, File } from 'lucide-react';
import { DbHomeworkSubmissionWithStudent } from '../../core/supabase/database.types';

interface GradingModalProps {
  submission: DbHomeworkSubmissionWithStudent;
  maxPoints: number;
  isOpen: boolean;
  onClose: () => void;
  onGrade: (points: number, feedback: string | null) => Promise<void>;
}

/**
 * Returns appropriate icon based on file URL extension
 */
const getFileIcon = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt'];

  if (imageExtensions.includes(extension)) {
    return <Image size={16} className="text-blue-500" />;
  }
  if (videoExtensions.includes(extension)) {
    return <Film size={16} className="text-purple-500" />;
  }
  if (documentExtensions.includes(extension)) {
    return <FileText size={16} className="text-red-500" />;
  }
  return <File size={16} className="text-slate-500" />;
};

/**
 * Extracts filename from URL
 */
const getFileName = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1] || 'File';
  } catch {
    return url.split('/').pop() || 'File';
  }
};

const GradingModal: React.FC<GradingModalProps> = ({
  submission,
  maxPoints,
  isOpen,
  onClose,
  onGrade,
}) => {
  const [points, setPoints] = useState<number>(
    submission.points_awarded ?? Math.round(maxPoints * 0.8)
  );
  const [feedback, setFeedback] = useState<string>(submission.feedback || '');
  const [isGrading, setIsGrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const studentName = submission.student?.full_name || submission.student?.email || 'Unknown Student';
  const submittedDate = new Date(submission.submitted_at).toLocaleString();

  const handleGrade = async () => {
    setErrorMessage(null);
    setIsGrading(true);

    try {
      await onGrade(points, feedback.trim() || null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to grade submission. Please try again.'
      );
      setIsGrading(false);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPoints(parseInt(e.target.value, 10));
  };

  // Calculate percentage for gradient styling
  const percentage = maxPoints > 0 ? (points / maxPoints) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Grade Submission</h3>
          <button
            onClick={onClose}
            disabled={isGrading}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Student Info */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {submission.student?.avatar_url ? (
                <img
                  src={submission.student.avatar_url}
                  alt={studentName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-sm">
                    {studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h4 className="font-medium text-slate-900">{studentName}</h4>
                <p className="text-xs text-slate-500">Submitted: {submittedDate}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          {/* Student's Text Response */}
          {submission.text_response && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student's Response
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {submission.text_response}
                </p>
              </div>
            </div>
          )}

          {/* Attached Files */}
          {submission.file_urls && submission.file_urls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Attached Files
              </label>
              <div className="space-y-2">
                {submission.file_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    {getFileIcon(url)}
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      {getFileName(url)}
                    </span>
                    <ExternalLink
                      size={16}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No Content Message */}
          {!submission.text_response && (!submission.file_urls || submission.file_urls.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
              This submission has no text response or attached files.
            </div>
          )}

          {/* Grade Section */}
          <div className="border-t border-slate-100 pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Grade
            </label>

            {/* Points Display */}
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <span className="text-4xl font-bold text-indigo-600">{points}</span>
                <span className="text-2xl text-slate-400 ml-1">/ {maxPoints}</span>
                <p className="text-xs text-slate-500 mt-1">points</p>
              </div>
            </div>

            {/* Points Slider */}
            <div className="relative mb-6">
              <input
                type="range"
                min="0"
                max={maxPoints}
                value={points}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>0</span>
                <span>{maxPoints}</span>
              </div>
            </div>

            {/* Feedback Textarea */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Feedback <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24 resize-none"
                placeholder="Provide feedback for the student..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isGrading}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGrade}
            disabled={isGrading}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            {isGrading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Grading...
              </>
            ) : (
              `Award ${points} Points`
            )}
          </button>
        </div>
      </div>

      {/* Custom slider thumb styles */}
      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #4f46e5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default GradingModal;
