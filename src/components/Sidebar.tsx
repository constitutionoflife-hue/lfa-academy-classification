import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentSession, logout as authLogout } from "../lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Sidebar({ isOpen, onClose, isAuthenticated: propAuth, onLogout: propLogout }: SidebarProps) {
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  const session = getCurrentSession();
  const isAuthenticated = propAuth !== undefined ? propAuth : (session !== null && session.isAuthenticated);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogout = () => {
    if (propLogout) {
      propLogout();
    } else {
      authLogout();
    }
    onClose();
    navigate("/");
  };

  const navLinks = [
    { label: "لوحة الأكاديمية", path: "/dashboard", icon: "dashboard", protected: true },
    { label: "سجل الأكاديمية", path: "/academy-registry", icon: "group", protected: true },
    { label: "حساب الأكاديمية", path: "/profile", icon: "person", protected: true },
    { label: "المعايير", path: "/standards", icon: "verified" },
    { label: "الأسئلة الشائعة", path: "/faq", icon: "help_center" },
    { label: "اتصل بنا", path: "/contact", icon: "mail" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#022C22]/60 backdrop-blur-[4px] z-[60] transition-opacity duration-300"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div 
        ref={sidebarRef}
        className={`fixed top-0 right-0 h-screen w-[300px] bg-[#022C22] text-white z-[70] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-7 border-b border-white/10 bg-[#064E3B]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 relative flex items-center justify-center bg-white/10 rounded-full p-1 border border-white/10 transition-all shadow-lg">
                <img 
                  src="/logo.png" 
                  className="h-full w-full object-contain" 
                  alt="LFA Logo"
                />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-base">القائمة الرئيسية</div>
                <div className="text-[10px] text-white/50 font-bold uppercase tracking-widest">LFA Academy</div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-90"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 py-8 px-4 overflow-y-auto">
            <div className="space-y-2">
              {navLinks.map((link, i) => {
                if (link.protected && !isAuthenticated) return null;
                
                return (
                  <Link
                    key={i}
                    to={link.path}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-bold transition-all group active:scale-[0.98] border-2 ${
                      link.path === "/profile" 
                        ? "bg-[#064E3B] text-[#C9A227] border-[#C9A227]/30 shadow-lg shadow-black/20" 
                        : "hover:bg-[#064E3B] hover:text-[#C9A227] border-transparent"
                    }`}
                  >
                    <span className={`material-symbols-outlined transition-colors ${
                      link.path === "/profile" ? "text-[#C9A227]" : "text-white/40 group-hover:text-[#C9A227]"
                    }`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            {isAuthenticated && (
              <div className="mt-8 pt-8 border-t border-white/10 px-4">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-red-500/10 text-red-400 font-bold text-lg hover:bg-red-500/20 hover:text-red-300 transition-all group active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">logout</span>
                  تسجيل الخروج
                </button>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-8 bg-[#011a14] border-t border-white/5">
            <div className="flex items-center gap-3 opacity-30 mb-2">
              <span className="material-symbols-outlined text-sm">info</span>
              <div className="text-[10px] font-bold uppercase tracking-widest">الاتحاد اللبناني لكرة القدم</div>
            </div>
            <div className="text-[10px] text-white/20">
               © 2024 نظام انتساب الأكاديميات بنسخة MVP v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
