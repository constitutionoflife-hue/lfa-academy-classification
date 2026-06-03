import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, resetPassword } from "./lib/auth";

export default function SigninPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unverified, setUnverified] = useState(false);

  // Password reset states
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setUnverified(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.email) newErrors.email = "مطلوب";
    else if (!emailRegex.test(formData.email)) newErrors.email = "بريد إلكتروني غير صالح";

    if (!formData.password) newErrors.password = "مطلوب";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          if (result.isVerified === false) {
            setErrors({ general: "يرجى تأكيد البريد الإلكتروني للمتابعة." });
            setUnverified(true);
          } else if (result.isAdmin) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } else {
          setErrors({ general: result.error || "خطأ في تسجيل الدخول" });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'يرجى إدخال البريد الإلكتروني.' });
      return;
    }
    setResetLoading(true);
    setResetMessage(null);
    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        setResetMessage({ type: 'success', text: 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.' });
      } else {
        setResetMessage({ type: 'error', text: result.error || 'فشل إرسال الرابط.' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F1E7] p-4 lg:p-8" dir="rtl">
      
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative overflow-hidden p-2 border border-white/10 backdrop-blur-sm">
                 <img 
                   src="/logo.png" 
                   alt="LFA Logo" 
                   className="w-full h-full object-contain relative z-10"
                 />
              </div>
            </Link>
            <h1 className="font-display-md text-3xl font-bold text-[#022C22] mb-3">
              {showResetForm ? "استعادة كلمة المرور" : "تسجيل الدخول"}
            </h1>
            <p className="text-[#64748B]">
              {showResetForm ? "أدخل بريدك الإلكتروني لتلقي رابط إرسال كلمة المرور." : "قم بتسجيل الدخول للوصول إلى لوحة الأكاديمية."}
            </p>
        </div>

        <div className="bg-[#FFFDF7] p-6 md:p-10 rounded-3xl shadow-xl border border-[#E5DED0]">
          {!showResetForm ? (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              {errors.general && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center">
                  {errors.general}
                  {unverified && (
                    <div className="mt-2">
                      <Link 
                        to={`/verify-email?email=${encodeURIComponent(formData.email)}`}
                        className="text-[#C9A227] underline"
                      >
                        تأكيد البريد الإلكتروني
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-label-md text-[#111827] mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  dir="ltr"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-white border ${errors.email ? 'border-red-500' : 'border-[#E5DED0]'} rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all text-right`}
                />
                {errors.email && <p className="text-red-500 font-label-sm mt-1 text-right">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-label-md text-[#111827] mb-2">كلمة المرور</label>
                <input
                  type="password"
                  name="password"
                  dir="ltr"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white border ${errors.password ? 'border-red-500' : 'border-[#E5DED0]'} rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all text-right`}
                />
                {errors.password && <p className="text-red-500 font-label-sm mt-1 text-right">{errors.password}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-[#064E3B] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#022C22] active:scale-[0.98] transition-all shadow-md focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227] focus:outline-none flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                      جاري الدخول...
                    </>
                  ) : 'تسجيل الدخول'}
                </button>
              </div>
              
              <div className="text-center pt-4 flex flex-col gap-3">
               <button 
                 type="button"
                 onClick={() => setShowResetForm(true)}
                 className="font-label-md text-[#64748B] hover:text-[#064E3B] transition-colors text-sm"
               >
                 نسيت كلمة المرور؟
               </button>
               <Link to="/signup" className="font-label-md text-[#64748B] hover:text-[#064E3B] transition-colors">
                 ليس لديك حساب؟ <span className="text-[#C9A227] font-bold underline underline-offset-4">إنشاء حساب</span>
               </Link>
              </div>

            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6" noValidate>
              
              {resetMessage && (
                <div className={`p-3 rounded-lg border text-sm font-bold text-center ${
                  resetMessage.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                  {resetMessage.text}
                </div>
              )}

              <div>
                <label className="block font-label-md text-[#111827] mb-2">البريد الإلكتروني المسجل</label>
                <input
                  type="email"
                  dir="ltr"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all text-right"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`w-full bg-[#064E3B] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#022C22] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 ${resetLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {resetLoading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[24px]">sync</span>
                      جاري الإرسال...
                    </>
                  ) : 'إرسال رابط الاستعادة'}
                </button>
              </div>
              
              <div className="text-center pt-4">
               <button 
                 type="button"
                 onClick={() => {
                   setShowResetForm(false);
                   setResetMessage(null);
                 }}
                 className="font-label-md text-[#064E3B] hover:underline transition-colors text-sm font-bold"
               >
                 العودة لتسجيل الدخول
               </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
