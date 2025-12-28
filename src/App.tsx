import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './core/contexts/AuthContext';
import { CommunityProvider } from './core/contexts/CommunityContext';

// Public components
import LandingPage from './public-pages/LandingPage';
import { LoginPage, SignupPage } from './features/auth';
import { CommunityLandingPage } from './public-pages/communities/CommunityLandingPage';
import { CommunitiesDirectory } from './public-pages/communities/CommunitiesDirectory';
import { LandingPage as CourseCatalogPage } from './features/landing';

// Protected components
import ProtectedRoute from './public-pages/auth/ProtectedRoute';
import Sidebar from './shared/Sidebar';
import Dashboard from './features/dashboard/Dashboard';
import StudentHome from './features/student/StudentHome';
import CommunityHub from './features/community/CommunityHub';
import CourseLMS from './features/courses/CourseLMS';
import CalendarView from './features/calendar/CalendarView';
import AiSuccessManager from './features/ai-manager/AiSuccessManager';
import Settings from './features/settings/Settings';
import HomeworkPage from './features/homework/HomeworkPage';
import HomeworkManagement from './features/homework/HomeworkManagement';
import ChatbotsPage from './features/chatbots/ChatbotsPage';
import { StudentManagerPage } from './features/student-manager';
import { View, UserRole } from './core/types';
import { useCommunity } from './core/contexts/CommunityContext';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-600">Loading Creator Club...</p>
    </div>
  </div>
);

// Map URL path to View enum
const pathToView = (pathname: string): View => {
  if (pathname.includes('/dashboard') || pathname === '/app') {
    return View.DASHBOARD;
  }
  if (pathname.includes('/community') && !pathname.includes('/communities')) {
    return View.COMMUNITY;
  }
  if (pathname.includes('/courses')) {
    return View.COURSES;
  }
  if (pathname.includes('/homework')) {
    return View.HOMEWORK;
  }
  if (pathname.includes('/ai-chat')) {
    return View.AI_CHAT;
  }
  if (pathname.includes('/calendar')) {
    return View.CALENDAR;
  }
  if (pathname.includes('/ai-manager')) {
    return View.AI_MANAGER;
  }
  if (pathname.includes('/student-manager')) {
    return View.STUDENT_MANAGER;
  }
  if (pathname.includes('/settings')) {
    return View.SETTINGS;
  }
  return View.DASHBOARD;
};

// Protected App Layout with Sidebar and View Switching
const AppLayout: React.FC = () => {
  const { role, profile } = useAuth();
  const { selectedCommunity } = useCommunity();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current user is the creator of the selected community
  const isCreatorOfCommunity = !!(
    selectedCommunity &&
    profile?.id &&
    selectedCommunity.creator_id === profile.id
  );

  // Initialize view based on current URL
  const [currentView, setCurrentView] = useState<View>(() => pathToView(location.pathname));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);

  // Sync view with URL changes
  useEffect(() => {
    const newView = pathToView(location.pathname);
    if (newView !== currentView) {
      setCurrentView(newView);
    }
  }, [location.pathname]);

  // Check if user is a student (not creator or superadmin)
  const isStudent = role === 'student' || role === 'member';

  // Helper to convert view string to View enum
  const handleStudentNavigate = (view: string) => {
    switch (view) {
      case 'community':
        setCurrentView(View.COMMUNITY);
        break;
      case 'courses':
        setCurrentView(View.COURSES);
        break;
      case 'calendar':
        setCurrentView(View.CALENDAR);
        break;
      case 'settings':
        setCurrentView(View.SETTINGS);
        break;
      default:
        setCurrentView(View.DASHBOARD);
    }
  };

  // Handler for "Browse More" - navigate to communities directory
  const handleBrowseCommunities = useCallback(() => {
    navigate('/communities');
  }, [navigate]);

  // Handler for "Create Community" - open the create community modal in CommunityHub
  const handleCreateCommunity = useCallback(() => {
    setCurrentView(View.COMMUNITY);
    setShowCreateCommunityModal(true);
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        // Students see StudentHome, creators see Dashboard
        return isStudent ? (
          <StudentHome onNavigate={handleStudentNavigate} />
        ) : (
          <Dashboard />
        );
      case View.COMMUNITY:
        return (
          <CommunityHub
            showCreateModal={showCreateCommunityModal}
            onCloseCreateModal={() => setShowCreateCommunityModal(false)}
          />
        );
      case View.COURSES:
        return <CourseLMS />;
      case View.HOMEWORK:
        // Creators see homework management, students see homework page
        if (!selectedCommunity) {
          return <div className="p-8 text-center text-slate-500">Please select a community first.</div>;
        }
        return isCreatorOfCommunity ? (
          <HomeworkManagement
            communityId={selectedCommunity.id}
            creatorProfileId={profile!.id}
          />
        ) : (
          <HomeworkPage communityId={selectedCommunity.id} />
        );
      case View.AI_CHAT:
        // AI Chatbots page - available to all users
        if (!selectedCommunity) {
          return <div className="p-8 text-center text-slate-500">Please select a community first.</div>;
        }
        return <ChatbotsPage communityId={selectedCommunity.id} />;
      case View.CALENDAR:
        return <CalendarView />;
      case View.AI_MANAGER:
        return <AiSuccessManager />;
      case View.STUDENT_MANAGER:
        // Student Manager - creators only
        if (!selectedCommunity) {
          return <div className="p-8 text-center text-slate-500">Please select a community first.</div>;
        }
        if (!isCreatorOfCommunity) {
          return <div className="p-8 text-center text-slate-500">Access restricted to community creators.</div>;
        }
        return <StudentManagerPage communityId={selectedCommunity.id} />;
      case View.SETTINGS:
        return <Settings />;
      default:
        return <div className="p-8 text-center text-slate-500">Section under construction for MVP.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onBrowseCommunities={handleBrowseCommunities}
        onCreateCommunity={handleCreateCommunity}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">C</div>
            Creator Club
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Helper function to get the default redirect path based on user role
export const getDefaultRedirectPath = (role: UserRole | null): string => {
  if (role === 'creator' || role === 'superadmin') {
    return '/dashboard';
  }
  // Students and members go to courses
  return '/courses';
};

// Wrapper component to handle auth-based redirects for protected routes
const ProtectedRouteWrapper: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?return=${returnUrl}`} replace />;
  }

  return <ProtectedRoute allowedRoles={allowedRoles}>{children}</ProtectedRoute>;
};

// Component to redirect authenticated users to their role-based default route
const AuthenticatedRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(getDefaultRedirectPath(role), { replace: true });
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If not authenticated, show landing page
  return <LandingPage onGetStarted={() => window.location.href = '/signup'} />;
};

// Main routing component
const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AuthenticatedRedirect />} />
      <Route path="/explore" element={<CourseCatalogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/communities" element={<CommunitiesDirectory />} />
      <Route path="/community/:communityId" element={<CommunityLandingPage />} />

      {/* Protected routes - Main app layout */}
      <Route
        path="/app/*"
        element={
          <ProtectedRouteWrapper>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />

      {/* Direct protected routes that redirect to app layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRouteWrapper allowedRoles={['creator', 'superadmin']}>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/courses"
        element={
          <ProtectedRouteWrapper>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRouteWrapper>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRouteWrapper>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/ai-manager"
        element={
          <ProtectedRouteWrapper allowedRoles={['creator', 'superadmin']}>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRouteWrapper>
            <CommunityProvider>
              <AppLayout />
            </CommunityProvider>
          </ProtectedRouteWrapper>
        }
      />

      {/* Legacy redirect /app to role-based default */}
      <Route path="/app" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Root App component
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
