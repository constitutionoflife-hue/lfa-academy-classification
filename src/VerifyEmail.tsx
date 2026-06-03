import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { verifyEmail, resendVerificationCode, getRegisteredAccounts } from "./lib/auth";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugCode, setDebugCode] = useState<string | undefined>("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get("email");
    const debugParam = params.get("debug");
    if (emailParam) {
      setEmail(emailParam);
      if (debugParam) setDebugCode(debugParam);
    } else {
      navigate("/signin");
    }
  }, [location, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (code.length !== 6) {
      setError("الرمز يجب أن يتكون من 6 أرقام.");
      return;
    }

    const result = await verifyEmail(email, code);
    if (result.success) {
      setSuccess("تم تأكيد البريد الإلكتروني بنجاح.");
      setTimeout(() => {
        navigate("/academy-profile");
      }, 1500);
    } else {
      setError(result.error || "خطأ غير متوقع.");
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    const result = await resendVerificationCode(email);
    if (result.success) {
      setSuccess("تم إرسال رمز تحقق جديد.");
      if (result.code) setDebugCode(result.code);
    } else {
      setError(result.error || "فشل في إرسال الرمز.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F1E7] p-4 lg:p-8" dir="rtl">
      <div className="w-full max-w-[500px]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#064E3B] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="material-symbols-outlined text-4xl md:text-5xl text-[#C9A227]">verified_user</span>
          </div>
          <h1 className="font-display-md text-3xl font-bold text-[#022C22] mb-3">تأكيد البريد الإلكتروني</h1>
          <p className="text-[#64748B]">أدخل رمز التحقق المرسل إلى {email} لإكمال إنشاء الحساب.</p>
        </div>

        <div className="bg-[#FFFDF7] p-6 md:p-10 rounded-3xl shadow-xl border border-[#E5DED0]">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-center font-label-md text-[#111827] mb-6">رمز التحقق (6 أرقام)</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full text-center tracking-[1em] text-2xl font-bold bg-white border border-[#E5DED0] rounded-xl px-4 py-4 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                placeholder="000000"
                dir="ltr"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-bold text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-green-600 text-sm font-bold text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#064E3B] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#022C22] transition-all shadow-md"
            >
              تأكيد الرمز
            </button>

            <div className="flex flex-col gap-4 text-center pt-2">
              <button
                type="button"
                onClick={handleResend}
                className="text-[#64748B] hover:text-[#064E3B] transition-colors text-sm font-bold"
              >
                إعادة إرسال الرمز
              </button>
              <Link to="/signin" className="text-[#C9A227] hover:underline text-sm font-bold">
                الرجوع لتسجيل الدخول
              </Link>
            </div>
          </form>

          {/* Development Debug Tool */}
          {debugCode && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 font-bold mb-1">تنبيه المطور:</p>
              <p className="text-xs text-amber-700">تم إنشاء رمز تحقق تجريبي لأغراض الاختبار: <span className="font-black text-sm select-all">{debugCode}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
