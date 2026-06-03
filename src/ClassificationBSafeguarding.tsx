import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

export default function ClassificationBSafeguarding() {
  const navigate = useNavigate();

  // State for axis data
  const [hasChildProtectionPolicy, setHasChildProtectionPolicy] = useState<
    boolean | null
  >(null);
  const [childProtectionPolicyFile, setChildProtectionPolicyFile] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [safeguardingNotes, setSafeguardingNotes] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/safeguarding");

    const saved = appStorage.getItem("classificationB_safeguarding");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasChildProtectionPolicy !== undefined)
          setHasChildProtectionPolicy(parsed.hasChildProtectionPolicy);
        if (parsed.childProtectionPolicyFile)
          setChildProtectionPolicyFile(parsed.childProtectionPolicyFile);
        if (parsed.policyConfirmed !== undefined)
          setPolicyConfirmed(parsed.policyConfirmed);
        if (parsed.safeguardingNotes)
          setSafeguardingNotes(parsed.safeguardingNotes);
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  const saveProgress = (currentData: Record<string, any>) => {
    const prog = calculateCompletion(currentData);
    const dataToSave = {
      ...currentData,
      completionPercentage: prog.percentage,
      status: prog.status,
      lastUpdated: new Date().toISOString(),
    };
    appStorage.setItem(
      "classificationB_safeguarding",
      JSON.stringify(dataToSave),
    );
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
  };

  const calculateCompletion = (
    currentData: any = {
      hasChildProtectionPolicy,
      childProtectionPolicyFile,
      policyConfirmed,
    },
  ) => {
    const required = [
      currentData.hasChildProtectionPolicy === true,
      currentData.childProtectionPolicyFile !== null,
      currentData.policyConfirmed === true,
    ];

    const metCount = required.filter(Boolean).length;
    const totalRequired = required.length;
    const percentage =
      totalRequired > 0 ? Math.round((metCount / totalRequired) * 100) : 0;

    let status = "لم يبدأ";
    if (percentage === 100) status = "مكتمل";
    else if (percentage >= 50) status = "مكتمل جزئيًا";
    else if (percentage > 0) status = "قيد التعبئة";

    return { percentage, status };
  };

  const handleUpdate = (updates: Partial<any>) => {
    const currentData = {
      hasChildProtectionPolicy,
      childProtectionPolicyFile,
      policyConfirmed,
      safeguardingNotes,
      ...updates,
    };
    saveProgress(currentData);
  };

  const progress = calculateCompletion();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { waitForAuth } = await import("./lib/auth");
                const user = await waitForAuth();
        if (!user) return;
        
        const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        setChildProtectionPolicyFile(fileData as any);
        handleUpdate({ childProtectionPolicyFile: fileData as any });
      } catch (err) {
        console.error("Upload failed", err);
        alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const policyItems = [
    "منع العنف الجسدي أو اللفظي",
    "منع التنمر والتمييز",
    "احترام خصوصية الطفل",
    "آلية واضحة للإبلاغ عن المخالفات",
    "تحديد شخص مسؤول داخل الأكاديمية عند الحاجة",
  ];

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-24" dir="rtl">
      <AppHeader showBackToDashboard />

      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#022C22] text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-3 transition-all duration-300 ${showToast ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`}
      >
        <span className="material-symbols-outlined text-[#C9A227]">
          check_circle
        </span>
        تم حفظ محور الرعاية والتعليم لتصنيف B كمسودة
      </div>

      {/* Breadcrumbs */}
      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link
              to="/dashboard"
              className="hover:text-white transition-colors"
            >
              لوحة الأكاديمية
            </Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">تصنيف B</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white text-xs opacity-70">
              الرعاية والتعليم
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/facilities"
          nextPath="/classification/b/equipment"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#064E3B]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            تصنيف B - المحور السادس: الرعاية والتعليم
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور مدى التزام الأكاديمية بتوفير بيئة آمنة للأطفال من
            خلال وجود سياسة مكتوبة لحماية الطفل.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                health_and_safety
              </span>
              المحور 6 من 7
            </div>
            <div className="text-[#064E3B] font-bold">
              {progress.percentage}% مكتمل
            </div>
          </div>
          <div className="h-2.5 w-full bg-[#E5DED0] rounded-full overflow-hidden text-right">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-1000"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Section 1: Child Protection */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">حماية الطفل</h2>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد سياسة مكتوبة لحماية الطفل؟
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setHasChildProtectionPolicy(true);
                    handleUpdate({ hasChildProtectionPolicy: true });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasChildProtectionPolicy === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
                >
                  نعم
                </button>
                <button
                  onClick={() => {
                    setHasChildProtectionPolicy(false);
                    handleUpdate({ hasChildProtectionPolicy: false });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasChildProtectionPolicy === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
                >
                  كلا
                </button>
              </div>
            </div>

            {hasChildProtectionPolicy === false && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
                <p className="text-sm text-red-800 leading-relaxed font-bold">
                  عدم وجود سياسة مكتوبة لحماية الطفل يعني أن محور الرعاية
                  والتعليم غير مكتمل. يجب على الأكاديمية إعداد سياسة واضحة
                  لحماية الطفل ورفع نسخة عنها ضمن الملف.
                </p>
              </div>
            )}

            {hasChildProtectionPolicy === true && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                        الشرط
                      </div>
                      <p className="font-bold text-[#022C22]">
                        وجود سياسة مكتوبة لحماية الطفل
                      </p>
                    </div>
                    <div className="md:text-left">
                      <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                        الدليل المطلوب
                      </div>
                      <p className="font-bold text-[#C9A227]">
                        نسخة عن السياسة
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#022C22]">
                        رفع سياسة حماية الطفل
                      </h4>
                      <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                        PDF, JPG, PNG
                      </div>
                    </div>
                    {!childProtectionPolicyFile ? (
                      <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 hover:bg-white hover:border-[#064E3B]/30 transition-all cursor-pointer group h-[200px]">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.png"
                          onChange={handleFileUpload}
                        />
                        <span className="material-symbols-outlined text-4xl text-[#64748B] group-hover:text-[#064E3B] mb-2 transition-colors">
                          upload_file
                        </span>
                        <span className="text-sm font-bold text-[#022C22]">
                          اضغط للرفع
                        </span>
                        <p className="text-[10px] text-[#64748B] mt-1 text-center font-medium">
                          يرجى رفع نسخة مكتوبة وواضحة عن سياسة حماية الطفل
                        </p>
                      </label>
                    ) : (
                      <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex items-center justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                            <span className="material-symbols-outlined">
                              verified_user
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[#022C22] truncate max-w-[150px]">
                              {childProtectionPolicyFile.name}
                            </div>
                            <div className="text-[10px] text-green-600 font-bold">
                              تم الرفع
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setChildProtectionPolicyFile(null);
                              handleUpdate({ childProtectionPolicyFile: null });
                            }}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-50"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              delete
                            </span>
                          </button>
                          <label className="p-2.5 text-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl transition-colors cursor-pointer border border-[#064E3B]/10">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.png"
                              onChange={handleFileUpload}
                            />
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 pt-4">
                    <label
                      className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${policyConfirmed ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-gray-50/50 border-[#E5DED0] hover:border-gray-200"}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${policyConfirmed ? "bg-[#064E3B] border-[#064E3B] text-white" : "bg-white border-gray-300"}`}
                      >
                        {policyConfirmed && (
                          <span className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={policyConfirmed}
                        onChange={(e) => {
                          setPolicyConfirmed(e.target.checked);
                          handleUpdate({ policyConfirmed: e.target.checked });
                        }}
                      />
                      <div className="space-y-1">
                        <p className="font-bold text-[#022C22] text-sm leading-relaxed">
                          {policyConfirmed
                            ? "تم التأكيد"
                            : "أؤكد أن السياسة مكتوبة ومعتمدة داخل الأكاديمية."}
                        </p>
                      </div>
                    </label>

                    <div className="space-y-2">
                      <label className="font-bold text-[#022C22] text-sm">
                        ملاحظات حول سياسة حماية الطفل
                      </label>
                      <textarea
                        value={safeguardingNotes}
                        onChange={(e) => {
                          setSafeguardingNotes(e.target.value);
                          handleUpdate({ safeguardingNotes: e.target.value });
                        }}
                        placeholder="مثال: يتم شرح السياسة للمدربين والإداريين قبل بداية الموسم."
                        className="w-full p-4 rounded-2xl border border-[#E5DED0] bg-gray-50 focus:bg-white focus:border-[#064E3B] outline-none transition-all resize-none h-24 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Policy Content */}
        <section className="space-y-6">
          <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#C9A227]/10 text-[#C9A227] rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined">info</span>
              </div>
              <h2 className="text-xl font-bold text-[#022C22]">
                ماذا يجب أن تتضمن سياسة حماية الطفل؟
              </h2>
            </div>

            <p className="text-[#64748B] mb-8 leading-relaxed">
              يفضّل أن تتضمن السياسة قواعد واضحة لحماية اللاعبين من العنف،
              الإساءة، التنمر، التمييز، وآلية واضحة للإبلاغ عن أي مخالفة داخل
              الأكاديمية.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {policyItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-sm"
                >
                  <span className="material-symbols-outlined text-[#064E3B] text-[20px]">
                    check_circle
                  </span>
                  <span className="text-sm font-bold text-[#022C22]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الرعاية والتعليم"
          icon="shield"
          percentage={progress.percentage}
          status={progress.status}
          subTitle="تصنيف B - المحور السادس"
          backLink="/dashboard"
          items={[
            {
              label: "وجود سياسة حماية الطفل",
              isActive: hasChildProtectionPolicy === true,
            },
            {
              label: "رفع نسخة السياسة",
              isActive: !!childProtectionPolicyFile,
            },
            { label: "اعتماد السياسة", isActive: policyConfirmed },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/b/facilities"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
              السابق: الملعب والمرافق
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-gray-500 hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/b/equipment"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 group"
            >
              التالي: المعدات والتجهيزات
              <span className="material-symbols-outlined text-[20px] rotate-180">
                arrow_forward
              </span>
            </Link>
          </div>
        </AxisSummary>
      </main>
    </div>
  );
}
