import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { AxisSummary } from "./components/AxisSummary";

const CONDITIONS = [
  {
    id: "a_planning_playing_philosophy",
    label: "هل توجد فلسفة لعب موحدة (هوية كروية) مكتوبة لجميع الفئات؟ (أسلوب اللعب الدفاعي والهجومي، المبادئ التكتيكية الأساسية، القيم السلوكية، الجانب الذهني)",
    evidence: "نسخة (توقيع المالك والمشرف الفني)"
  },
  {
    id: "a_planning_annual_training_curriculum",
    label: "هل يوجد منهاج تدريبي عام سنوي؟",
    evidence: "نسخة ومناقشة"
  },
  {
    id: "a_planning_weekly_planning_template",
    label: "هل يوجد نموذج تخطيط أسبوعي؟",
    evidence: "نسخة ومناقشة"
  },
  {
    id: "a_planning_session_plan_template",
    label: "هل يوجد نموذج تخطيط لحصة تدريبية؟",
    evidence: "نسخة ومناقشة"
  },
  {
    id: "a_planning_coach_development_program",
    label: "هل يوجد برنامج تطوير للمدربين في الأكاديمية؟",
    evidence: "نسخة ومناقشة"
  }
];

export default function ClassificationAPlanning() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({});
  const [notes, setNotes] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/planning");
    const saved = appStorage.getItem("classificationA_planning");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        const newData = { ...parsed };
        // Migrate old field to new ID if present and new ID is empty
        if (parsed.uploadedTrainingSessionPlan && !parsed.a_planning_session_plan_template) {
          newData.a_planning_session_plan_template = parsed.uploadedTrainingSessionPlan;
        }
        
        setData(newData);
        if (parsed.notes) setNotes(parsed.notes);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  const saveProgress = (currentData: any, noteVal: string) => {
    let completed = 0;
    CONDITIONS.forEach(c => {
      const hasKey = `has_${c.id}`;
      if (currentData[hasKey] === false) {
        completed++;
      } else if (currentData[hasKey] === true && currentData[c.id]) {
        completed++;
      }
    });

    let percentage = Math.round((completed / CONDITIONS.length) * 100);
    let status = "لم يبدأ";
    
    if (percentage === 100) {
      status = "مكتمل";
    } else if (percentage > 0 || noteVal.trim().length > 0) {
      status = "مكتمل جزئيًا";
    }

    const dataToSave = {
      ...currentData,
      notes: noteVal,
      completionPercentage: percentage,
      status: status,
      lastUpdated: new Date().toISOString(),
    };
    
    appStorage.setItem("classificationA_planning", JSON.stringify(dataToSave));
    appStorage.setItem("selectedApplicationType", "A");
    appStorage.setItem("applicationStarted", "true");
  };

  const handleYesNo = (conditionId: string, value: boolean) => {
    const newData = { ...data, [`has_${conditionId}`]: value };
    // If they change to No, optionally we could clear the file, but we can just leave it in data so it doesn't get lost
    setData(newData);
    saveProgress(newData, notes);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, conditionId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setUploadingId(conditionId);
        const { waitForAuth } = await import("./lib/auth");
        const user = await waitForAuth();
        if (!user) {
          setUploadingId(null);
          return;
        }
        
        const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        
        const newData = { ...data, [conditionId]: fileData };
        setData(newData);
        saveProgress(newData, notes);
        
        setUploadingId(null);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error("Upload failed", err);
        setUploadingId(null);
        alert((err as any)?.message || "فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const removeFile = (conditionId: string) => {
    const newData = { ...data };
    delete newData[conditionId];
    setData(newData);
    saveProgress(newData, notes);
  };

  const updateNotes = (val: string) => {
    setNotes(val);
    saveProgress(data, val);
  };

  let completedCount = 0;
  CONDITIONS.forEach(c => {
    const hasKey = `has_${c.id}`;
    if (data[hasKey] === false) {
      completedCount++;
    } else if (data[hasKey] === true && data[c.id]) {
      completedCount++;
    }
  });
  const percentage = Math.round((completedCount / CONDITIONS.length) * 100) || 0;

  const renderCondition = (condition: typeof CONDITIONS[0], index: number) => {
    const uploadedFile = data[condition.id];
    const isUploading = uploadingId === condition.id;
    const hasKey = `has_${condition.id}`;
    const hasCondition = data[hasKey];

    return (
      <div key={condition.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono shrink-0">
            {index + 1}
          </div>
          <h2 className="text-xl font-bold text-[#022C22]">{condition.label}</h2>
        </div>

        <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <p className="font-bold text-[#022C22] mb-1">هل يتوفر هذا المتطلب؟</p>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => handleYesNo(condition.id, true)} 
                className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasCondition === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
              >نعم</button>
              <button 
                onClick={() => handleYesNo(condition.id, false)} 
                className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasCondition === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-500/30"}`}
              >كلا</button>
            </div>
          </div>
          {hasCondition === false && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
              <span className="material-symbols-outlined text-red-600">warning</span>
              <p className="text-sm text-red-800 leading-relaxed font-bold">عدم توفر هذا المتطلب يعني أن هذا المحور قد يكون غير مكتمل.</p>
            </div>
          )}
          {hasCondition === true && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">الدليل المطلوب</div>
                    <p className="font-bold text-[#C9A227]">{condition.evidence}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {!uploadedFile ? (
                  <label className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed border-[#E5DED0] rounded-3xl ${isUploading ? "bg-gray-100 opacity-75" : "bg-gray-50/50 hover:border-[#064E3B]/40 hover:bg-white"} transition-all cursor-pointer group`}>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.png"
                      onChange={(e) => handleFileUpload(e, condition.id)}
                      disabled={isUploading}
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-4xl text-[#C9A227] animate-spin mb-4">progress_activity</span>
                        <span className="font-bold text-[#022C22]">جاري الرفع...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 text-[#64748B] group-hover:text-[#064E3B] group-hover:scale-110 transition-all border border-[#E5DED0]">
                          <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                        </div>
                        <h3 className="font-bold text-[#022C22] text-lg mb-2">رفع الملف</h3>
                        <p className="text-sm font-bold text-[#64748B]">JPG, PNG, PDF</p>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="bg-white border border-[#E5DED0] rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm border-r-4 border-r-green-500 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                        <span className="material-symbols-outlined text-3xl">task</span>
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <h3 className="font-bold text-[#022C22] mb-1 truncate">{uploadedFile.name}</h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-md">تم الرفع الجاهز</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => removeFile(condition.id)} className="px-6 py-2.5 bg-white border border-red-100 text-red-500 rounded-xl font-bold text-xs hover:bg-red-50 shadow-sm shrink-0">
                        إلغاء الملف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

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
            <span className="text-white font-bold">تصنيف A</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white">التخطيط</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/leadership"
          nextPath="/classification/a/organization"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
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

        {CONDITIONS.map((condition, index) => renderCondition(condition, index))}

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              6
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">خانة الملاحظات</h2>
          </div>
          <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 shadow-sm">
            <textarea
              value={notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="w-full h-32 p-4 bg-[#F6F1E7]/30 border border-[#E5DED0] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#064E3B]/20 text-[#022C22] resize-none font-bold"
            />
          </div>
        </div>

        <AxisSummary
          title="ملخص محور التخطيط"
          icon="event_note"
          items={CONDITIONS.map(c => ({
            label: c.label,
            isActive: data[`has_${c.id}`] === false || (data[`has_${c.id}`] === true && !!data[c.id]),
          }))}
          percentage={percentage}
          status={percentage === 100 ? "مكتمل" : percentage >= 50 ? "مكتمل جزئيًا" : percentage > 0 ? "قيد التعبئة" : "لم يبدأ"}
          subTitle={`${completedCount} من ${CONDITIONS.length} متطلبات مكتملة`}
          backLink="/dashboard"
          onSave={() => saveProgress(data, notes)}
        >
          <Link
            to="/classification/a/leadership"
            className="px-6 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            السابق: القيادة
          </Link>
          <button
            onClick={() => saveProgress(data, notes)}
            className="px-6 py-3.5 bg-[#C9A227] text-white hover:bg-[#B38D1F] rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            حفظ التقدم
          </button>
          <Link
            to="/classification/a/organization"
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

