import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Award,
  Search,
  Loader2,
  X,
  Trophy,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { getStudentsWithStats, addBonusPoints, StudentWithStats } from './studentManagerService';

interface StudentManagerPageProps {
  communityId: string;
}

const StudentManagerPage: React.FC<StudentManagerPageProps> = ({ communityId }) => {
  // State
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Bonus points modal state
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [bonusPoints, setBonusPoints] = useState(5);
  const [bonusReason, setBonusReason] = useState('');
  const [isAwarding, setIsAwarding] = useState(false);

  // Load students
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudentsWithStats(communityId);
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  }, [communityId]);

  // Initial load
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Filter students by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.profile.full_name?.toLowerCase().includes(query) ||
        s.profile.email.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Open bonus modal for a student
  const handleBonusClick = (student: StudentWithStats) => {
    setSelectedStudent(student);
    setBonusPoints(5);
    setBonusReason('');
    setIsBonusModalOpen(true);
  };

  // Award bonus points
  const handleAwardBonus = async () => {
    if (!selectedStudent) return;

    setIsAwarding(true);
    try {
      const success = await addBonusPoints(
        selectedStudent.profile.id,
        communityId,
        bonusPoints,
        bonusReason
      );

      if (success) {
        // Refresh the student list to show updated points
        await loadStudents();
        setIsBonusModalOpen(false);
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Error awarding bonus points:', error);
    } finally {
      setIsAwarding(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    if (!isAwarding) {
      setIsBonusModalOpen(false);
      setSelectedStudent(null);
    }
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Users className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Student Manager</h1>
              <p className="text-slate-600">
                View student progress and award bonus points
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700">
                {searchQuery ? 'No students found' : 'No students yet'}
              </h3>
              <p className="text-slate-500 mt-2">
                {searchQuery
                  ? 'Try adjusting your search query.'
                  : 'Students will appear here when they join your community.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        Points
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Submissions
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const studentName = student.profile.full_name || student.profile.email;
                    const totalPoints = student.points?.total_points || 0;
                    const level = student.points?.level || 1;

                    return (
                      <tr key={student.profile.id} className="hover:bg-slate-50 transition-colors">
                        {/* Student Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {student.profile.avatar_url ? (
                              <img
                                src={student.profile.avatar_url}
                                alt={studentName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-indigo-600 font-medium">
                                  {studentName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-slate-900">{studentName}</p>
                              {student.profile.full_name && (
                                <p className="text-sm text-slate-500">{student.profile.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-slate-900">{totalPoints}</span>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            Level {level}
                          </span>
                        </td>

                        {/* Submissions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900">
                              {student.gradedCount}/{student.submissionCount}
                            </span>
                            {student.submissionCount > 0 && (
                              <span className="text-slate-500 text-sm">
                                ({Math.round((student.gradedCount / student.submissionCount) * 100)}% graded)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleBonusClick(student)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium text-sm transition-colors"
                          >
                            <Award className="w-4 h-4" />
                            Bonus
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {students.length > 0 && (
          <div className="mt-4 text-sm text-slate-500">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        )}
      </div>

      {/* Bonus Points Modal */}
      {isBonusModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Award Bonus Points</h3>
              <button
                onClick={handleCloseModal}
                disabled={isAwarding}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {/* Student Info */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-lg">
                {selectedStudent.profile.avatar_url ? (
                  <img
                    src={selectedStudent.profile.avatar_url}
                    alt={selectedStudent.profile.full_name || ''}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-medium text-lg">
                      {(selectedStudent.profile.full_name || selectedStudent.profile.email)
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-slate-900">
                    {selectedStudent.profile.full_name || selectedStudent.profile.email}
                  </p>
                  <p className="text-sm text-slate-500">
                    Current: {selectedStudent.points?.total_points || 0} points
                  </p>
                </div>
              </div>

              {/* Points Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Bonus Points (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Great participation in live session"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Preview */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Will award <strong>{bonusPoints} bonus points</strong> to{' '}
                  {selectedStudent.profile.full_name || selectedStudent.profile.email}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={handleCloseModal}
                disabled={isAwarding}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAwardBonus}
                disabled={isAwarding}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isAwarding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Awarding...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" />
                    Award Points
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagerPage;
