import React from 'react';
import { PublicNavigation } from './PublicNavigation';
import { Link } from 'react-router-dom';
import { Sparkles, Twitter, Github, Mail } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  showFooter?: boolean;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  showNavigation = true,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {showNavigation && <PublicNavigation />}

      <main className={showNavigation ? 'pt-16' : ''}>
        {children}
      </main>

      {showFooter && (
        <footer className="bg-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">Creator Club</span>
                </div>
                <p className="text-slate-400 text-sm max-w-md">
                  The all-in-one platform for mentors, coaches, and course creators.
                  Build your community, deliver courses, and scale your impact.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>
                    <Link to="/communities" className="hover:text-white transition-colors">
                      Browse Communities
                    </Link>
                  </li>
                  <li>
                    <Link to="/signup" className="hover:text-white transition-colors">
                      Get Started
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-white transition-colors">
                      Sign In
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <div className="flex items-center gap-3">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="mailto:hello@creatorclub.app"
                    className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} Creator Club. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
