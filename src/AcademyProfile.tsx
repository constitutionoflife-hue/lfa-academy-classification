import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { updateAccountProfile } from "./lib/auth";
import { useAuth } from "./lib/AuthContext";
import { doc, getDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { compressImage } from "./lib/imageUtils";
import { NATIONALITIES, COUNTRY_CODES } from "./lib/constants";

export default function AcademyProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");

  const [formData, setFormData] = useState({
    academyName: "",
    governorate: "",
    district: "",
    nationality: "لبنانية",
    phoneCode: "+961",
    academyPhone: "",
    academyEmail: "",
    academyLogo: null as any,
    approvedStadiumName: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { waitForAuth, clearSession } = await import("./lib/auth");
      const user = await waitForAuth();
      if (!user) return;

      // Delete progress subcollection
      const progressRef = collection(db, 'users', user.uid, 'progress');
      const progressDocs = await getDocs(progressRef);
      const progressDeletePromises = progressDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(progressDeletePromises);

      // Delete reviews subcollection
      const reviewsRef = collection(db, 'users', user.uid, 'adminReviews');
      const reviewsDocs = await getDocs(reviewsRef);
      const reviewsDeletePromises = reviewsDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(reviewsDeletePromises);

      await deleteDoc(doc(db, "users", user.uid));
      
      if (user) {
        try {
          await user.delete();
        } catch (e) {
          console.warn("Auth deletion failed:", e);
        }
      }
      clearSession();
      navigate("/");
    } catch (err: any) {
      console.error(err);
      alert("تعذر حذف الحساب: " + err.message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const { user, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setEmail(user.email || "");
      setFormData(prev => ({ ...prev, loginEmail: user.email }));
    } else {
      navigate("/signup");
    }
  }, [user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert("يرجى رفع صورة فقط بصيغة JPG أو PNG أو WEBP");
       e.target.value = '';
       return;
    }

    setIsLoading(true);
    try {
      const { waitForAuth, getCurrentSession } = await import("./lib/auth");
      const { uploadFileAndReturnMetadata } = await import("./lib/fileUpload");
      
      const user = await waitForAuth();
      const session = getCurrentSession();
      const uid = user ? user.uid : (session ? session.accountId : "anonymous");
      
      const fileData = await uploadFileAndReturnMetadata(file, uid, "academy-logo");
      
      // Save full file object to form data, so we don't just save a blob or base64.
      setFormData(prev => ({ ...prev, academyLogo: fileData }));
      setLogoPreview(fileData.preview || fileData.downloadURL || fileData.url);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Logo upload failed:", err);
      alert("تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, academyLogo: null }));
    setLogoPreview(null);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.academyName) newErrors.academyName = "اسم الأكاديمية مطلوب";
    if (!formData.governorate) newErrors.governorate = "المحافظة مطلوبة";
    if (!formData.district) newErrors.district = "المنطقة مطلوبة";
    if (!formData.academyPhone) newErrors.academyPhone = "رقم الهاتف مطلوب";
    if (!formData.approvedStadiumName) newErrors.approvedStadiumName = "اسم الملعب مطلوب";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.academyEmail) newErrors.academyEmail = "البريد العام مطلوب";
    else if (!emailRegex.test(formData.academyEmail)) newErrors.academyEmail = "بريد إلكتروني غير صالح";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("[DEBUG] handleSubmit failed: No authenticated user found");
          setErrors({ general: "يجب تسجيل الدخول أولاً." });
          return;
        }

        const _updateData = {
          academyName: formData.academyName,
          governorate: formData.governorate,
          district: formData.district,
          nationality: formData.nationality,
          academyPhone: `${formData.phoneCode}${formData.academyPhone}`,
          academyEmail: formData.academyEmail,
          approvedStadiumName: formData.approvedStadiumName,
          academyLogo: typeof formData.academyLogo === "object" && formData.academyLogo !== null && !Array.isArray(formData.academyLogo) && formData.academyLogo.downloadURL ? formData.academyLogo : (logoPreview || null)
        };

        console.log("[DEBUG] Save AcademyProfile Initiated");
        console.log("[DEBUG] Current User ID:", user.uid);
        console.log("[DEBUG] Payload before save:", JSON.stringify(_updateData));
        console.log("[DEBUG] Firestore Document Path:", `users/${user.uid}`);

        const result = await updateAccountProfile(user.uid, _updateData);

        console.log("[DEBUG] Save Result:", result);

        if (result.success) {
          try {
            // Save for registry logic compatibility
            localStorage.setItem("academyBasicInfo", JSON.stringify({
              ..._updateData,
              loginEmail: email
            }));
          } catch (storageErr) {
            console.warn("Could not save to localStorage:", storageErr);
          }

          navigate("/dashboard");
        } else {
          console.error("[DEBUG] Exact error during save:", result.error);
          setErrors({ general: result.error || "فشل في حفظ البيانات" });
        }
      } catch (err: any) {
        console.error("[DEBUG] Uncaught error in handleSubmit:", err);
        setErrors({ general: "تعذر الحفظ. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E7]" dir="rtl">
      {/* Top Banner with improved design */}
      <div className="w-full bg-gradient-to-b md:bg-gradient-to-r from-[#022C22] to-[#064E3B] p-8 lg:px-12 lg:pt-16 lg:pb-40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute bottom-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C9A227] to-transparent shadow-[0_0_20px_rgba(201,162,39,0.5)]"></div>
        
        <div className="relative z-10 w-full max-w-[1000px] mx-auto text-white text-right">
          <div className="flex flex-col items-start">
            <div className="bg-[#C9A227] text-[#022C22] px-5 py-1.5 rounded-full font-black text-xs mb-6 inline-block shadow-lg">الخطوة الثانية</div>
            <h1 className="font-display-md text-4xl md:text-6xl font-black mb-4 leading-tight tracking-tight">بيانات الأكاديمية</h1>
            <p className="font-body-lg text-white/80 max-w-2xl text-lg md:text-xl leading-relaxed">يرجى استكمال المعلومات الأساسية للأكاديمية لبدء عملية التصنيف.</p>
          </div>
        </div>
      </div>

      {/* Form Area with fixed visibility */}
      <div className="flex-1 w-full p-4 md:p-8 lg:pb-24 font-body-md relative -mt-4 lg:-mt-16 z-20">
        <div className="max-w-[800px] mx-auto w-full">
          <div className="bg-[#FFFDF7] p-8 md:p-12 rounded-[32px] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-[#E5DED0]">
            <form onSubmit={handleSubmit} className="space-y-10" noValidate>
              
              {errors.general && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined font-bold">error</span>
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 text-right">
                {/* Academy Name - Full Width */}
                <div className="md:col-span-2 pt-4">
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg font-bold">stadium</span>
                    اسم الأكاديمية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="academyName"
                    placeholder="مثال: أكاديمية النجوم لكرة القدم"
                    value={formData.academyName}
                    onChange={handleChange}
                    className={`w-full bg-white border-2 ${errors.academyName ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all shadow-[0_2px_4px_rgba(0,0,0,0.02)] font-bold text-[#022C22] placeholder:text-[#64748B]/40`}
                  />
                  {errors.academyName && <p className="text-red-500 text-xs mt-2 font-bold">{errors.academyName}</p>}
                </div>

                {/* Location Group */}
                <div>
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">map</span>
                    المحافظة <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleChange}
                      className={`w-full bg-white border-2 ${errors.governorate ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all appearance-none font-bold text-[#022C22]`}
                    >
                      <option value="">اختر المحافظة</option>
                      <option value="محافظة بيروت">محافظة بيروت</option>
                      <option value="محافظة جبل لبنان">محافظة جبل لبنان</option>
                      <option value="محافظة الشمال">محافظة الشمال</option>
                      <option value="محافظة عكار">محافظة عكار</option>
                      <option value="محافظة البقاع">محافظة البقاع</option>
                      <option value="محافظة بعلبك الهرمل">محافظة بعلبك الهرمل</option>
                      <option value="محافظة الجنوب">محافظة الجنوب</option>
                      <option value="محافظة النبطية">محافظة النبطية</option>
                    </select>
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">expand_more</span>
                  </div>
                  {errors.governorate && <p className="text-red-500 text-xs mt-2 font-bold">{errors.governorate}</p>}
                </div>

                <div>
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">public</span>
                    الجنسية <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className={`w-full bg-white border-2 border-[#E5DED0] rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all appearance-none font-bold text-[#022C22]`}
                    >
                      {NATIONALITIES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">location_on</span>
                    المنطقة / القضاء <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="district"
                    placeholder="مثال: صور"
                    value={formData.district}
                    onChange={handleChange}
                    className={`w-full bg-white border-2 ${errors.district ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all shadow-sm font-bold text-[#022C22]`}
                  />
                  {errors.district && <p className="text-red-500 text-xs mt-2 font-bold">{errors.district}</p>}
                </div>

                {/* Contact Group */}
                <div>
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">phone</span>
                    رقم هاتف الأكاديمية <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-row-reverse gap-2">
                    <div className="w-1/3 relative">
                      <select
                        name="phoneCode"
                        value={formData.phoneCode}
                        onChange={handleChange}
                        className="w-full bg-white border-2 border-[#E5DED0] rounded-2xl px-1 py-4 focus:border-[#C9A227] outline-none transition-all appearance-none font-bold text-[#022C22] text-center text-xs"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute left-1 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none text-[10px]">expand_more</span>
                    </div>
                    <input
                      type="tel"
                      name="academyPhone"
                      dir="ltr"
                      placeholder="70 000 000"
                      value={formData.academyPhone}
                      onChange={handleChange}
                      className={`flex-1 bg-white border-2 ${errors.academyPhone ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all text-right shadow-sm font-bold text-[#022C22]`}
                    />
                  </div>
                  {errors.academyPhone && <p className="text-red-500 text-xs mt-2 font-bold text-right">{errors.academyPhone}</p>}
                </div>

                <div>
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">alternate_email</span>
                    البريد الإلكتروني العام <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="academyEmail"
                    dir="ltr"
                    placeholder="example@academy.com"
                    value={formData.academyEmail}
                    onChange={handleChange}
                    className={`w-full bg-white border-2 ${errors.academyEmail ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all text-right shadow-sm font-bold text-[#022C22]`}
                  />
                  {errors.academyEmail && <p className="text-red-500 text-xs mt-2 font-bold text-right">{errors.academyEmail}</p>}
                </div>

                {/* Stadium Name */}
                <div className="md:col-span-2">
                  <label className="block text-[#022C22] font-black text-sm mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">sports_score</span>
                    اسم الملعب المعتمد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="approvedStadiumName"
                    value={formData.approvedStadiumName}
                    onChange={handleChange}
                    className={`w-full bg-white border-2 ${errors.approvedStadiumName ? 'border-red-500' : 'border-[#E5DED0]'} rounded-2xl px-5 py-4 focus:border-[#C9A227] outline-none transition-all shadow-sm font-bold text-[#022C22]`}
                  />
                  {errors.approvedStadiumName && <p className="text-red-500 text-xs mt-2 font-bold">{errors.approvedStadiumName}</p>}
                </div>

                {/* Logo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-[#022C22] font-black text-sm mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#C9A227] text-lg">photo_library</span>
                    شعار الأكاديمية
                  </label>
                  {!logoPreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#E5DED0] rounded-3xl cursor-pointer hover:bg-[#F6F1E7] hover:border-[#C9A227]/50 transition-all group bg-white/50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-16 h-16 bg-[#F6F1E7] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                          <span className="material-symbols-outlined text-[#C9A227] text-4xl">add_photo_alternate</span>
                        </div>
                        <p className="text-sm font-black text-[#022C22]">رفع شعار الأكاديمية</p>
                        <p className="text-xs text-[#64748B] mt-2">PNG, JPG حتى 5 ميغابايت</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  ) : (
                    <div className="p-6 bg-white rounded-3xl border-2 border-[#064E3B]/10 flex items-center justify-between shadow-sm animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-2xl border-2 border-[#E5DED0] overflow-hidden flex items-center justify-center p-2 shadow-sm">
                          <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#022C22]">تم رفع الشعار بنجاح</p>
                          <p className="text-xs text-[#64748B] mt-1">يمكنك الحذف لإعادة الرفع</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={removeLogo} 
                        className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-colors border border-red-100"
                        title="حذف الشعار"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#022C22] to-[#064E3B] text-white py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_15px_30px_rgba(2,44,34,0.3)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                   {isLoading ? (
                     <>
                       <span className="material-symbols-outlined animate-spin">sync</span>
                       جاري الحفظ...
                     </>
                   ) : (
                     <>
                       حفظ الملف والمتابعة
                       <span className="material-symbols-outlined">arrow_back</span>
                     </>
                   )}
                </button>
                <div className="text-center mt-6">
                  <p className="text-[#64748B] text-sm font-bold flex items-center justify-center gap-2 italic">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    سيتم استخدام هذه البيانات في جميع مستندات الأكاديمية الرسمية
                  </p>
                </div>
              </div>
            </form>
            
            <div className="mt-8 pt-8 border-t border-[#E5DED0]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-[#64748B]">إذا كنت ترغب في حذف الحساب نهائياً يمكنك القيام بذلك عبر الزر أدناه.</p>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  type="button"
                  className="px-6 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-red-100"
                >
                  حذف الحساب نهائياً
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-red-600">warning</span>
              </div>
              <h3 className="text-xl font-bold text-center text-[#022C22] mb-2">تأكيد حذف الحساب</h3>
              <p className="text-center text-[#64748B] mb-6">
                هل أنت متأكد من رغبتك في حذف الحساب نهائياً؟ 
                هذا الإجراء سيقوم بمسح كافة بياناتك ولن تتمكن من استعادتها.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      جاري الحذف...
                    </>
                  ) : 'نعم، احذف الحساب'}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-3.5 bg-gray-100 text-[#022C22] rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
