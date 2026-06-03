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
    <div className="relative z-10 rounded-[36px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-[#C9A227]/20 w-full aspect-[4/3] group bg-[#022C22]">
       <AnimatePresence mode="popLayout" initial={false}>
         <motion.div
           key={currentSlide}
           initial={{ opacity: 0, scale: 1.15 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           transition={{ 
             opacity: { duration: 1.2, ease: "easeInOut" },
             scale: { duration: 1.5, ease: "easeOut" }
           }}
           className="absolute inset-0"
         >
           {/* Background Image with Enhanced Ken Burns Effect */}
           <motion.div
              animate={{ 
                scale: [1, 1.08],
                x: [0, -10],
                y: [0, 5]
              }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute inset-0"
           >
             <img 
               src={slides[currentSlide].image} 
               className="w-full h-full object-cover"
               alt={slides[currentSlide].title}
             />
             {/* Gradient Overlays */}
             <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].bg} opacity-40 mix-blend-multiply`}></div>
             <div className="absolute inset-0 bg-gradient-to-t from-[#023126] via-[#023126]/40 to-transparent"></div>
           </motion.div>

           {/* Content Box */}
           <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-14 text-right z-10">
             <div className="flex items-center gap-4 mb-10">
                <motion.div 
                   initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                   animate={{ scale: 1, opacity: 1, rotate: 0 }}
                   key={`icon-${currentSlide}`}
                   className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#E1BC4B] to-[#C9A227] flex items-center justify-center text-[#022C22] shadow-[0_12px_24px_rgba(201,162,39,0.3)] border border-white/20"
                >
                   <span className="material-symbols-outlined text-4xl font-black">{slides[currentSlide].icon}</span>
                </motion.div>
                <motion.div 
                   initial={{ x: 20, opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/10 text-[#C9A227] rounded-full text-[12px] font-black uppercase tracking-widest shadow-lg"
                >
                   رؤية تطوير الأكاديميات
                </motion.div>
             </div>
             
             <motion.div
               initial={{ opacity: 0, x: 40 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
               key={`text-${currentSlide}`}
               className="space-y-4"
             >
               <h3 className="text-white text-3xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                 {slides[currentSlide].title}
               </h3>
               <div className="w-24 h-1.5 bg-[#C9A227] rounded-full shadow-lg"></div>
             </motion.div>
           </div>

           {/* Lebanese Subtle Accent */}
           <div className="absolute top-8 left-8 flex flex-col gap-1 opacity-60 z-10">
             <div className="w-10 h-2 bg-[#ED1C24] rounded-t-sm"></div>
             <div className="w-10 h-3 bg-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[#00A859] text-[12px] scale-125">park</span>
             </div>
             <div className="w-10 h-2 bg-[#ED1C24] rounded-b-sm"></div>
           </div>
         </motion.div>
       </AnimatePresence>

       <div className="absolute bottom-8 left-10 flex gap-2.5 z-20" dir="ltr">
         {slides.map((_, idx) => (
           <button
             key={idx}
             onClick={() => setCurrentSlide(idx)}
             className={`h-2 rounded-full transition-all duration-500 shadow-lg ${idx === currentSlide ? 'w-12 bg-[#C9A227]' : 'w-2.5 bg-white/20 hover:bg-white/40'}`}
             aria-label={`Go to slide ${idx + 1}`}
           />
         ))}
       </div>

       {/* Decorative Frame Overlay */}
       <div className="absolute inset-0 border-[12px] border-white/5 rounded-[36px] pointer-events-none"></div>
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
    <div className="min-h-screen bg-white selection:bg-[#C9A227] selection:text-white font-['Cairo'] text-[#111827]" dir="rtl">
      {/* 1. HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#022C22] border-b border-[#C9A227]/20 h-[88px] flex items-center">
        <div className="max-w-[1280px] mx-auto px-6 w-full flex items-center justify-between">
          {/* Logo (Right) */}
          <Link to="/" className="flex items-center gap-4 text-right group">
            <div className="h-14 w-14 relative flex items-center justify-center bg-white/10 rounded-full p-1 border border-white/10 group-hover:bg-white/20 transition-all">
              <img 
                src="/logo.png" 
                className="h-full w-full object-contain transform group-hover:scale-110 transition-transform" 
                alt="LFA Logo"
              />
            </div>
            <div>
              <h3 className="text-white font-black text-lg leading-tight group-hover:text-[#C9A227] transition-colors tracking-tighter">الاتحاد اللبناني لكرة القدم</h3>
              <p className="text-[#C9A227] text-xs font-bold leading-none mt-1">منصة انتساب وتصنيف الأكاديميات</p>
            </div>
          </Link>

          {/* Navigation (Center) - Desktop Only */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link, idx) => (
              <Link
                key={link.name}
                to={link.path}
                className={`font-bold text-base transition-colors ${idx === 0 ? 'text-[#C9A227]' : 'text-white hover:text-[#C9A227]'}`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons (Left) - Desktop Only */}
          <div className="hidden lg:flex items-center gap-4">
            <>
              <Link 
                to="/signin" 
                className="px-6 py-2.5 bg-transparent border border-white/30 text-white rounded-md font-bold text-sm hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person</span>
                تسجيل الدخول
              </Link>
              <Link 
                to="/signup" 
                className="px-6 py-2.5 bg-[#C9A227] text-[#022C22] rounded-md font-black text-sm hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                ابدأ الطلب
              </Link>
            </>
          </div>

          <div className="lg:hidden">
            <button className="text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="material-symbols-outlined text-3xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-[88px] inset-x-0 bg-[#022C22] z-40 border-b border-[#C9A227]/30 lg:hidden py-8 px-6 shadow-2xl origin-top"
          >
            <div className="flex flex-col gap-6 text-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white font-bold text-xl"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
                <Link 
                  to="/signin" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 bg-white/5 border border-white/20 text-white rounded-xl font-bold"
                >
                  تسجيل الدخول
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 bg-[#C9A227] text-[#022C22] rounded-xl font-black"
                >
                  ابدأ الطلب
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-[88px]">
        {/* 2. HERO SECTION */}
        <section className="relative min-h-[720px] bg-[#011F18] overflow-hidden flex items-center">
          {/* Real Football Background */}
          <div className="absolute inset-0 z-0 text-white">
            <img 
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=2000" 
              className="w-full h-full object-cover opacity-30"
              alt="Stadium background"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#011F18] via-[#011F18]/80 to-transparent"></div>
          </div>

          <div className="absolute inset-0 opacity-20 pointer-events-none select-none overflow-hidden text-white">
            {/* Rounded Background Photo Frame */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border-[40px] border-white/5 rounded-[300px] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1526232761682-d26e4fca61d5?auto=format&fit=crop&q=80&w=1600" 
                className="w-full h-full object-cover opacity-30 brightness-50"
                alt=""
              />
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white/5"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#C9A227]/10 rounded-full blur-[140px]"></div>

          <div className="max-w-[1280px] mx-auto px-6 w-full relative z-10 flex flex-col lg:flex-row items-center gap-16 pt-20 pb-28 md:pt-32 md:pb-40">
            {/* HERO PHOTO (LEFT) - SLIDESHOW */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-1 w-full relative"
            >
              <HeroSlideshow />
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#022C22] border-4 border-[#C9A227] rounded-full flex items-center justify-center text-[#C9A227] shadow-2xl z-20 hidden md:flex"
              >
                <span className="material-symbols-outlined text-5xl font-black">verified</span>
              </motion.div>
            </motion.div>

            {/* HERO TEXT (RIGHT) */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-[1.2] text-right space-y-8"
            >
              <div className="inline-block px-4 py-1.5 bg-[#C9A227]/10 border-r-4 border-[#C9A227] mb-4">
                <h4 className="text-[#C9A227] font-black text-sm uppercase tracking-widest">البوابة الرسمية للأكاديميات</h4>
              </div>
              <h2 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tight">
                منصة انتساب وتصنيف
                <span className="text-[#C9A227] block mt-4 md:mt-6">أكاديميات كرة القدم</span>
              </h2>
              <p className="text-white/80 text-xl font-medium leading-[1.8] max-w-2xl">
                نظام رقمي رسمي يساعد الأكاديميات على تنظيم ملفها، اختيار المسار المناسب، واستكمال متطلبات الانتساب والتصنيف تحت مظلة الاتحاد اللبناني لكرة القدم.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-5 justify-end pt-4">
                <Link 
                  to="/signup" 
                  className="w-full sm:w-auto px-12 py-5 bg-[#C9A227] text-[#022C22] rounded-xl font-black text-xl hover:scale-105 transition-all shadow-[0_20px_50px_rgba(201,162,39,0.3)] flex items-center justify-center gap-3 order-1 sm:order-2"
                >
                  <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
                  <span>ابدأ طلب الانتساب الآن</span>
                </Link>
                <Link 
                  to="/standards" 
                  className="w-full sm:w-auto px-12 py-5 bg-transparent border-2 border-white/20 text-white rounded-xl font-black text-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 order-2 sm:order-1"
                >
                  <span>تعرف على المعايير</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. FEATURE STRIP */}
        <section className="bg-white py-16 border-b border-[#E5DED0]">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
               {[
                 { title: "انتساب رسمي", text: "منح الأكاديمية صفة رسمية تحت مظلة اتحاد كرة القدم.", icon: "verified_user" },
                 { title: "تصنيف واضح", text: "اختيار تصنيف A أو B بحسب جاهزية الأكاديمية الإدارية والفنية.", icon: "military_tech" },
                 { title: "سجل أكاديمي موحد", text: "إدخال بيانات الإدارة، الجهاز الفني، والجهاز الطبي في سجل واحد منظم.", icon: "groups" },
                 { title: "متابعة رقمية", text: "متابعة النواقص، نسب الإنجاز، وحالة الملف قبل الإرسال.", icon: "bar_chart" }
               ].map((feature, idx) => (
                 <div key={idx} className={`p-8 flex flex-col items-center text-center gap-4 ${idx !== 3 ? 'lg:border-l border-[#E5DED0]' : ''}`}>
                    <div className="w-12 h-12 flex items-center justify-center text-[#064E3B]">
                      <span className="material-symbols-outlined text-[42px] font-black">{feature.icon}</span>
                    </div>
                    <h5 className="font-black text-xl text-[#022C22]">{feature.title}</h5>
                    <p className="text-[#64748B] text-sm font-medium leading-relaxed max-w-[280px]">{feature.text}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section className="py-24 bg-[#FFFDF7]">
          <div className="max-w-[1280px] mx-auto px-6 text-center">
            <h2 className="text-4xl font-black text-[#022C22] mb-24">كيف تعمل المنصة؟</h2>

            <div className="relative">
              <div className="hidden lg:block absolute top-[44px] left-[15%] right-[15%] h-0.5 bg-[#E5DED0]"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
                {[
                  { title: "إنشاء حساب الأكاديمية", text: "أدخل المعلومات الأساسية للأكاديمية مثل الاسم، المحافظة، المنطقة، الشعار، والملعب المعتمد.", icon: "account_balance" },
                  { title: "اختيار نوع الطلب", text: "اختر المسار المناسب للأكاديمية: تصنيف A، تصنيف B، أو انتساب فقط.", icon: "list_alt" },
                  { title: "إكمال سجل الأكاديمية", text: "أضف الأشخاص المطلوبين حسب نوع التصنيف مثل المالك، المشرف الفني، المدربين، والجهاز الطبي.", icon: "diversity_3" },
                  { title: "تعبئة محاور التصنيف", text: "استكمل المتطلبات، ارفع المستندات، وتابع نسبة الإنجاز في ملف الواجهة للأكاديمية قبل مراجعة الملف.", icon: "assignment" }
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center group">
                    <div className="w-22 h-22 mb-8 relative">
                       <div className="w-20 h-20 rounded-full border-4 border-[#F6F1E7] bg-white flex items-center justify-center text-[#C9A227] shadow-lg group-hover:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-4xl font-black">{step.icon}</span>
                       </div>
                       <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-[#022C22] text-white flex items-center justify-center font-black text-sm border-2 border-white">{idx + 1}</div>
                    </div>
                    <h5 className="font-black text-xl text-[#022C22] mb-3">{step.title}</h5>
                    <p className="text-[#64748B] text-sm font-medium leading-relaxed max-w-[320px]">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. CLASSIFICATION OPTIONS */}
        <section className="py-24 bg-[#F6F1E7]">
          <div className="max-w-[1280px] mx-auto px-6">
            <h2 className="text-4xl font-black text-[#022C22] text-center mb-20">اختر المسار المناسب لأكاديميتك</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Classification A */}
              <div className="bg-[#022C22] rounded-[24px] p-10 flex flex-col items-center text-white text-center shadow-2xl relative overflow-hidden group border border-white/5">
                 <div className="w-24 h-24 bg-[#C9A227]/10 rounded-full flex items-center justify-center text-[#C9A227] mb-8">
                   <span className="material-symbols-outlined text-5xl font-black">military_tech</span>
                 </div>
                 <h4 className="text-3xl font-black mb-2">تصنيف A</h4>
                 <span className="px-4 py-1.5 bg-[#C9A227] text-[#022C22] rounded-full text-xs font-black mb-8 italic uppercase">مستوى متقدم</span>
                 <p className="text-white/60 font-medium text-[15px] leading-relaxed mb-10 max-w-[320px]">مناسب للأكاديميات الجاهزة إداريًا وفنيًا وتنظيميًا، وتمتلك مرافق وسجلات متكاملة ومتقدمة.</p>
                 <ul className="w-full text-right space-y-4 mb-12">
                   {["10 محاور تقييم شاملة", "4 فئات عمرية: دون 10، 11، 12، 13", "سجل أكاديمية موسع وفريق عمل متطور", "متطلبات تنظيمية وفنية متكاملة"].map((li, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm font-bold text-white/90">
                       <span className="material-symbols-outlined text-[#C9A227] text-[18px]">verified</span>
                       {li}
                     </li>
                   ))}
                 </ul>
              </div>

              {/* Classification B */}
              <div className="bg-white rounded-[24px] p-10 flex flex-col items-center text-center shadow-xl border border-[#E5DED0] group">
                 <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-[#064E3B] mb-8 group-hover:bg-[#C9A227]/10 group-hover:text-[#C9A227] transition-all">
                   <span className="material-symbols-outlined text-5xl font-black">military_tech</span>
                 </div>
                 <h4 className="text-3xl font-black text-[#022C22] mb-2">تصنيف B</h4>
                 <span className="px-4 py-1.5 bg-[#064E3B] text-white rounded-full text-xs font-black mb-8 italic uppercase tracking-wider">مستوى أساسي</span>
                 <p className="text-[#64748B] font-medium text-[15px] leading-relaxed mb-10 max-w-[320px]">للأكاديميات التي تستوفي الحد الأدنى من المعايير المطلوبة للمسار الرسمي للتنظيم والتطوير التدريجي.</p>
                 <ul className="w-full text-right space-y-4 mb-12">
                   {["محاور تقييم أساسية مختارة", "فئتان عمريتان: دون 12 ودون 13", "سجل أكاديمية مبسط ومنظم", "مناطق قيادية رسمية تحت إشراف الاتحاد"].map((li, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#022C22]">
                       <span className="material-symbols-outlined text-[#064E3B] text-[18px]">verified</span>
                       {li}
                     </li>
                   ))}
                 </ul>
              </div>

              {/* Affiliation Only */}
              <div className="bg-[#FFFDF7] rounded-[24px] p-10 flex flex-col items-center text-center shadow-xl border-2 border-dashed border-[#C9A227]/40 group">
                 <div className="w-24 h-24 bg-[#F6F1E7] rounded-full flex items-center justify-center text-[#C9A227] mb-8">
                   <span className="material-symbols-outlined text-5xl font-black">verified</span>
                 </div>
                 <h4 className="text-3xl font-black text-[#022C22] mb-2">انتساب فقط</h4>
                 <span className="px-4 py-1.5 bg-[#C9A227]/20 text-[#C9A227] rounded-full text-xs font-black mb-8 italic uppercase tracking-wider">صفة رسمية</span>
                 <p className="text-[#64748B] font-medium text-[15px] leading-relaxed mb-10 max-w-[320px]">منح الأكاديمية صفة رسمية تحت مظلة الاتحاد، لكنه لا يفتح مسار التصنيف المباشر في المرحلة الحالية.</p>
                 <ul className="w-full text-right space-y-4 mb-12">
                   {["لا يتطلب استكمال كافة المحاور المتقدمة", "خطوة أولى رسمية تحت مسمى الانتساب", "يمكن التقدم لطلب التصنيف في وقت لاحق", "مناسب للأكاديميات الناشئة والصغيرة"].map((li, i) => (
                     <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#022C22]">
                       <span className="material-symbols-outlined text-[#C9A227] text-[18px]">verified</span>
                       {li}
                     </li>
                   ))}
                 </ul>
              </div>
            </div>
          </div>
        </section>


      </main>

    </div>
  );
}
