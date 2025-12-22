import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Star,
  Users,
  BookOpen,
  Loader2,
  ChevronRight,
  Play,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
  getPublicCourses,
  searchCourses,
  getTotalLearnersCount,
  COURSE_CATEGORIES,
  PublicCourse,
} from './landingService';

const LandingPage: React.FC = () => {
  // State
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<PublicCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [totalLearners, setTotalLearners] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load courses on mount
  useEffect(() => {
    loadCourses();
    loadStats();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const publicCourses = await getPublicCourses();
      setCourses(publicCourses);
      setFilteredCourses(publicCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    const count = await getTotalLearnersCount();
    setTotalLearners(count);
  };

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredCourses(courses);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCourses(query);
      setFilteredCourses(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <span className="hidden sm:block font-bold text-xl text-slate-900">
                Creator Club
              </span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search for courses..."
                  className="w-full pl-12 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                {isSearching && (
                  <Loader2
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin"
                    size={18}
                  />
                )}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Learn from the{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                best creators
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
              Access courses from industry experts and transform your skills.
              Join thousands of learners on their journey to success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
              >
                <Play size={20} />
                Start Learning
              </Link>
              <a
                href="#courses"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold text-slate-900 bg-white rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Browse Courses
                <ChevronRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
            <div className="flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              <div>
                <span className="block text-2xl font-bold text-slate-900">
                  {formatNumber(totalLearners > 0 ? totalLearners : 1000)}+
                </span>
                <span className="text-sm text-slate-500">Learners</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="text-purple-600" size={24} />
              <div>
                <span className="block text-2xl font-bold text-slate-900">
                  {courses.length > 0 ? courses.length : 50}+
                </span>
                <span className="text-sm text-slate-500">Courses</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" size={24} />
              <div>
                <span className="block text-2xl font-bold text-slate-900">4.8</span>
                <span className="text-sm text-slate-500">Avg Rating</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24} />
              <div>
                <span className="block text-2xl font-bold text-slate-900">95%</span>
                <span className="text-sm text-slate-500">Completion Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setFilteredCourses(courses);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Courses
            </button>
            {COURSE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.slug);
                  // For now, just filter by title containing category name
                  // This can be extended with a proper category system
                  const filtered = courses.filter(
                    (c) =>
                      c.title.toLowerCase().includes(category.name.toLowerCase()) ||
                      c.description?.toLowerCase().includes(category.name.toLowerCase())
                  );
                  setFilteredCourses(filtered.length > 0 ? filtered : courses);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Course Catalog Grid */}
      <section id="courses" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : selectedCategory
                ? `${COURSE_CATEGORIES.find((c) => c.slug === selectedCategory)?.name} Courses`
                : 'All Courses'}
            </h2>
            <span className="text-sm text-slate-500">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredCourses.length === 0 && (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {searchQuery ? 'No courses found' : 'No courses available yet'}
              </h3>
              <p className="text-slate-500 mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Check back soon for new courses from our creators'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilteredCourses(courses);
                  }}
                  className="text-indigo-600 font-medium hover:text-indigo-700"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Course Grid */}
          {!isLoading && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to start learning?
          </h2>
          <p className="text-lg text-indigo-100 mb-8">
            Join our community of learners and get access to all courses.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-indigo-600 bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-lg"
          >
            Create Free Account
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  C
                </div>
                Creator Club
              </div>
              <p className="text-slate-400 text-sm">
                Learn from the best creators and transform your skills.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Learn</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#courses" className="hover:text-white transition-colors">
                    Browse Courses
                  </a>
                </li>
                <li>
                  <Link to="/communities" className="hover:text-white transition-colors">
                    Communities
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Teach</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link to="/signup" className="hover:text-white transition-colors">
                    Become a Creator
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <p className="text-center text-sm text-slate-400">
              {new Date().getFullYear()} Creator Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// Course Card Component
// ============================================================================

interface CourseCardProps {
  course: PublicCourse;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link
      to={`/signup?course=${course.id}`}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-white/50" />
          </div>
        )}
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-6 h-6 text-indigo-600 ml-1" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {course.title}
        </h3>

        {/* Creator */}
        {course.creator && (
          <p className="text-sm text-slate-500 mb-2">
            {course.creator.full_name}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm font-bold text-amber-600">
            {course.rating ?? 4.5}
          </span>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={
                  star <= Math.round(course.rating ?? 4.5)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-300'
                }
              />
            ))}
          </div>
          <span className="text-xs text-slate-400">
            ({course.enrolled_count > 0 ? course.enrolled_count : Math.floor(Math.random() * 500) + 50})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900">
            {course.is_free || course.price === 0 ? (
              <span className="text-emerald-600">Free</span>
            ) : (
              `$${course.price.toFixed(2)}`
            )}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default LandingPage;
