import { Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

function HeroSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      title: "بيئة تدريب منظمة",
      icon: "sports_soccer",
      bg: "from-[#022C22] to-[#011F18]",
      image: "/1.png"
    },
    {
      title: "مدربون مؤهلون",
      icon: "groups",
      bg: "from-[#064E3B] to-[#022C22]",
      image: "/2.png"
    },
    {
      title: "هوية أكاديمية موحدة",
      icon: "shield",
      bg: "from-[#022C22] via-[#011F18] to-[#022C22]",
      image: "/3.png"
    },
    {
      title: "سجل رقمي للأكاديمية",
      icon: "dashboard",
      bg: "from-[#011F18] to-[#052E21]",
      image: "/4.png"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative z-10 rounded-[32px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)] border border-white/[0.08] w-full aspect-[4/3] group bg-[#011F18]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{
            opacity: { duration: 1.2, ease: "easeInOut" },
            scale: { duration: 1.5, ease: "easeOut" }
          }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [1, 1.07], x: [0, -8], y: [0, 4] }}
            transition={{ duration: 6, ease: "linear" }}
            className="absolute inset-0"
          >
            <img
              src={slides[currentSlide].image}
              className="w-full h-full object-cover"
              alt={slides[currentSlide].title}
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bg} opacity-45 mix-blend-multiply`}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#011F18] via-[#011F18]/30 to-transparent"></div>
          </motion.div>

          <div className="absolute inset-0 flex flex-col justify-end p-7 md:p-10 text-right z-10">
            <div className="flex items-center gap-3 mb-6">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                key={`icon-${currentSlide}`}
                className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#E1BC4B] to-[#C9A227] flex items-center justify-center text-[#011F18] shadow-[0_8px_24px_rgba(201,162,39,0.4)]"
              >
                <span className="material-symbols-outlined text-3xl font-black">{slides[currentSlide].icon}</span>
              </motion.div>
              <motion.div
                initial={{ x: 16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="px-4 py-1.5 bg-white/[0.08] backdrop-blur-md border border-white/[0.1] text-[#C9A227] rounded-full text-[11px] font-black uppercase tracking-widest"
              >
                رؤية تطوير الأكاديميات
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              key={`text-${currentSlide}`}
              className="space-y-3"
            >
              <h3 className="text-white text-2xl md:text-4xl font-black leading-tight tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                {slides[currentSlide].title}
              </h3>
              <div className="w-16 h-1 bg-gradient-to-r from-[#C9A227] to-[#E1BC4B] rounded-full shadow-lg"></div>
            </motion.div>
          </div>

          {/* Lebanese flag accent — top left */}
          <div className="absolute top-5 left-5 flex flex-col overflow-hidden rounded shadow-lg z-10 opacity-70 border border-white/10" style={{ width: 28, height: 18 }}>
            <div style={{ flex: 1, background: '#ED1C24' }}></div>
            <div style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined text-[#00A859]" style={{ fontSize: '7px' }}>park</span>
            </div>
            <div style={{ flex: 1, background: '#ED1C24' }}></div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide dots */}
      <div className="absolute bottom-6 left-8 flex gap-2 z-20" dir="ltr">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-10 bg-[#C9A227]' : 'w-2 bg-white/20 hover:bg-white/40'}`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Subtle frame glow */}
      <div className="absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/[0.05] pointer-events-none"></div>
    </div>
  );
}

import { getCurrentSession } from "./lib/auth";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const session = getCurrentSession();
  if (session && session.isAuthenticated) {
    if (session.isAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "المعايير", path: "/standards" },
    { name: "الأسئلة الشائعة", path: "/faq" },
    { name: "اتصل بنا", path: "/contact" },
  ];

  return (
    <div className="min-h-screen bg-[#011F18] selection:bg-[#C9A227] selection:text-[#011F18] font-['Cairo'] text-white" dir="rtl">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[76px] flex items-center"
        style={{ background: 'rgba(1,31,24,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-[1280px] mx-auto px-6 w-full flex items-center justify-between gap-8">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 text-right group flex-shrink-0">
            <div className="h-11 w-11 flex items-center justify-center bg-white/[0.07] rounded-xl border border-white/[0.1] group-hover:bg-white/[0.12] group-hover:border-[#C9A227]/30 transition-all duration-300">
              <img src="/logo.png" className="h-7 w-7 object-contain" alt="LFA Logo" />
            </div>
            <div>
              <h3 className="text-white font-black text-[14px] leading-tight tracking-tight group-hover:text-[#C9A227] transition-colors">
                الاتحاد اللبناني لكرة القدم
              </h3>
              <p className="text-[#C9A227]/60 text-[10px] font-bold leading-none mt-0.5">
                منصة انتساب وتصنيف الأكاديميات
              </p>
            </div>
          </Link>

          {/* Nav — desktop */}
          <nav className="hidden lg:flex items-center gap-7 flex-1 justify-center">
            {navLinks.map((link, idx) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative font-bold text-[13.5px] transition-all duration-200 pb-0.5 group ${
                  idx === 0 ? 'text-[#C9A227]' : 'text-white/55 hover:text-white/90'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-px right-0 left-0 h-[2px] rounded-full bg-[#C9A227] transition-all duration-300 ${
                  idx === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 scale-x-0 group-hover:scale-x-100 origin-right'
                }`} style={{ transformOrigin: 'right center' }}></span>
              </Link>
            ))}
          </nav>

          {/* Action buttons — desktop */}
          <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
            <Link
              to="/signin"
              className="px-5 py-2 bg-white/[0.06] border border-white/[0.12] text-white/80 rounded-xl font-bold text-[13px] hover:bg-white/[0.10] hover:border-white/20 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">person</span>
              تسجيل الدخول
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 text-[#011F18] rounded-xl font-black text-[13px] active:scale-[0.97] transition-all flex items-center gap-1.5"
              style={{
                background: 'linear-gradient(135deg, #E1BC4B 0%, #C9A227 100%)',
                boxShadow: '0 4px 20px rgba(201,162,39,0.25)'
              }}
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              ابدأ الطلب
            </Link>
          </div>

          {/* Hamburger — mobile */}
          <button
            className="lg:hidden text-white/70 p-2 hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-[76px] inset-x-0 z-40 border-b border-white/[0.08] lg:hidden py-7 px-6 shadow-2xl"
            style={{ background: 'rgba(1,31,24,0.97)', backdropFilter: 'blur(24px)' }}
          >
            <div className="flex flex-col gap-5 text-center max-w-xs mx-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/70 font-bold text-lg hover:text-white transition-colors py-1"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-5 border-t border-white/[0.08] flex flex-col gap-3">
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 bg-white/[0.06] border border-white/[0.12] text-white rounded-xl font-bold text-sm"
                >
                  تسجيل الدخول
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 text-[#011F18] rounded-xl font-black text-sm"
                  style={{ background: 'linear-gradient(135deg, #E1BC4B 0%, #C9A227 100%)' }}
                >
                  ابدأ الطلب
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN ───────────────────────────────────────────────────────── */}
      <main className="pt-[76px]">

        {/* ═══ HERO ═══════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden flex items-center" style={{ minHeight: 'calc(100vh - 76px)' }}>

          {/* Ambient glow orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full opacity-25"
              style={{ background: 'radial-gradient(circle, #064E3B 0%, transparent 70%)' }}></div>
            <div className="absolute bottom-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #C9A227 0%, transparent 70%)' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full opacity-10"
              style={{ background: 'radial-gradient(ellipse, #022C22 0%, transparent 70%)' }}></div>
          </div>

          {/* Pitch line pattern */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1280 720"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={{ opacity: 0.032 }}
          >
            {/* Pitch outline */}
            <rect x="60" y="60" width="1160" height="600" fill="none" stroke="white" strokeWidth="2.5" />
            {/* Centre line */}
            <line x1="640" y1="60" x2="640" y2="660" stroke="white" strokeWidth="2" />
            {/* Centre circle */}
            <circle cx="640" cy="360" r="120" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="640" cy="360" r="5" fill="white" />
            {/* Left penalty box */}
            <rect x="60" y="215" width="185" height="290" fill="none" stroke="white" strokeWidth="2" />
            {/* Right penalty box */}
            <rect x="1035" y="215" width="185" height="290" fill="none" stroke="white" strokeWidth="2" />
            {/* Left goal box */}
            <rect x="60" y="280" width="75" height="160" fill="none" stroke="white" strokeWidth="2" />
            {/* Right goal box */}
            <rect x="1145" y="280" width="75" height="160" fill="none" stroke="white" strokeWidth="2" />
            {/* Penalty marks */}
            <circle cx="245" cy="360" r="5" fill="white" />
            <circle cx="1035" cy="360" r="5" fill="white" />
            {/* Penalty arcs */}
            <path d="M 245 215 A 120 120 0 0 1 245 505" fill="none" stroke="white" strokeWidth="2" />
            <path d="M 1035 215 A 120 120 0 0 0 1035 505" fill="none" stroke="white" strokeWidth="2" />
            {/* Corner arcs */}
            <path d="M 60 95 A 35 35 0 0 0 95 60" fill="none" stroke="white" strokeWidth="2" />
            <path d="M 1185 60 A 35 35 0 0 0 1220 95" fill="none" stroke="white" strokeWidth="2" />
            <path d="M 60 625 A 35 35 0 0 1 95 660" fill="none" stroke="white" strokeWidth="2" />
            <path d="M 1185 660 A 35 35 0 0 0 1220 625" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Stadium background image */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000"
              className="w-full h-full object-cover"
              style={{ opacity: 0.12 }}
              alt=""
            />
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(to left, #011F18 0%, rgba(1,31,24,0.55) 40%, rgba(1,31,24,0.75) 100%)'
            }}></div>
          </div>

          {/* Content */}
          <div className="max-w-[1280px] mx-auto px-6 w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 xl:gap-20 py-16 lg:py-20">

            {/* ── Slideshow (left on desktop, top on mobile) ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex-1 w-full relative"
            >
              <HeroSlideshow />
              {/* Floating verified badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-5 -left-5 w-[68px] h-[68px] rounded-2xl flex items-center justify-center text-[#C9A227] z-20 hidden md:flex"
                style={{
                  background: '#022C22',
                  border: '2px solid rgba(201,162,39,0.5)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,162,39,0.1)'
                }}
              >
                <span className="material-symbols-outlined text-[36px] font-black">verified</span>
              </motion.div>
            </motion.div>

            {/* ── Hero text (right on desktop) ── */}
            <motion.div
              initial={{ opacity: 0, x: 36 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.12 }}
              className="flex-[1.15] text-right space-y-6"
            >
              {/* Badge row with Lebanese flag */}
              <div className="flex items-center justify-end gap-3">
                {/* Lebanese flag */}
                <div
                  className="flex flex-col overflow-hidden shadow-lg border border-white/[0.15]"
                  style={{ width: 26, height: 17, borderRadius: 2 }}
                >
                  <div style={{ flex: 1, background: '#ED1C24' }}></div>
                  <div style={{ flex: 1, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined text-[#00A859]" style={{ fontSize: 7 }}>park</span>
                  </div>
                  <div style={{ flex: 1, background: '#ED1C24' }}></div>
                </div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(201,162,39,0.08)',
                    border: '1px solid rgba(201,162,39,0.25)'
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"
                    style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}></span>
                  <span className="text-[#C9A227] font-black text-[11px] uppercase tracking-widest">
                    البوابة الرسمية للأكاديميات
                  </span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="font-black leading-[1.0] tracking-tight" style={{ fontSize: 'clamp(42px, 6vw, 76px)' }}>
                <span className="text-white block">منصة انتساب</span>
                <span className="text-white block">وتصنيف</span>
                <span className="block mt-2" style={{
                  background: 'linear-gradient(90deg, #C9A227, #E1BC4B)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 32px rgba(201,162,39,0.2))'
                }}>
                  أكاديميات كرة القدم
                </span>
              </h1>

              {/* Description */}
              <p className="text-white/55 text-[15.5px] font-medium leading-[2] max-w-[480px]">
                نظام رقمي رسمي يساعد الأكاديميات على تنظيم ملفها، اختيار المسار المناسب، واستكمال متطلبات الانتساب والتصنيف تحت مظلة الاتحاد اللبناني لكرة القدم.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 justify-end pt-1">
                <Link
                  to="/standards"
                  className="sm:w-auto px-8 py-4 text-white/80 rounded-2xl font-bold text-[14.5px] hover:text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  تعرف على المعايير
                </Link>
                <Link
                  to="/signup"
                  className="sm:w-auto px-8 py-4 text-[#011F18] rounded-2xl font-black text-[14.5px] transition-all flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #E1BC4B 0%, #C9A227 100%)',
                    boxShadow: '0 8px 32px rgba(201,162,39,0.35), 0 2px 8px rgba(201,162,39,0.2)'
                  }}
                >
                  <span>انتسب الآن واحصل على تصنيف A أو B</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </Link>
              </div>

              {/* Mini stats strip */}
              <div
                className="flex items-center justify-end gap-7 pt-5"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {[
                  { num: "A / B", label: "مسار التصنيف" },
                  { num: "10", label: "محاور تقييم" },
                  { num: "٤", label: "فئات عمرية" },
                ].map((stat) => (
                  <div key={stat.num} className="text-right">
                    <div className="font-black text-[22px] leading-none" style={{
                      background: 'linear-gradient(135deg, #E1BC4B, #C9A227)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>{stat.num}</div>
                    <div className="text-white/35 text-[11px] font-bold mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ FEATURE STRIP ═══════════════════════════════════════════════ */}
        <section style={{ background: 'rgba(2,44,34,0.6)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "انتساب رسمي", text: "صفة رسمية تحت مظلة اتحاد كرة القدم.", icon: "verified_user" },
                { title: "تصنيف واضح", text: "اختيار A أو B بحسب جاهزية الأكاديمية.", icon: "military_tech" },
                { title: "سجل أكاديمي موحد", text: "بيانات الإدارة والجهاز الفني والطبي.", icon: "groups" },
                { title: "متابعة رقمية", text: "النواقص ونسب الإنجاز وحالة الملف.", icon: "bar_chart" }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className={`py-7 px-6 flex flex-col items-center text-center gap-2.5 ${
                    idx !== 3 ? 'lg:border-l' : ''
                  }`}
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                    style={{ background: 'rgba(201,162,39,0.1)' }}
                  >
                    <span className="material-symbols-outlined text-[#C9A227] text-[20px] font-black">{feature.icon}</span>
                  </div>
                  <h5 className="font-black text-[14px] text-white">{feature.title}</h5>
                  <p className="text-white/35 text-[12px] font-medium leading-relaxed max-w-[200px]">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section className="py-20 bg-[#011F18]">
          <div className="max-w-[1280px] mx-auto px-6">

            <div className="text-center mb-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}
              >
                <span className="text-[#C9A227] font-black text-[11px] uppercase tracking-widest">كيف يعمل النظام</span>
              </div>
              <h2 className="text-white text-[34px] font-black tracking-tight">كيف تعمل المنصة؟</h2>
            </div>

            <div className="relative">
              {/* Connector line */}
              <div className="hidden lg:block absolute top-[38px] left-[12%] right-[12%] h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.2), rgba(201,162,39,0.2), transparent)' }}></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {[
                  { title: "إنشاء حساب الأكاديمية", text: "أدخل المعلومات الأساسية: الاسم، المحافظة، المنطقة، الشعار، والملعب المعتمد.", icon: "account_balance" },
                  { title: "اختيار نوع الطلب", text: "اختر المسار المناسب: تصنيف A، تصنيف B، أو انتساب فقط.", icon: "list_alt" },
                  { title: "إكمال سجل الأكاديمية", text: "أضف الأشخاص المطلوبين: المالك، المشرف الفني، المدربين، والجهاز الطبي.", icon: "diversity_3" },
                  { title: "تعبئة محاور التصنيف", text: "استكمل المتطلبات، ارفع المستندات، وتابع نسبة الإنجاز قبل إرسال الملف.", icon: "assignment" }
                ].map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: idx * 0.1, duration: 0.6 }}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="relative mb-6">
                      <div
                        className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center text-[#C9A227] transition-all duration-300 group-hover:scale-105"
                        style={{
                          background: '#022C22',
                          border: '1px solid rgba(255,255,255,0.07)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <span className="material-symbols-outlined text-[30px] font-black">{step.icon}</span>
                      </div>
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] text-[#011F18]"
                        style={{ background: 'linear-gradient(135deg, #E1BC4B, #C9A227)', boxShadow: '0 4px 12px rgba(201,162,39,0.3)' }}
                      >{idx + 1}</div>
                    </div>
                    <h5 className="font-black text-[15px] text-white mb-2">{step.title}</h5>
                    <p className="text-white/35 text-[13px] font-medium leading-relaxed max-w-[240px]">{step.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CLASSIFICATION OPTIONS ══════════════════════════════════════ */}
        <section className="py-20" style={{ background: 'rgba(2,44,34,0.25)' }}>
          <div className="max-w-[1280px] mx-auto px-6">

            <div className="text-center mb-14">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
                style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)' }}
              >
                <span className="text-[#C9A227] font-black text-[11px] uppercase tracking-widest">مسارات التصنيف</span>
              </div>
              <h2 className="text-white text-[34px] font-black tracking-tight">اختر المسار المناسب لأكاديميتك</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* ── Classification A ── */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="rounded-3xl p-8 flex flex-col items-center text-white text-center relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(160deg, #022C22 0%, #011F18 100%)',
                  border: '1px solid rgba(201,162,39,0.2)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
                }}
              >
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(201,162,39,0.6), transparent)' }}></div>
                <div
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-[#C9A227] mb-5 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.2)' }}
                >
                  <span className="material-symbols-outlined text-4xl font-black">military_tech</span>
                </div>
                <h4 className="text-[28px] font-black mb-1.5">تصنيف A</h4>
                <span
                  className="px-3.5 py-1 rounded-full text-[11px] font-black mb-6 uppercase tracking-wider text-[#011F18]"
                  style={{ background: 'linear-gradient(135deg, #E1BC4B, #C9A227)' }}
                >مستوى متقدم</span>
                <p className="text-white/45 font-medium text-[13.5px] leading-relaxed mb-7 max-w-[280px]">
                  مناسب للأكاديميات الجاهزة إداريًا وفنيًا وتنظيميًا، وتمتلك مرافق وسجلات متكاملة ومتقدمة.
                </p>
                <ul className="w-full text-right space-y-3">
                  {["10 محاور تقييم شاملة", "4 فئات عمرية: دون 10، 11، 12، 13", "سجل أكاديمية موسع وفريق عمل متطور", "متطلبات تنظيمية وفنية متكاملة"].map((li, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] font-bold text-white/75">
                      <span className="material-symbols-outlined text-[#C9A227] text-[15px]">check_circle</span>
                      {li}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* ── Classification B ── */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(160deg, rgba(6,78,59,0.4) 0%, rgba(2,44,34,0.4) 100%)',
                  border: '1px solid rgba(52,211,153,0.15)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.25)'
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(52,211,153,0.4), transparent)' }}></div>
                <div
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110"
                  style={{ background: 'rgba(6,78,59,0.5)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}
                >
                  <span className="material-symbols-outlined text-4xl font-black">military_tech</span>
                </div>
                <h4 className="text-[28px] font-black text-white mb-1.5">تصنيف B</h4>
                <span
                  className="px-3.5 py-1 rounded-full text-[11px] font-black mb-6 uppercase tracking-wider"
                  style={{ background: 'rgba(6,78,59,0.6)', border: '1px solid rgba(52,211,153,0.25)', color: '#34D399' }}
                >مستوى أساسي</span>
                <p className="text-white/45 font-medium text-[13.5px] leading-relaxed mb-7 max-w-[280px]">
                  للأكاديميات التي تستوفي الحد الأدنى من المعايير المطلوبة للمسار الرسمي والتطوير التدريجي.
                </p>
                <ul className="w-full text-right space-y-3">
                  {["محاور تقييم أساسية مختارة", "فئتان عمريتان: دون 12 ودون 13", "سجل أكاديمية مبسط ومنظم", "مناطق قيادية رسمية تحت إشراف الاتحاد"].map((li, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] font-bold text-white/75">
                      <span className="material-symbols-outlined text-[15px]" style={{ color: '#34D399' }}>check_circle</span>
                      {li}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* ── Affiliation Only ── */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group"
                style={{
                  background: 'rgba(1,31,24,0.6)',
                  border: '1.5px dashed rgba(201,162,39,0.2)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                }}
              >
                <div
                  className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-5 transition-all group-hover:scale-110 group-hover:bg-[rgba(201,162,39,0.1)]"
                  style={{ background: 'rgba(201,162,39,0.05)', border: '1px dashed rgba(201,162,39,0.2)', color: 'rgba(201,162,39,0.6)' }}
                >
                  <span className="material-symbols-outlined text-4xl font-black">verified</span>
                </div>
                <h4 className="text-[28px] font-black text-white mb-1.5">انتساب فقط</h4>
                <span
                  className="px-3.5 py-1 rounded-full text-[11px] font-black mb-6 uppercase tracking-wider"
                  style={{ background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.15)', color: 'rgba(201,162,39,0.7)' }}
                >صفة رسمية</span>
                <p className="text-white/45 font-medium text-[13.5px] leading-relaxed mb-7 max-w-[280px]">
                  منح الأكاديمية صفة رسمية تحت مظلة الاتحاد، دون فتح مسار التصنيف المباشر في المرحلة الحالية.
                </p>
                <ul className="w-full text-right space-y-3">
                  {["لا يتطلب استكمال كافة المحاور المتقدمة", "خطوة أولى رسمية تحت مسمى الانتساب", "يمكن التقدم لطلب التصنيف في وقت لاحق", "مناسب للأكاديميات الناشئة والصغيرة"].map((li, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-[13px] font-bold text-white/75">
                      <span className="material-symbols-outlined text-[15px]" style={{ color: 'rgba(201,162,39,0.6)' }}>check_circle</span>
                      {li}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ══════════════════════════════════════════════════════ */}
        <footer
          className="py-8"
          style={{ background: '#011F18', borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" className="h-7 w-7 object-contain" style={{ opacity: 0.4 }} alt="LFA" />
              <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                © 2025 الاتحاد اللبناني لكرة القدم. جميع الحقوق محفوظة.
              </span>
            </div>
            <div className="flex items-center gap-6">
              {[
                { name: "المعايير", path: "/standards" },
                { name: "الأسئلة الشائعة", path: "/faq" },
                { name: "اتصل بنا", path: "/contact" },
              ].map(link => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-[13px] font-medium transition-colors"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
