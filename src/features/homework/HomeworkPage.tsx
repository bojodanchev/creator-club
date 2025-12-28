import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Award,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';
import {
  getAssignments,
  getStudentSubmissions,
  submitHomework,
} from './homeworkService';
import HomeworkSubmissionModal from './HomeworkSubmissionModal';
import type {
  DbHomeworkAssignment,
  DbHomeworkAssignmentWithStats,
  DbHomeworkSubmission,
} from '../../core/supabase/database.types';

interface HomeworkPageProps {
  communityId: string;
}

const HomeworkPage: React.FC<HomeworkPageProps> = ({ communityId }) => {
  const { profile } = useAuth();

  // State
  const [assignments, setAssignments] = useState<DbHomeworkAssignmentWithStats[]>([]);
  const [submissions, setSubmissions] = useState<(DbHomeworkSubmission & { assignment: DbHomeworkAssignment })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<DbHomeworkAssignment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      setIsLoading(true);
      try {
        // Get all published assignments for this community
        const allAssignments = await getAssignments(communityId, false);
        setAssignments(allAssignments);

        // Get student's submissions
        const studentSubmissions = await getStudentSubmissions(profile.id, communityId);
        setSubmissions(studentSubmissions);
      } catch (error) {
        console.error('Error loading homework data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [communityId, profile?.id]);

  // Get submitted assignment IDs
  const submittedAssignmentIds = new Set(submissions.map((s) => s.assignment_id));

  // Filter pending assignments (not yet submitted)
  const pendingAssignments = assignments.filter(
    (a) => !submittedAssignmentIds.has(a.id)
  );

  // Handle submission
  const handleSubmit = async (textResponse: string, fileUrls: string[]) => {
    if (!profile?.id || !selectedAssignment) return;

    setIsSubmitting(true);
    try {
      const result = await submitHomework(
        selectedAssignment.id,
        profile.id,
        textResponse,
        fileUrls
      );

      if (result) {
        // Refresh submissions
        const updatedSubmissions = await getStudentSubmissions(profile.id, communityId);
        setSubmissions(updatedSubmissions);
        setSelectedAssignment(null);
      }
    } catch (error) {
      console.error('Error submitting homework:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Check if assignment is past due
  const isPastDue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <ClipboardList className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Homework</h1>
              <p className="text-slate-600">
                View assignments and track your submissions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {pendingAssignments.length}
                </p>
                <p className="text-sm text-slate-600">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {submissions.length}
                </p>
                <p className="text-sm text-slate-600">Submitted</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {submissions.filter((s) => s.status === 'graded').reduce(
                    (sum, s) => sum + (s.points_awarded || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-slate-600">Points Earned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Assignments Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Pending Assignments
          </h2>

          {pendingAssignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">
                All caught up!
              </h3>
              <p className="text-slate-600 mt-1">
                You have no pending assignments at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {assignment.title}
                      </h3>
                      {assignment.description && (
                        <p className="text-slate-600 mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1 text-indigo-600 font-medium">
                          <Award className="w-4 h-4" />
                          {assignment.max_points} points
                        </span>
                        {assignment.due_date && (
                          <span
                            className={`flex items-center gap-1 ${
                              isPastDue(assignment.due_date)
                                ? 'text-red-600'
                                : 'text-slate-500'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(assignment.due_date)}
                            {isPastDue(assignment.due_date) && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium whitespace-nowrap"
                    >
                      Submit
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Submissions Section */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            My Submissions
          </h2>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900">
                No submissions yet
              </h3>
              <p className="text-slate-600 mt-1">
                Submit your first assignment to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-900">
                          {submission.assignment.title}
                        </h3>
                        {submission.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Graded
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Submitted on {formatDate(submission.submitted_at)}
                      </p>

                      {/* Show graded info */}
                      {submission.status === 'graded' && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              <Award className="w-4 h-4" />
                              {submission.points_awarded} / {submission.assignment.max_points} points
                            </div>
                            {submission.graded_at && (
                              <span className="text-sm text-slate-500">
                                Graded on {formatDate(submission.graded_at)}
                              </span>
                            )}
                          </div>
                          {submission.feedback && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-slate-700">
                                Feedback:
                              </p>
                              <p className="text-sm text-slate-600 mt-1">
                                {submission.feedback.length > 200
                                  ? `${submission.feedback.slice(0, 200)}...`
                                  : submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Submission Modal */}
      {selectedAssignment && profile && (
        <HomeworkSubmissionModal
          assignment={selectedAssignment}
          studentId={profile.id}
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default HomeworkPage;
