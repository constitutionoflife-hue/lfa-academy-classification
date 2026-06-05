import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { AxisSummary } from "./components/AxisSummary";

export default function ClassificationBPlanning() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/planning");
    const saved = appStorage.getItem("classificationB_planning");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.uploadedTrainingSessionPlan) {
          setUploadedFile(parsed.uploadedTrainingSessionPlan);
        }
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  const saveProgress = (file: any, noteVal: string) => {
    let percentage = 0;
    let status = "لم يبدأ";
    
    if (file) {
      percentage = 100;
      status = "مكتمل";
    } else if (noteVal.trim().length > 0) {
      percentage = 50;
      status = "مكتمل جزئيًا";
    }

    const dataToSave = {
      uploadedTrainingSessionPlan: file,
      notes: noteVal,
      completionPercentage: percentage,
      status: status,
      lastUpdated: new Date().toISOString(),
    };
    
    appStorage.setItem("classificationB_planning", JSON.stringify(dataToSave));
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { waitForAuth, getCurrentSession } = await import("./lib/auth");
        const user = await waitForAuth();
        const session = getCurrentSession();
        const uid = user ? user.uid : (session ? session.accountId : "anonymous");
        
        const fileData = await uploadFileAndReturnMetadata(file, uid, "classification-axes");
        setUploadedFile(fileData);
        saveProgress(fileData, notes);
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error("Upload failed", err);
        alert((err as any)?.message || "فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    saveProgress(null, notes);
  };

  const updateNotes = (val: string) => {
    setNotes(val);
    saveProgress(uploadedFile, val);
  };

  const percentage = uploadedFile ? 100 : 0;

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-24" dir="rtl">
      <AppHeader showBackToDashboard />

      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#022C22] text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-3 transition-all duration-300 ${showToast ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`}
      >
        <span className="material-symbols-outlined text-[#C9A227]">
          check_circle
        </span>
        تم حفظ المحور
      </div>

      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link to="/dashboard" className="hover:text-white transition-colors">
              لوحة الأكاديمية
            </Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">تصنيف B</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white">التخطيط</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/leadership"
          nextPath="/classification/b/organization"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الثاني: التخطيط
          </h1>
        </div>

        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                event_note
              </span>
              المحور 2 من 7
            </div>
            <div className="text-[#064E3B] font-bold">
              {percentage}% مكتمل
            </div>
          </div>
          <div className="h-2.5 w-full bg-[#E5DED0] rounded-full overflow-hidden text-right">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-1000"
              style={{ width: `${percentage || 5}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">نموذج حصة تدريبية</h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5DED0] p-8 space-y-6">
            {!uploadedFile ? (
              <label className="relative flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-3xl bg-gray-50/50 group hover:border-[#064E3B]/40 hover:bg-white transition-all cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.png"
                  onChange={handleFileUpload}
                />
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-md mb-6 text-[#64748B] group-hover:text-[#064E3B] group-hover:scale-110 transition-all border border-[#E5DED0]">
                  <span className="material-symbols-outlined text-4xl">
                    cloud_upload
                  </span>
                </div>
                <h3 className="font-black text-[#022C22] text-xl mb-6">
                  رفع الملف
                </h3>
              </label>
            ) : (
              <div className="bg-white border border-[#E5DED0] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border-r-4 border-r-green-500 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                    <span className="material-symbols-outlined text-3xl">task</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#022C22] mb-1">{uploadedFile.name}</h3>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">تم الرفع</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={removeFile} className="px-6 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-xs hover:bg-red-50 shadow-sm">
                    إلغاء الملف
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              2
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">خانة الملاحظات</h2>
          </div>
          <div className="bg-white rounded-3xl border border-[#E5DED0] p-8">
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="w-full h-32 p-4 bg-[#F6F1E7]/30 border border-[#E5DED0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 text-[#022C22] resize-none"
            />
          </div>
        </div>

        <AxisSummary
          title="ملخص محور التخطيط (تصنيف B)"
          icon="event_note"
          items={[
            { label: "نموذج تخطيط حصة تدريبية (ملف مرفوع)", isActive: !!uploadedFile },
          ]}
          percentage={percentage}
          status={percentage === 100 ? "مكتمل" : percentage > 0 ? "مكتمل جزئيًا" : "لم يبدأ"}
          subTitle={uploadedFile ? "تم رفع نموذج تخطيط الحصة التدريبية بنجاح" : "يرجى رفع نموذج تخطيط حصة تدريبية لإكمال هذا المحور"}
          backLink="/dashboard"
          onSave={() => saveProgress(uploadedFile, notes)}
        >
          <Link
            to="/classification/b/leadership"
            className="px-6 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            السابق: القيادة
          </Link>
          <button
            onClick={() => saveProgress(uploadedFile, notes)}
            className="px-6 py-3.5 bg-[#C9A227] text-white hover:bg-[#B38D1F] rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            حفظ التقدم
          </button>
          <Link
            to="/classification/b/organization"
            className="px-6 py-3.5 bg-[#064E3B] text-white hover:bg-[#022C22] rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
          >
            التالي: التنظيم
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
        </AxisSummary>
      </main>
    </div>
  );
}
