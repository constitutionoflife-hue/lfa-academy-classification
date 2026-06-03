import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerAccount } from "./lib/auth";

export default function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginEmail: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.loginEmail) newErrors.loginEmail = "بريد الدخول مطلوب";
    else if (!emailRegex.test(formData.loginEmail)) newErrors.loginEmail = "بريد إلكتروني غير صالح";

    if (!formData.password) newErrors.password = "كلمة المرور مطلوبة";
    else if (formData.password.length < 6) newErrors.password = "كلمة المرور يجب أن لا تقل عن 6 أحرف";

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";
    }

    if (!formData.agreeToTerms) newErrors.agreeToTerms = "يجب الموافقة على الشروط";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const result = await registerAccount({
          loginEmail: formData.loginEmail,
          password: formData.password,
        });

        if (result.success) {
          navigate(`/academy-profile?email=${encodeURIComponent(formData.loginEmail)}`);
        } else {
          setErrors({ loginEmail: result.error || "فشل في إنشاء الحساب." });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E7]" dir="rtl">
      {/* Top Banner */}
      <div className="w-full bg-gradient-to-b md:bg-gradient-to-r from-[#022C22] to-[#064E3B] p-8 lg:px-12 lg:pt-12 lg:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent shadow-[0_0_20px_rgba(201,162,39,0.5)]"></div>
        
        <div className="relative z-10 w-full max-w-[1000px] mx-auto text-white flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 md:gap-12 text-right">
          <div className="flex flex-col items-start w-full">
            <Link to="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl p-2 relative">
                 <img 
                   src="/logo.png" 
                   alt="LFA Logo" 
                   className="w-full h-full object-contain"
                 />
              </div>
            </Link>
            <div className="bg-[#C9A227] text-[#022C22] px-4 py-1.5 rounded-full font-bold text-sm mb-4 inline-block">الخطوة الأولى</div>
            <h1 className="font-display-md text-3xl md:text-5xl font-bold mb-4 leading-tight">إنشاء حساب جديد</h1>
            <p className="font-body-lg text-white/90 leading-relaxed text-base md:text-xl max-w-2xl">أدخل بيانات الدخول الخاصة بك للبدء في عملية تسجيل الأكاديمية.</p>
          </div>
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 w-full p-4 md:p-8 lg:pb-16 font-body-md relative">
        <div className="max-w-[500px] mx-auto w-full relative z-20 lg:-mt-24">
          <div className="bg-[#FFFDF7] p-8 text-right rounded-3xl shadow-xl border border-[#E5DED0]">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              
              <div>
                <label className="block font-label-md text-[#111827] mb-2 font-bold">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="loginEmail"
                  dir="ltr"
                  value={formData.loginEmail}
                  onChange={handleChange}
                  className={`w-full bg-white border ${errors.loginEmail ? 'border-red-500' : 'border-[#E5DED0]'} rounded-xl px-4 py-3.5 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all shadow-sm text-right`}
                  placeholder="name@example.com"
                />
                {errors.loginEmail && <p className="text-red-500 font-label-sm mt-1 text-right">{errors.loginEmail}</p>}
              </div>

              <div>
                <label className="block font-label-md text-[#111827] mb-2 font-bold">كلمة المرور <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  dir="ltr"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full bg-white border ${errors.password ? 'border-red-500' : 'border-[#E5DED0]'} rounded-xl px-4 py-3.5 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all shadow-sm text-right`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 font-label-sm mt-1 text-right">{errors.password}</p>}
              </div>

              <div>
                <label className="block font-label-md text-[#111827] mb-2 font-bold">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="confirmPassword"
                  dir="ltr"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full bg-white border ${errors.confirmPassword ? 'border-red-500' : 'border-[#E5DED0]'} rounded-xl px-4 py-3.5 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all shadow-sm text-right`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="text-red-500 font-label-sm mt-1 text-right">{errors.confirmPassword}</p>}
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-1">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="peer appearance-none w-5 h-5 border-2 border-[#E5DED0] rounded focus:outline-none focus:ring-2 focus:ring-[#C9A227] checked:bg-[#064E3B] checked:border-[#064E3B] transition-colors"
                    />
                    <span className="material-symbols-outlined absolute text-white text-[16px] pointer-events-none opacity-0 peer-checked:opacity-100 font-bold">check</span>
                  </div>
                  <span className="font-body-md text-[#111827] select-none group-hover:text-[#064E3B] transition-colors">أوافق على الشروط والتعليمات.</span>
                </label>
                {errors.agreeToTerms && <p className="text-red-500 font-label-sm mt-2">{errors.agreeToTerms}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#064E3B] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#022C22] transition-all shadow-md mt-4 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    جاري الإنشاء...
                  </>
                ) : 'إنشاء الحساب'}
              </button>
              
              <div className="text-center pt-2">
                <Link to="/signin" className="font-label-md text-[#64748B] hover:text-[#064E3B] transition-colors">
                  لديك حساب بالفعل؟ <span className="text-[#C9A227] font-bold underline underline-offset-4">تسجيل الدخول</span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
