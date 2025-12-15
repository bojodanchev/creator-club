import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { useAuth } from '../../core/contexts/AuthContext';

interface PublicNavigationProps {
  transparent?: boolean;
}

export const PublicNavigation: React.FC<PublicNavigationProps> = ({ transparent = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 ${transparent ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className={`font-bold text-lg ${transparent ? 'text-white' : 'text-slate-900'}`}>
              Creator Club
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/communities"
              className={`text-sm font-medium ${transparent ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Browse Communities
            </Link>

            {user ? (
              <button
                onClick={() => navigate('/app')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    transparent
                      ? 'text-white border border-white/30 hover:bg-white/10'
                      : 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${transparent ? 'text-white' : 'text-slate-600'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/communities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Browse Communities
            </Link>

            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app');
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
