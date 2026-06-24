import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import { useAuth } from "../lib/AuthContext";
import { logout as authLogout } from "../lib/auth";

interface AppHeaderProps {
  academyName?: string;
  academyLogo?: string | null;
  showBackToDashboard?: boolean;
}

export default function AppHeader({ academyName: propName, academyLogo: propLogo, showBackToDashboard }: AppHeaderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [internalName, setInternalName] = useState("");
  const [internalLogo, setInternalLogo] = useState<string | null>(null);

  const isLanding = pathname === "/";
  const { user, isAdmin } = useAuth();
  const isAuth = !!user;
  const adminViewEmail = localStorage.getItem("adminViewEmail");

  useEffect(() => {
    if (isAuth && !propName) {
      const basicInfoStr = localStorage.getItem("academyBasicInfo");
      if (basicInfoStr) {
        try {
          const basicInfo = JSON.parse(basicInfoStr);
          if (basicInfo && basicInfo.academyName) setInternalName(basicInfo.academyName);
          if (basicInfo && basicInfo.academyLogo) setInternalLogo(basicInfo.academyLogo);
        } catch (e) {}
      }
    }
  }, [isAuth, propName]);

  const academyName = propName || internalName;
  const academyLogo = propLogo || internalLogo;

  const handleLogout = () => {
    authLogout();
    navigate("/");
  };

  return (
    <>
      {adminViewEmail && (
        <div className="bg-blue-600 text-white text-center py-2 px-4 shadow-md flex items-center justify-center gap-4 text-sm font-bold relative z-[60]">
           <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
           أنت تقوم الآن بعرض حساب الأكاديمية: {adminViewEmail}
           <Link 
             to="/admin" 
             onClick={() => {
               localStorage.removeItem("adminViewEmail");
               localStorage.removeItem("adminViewUid");
               window.location.href = '/admin'; // Force reload to clear states
             }}
             className="mr-4 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-colors"
           >
             العودة للوحة تحكم الإدارة
           </Link>
        </div>
      )}
      <header className="bg-[#022C22] text-white sticky top-0 z-50 shadow-lg border-b border-white/5">
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between" dir="rtl">
          {/* Right Side: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            {!isLanding && isAuth && !(isAdmin && !adminViewEmail) && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 border border-white/10"
              >
                <span className="material-symbols-outlined text-white text-2xl">menu</span>
              </button>
            )}
            <Link 
              to={isAuth ? (isAdmin ? "/admin" : "/dashboard") : "/"} 
              onClick={() => {
                if (isAuth && isAdmin) {
                  localStorage.removeItem("adminViewEmail");
                  localStorage.removeItem("adminViewUid");
                }
              }}
              aria-label="العودة إلى الصفحة الرئيسية" 
              className="flex items-center gap-4 text-right group transition-all"
            >
              <div className="h-12 w-12 md:h-14 md:w-14 relative flex items-center justify-center bg-white/10 rounded-full p-1 border border-white/10 group-hover:bg-white/20 transition-all">
                <img 
                  src="/logo.png" 
                  className="h-full w-full object-contain transform group-hover:scale-110 transition-transform" 
                  alt="LFA Logo"
                />
              </div>
              <div>
                <h3 className="text-white font-black text-sm md:text-lg leading-tight group-hover:text-[#C9A227] transition-colors tracking-tighter">الاتحاد اللبناني لكرة القدم</h3>
                <p className="text-[#C9A227] text-[10px] md:text-xs font-bold leading-none mt-1">منصة انتساب وتصنيف الأكاديميات</p>
              </div>
            </Link>
          </div>

          {/* Left Side: Academy Info & Actions */}
          <div className="flex items-center gap-2 md:gap-6">
            {!isLanding && isAuth && showBackToDashboard && !(isAdmin && !adminViewEmail) && (
              <Link to="/dashboard" className="hidden sm:flex items-center gap-2 text-[#C9A227] font-bold hover:brightness-110 bg-[#C9A227]/10 px-3 md:px-4 py-2 rounded-xl transition-all border border-[#C9A227]/20 text-xs md:text-sm">
                <span className="material-symbols-outlined text-[18px] md:text-[20px]">grid_view</span>
                <span className="hidden md:inline">لوحة المتابعة</span>
              </Link>
            )}
            
            {!isLanding && isAuth ? (
              <div className="flex items-center gap-3 md:gap-4 border-r border-white/10 pr-3 md:pr-6">
                {!isAdmin && <NotificationBell />}
                <div className="text-right hidden md:flex flex-col items-end">
                  <div className="text-[#C9A227] text-[9px] font-black uppercase tracking-widest">{isAdmin ? "مسؤول النظام" : "طالب التصنيف"}</div>
                  <div className="font-bold text-sm text-white">{isAdmin ? "الإدارة" : (internalName || "طالب التصنيف")}</div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl border border-white/20 overflow-hidden flex items-center justify-center group hover:bg-white/20 transition-all">
                  {isAdmin ? <span className="material-symbols-outlined text-white">admin_panel_settings</span> : internalLogo ? <img src={internalLogo} alt="Logo" className="w-full h-full object-cover group-hover:scale-110 transition-transform bg-white" /> : <span className="material-symbols-outlined text-white">person</span>}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 md:w-11 md:h-11 bg-white/5 hover:bg-red-500/10 hover:text-red-400 group flex items-center justify-center rounded-xl transition-all border border-white/10"
                  title="تسجيل الخروج"
                >
                  <span className="material-symbols-outlined text-xl md:text-2xl group-hover:rotate-12 transition-transform">logout</span>
                </button>
              </div>
            ) : isLanding && !isAuth ? (
               <div className="flex items-center gap-2 md:gap-3">
                 <Link to="/signin" className="text-xs md:text-sm font-bold text-white/70 hover:text-white transition-colors px-3 md:px-4 py-2 border border-white/10 rounded-xl">دخول</Link>
                 <Link to="/signup" className="text-xs md:text-sm font-bold bg-[#C9A227] text-[#022C22] px-4 md:px-6 py-2 rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95">بدء الطلب</Link>
               </div>
            ) : null}
          </div>
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
