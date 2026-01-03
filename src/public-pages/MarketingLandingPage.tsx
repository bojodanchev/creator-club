import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  Shield,
  Sparkles,
  Star,
  Rocket,
  Github,
  Twitter,
  Linkedin,
  AlertTriangle,
  X,
  Heart,
  Target,
  Trophy,
  Layers,
  GraduationCap
} from 'lucide-react';

// ============================================================================
// MARKETING LANDING PAGE
// Full-featured landing page with Hero, Pain, Promise, Origin, Pillars, Pricing
// ============================================================================

const MarketingLandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/signup');
  };

  // Platform chaos tools for the Pain section
  const chaosTools = [
    { name: 'Telegram', color: 'bg-blue-500' },
    { name: 'Viber', color: 'bg-purple-500' },
    { name: 'Skool', color: 'bg-yellow-500' },
    { name: 'Discord', color: 'bg-indigo-500' },
    { name: 'Kajabi', color: 'bg-pink-500' },
    { name: 'Calendly', color: 'bg-blue-600' },
    { name: 'Zapier', color: 'bg-orange-500' },
    { name: 'Whop', color: 'bg-slate-700' },
  ];

  // Five pillars of Creator Club
  const pillars = [
    {
      icon: MessageSquare,
      title: 'Community Hub',
      description: 'Пълноценен форум с канали, дискусии и real-time чат. Всичко на едно място.',
      color: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
    {
      icon: BookOpen,
      title: 'Course LMS',
      description: 'Професионална платформа за курсове с модули, уроци и проследяване на прогреса.',
      color: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      icon: Calendar,
      title: 'Calendar & Events',
      description: 'Групови събития и 1:1 booking интегрирани директно в платформата.',
      color: 'bg-pink-100',
      iconColor: 'text-pink-600',
    },
    {
      icon: Brain,
      title: 'AI Success Manager',
      description: 'Изкуствен интелект, който следи всеки студент и предотвратява отпадане.',
      color: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Детайлни анализи на ангажираност, прогрес и приходи в реално време.',
      color: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

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
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">™</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#pillars" className="text-slate-600 hover:text-slate-900 transition-colors">Стълбове</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900 transition-colors">Цени</a>
              <a href="#story" className="text-slate-600 hover:text-slate-900 transition-colors">История</a>
              <button
                onClick={handleGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Започни Сега
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================
          HERO SECTION
          Headline, Subheadline, Identity Hook, CTA
      ======================================================================== */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Identity Hook Badge */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold mb-8 shadow-lg shadow-indigo-500/25">
              <Sparkles size={16} />
              Операционната система за ментори и създатели на курсове
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Един инструмент.{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Всичко необходимо.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              Creator Club™ замества 4-5 отделни инструмента и добавя AI Success Manager,
              който следи прогреса на всеки твой студент.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={handleGetStarted}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
              >
                Започни Безплатно
                <ArrowRight size={20} />
              </button>
              <button className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition-colors border-2 border-slate-200">
                Виж Демо
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                Без кредитна карта
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                Готов за старт за минути
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-green-500" size={20} />
                Отмени когато пожелаеш
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          PAIN SECTION
          "Platform Chaos" - The problem with multiple tools
      ======================================================================== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <AlertTriangle size={16} />
              Хаосът с платформите
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Познат ли ти е този{' '}
              <span className="text-red-500">кошмар</span>?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Жонглираш между 8+ платформи. Всяка с отделен login, отделна такса, отделни проблеми.
            </p>
          </div>

          {/* Chaos Tools Grid */}
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border-2 border-slate-200 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {chaosTools.map((tool, index) => (
                <div
                  key={tool.name}
                  className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-red-300 transition-all duration-200 group relative"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`w-10 h-10 ${tool.color} rounded-lg mb-3 flex items-center justify-center text-white font-bold text-sm`}>
                    {tool.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-slate-700">{tool.name}</p>
                  <p className="text-sm text-slate-500">~€15-50/мес</p>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={14} className="text-white" />
                  </div>
                </div>
              ))}
            </div>

            {/* Pain Points */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="text-red-600" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Загубено време</p>
                  <p className="text-sm text-slate-600">15+ часа седмично в превключване</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="text-orange-600" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Изгубени студенти</p>
                  <p className="text-sm text-slate-600">Без видимост кой има нужда от помощ</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="text-purple-600" size={18} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">€200-400/месец</p>
                  <p className="text-sm text-slate-600">Разпръснато в 8 различни сметки</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          PROMISE SECTION
          "Automated Success Engine" - AI Success Manager
      ======================================================================== */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Brain size={16} />
              Автоматизирана Машина за Успех
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              AI Success Manager™
            </h2>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Твоят личен асистент, който никога не спи. Следи всеки студент,
              разпознава риска преди отпадане и ти дава actionable insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="text-green-300" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Risk Scoring</h3>
                    <p className="text-indigo-100">
                      AI анализира поведението и маркира студенти в риск седмици преди да отпаднат.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-blue-300" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
                    <p className="text-indigo-100">
                      Персонализирани препоръки какво да направиш, за да задържиш всеки студент.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="text-purple-300" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Health Dashboard</h3>
                    <p className="text-indigo-100">
                      Визуално табло със здравето на целия ти бизнес и всеки отделен студент.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: OS Concept */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  <Layers size={16} />
                  Operating System
                </div>
                <h3 className="text-2xl font-bold">OS за Създателя & Студента</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap size={20} className="text-yellow-300" />
                    <span className="font-semibold">За Създателя</span>
                  </div>
                  <p className="text-sm text-indigo-100">
                    Централизирано управление на курсове, общност, събития и приходи.
                  </p>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users size={20} className="text-green-300" />
                    <span className="font-semibold">За Студента</span>
                  </div>
                  <p className="text-sm text-indigo-100">
                    Персонализирано изживяване с прогрес, точки, gamification и community.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          ORIGIN STORY
          "Създадохме инструмента, който ни липсваше"
      ======================================================================== */}
      <section id="story" className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Heart size={16} />
              Нашата История
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Създадохме инструмента, който ни липсваше
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 border-2 border-slate-200 shadow-sm">
            <div className="prose prose-lg max-w-none text-slate-600">
              <p className="text-xl leading-relaxed mb-6">
                Като ментори и създатели на курсове, ние самите преживяхме този хаос.
                Telegram за чат, Skool за общност, Kajabi за курсове, Calendly за booking,
                Zapier за да свържем всичко... и все още губехме студенти.
              </p>
              <p className="text-xl leading-relaxed mb-6">
                <span className="font-semibold text-slate-900">Най-болезненото?</span> Студенти
                отпадаха в тишина. Нямахме начин да видим кой има нужда от помощ,
                докато не беше твърде късно.
              </p>
              <p className="text-xl leading-relaxed">
                Затова създадохме <span className="font-bold text-indigo-600">Creator Club™</span> —
                единствената платформа, която обединява всичко И добавя AI Success Manager,
                за да не загубиш нито един студент повече.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                CC
              </div>
              <div>
                <p className="font-bold text-slate-900">Екипът на Creator Club™</p>
                <p className="text-slate-500">Ментори, създатели, предприемачи</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          SYSTEM/PILLARS SECTION
          5-те стълба на Creator Club™
      ======================================================================== */}
      <section id="pillars" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Layers size={16} />
              5-те Стълба
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Всичко, от което имаш нужда
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Creator Club™ е изграден върху 5 основни стълба, които заедно създават
              перфектния екосистем за твоя бизнес.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.title}
                className={`bg-slate-50 rounded-2xl p-8 border-2 border-slate-200 hover:border-indigo-300 transition-all duration-200 ${
                  index === pillars.length - 1 ? 'lg:col-span-1 md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                <div className={`w-14 h-14 ${pillar.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <pillar.icon className={pillar.iconColor} size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                <p className="text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>

          {/* Integration Note */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-50 text-green-700 px-6 py-3 rounded-xl">
              <Check size={20} />
              <span className="font-semibold">Всичко интегрирано. Без Zapier. Без хаос.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          PRICING & GUARANTEE
          Creator plans with user roles
      ======================================================================== */}
      <section id="pricing" className="py-20 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Trophy size={16} />
              Ценообразуване
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Ясни цени. Без изненади.
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Започни безплатно. Плащай за растеж само когато имаш резултати.
            </p>
          </div>

          {/* User Roles Explainer */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-slate-200 mb-12 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">Два типа потребители</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="text-indigo-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Създател (Creator)</p>
                  <p className="text-sm text-slate-600">
                    Ментор, коуч или курс криейтор. Създава съдържание, управлява общност, получава плащания.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Студент (Student)</p>
                  <p className="text-sm text-slate-600">
                    Учи се, участва в общността, booking-ва сесии. Безплатен достъп до платформата.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="text-sm font-semibold text-indigo-600 mb-2">STARTER</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  €0
                  <span className="text-lg text-slate-500 font-normal">/месец</span>
                </div>
                <p className="text-slate-600">Перфектен за начало</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-700 font-semibold">6.9% такса на продажба</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">До 50 студента</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">2 курса</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">1 общност</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">AI Success Manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Stripe плащания</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Започни Безплатно
              </button>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 border-2 border-indigo-500 relative transform md:scale-105 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                НАЙ-ПОПУЛЯРЕН
              </div>
              <div className="text-sm font-semibold text-white mb-2">PRO</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-white mb-2">
                  €30
                  <span className="text-lg text-indigo-200 font-normal">/месец</span>
                </div>
                <p className="text-indigo-100">За растящи бизнеси</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-white font-semibold">3.9% такса на продажба</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">До 500 студента</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">10 курса</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">3 общности</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Custom branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Priority support</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-300 flex-shrink-0 mt-1" size={20} />
                  <span className="text-white">Advanced analytics</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-white hover:bg-slate-50 text-indigo-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Избери Pro
              </button>
            </div>

            {/* Scale Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-slate-200 hover:border-indigo-300 transition-colors">
              <div className="text-sm font-semibold text-indigo-600 mb-2">SCALE</div>
              <div className="mb-6">
                <div className="text-4xl font-bold text-slate-900 mb-2">
                  €99
                  <span className="text-lg text-slate-500 font-normal">/месец</span>
                </div>
                <p className="text-slate-600">За установени бизнеси</p>
              </div>
              <div className="mb-6 py-3 px-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700 font-semibold">1.9% такса на продажба</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Неограничени студенти</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Неограничени курсове</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Неограничени общности</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">White-label branding</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">API достъп</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 flex-shrink-0 mt-1" size={20} />
                  <span className="text-slate-700">Dedicated account manager</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Избери Scale
              </button>
            </div>
          </div>

          {/* Activation Fee Note */}
          <div className="text-center mb-8">
            <p className="text-slate-600 text-sm">
              * Еднократна активационна такса от €2.90 при регистрация
            </p>
          </div>

          {/* Guarantee */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 max-w-3xl mx-auto border-2 border-green-200">
            <div className="flex items-center gap-4 justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-green-600" size={32} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Гаранция 100% Satisfaction</h3>
                <p className="text-slate-600">
                  Опитай Creator Club™ без риск. Ако не си доволен през първите 14 дни,
                  връщаме ти парите — без въпроси.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================
          FINAL CTA
      ======================================================================== */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Готов ли си да промениш бизнеса си?
          </h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Присъедини се към създателите, които вече използват Creator Club™
            и постигат по-добри резултати с по-малко усилия.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white hover:bg-slate-50 text-indigo-600 px-10 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg inline-flex items-center gap-2"
          >
            Започни Сега — Безплатно
            <ArrowRight size={20} />
          </button>
          <p className="text-indigo-200 mt-6">
            €2.90 еднократна активация • Без месечна такса за Starter • Отмени когато пожелаеш
          </p>
        </div>
      </section>

      {/* ========================================================================
          FOOTER
      ======================================================================== */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  C
                </div>
                Creator Club™
              </div>
              <p className="text-slate-400">
                Платформата за ментори, коучове и създатели на курсове.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Продукт</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#pillars" className="hover:text-white transition-colors">Функционалности</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Цени</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Ресурси</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Документация</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Общност</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Компания</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#story" className="hover:text-white transition-colors">За Нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакт</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">
              © 2025 Creator Club™. Всички права запазени.
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

export default MarketingLandingPage;
