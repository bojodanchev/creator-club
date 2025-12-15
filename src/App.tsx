import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './core/contexts/AuthContext';

// Public components
import LandingPage from './public-pages/LandingPage';
import LoginForm from './public-pages/auth/LoginForm';
import SignupForm from './public-pages/auth/SignupForm';
import { CommunityLandingPage } from './public-pages/communities/CommunityLandingPage';
import { CommunitiesDirectory } from './public-pages/communities/CommunitiesDirectory';

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
import { View } from './core/types';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-600">Loading Creator Club...</p>
    </div>
  </div>
);

// Protected App Layout with Sidebar and View Switching
const AppLayout: React.FC = () => {
  const { role } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        return <CommunityHub />;
      case View.COURSES:
        return <CourseLMS />;
      case View.CALENDAR:
        return <CalendarView />;
      case View.AI_MANAGER:
        return <AiSuccessManager />;
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

// Wrapper component to handle auth-based redirects for protected routes
const ProtectedRouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    // Redirect to login with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?return=${returnUrl}`} replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
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
      <Route path="/" element={<LandingPage onGetStarted={() => window.location.href = '/signup'} />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/communities" element={<CommunitiesDirectory />} />
      <Route path="/community/:communityId" element={<CommunityLandingPage />} />

      {/* Protected routes */}
      <Route
        path="/app/*"
        element={
          <ProtectedRouteWrapper>
            <AppLayout />
          </ProtectedRouteWrapper>
        }
      />

      {/* Redirect /app to /app/dashboard */}
      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

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
