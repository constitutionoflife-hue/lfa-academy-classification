import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

export default function ClassificationBFacilities() {
  const navigate = useNavigate();

  // Section 1: Pitch
  const [hasLegalPitch, setHasLegalPitch] = useState<boolean | null>(null);
  const [pitchSize, setPitchSize] = useState<string>("");
  const [customPitchSize, setCustomPitchSize] = useState("");
  const [pitchDepth, setPitchDepth] = useState<string>("");
  const [pitchWidth, setPitchWidth] = useState<string>("");
  const [pitchName, setPitchName] = useState("");
  const [pitchLocation, setPitchLocation] = useState("");
  const [pitchNotes, setPitchNotes] = useState("");
  const [pitchContractFile, setPitchContractFile] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);

  // Section 2: Waiting Area
  const [hasWaitingAreaOrStand, setHasWaitingAreaOrStand] = useState<
    boolean | null
  >(null);
  const [waitingAreaPhotosFile, setWaitingAreaPhotosFile] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);
  const [waitingAreaConfirmed, setWaitingAreaConfirmed] = useState(false);
  const [waitingAreaDescription, setWaitingAreaDescription] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/facilities");

    const saved = appStorage.getItem("classificationB_facilities");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasLegalPitch !== undefined)
          setHasLegalPitch(parsed.hasLegalPitch);
        if (parsed.pitchSize) setPitchSize(parsed.pitchSize);
        if (parsed.customPitchSize) setCustomPitchSize(parsed.customPitchSize);
        if (parsed.pitchDepth) setPitchDepth(parsed.pitchDepth);
        if (parsed.pitchWidth) setPitchWidth(parsed.pitchWidth);
        if (parsed.pitchName) setPitchName(parsed.pitchName);
        if (parsed.pitchLocation) setPitchLocation(parsed.pitchLocation);
        if (parsed.pitchNotes) setPitchNotes(parsed.pitchNotes);
        if (parsed.pitchContractFile)
          setPitchContractFile(parsed.pitchContractFile);

        if (parsed.hasWaitingAreaOrStand !== undefined)
          setHasWaitingAreaOrStand(parsed.hasWaitingAreaOrStand);
        if (parsed.waitingAreaPhotosFile)
          setWaitingAreaPhotosFile(parsed.waitingAreaPhotosFile);
        if (parsed.waitingAreaConfirmed !== undefined)
          setWaitingAreaConfirmed(parsed.waitingAreaConfirmed);
        if (parsed.waitingAreaDescription)
          setWaitingAreaDescription(parsed.waitingAreaDescription);

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
      "classificationB_facilities",
      JSON.stringify(dataToSave),
    );
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
  };

  const calculateCompletion = (
    currentData: any = {
      hasLegalPitch,
      pitchDepth,
      pitchWidth,
      pitchContractFile,
      hasWaitingAreaOrStand,
      waitingAreaPhotosFile,
      waitingAreaConfirmed,
    },
  ) => {
    const required = [
      currentData.hasLegalPitch === true,
      currentData.pitchDepth !== "" && currentData.pitchWidth !== "",
      currentData.pitchContractFile !== null,
      currentData.hasWaitingAreaOrStand === true,
      currentData.waitingAreaPhotosFile !== null,
      currentData.waitingAreaConfirmed === true,
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
      hasLegalPitch,
      pitchSize,
      customPitchSize,
      pitchDepth,
      pitchWidth,
      pitchName,
      pitchLocation,
      pitchNotes,
      pitchContractFile,
      hasWaitingAreaOrStand,
      waitingAreaPhotosFile,
      waitingAreaConfirmed,
      waitingAreaDescription,
      ...updates,
    };
    saveProgress(currentData);
  };

  const progress = calculateCompletion();

  const handleFileUpload =
    (type: "contract" | "photos") =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const { waitForAuth } = await import("./lib/auth");
                    const user = await waitForAuth();
          if (!user) return;
          
          const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
          if (type === "contract") {
            setPitchContractFile(fileData as any);
            handleUpdate({ pitchContractFile: fileData as any });
          } else {
            setWaitingAreaPhotosFile(fileData as any);
            handleUpdate({ waitingAreaPhotosFile: fileData as any });
          }
        } catch (error) {
           console.error(error);
           alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
        }
      }
    };

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
        تم حفظ محور الملعب والمرافق الأخرى لتصنيف B كمسودة
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
              الملعب والمرافق الأخرى
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/technical"
          nextPath="/classification/b/safeguarding"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#064E3B]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            تصنيف B - المحور الخامس: الملعب والمرافق الأخرى
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور مدى توفر ملعب قانوني للتدريبات والمباريات، إضافة
            إلى وجود مساحة مناسبة لانتظار الأهالي أو متابعة المباريات والتمارين.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                stadium
              </span>
              المحور 5 من 7
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

        {/* Section 1: Pitch */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">الملعب</h2>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
            <div>
              <p className="font-bold text-[#022C22] mb-1">
                هل تمتلك الأكاديمية ملعبًا قانونيًا للمباريات؟
              </p>
              <p className="text-xs text-[#64748B] mb-4">
                يُقبل الملعب إذا كان بقياس 50×30 متر أو 70×45 متر.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setHasLegalPitch(true);
                    handleUpdate({ hasLegalPitch: true });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasLegalPitch === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
                >
                  نعم
                </button>
                <button
                  onClick={() => {
                    setHasLegalPitch(false);
                    handleUpdate({ hasLegalPitch: false });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasLegalPitch === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
                >
                  كلا
                </button>
              </div>
            </div>

            {hasLegalPitch === false && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
                <p className="text-sm text-red-800 leading-relaxed font-bold">
                  عدم توفر ملعب قانوني يعني أن محور الملعب والمرافق غير مكتمل،
                  لأن تصنيف B يتطلب وجود ملعب مناسب للتدريبات أو المباريات.
                </p>
              </div>
            )}

            {hasLegalPitch === true && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                        الشرط
                      </div>
                      <p className="font-bold text-[#022C22]">
                        توفر ملعب قانوني للمباريات بقياس 50×30 أو 70×45
                      </p>
                    </div>
                    <div className="md:text-left">
                      <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                        الدليل المطلوب
                      </div>
                      <p className="font-bold text-[#C9A227]">
                        عقد ملكية أو إيجار أو استثمار
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#022C22] text-sm">
                            الطول
                          </label>
                          <select
                            value={pitchDepth}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPitchDepth(val);
                              handleUpdate({
                                pitchDepth: val,
                                pitchSize:
                                  val && pitchWidth
                                    ? `${val}x${pitchWidth}`
                                    : pitchSize,
                              });
                            }}
                            className="w-full p-3.5 rounded-xl border border-[#E5DED0] outline-none focus:border-[#064E3B] transition-all text-sm bg-white"
                          >
                            <option value="">اختر الطول</option>
                            {Array.from(
                              { length: 12 },
                              (_, i) => 50 + i * 5,
                            ).map((depth) => (
                              <option key={depth} value={depth}>
                                {depth} متر
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-[#022C22] text-sm">
                            العرض
                          </label>
                          <select
                            value={pitchWidth}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPitchWidth(val);
                              handleUpdate({
                                pitchWidth: val,
                                pitchSize:
                                  val && pitchDepth
                                    ? `${pitchDepth}x${val}`
                                    : pitchSize,
                              });
                            }}
                            className="w-full p-3.5 rounded-xl border border-[#E5DED0] outline-none focus:border-[#064E3B] transition-all text-sm bg-white"
                          >
                            <option value="">اختر العرض</option>
                            {Array.from(
                              { length: 9 },
                              (_, i) => 30 + i * 5,
                            ).map((width) => (
                              <option key={width} value={width}>
                                {width} متر
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#022C22] text-sm">
                          اسم الملعب
                        </label>
                        <input
                          type="text"
                          value={pitchName}
                          onChange={(e) => {
                            setPitchName(e.target.value);
                            handleUpdate({ pitchName: e.target.value });
                          }}
                          placeholder="أدخل اسم الملعب"
                          className="w-full p-3.5 rounded-xl border border-[#E5DED0] outline-none focus:border-[#064E3B] transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="font-bold text-[#022C22] text-sm">
                          موقع الملعب
                        </label>
                        <input
                          type="text"
                          value={pitchLocation}
                          onChange={(e) => {
                            setPitchLocation(e.target.value);
                            handleUpdate({ pitchLocation: e.target.value });
                          }}
                          placeholder="أدخل موقع الملعب (المدينة أو المنطقة)"
                          className="w-full p-3.5 rounded-xl border border-[#E5DED0] outline-none focus:border-[#064E3B] transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#022C22]">
                        رفع عقد الملكية أو الإيجار أو الاستثمار
                      </h4>
                      <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                        PDF, JPG, PNG
                      </div>
                    </div>
                    {!pitchContractFile ? (
                      <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 hover:bg-white hover:border-[#064E3B]/30 transition-all cursor-pointer group h-[200px]">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.png"
                          onChange={handleFileUpload("contract")}
                        />
                        <span className="material-symbols-outlined text-4xl text-[#64748B] group-hover:text-[#064E3B] mb-2 transition-colors">
                          upload_file
                        </span>
                        <span className="text-sm font-bold text-[#022C22]">
                          اضغط للرفع
                        </span>
                        <p className="text-[10px] text-[#64748B] mt-1 text-center font-medium">
                          يرجى رفع نسخة واضحة من العقد
                        </p>
                      </label>
                    ) : (
                      <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex items-center justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                            <span className="material-symbols-outlined">
                              description
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-[#022C22] truncate max-w-[150px]">
                              {pitchContractFile.name}
                            </div>
                            <div className="text-[10px] text-green-600 font-bold">
                              تم الرفع الجاهز
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setPitchContractFile(null);
                              handleUpdate({ pitchContractFile: null });
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
                              onChange={handleFileUpload("contract")}
                            />
                            <span className="material-symbols-outlined text-[20px]">
                              edit_square
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold text-[#022C22] text-sm">
                    ملاحظات حول الملعب
                  </label>
                  <textarea
                    value={pitchNotes}
                    onChange={(e) => {
                      setPitchNotes(e.target.value);
                      handleUpdate({ pitchNotes: e.target.value });
                    }}
                    placeholder="أدخل أي ملاحظات إضافية هنا..."
                    className="w-full p-4 rounded-2xl border border-[#E5DED0] bg-gray-50 focus:bg-white focus:border-[#064E3B] outline-none transition-all resize-none h-24 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Waiting Area */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              2
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">
              القاعة أو المدرج
            </h2>
          </div>

          <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد قاعة أو باحة حيث يمكن للأهل الانتظار أو مدرج لمتابعة
                المباريات والتمارين؟
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setHasWaitingAreaOrStand(true);
                    handleUpdate({ hasWaitingAreaOrStand: true });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasWaitingAreaOrStand === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
                >
                  نعم
                </button>
                <button
                  onClick={() => {
                    setHasWaitingAreaOrStand(false);
                    handleUpdate({ hasWaitingAreaOrStand: false });
                  }}
                  className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasWaitingAreaOrStand === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
                >
                  كلا
                </button>
              </div>
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                      الشرط
                    </div>
                    <p className="font-bold text-[#022C22]">
                      وجود قاعة أو باحة انتظار للأهل أو مدرج لمتابعة المباريات
                      والتمارين
                    </p>
                  </div>
                  <div className="md:text-left">
                    <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                      الدليل المطلوب
                    </div>
                    <p className="font-bold text-[#C9A227]">
                      صور واضحة – زيارة ميدانية
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#022C22]">
                      رفع صور القاعة أو الباحة أو المدرج
                    </h4>
                    <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                      JPG, PNG, PDF
                    </div>
                  </div>
                  {!waitingAreaPhotosFile ? (
                    <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 hover:bg-white hover:border-[#064E3B]/30 transition-all cursor-pointer group h-[200px]">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.png,.pdf"
                        onChange={handleFileUpload("photos")}
                      />
                      <span className="material-symbols-outlined text-4xl text-[#64748B] group-hover:text-[#064E3B] mb-2 transition-colors">
                        add_a_photo
                      </span>
                      <span className="text-sm font-bold text-[#022C22]">
                        اضغط لرفع الصور
                      </span>
                      <p className="text-[10px] text-[#64748B] mt-1 text-center font-medium">
                        يرجى رفع صور واضحة للمكان
                      </p>
                    </label>
                  ) : (
                    <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex items-center justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                          <span className="material-symbols-outlined">
                            image
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-[#022C22] truncate max-w-[150px]">
                            {waitingAreaPhotosFile.name}
                          </div>
                          <div className="text-[10px] text-green-600 font-bold">
                            تم رفع الصور
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            setWaitingAreaPhotosFile(null);
                            handleUpdate({ waitingAreaPhotosFile: null });
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
                            accept=".jpg,.png,.pdf"
                            onChange={handleFileUpload("photos")}
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
                    className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${waitingAreaConfirmed ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-gray-50/50 border-[#E5DED0] hover:border-gray-200"}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${waitingAreaConfirmed ? "bg-[#064E3B] border-[#064E3B] text-white" : "bg-white border-gray-300"}`}
                    >
                      {waitingAreaConfirmed && (
                        <span className="material-symbols-outlined text-[18px]">
                          check
                        </span>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={waitingAreaConfirmed}
                      onChange={(e) => {
                        setWaitingAreaConfirmed(e.target.checked);
                        handleUpdate({
                          waitingAreaConfirmed: e.target.checked,
                        });
                      }}
                    />
                    <div className="space-y-1">
                      <p className="font-bold text-[#022C22] text-sm leading-relaxed">
                        {waitingAreaConfirmed
                          ? "تم التأكيد"
                          : "أؤكد أن المكان المذكور متاح للأهالي خلال التدريبات أو المباريات."}
                      </p>
                    </div>
                  </label>

                  <div className="space-y-2">
                    <label className="font-bold text-[#022C22] text-sm">
                      وصف مختصر للمكان
                    </label>
                    <textarea
                      value={waitingAreaDescription}
                      onChange={(e) => {
                        setWaitingAreaDescription(e.target.value);
                        handleUpdate({
                          waitingAreaDescription: e.target.value,
                        });
                      }}
                      placeholder="مثال: توجد باحة انتظار بجانب الملعب تتسع للأهالي خلال الحصص التدريبية."
                      className="w-full p-4 rounded-2xl border border-[#E5DED0] bg-gray-50 focus:bg-white focus:border-[#064E3B] outline-none transition-all resize-none h-24 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الملعب والمرافق"
          icon="fact_check"
          percentage={progress.percentage}
          status={progress.status}
          subTitle="تصنيف B - المحور الخامس"
          backLink="/dashboard"
          items={[
            { label: "حالة الملعب القانوني", isActive: hasLegalPitch === true },
            {
              label: `قياس الملعب: ${pitchDepth ? pitchDepth + "م" : "-"} × ${pitchWidth ? pitchWidth + "م" : "-"}`,
              isActive: !!pitchDepth && !!pitchWidth,
            },
            { label: "عقد الملعب", isActive: !!pitchContractFile },
            {
              label: "حالة القاعة أو المدرج",
              isActive: hasWaitingAreaOrStand === true,
            },
            { label: "الصور المرفوعة", isActive: !!waitingAreaPhotosFile },
            { label: "تأكيد توفر المكان", isActive: waitingAreaConfirmed },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/b/technical"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
              السابق: الجانب الفني
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-gray-500 hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/b/safeguarding"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 group"
            >
              التالي: الرعاية والتعليم
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
