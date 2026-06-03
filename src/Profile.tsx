import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import AppHeader from "./components/AppHeader";
import { useAuth } from "./lib/AuthContext";
import { saveSession, clearSession, updateAccountProfile, waitForAuth } from "./lib/auth";
import { doc, getDoc, deleteDoc, getDocs, collection } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { AcademyAccount } from "./types";
import { compressImage } from "./lib/imageUtils";
import { NATIONALITIES, COUNTRY_CODES } from "./lib/constants";

export default function Profile() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    academyName: "",
    governorate: "",
    district: "",
    nationality: "لبنانية",
    phoneCode: "+961",
    academyPhone: "",
    academyEmail: "",
    approvedStadiumName: "",
    loginEmail: "",
    academyLogo: null as string | null,
  });

  const [isLoading, setIsLoading] = useState(false);

  const { user, isAdmin } = useAuth();
  const isAdminView = isAdmin && localStorage.getItem("adminViewUid") !== null;

  useEffect(() => {
    if (session) {
      const fetchProfile = async () => {
        try {
          const user = await waitForAuth();
          if (!user) {
            console.warn("User is not authenticated with Firebase");
            return;
          }
          const adminViewUid = session?.isAdmin ? localStorage.getItem("adminViewUid") : null;
          const targetUid = adminViewUid || user.uid;
          const userDoc = await getDoc(doc(db, 'users', targetUid));
          if (userDoc.exists()) {
            const account = userDoc.data() as AcademyAccount;
            
            let pCode = "+961";
            let pNum = account.academyPhone || "";
            
            // Try to match country code
            for (const c of COUNTRY_CODES) {
              if (pNum.startsWith(c.code)) {
                pCode = c.code;
                pNum = pNum.substring(c.code.length);
                break;
              }
            }

            setFormData({
              academyName: account.academyName || "",
              governorate: account.governorate || "",
              district: account.district || "",
              nationality: account.nationality || "لبنانية",
              phoneCode: pCode,
              academyPhone: pNum,
              academyEmail: account.academyEmail || "",
              approvedStadiumName: account.approvedStadiumName || "",
              loginEmail: account.loginEmail || "",
              academyLogo: account.academyLogo || null,
            });
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      };
      fetchProfile();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const compressed = await compressImage(base64, 400, 400, 0.6);
            setFormData((prev) => ({ ...prev, academyLogo: compressed }));
          } catch (err) {
            console.error("Compression failed", err);
            setFormData((prev) => ({ ...prev, academyLogo: base64 }));
          }
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsLoading(false);
      }
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      setIsLoading(true);
      try {
        const updateData = {
          ...formData,
          academyPhone: `${formData.phoneCode}${formData.academyPhone}`
        };

        const result = await updateAccountProfile(user.uid, updateData);
        
        if (result.success) {
          try {
            localStorage.setItem("academyBasicInfo", JSON.stringify({ ...updateData, id: user.uid }));
          } catch(storageErr) {
            console.warn(storageErr);
          }
          
          setIsSuccess(true);
          setTimeout(() => setIsSuccess(false), 3000);
        } else {
          console.error("[DEBUG] Exact error during save:", result.error);
          alert('تعذر حفظ التغييرات: ' + (result.error || 'يرجى المحاولة مجددًا'));
        }
      } catch (err: any) {
        console.error("[DEBUG] Uncaught error in handleUpdate:", err);
        alert('حدث خطأ أثناء الاتصال بالخادم. ' + err.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (user) {
      setIsLoading(true);
      try {
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

        // Delete from Firestore
        await deleteDoc(doc(db, 'users', user.uid));
        
        // Delete auth account (requires recent login usually, but for this applet we just clear local)
        try {
            await user.delete();
        } catch (e) {
            console.warn("Auth deletion failed (likely needs recent login):", e);
        }
      } finally {
        setIsLoading(false);
        if (user?.email) {
          import("./lib/appStorage").then(({ clearStorageForEmail }) => {
            clearStorageForEmail(user.email!);
          }).catch(() => {});
        }
        localStorage.removeItem("academyBasicInfo");
        localStorage.removeItem("applicationStarted");
        const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith("classification"));
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        clearSession();
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] flex flex-col" dir="rtl">
      <AppHeader />

      <main className="flex-1 p-4 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#064E3B] mb-8 font-bold transition-all"
          >
            <span className="material-symbols-outlined rotate-180">arrow_forward</span>
            العودة للوحة الأكاديمية
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-[32px] shadow-sm border border-[#E5DED0] overflow-hidden">
            <div className="p-8 md:p-10 border-b border-[#E5DED0] bg-[#064E3B] text-white">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-28 h-28 bg-white rounded-[32px] border-4 border-white/20 flex items-center justify-center shadow-2xl relative overflow-hidden shrink-0">
                    {formData.academyLogo ? (
                      <img src={formData.academyLogo} alt="Academy Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[#C9A227] text-6xl">domain</span>
                    )}
                  </div>
                  <UploadTrigger className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#C9A227] text-[#022C22] rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-[#064E3B]" accept="image/*" onFileSelect={handleLogoUpload}><span className="material-symbols-outlined text-xl">photo_camera</span></UploadTrigger>
                </div>
                <div className="text-center md:text-right">
                  <h1 className="text-3xl font-bold mb-1">{formData.academyName || "الأكاديمية"}</h1>
                  <p className="opacity-70 font-medium">{formData.loginEmail}</p>
                  <p className="text-[10px] bg-white/20 inline-block px-2 py-0.5 rounded-full mt-2 font-bold uppercase tracking-widest leading-none">Academy Profile</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#022C22] mb-2">اسم الأكاديمية</label>
                    <input 
                      type="text" 
                      name="academyName"
                      value={formData.academyName}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-2">المحافظة</label>
                    <select 
                      name="governorate"
                      value={formData.governorate}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all appearance-none"
                    >
                      <option value="محافظة بيروت">محافظة بيروت</option>
                      <option value="محافظة جبل لبنان">محافظة جبل لبنان</option>
                      <option value="محافظة الشمال">محافظة الشمال</option>
                      <option value="محافظة عكار">محافظة عكار</option>
                      <option value="محافظة البقاع">محافظة البقاع</option>
                      <option value="محافظة بعلبك الهرمل">محافظة بعلبك الهرمل</option>
                      <option value="محافظة الجنوب">محافظة الجنوب</option>
                      <option value="محافظة النبطية">محافظة النبطية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-2">المنطقة / القضاء</label>
                    <input 
                      type="text" 
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-2">الجنسية</label>
                    <select 
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all appearance-none"
                    >
                      {NATIONALITIES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-2 text-right">رقم الهاتف</label>
                    <div className="flex flex-row-reverse gap-2">
                       <select 
                        name="phoneCode"
                        value={formData.phoneCode}
                        onChange={handleChange}
                        className="w-1/3 bg-white border border-[#E5DED0] rounded-xl px-1 py-3 outline-none focus:border-[#C9A227] transition-all appearance-none text-center text-xs font-bold"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <input 
                        type="tel" 
                        name="academyPhone"
                        dir="ltr"
                        value={formData.academyPhone}
                        onChange={handleChange}
                        className="flex-1 bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] transition-all text-right font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-2 text-right">البريد الإلكتروني العام</label>
                    <input 
                      type="email" 
                      name="academyEmail"
                      dir="ltr"
                      value={formData.academyEmail}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all text-right"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#022C22] mb-2">اسم الملعب المعتمِد</label>
                    <input 
                      type="text" 
                      name="approvedStadiumName"
                      value={formData.approvedStadiumName}
                      onChange={handleChange}
                      className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition-all"
                    />
                  </div>
                </div>

                {!isAdminView && (
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#E5DED0]">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full sm:w-auto px-12 py-4 bg-[#064E3B] text-white rounded-xl font-bold text-lg hover:bg-[#022C22] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          جاري الحفظ...
                        </>
                      ) : 'حفظ التغييرات'}
                    </button>
                    {isSuccess && (
                      <span className="text-green-600 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="material-symbols-outlined">check_circle</span>
                        تم تحديث البيانات بنجاح
                      </span>
                    )}
                  </div>
                )}
              </form>

              {!isAdminView && (
                <div className="mt-16 pt-8 border-t border-red-100 bg-red-50/30 -mx-8 md:-mx-10 px-8 md:px-10 pb-8 md:pb-10 rounded-b-[32px]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-red-700 mb-1">حذف الحساب</h3>
                    <p className="text-red-600 text-sm max-w-2xl leading-relaxed font-medium">
                      تحذير: سيؤدي حذف الحساب إلى مسح جميع البيانات المسجلة، بما في ذلك سجل الأشخاص والمستندات المرفوعة. هذا الإجراء لا يمكن التراجع عنه.
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-8 py-3.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-sm shrink-0"
                    >
                      طلب حذف الحساب
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={handleDeleteAccount}
                        className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg"
                      >
                        تأكيد الحذف النهائي
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
