import React from 'react';
import {
  ArrowRight,
  Check,
  Zap,
  Users,
  BookOpen,
  Calendar,
  Brain,
  MessageSquare,
  BarChart3,
  Clock,
  DollarSign,
  Sparkles,
  Star,
  Shield,
  Rocket,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 font-bold text-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                C
              </div>
              <span className="text-slate-900">Creator Club</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-900 transition-colors">Testimonials</a>
              <button
                onClick={onGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <Sparkles size={16} />
              The All-in-One Platform for Course Creators
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Replace 5+ Tools with One{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Powerful Platform
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              Stop juggling Discord, Kajabi, Calendly, Skool, and Zapier.
              Creator Club combines community, courses, scheduling, and AI-powered student success tracking in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={onGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </button>
              <button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-colors border-2 border-slate-200">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Tired of the Tool Chaos?
            </h2>
            <p className="text-xl text-slate-600">
              Course creators face real challenges every day
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Juggling Multiple Tools
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Switching between Discord, Kajabi, Calendly, and more wastes hours every week.
                Each tool has its own login, interface, and billing.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-200">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="text-orange-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Losing Students to Silence
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Without visibility into student progress, at-risk learners slip through the cracks.
                By the time you notice, they've already churned.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border-2 border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="text-purple-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Manual Tracking & Admin Work
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Manually tracking progress, engagement, and student health eats into your time.
                You should be creating, not doing admin work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              One Platform. Everything You Need.
            </h2>
            <p className="text-xl text-indigo-100">
              Creator Club replaces your entire tech stack with a unified, AI-powered solution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <MessageSquare className="mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Community Hub</h3>
              <p className="text-indigo-100">
                Built-in forums, channels, and real-time chat. Replace Discord and Skool.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <BookOpen className="mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Course LMS</h3>
              <p className="text-indigo-100">
                Complete learning platform with modules, lessons, and progress tracking. Replace Kajabi.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Calendar className="mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">Events & Scheduling</h3>
              <p className="text-indigo-100">
                Group events and 1:1 booking built-in. Replace Calendly and Cal.com.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Brain className="mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">AI Success Manager</h3>
              <p className="text-indigo-100">
                AI tracks every student, identifies at-risk learners, and suggests interventions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Features That Scale With You
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to run a successful creator business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users size={24} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Member Management</h3>
                <p className="text-slate-600">
                  Organize students, track engagement, and manage access all in one place.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Analytics Dashboard</h3>
                <p className="text-slate-600">
                  Real-time insights into course completion, engagement, and revenue.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign size={24} className="text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Payments & Subscriptions</h3>
                <p className="text-slate-600">
                  Stripe integration for one-time purchases and recurring memberships.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={24} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Content Protection</h3>
                <p className="text-slate-600">
                  Secure your courses with access controls and member-only content.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Rocket size={24} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Fast Setup</h3>
                <p className="text-slate-600">
                  Launch your creator business in minutes, not weeks. No technical skills needed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2">AI-Powered Insights</h3>
                <p className="text-slate-600">
                  Let AI identify struggling students and suggest personalized interventions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-slate-600">
              See what course creators are saying about Creator Club
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Creator Club saved me 15+ hours a week. No more switching between tools.
                Everything I need is right here, and the AI Success Manager is a game-changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <div className="font-bold text-slate-900">Sarah Mitchell</div>
                  <div className="text-sm text-slate-500">Fitness Coach</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "I was paying $400/month for 5 different tools. Now I pay a fraction of that and
                have everything in one place. My students love the integrated experience."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  JC
                </div>
                <div>
                  <div className="font-bold text-slate-900">James Chen</div>
                  <div className="text-sm text-slate-500">Marketing Mentor</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "The AI Success Manager helped me reduce churn by 40%. It identifies at-risk
                students before they disappear. This alone paid for the platform 10x over."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                  EP
                </div>
                <div>
                  <div className="font-bold text-slate-900">Emily Rodriguez</div>
                  <div className="text-sm text-slate-500">Design Course Creator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              Choose the plan that fits your creator business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Creator Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="text-sm font-semibold text-indigo-600 mb-2">CREATOR</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  $49
                  <span className="text-lg text-slate-500 font-normal">/month</span>
                </div>
                <p className="text-slate-600">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Up to 100 students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Unlimited courses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Community hub</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Calendar & events</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Basic analytics</span>
                </li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Business Plan - Featured */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 border-2 border-indigo-500 relative transform md:scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold text-white mb-2">BUSINESS</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  $99
                  <span className="text-lg text-indigo-200 font-normal">/month</span>
                </div>
                <p className="text-indigo-100">For growing creator businesses</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Up to 500 students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Everything in Creator</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">AI Success Manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Advanced analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full bg-white hover:bg-slate-50 text-indigo-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial
              </button>
            </div>

            {/* Elite Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="text-sm font-semibold text-indigo-600 mb-2">ELITE</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  $199
                  <span className="text-lg text-slate-500 font-normal">/month</span>
                </div>
                <p className="text-slate-600">For established creators</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Unlimited students</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Everything in Business</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">White-label branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Dedicated account manager</span>
                </li>
              </ul>
              <button
                onClick={onGetStarted}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Simplify Your Creator Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of creators who've ditched the tool chaos and built
            thriving communities with Creator Club.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white hover:bg-slate-50 text-indigo-600 px-10 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg inline-flex items-center gap-2"
          >
            Start Your Free Trial
            <ArrowRight size={20} />
          </button>
          <p className="text-indigo-200 mt-6">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  C
                </div>
                Creator Club
              </div>
              <p className="text-slate-400">
                The all-in-one platform for course creators, coaches, and mentors.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              2025 Creator Club. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Github size={20} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
