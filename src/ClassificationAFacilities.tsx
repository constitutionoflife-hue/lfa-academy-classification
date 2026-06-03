import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";

const DEFAULT_DATA = {
  pitchSpecifications: {
    hasMinimumPitchSize: null as string | null,
    actualPitchSize: "",
    pitchSurfaceQuality: "",
    pitchSurfacePhoto: { uploaded: false, name: "" },
    hasLighting: null as string | null,
  },
  playerCoachFacilities: {
    hasChangingRooms: null as string | null,
    changingRoomsPhotos: { uploaded: false, name: "" },
    hasTechnicalBenches: null as string | null,
    technicalBenchesPhotos: { uploaded: false, name: "" },
    hasFirstAidPoint: null as string | null,
    firstAidPointPhotos: { uploaded: false, name: "" },
  },
  supportingFacilities: {
    hasParkingAccess: null as string | null,
    parkingAccessPhotos: { uploaded: false, name: "" },
    hasParentsWaitingArea: null as string | null,
    parentsWaitingAreaPhotos: { uploaded: false, name: "" },
    hasSafeViewingArea: null as string | null,
    safeViewingAreaPhotos: { uploaded: false, name: "" },
    hasAdministrativePoint: null as string | null,
    administrativePointPhotos: { uploaded: false, name: "" },
  },
  pitchUsageRight: {
    hasLegalUsageRight: null as string | null,
    pitchName: "",
    pitchUsageDuration: "",
    hasEnoughWeeklySessions: null as string | null,
    weeklySessionsPerAgeGroup: "",
    canHostOfficialMatches: null as string | null,
    usageRightType: "",
    pitchUsageRightDocument: { uploaded: false, name: "" },
  },
};

export default function ClassificationAFacilities() {
  const navigate = useNavigate();
  const [data, setData] = useState(DEFAULT_DATA);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/facilities");
    const saved = appStorage.getItem("classificationA_facilities");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          pitchSpecifications: {
            ...DEFAULT_DATA.pitchSpecifications,
            ...parsed.pitchSpecifications,
          },
          playerCoachFacilities: {
            ...DEFAULT_DATA.playerCoachFacilities,
            ...parsed.playerCoachFacilities,
          },
          supportingFacilities: {
            ...DEFAULT_DATA.supportingFacilities,
            ...parsed.supportingFacilities,
          },
          pitchUsageRight: {
            ...DEFAULT_DATA.pitchUsageRight,
            ...parsed.pitchUsageRight,
          },
        });
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
  }, []);

  const calculateProgress = (currentData = data) => {
    let completeSections = 0;

    // Pitch Specifications
    const s1 = currentData.pitchSpecifications;
    const isS1Complete =
      s1.hasMinimumPitchSize === "نعم" &&
      s1.actualPitchSize.trim() !== "" &&
      s1.pitchSurfaceQuality !== "" &&
      s1.pitchSurfacePhoto.uploaded &&
      (s1.hasLighting === "نعم" || s1.hasLighting === "كلا");

    if (isS1Complete) completeSections++;

    // Player Coach Facilities
    const s2 = currentData.playerCoachFacilities;
    const isS2Complete =
      s2.hasChangingRooms === "نعم" &&
      s2.changingRoomsPhotos.uploaded &&
      s2.hasTechnicalBenches === "نعم" &&
      s2.technicalBenchesPhotos.uploaded &&
      s2.hasFirstAidPoint === "نعم" &&
      s2.firstAidPointPhotos.uploaded;

    if (isS2Complete) completeSections++;

    // Supporting Facilities
    const s3 = currentData.supportingFacilities;
    const isS3Complete =
      s3.hasParkingAccess === "نعم" &&
      s3.parkingAccessPhotos.uploaded &&
      s3.hasParentsWaitingArea === "نعم" &&
      s3.parentsWaitingAreaPhotos.uploaded &&
      s3.hasSafeViewingArea === "نعم" &&
      s3.safeViewingAreaPhotos.uploaded &&
      s3.hasAdministrativePoint === "نعم" &&
      s3.administrativePointPhotos.uploaded;

    if (isS3Complete) completeSections++;

    // Pitch Usage Right
    const s4 = currentData.pitchUsageRight;
    const isS4Complete =
      s4.hasLegalUsageRight === "نعم" &&
      s4.pitchName.trim() !== "" &&
      s4.pitchUsageDuration !== "" &&
      s4.hasEnoughWeeklySessions === "نعم" &&
      (s4.canHostOfficialMatches === "نعم" ||
        s4.canHostOfficialMatches === "كلا") &&
      s4.usageRightType !== "" &&
      s4.pitchUsageRightDocument.uploaded;

    if (isS4Complete) completeSections++;

    const percentage = completeSections * 25;
    return { percentage, completeSections, totalSections: 4 };
  };

  const progress = calculateProgress();

  const saveProgress = (newData = data) => {
    const prog = calculateProgress(newData);
    let status = "لم يبدأ";
    if (prog.percentage === 100) status = "مكتمل";
    else if (prog.percentage >= 50) status = "مكتمل جزئيًا";
    else if (prog.percentage > 0) status = "قيد التعبئة";

    const payload = {
      ...newData,
      completionPercentage: prog.percentage,
      status,
      lastUpdated: Date.now(),
    };
    appStorage.setItem("classificationA_facilities", JSON.stringify(payload));
  };

  const updateSection = (
    section: keyof typeof DEFAULT_DATA,
    field: string,
    value: any,
  ) => {
    setData((prev) => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };
      saveProgress(newData);
      return newData;
    });
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: keyof typeof DEFAULT_DATA,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { waitForAuth } = await import("./lib/auth");
                const user = await waitForAuth();
        if (!user) return;
        
        const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        updateSection(section, field, fileData);
      } catch (err) {
        console.error(err);
        alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const handleCancelFile = (
    section: keyof typeof DEFAULT_DATA,
    field: string,
  ) => {
    updateSection(section, field, { uploaded: false, name: "" });
  };

  const renderUploadBox = (
    section: keyof typeof DEFAULT_DATA,
    field: string,
    title: string,
    helperText: string,
  ) => {
    const fileData = (data as any)[section][field];
    return (
      <div className="w-full mt-4">
        <label className="block text-sm font-bold text-[#022C22] mb-2">
          {title}
        </label>
        {fileData?.uploaded ? (
          <div className="flex items-center gap-3 bg-[#064E3B]/5 px-4 py-3 rounded-xl border border-[#064E3B]/20">
            <span className="material-symbols-outlined text-[20px] text-[#064E3B]">
              check_circle
            </span>
            <span className="text-sm font-bold text-[#022C22] truncate flex-1">
              {fileData.name}
            </span>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[#064E3B] font-bold underline cursor-pointer">
                تعديل
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e, section, field)}
                />
              </label>
              <button
                type="button"
                onClick={() => handleCancelFile(section, field)}
                className="text-xs text-red-600 font-bold underline"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-2 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] text-[#64748B] p-4 rounded-2xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group">
            <div className="w-10 h-10 bg-[#064E3B]/5 rounded-full flex items-center justify-center text-[#064E3B] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">
                upload_file
              </span>
            </div>
            <div className="text-center">
              <span className="font-bold text-sm block text-[#064E3B]">
                اضغط لرفع الملف (JPG, PNG, PDF)
              </span>
              {helperText && (
                <span className="text-[10px] mt-1 block">{helperText}</span>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e, section, field)}
            />
          </label>
        )}
      </div>
    );
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
        تم الحفظ كمسودة
      </div>

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
            <span className="text-white/80">تصنيف A</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">الملعب والمرافق الأخرى</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/budget"
          nextPath="/classification/a/health"
        />

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور السادس: الملعب والمرافق الأخرى
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور مدى توفر ملعب مناسب ومرافق أساسية وداعمة، إضافة
            إلى حق استخدام الملعب بطريقة قانونية ومنظمة.
          </p>
        </div>

        {/* Progress */}

        {/* Section 1 */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#064E3B] rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xl">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                مواصفات الملعب
              </h2>
              <p className="text-xs text-[#64748B]">
                يهدف هذا القسم إلى التأكد من أن الملعب مناسب لتدريبات ومباريات
                الفئات العمرية، من حيث المساحة، جودة الأرضية، والإنارة.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Question 1.1 */}
            <div>
              <p className="font-bold text-[#022C22] mb-2">
                هل مساحة الملعب لا تقل عن 70×45 متر؟
              </p>
              <p className="text-xs text-[#64748B] mb-4">
                الحد الأدنى المطلوب لمساحة الملعب هو 70×45 متر. إذا كان الملعب
                أكبر من ذلك، يرجى ذكر المقاسات الفعلية.
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchSpecifications.hasMinimumPitchSize === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchSpecifications",
                        "hasMinimumPitchSize",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchSpecifications.hasMinimumPitchSize === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchSpecifications",
                        "hasMinimumPitchSize",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.pitchSpecifications.hasMinimumPitchSize === "نعم" && (
                <div className="mt-4">
                  <label className="block text-sm font-bold mb-2">
                    المقاسات الفعلية للملعب
                  </label>
                  <input
                    type="text"
                    value={data.pitchSpecifications.actualPitchSize}
                    onChange={(e) =>
                      updateSection(
                        "pitchSpecifications",
                        "actualPitchSize",
                        e.target.value,
                      )
                    }
                    placeholder="مثال: 75×50 متر"
                    className="w-full p-3 rounded-xl border border-[#E5DED0] focus:outline-none focus:border-[#C9A227] font-bold text-sm"
                  />
                </div>
              )}
              {data.pitchSpecifications.hasMinimumPitchSize === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  مساحة الملعب أقل من الحد الأدنى المطلوب لهذا التصنيف.
                </div>
              )}
            </div>

            {/* Question 1.2 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-2">
                ما هي جودة أرضية الملعب؟
              </p>
              <select
                value={data.pitchSpecifications.pitchSurfaceQuality}
                onChange={(e) =>
                  updateSection(
                    "pitchSpecifications",
                    "pitchSurfaceQuality",
                    e.target.value,
                  )
                }
                className="w-full p-3 rounded-xl border border-[#E5DED0] focus:outline-none focus:border-[#C9A227] font-bold text-sm"
              >
                <option value="">-- اختر جودة الأرضية --</option>
                <option value="ممتازة">ممتازة</option>
                <option value="جيدة">جيدة</option>
                <option value="سيئة">سيئة</option>
              </select>
              {data.pitchSpecifications.pitchSurfaceQuality && (
                <div className="mt-4">
                  {renderUploadBox(
                    "pitchSpecifications",
                    "pitchSurfacePhoto",
                    "رفع صورة أرضية الملعب",
                    "يرجى رفع صورة واضحة تظهر جودة أرضية الملعب.",
                  )}
                </div>
              )}
            </div>

            {/* Question 1.3 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد إنارة في الملعب؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.pitchSpecifications.hasLighting === "نعم"}
                    onChange={() =>
                      updateSection("pitchSpecifications", "hasLighting", "نعم")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.pitchSpecifications.hasLighting === "كلا"}
                    onChange={() =>
                      updateSection("pitchSpecifications", "hasLighting", "كلا")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.pitchSpecifications.hasLighting === "كلا" && (
                <div className="p-3 bg-yellow-50 text-yellow-800 text-sm font-bold rounded-xl border border-yellow-200 mt-4">
                  يرجى الانتباه إلى أن عدم وجود إنارة قد يؤثر على إمكانية إقامة
                  الحصص أو المباريات مساءً.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#064E3B] rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xl">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                مرافق اللاعبين والمدربين
              </h2>
              <p className="text-xs text-[#64748B]">
                يهدف هذا القسم إلى التأكد من توفر مرافق أساسية تخدم اللاعبين
                والمدربين أثناء التدريبات والمباريات.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Question 2.1 */}
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد غرف تبديل للاعبين؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasChangingRooms === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasChangingRooms",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasChangingRooms === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasChangingRooms",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.playerCoachFacilities.hasChangingRooms === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "playerCoachFacilities",
                    "changingRoomsPhotos",
                    "رفع صور غرف تبديل اللاعبين",
                    "يرجى رفع صور واضحة لغرف تبديل اللاعبين.",
                  )}
                </div>
              )}
              {data.playerCoachFacilities.hasChangingRooms === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر غرف تبديل للاعبين يعني أن هذا المتطلب غير مكتمل.
                </div>
              )}
            </div>

            {/* Question 2.2 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد مقاعد بدلاء للمدربين أو الجهاز الفني؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasTechnicalBenches === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasTechnicalBenches",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasTechnicalBenches === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasTechnicalBenches",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.playerCoachFacilities.hasTechnicalBenches === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "playerCoachFacilities",
                    "technicalBenchesPhotos",
                    "رفع صور مقاعد البدلاء",
                    "يرجى رفع صور واضحة لمقاعد البدلاء أو المنطقة المخصصة للجهاز الفني.",
                  )}
                </div>
              )}
              {data.playerCoachFacilities.hasTechnicalBenches === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر مقاعد بدلاء للجهاز الفني يعني أن هذا المتطلب غير
                  مكتمل.
                </div>
              )}
            </div>

            {/* Question 2.3 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد نقطة إسعاف أولي في الملعب؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasFirstAidPoint === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasFirstAidPoint",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.playerCoachFacilities.hasFirstAidPoint === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "playerCoachFacilities",
                        "hasFirstAidPoint",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.playerCoachFacilities.hasFirstAidPoint === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "playerCoachFacilities",
                    "firstAidPointPhotos",
                    "رفع صور نقطة الإسعاف الأولي",
                    "يرجى رفع صورة واضحة لنقطة الإسعاف الأولي أو مكان تواجد حقيبة الإسعافات.",
                  )}
                </div>
              )}
              {data.playerCoachFacilities.hasFirstAidPoint === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر نقطة إسعاف أولي في الملعب يعني أن هذا المتطلب غير
                  مكتمل.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#064E3B] rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xl">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                المرافق الداعمة
              </h2>
              <p className="text-xs text-[#64748B]">
                يهدف هذا القسم إلى التأكد من وجود مرافق تساعد على تنظيم النشاط
                بشكل آمن ومنظم للأهالي والجمهور والإدارة.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Question 3.1 */}
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد موقف سيارات أو مساحة مناسبة للوصول؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasParkingAccess === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasParkingAccess",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasParkingAccess === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasParkingAccess",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.supportingFacilities.hasParkingAccess === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "supportingFacilities",
                    "parkingAccessPhotos",
                    "رفع صور موقف السيارات أو مساحة الوصول",
                    "",
                  )}
                </div>
              )}
              {data.supportingFacilities.hasParkingAccess === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر موقف سيارات أو مساحة مناسبة للوصول يعني أن هذا
                  المتطلب غير مكتمل.
                </div>
              )}
            </div>

            {/* Question 3.2 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد منطقة انتظار للأهالي؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasParentsWaitingArea === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasParentsWaitingArea",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasParentsWaitingArea === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasParentsWaitingArea",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.supportingFacilities.hasParentsWaitingArea === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "supportingFacilities",
                    "parentsWaitingAreaPhotos",
                    "رفع صور منطقة انتظار الأهالي",
                    "",
                  )}
                </div>
              )}
              {data.supportingFacilities.hasParentsWaitingArea === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر منطقة انتظار للأهالي يعني أن هذا المتطلب غير مكتمل.
                </div>
              )}
            </div>

            {/* Question 3.3 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد مدرج أو مساحة متابعة آمنة؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasSafeViewingArea === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasSafeViewingArea",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasSafeViewingArea === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasSafeViewingArea",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.supportingFacilities.hasSafeViewingArea === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "supportingFacilities",
                    "safeViewingAreaPhotos",
                    "رفع صور المدرج أو مساحة المتابعة",
                    "",
                  )}
                </div>
              )}
              {data.supportingFacilities.hasSafeViewingArea === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر مدرج أو مساحة متابعة آمنة يعني أن هذا المتطلب غير
                  مكتمل.
                </div>
              )}
            </div>

            {/* Question 3.4 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد مكتب أو نقطة إدارية داخل المنشأة؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasAdministrativePoint === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasAdministrativePoint",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.supportingFacilities.hasAdministrativePoint === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "supportingFacilities",
                        "hasAdministrativePoint",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.supportingFacilities.hasAdministrativePoint === "نعم" && (
                <div className="mt-4">
                  {renderUploadBox(
                    "supportingFacilities",
                    "administrativePointPhotos",
                    "رفع صور المكتب أو النقطة الإدارية",
                    "",
                  )}
                </div>
              )}
              {data.supportingFacilities.hasAdministrativePoint === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم توفر مكتب أو نقطة إدارية داخل المنشأة يعني أن هذا المتطلب
                  غير مكتمل.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4 */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#064E3B] rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xl">
              4
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                حق استخدام الملعب
              </h2>
              <p className="text-xs text-[#64748B]">
                يهدف هذا القسم إلى التأكد من أن الأكاديمية تمتلك حقًا قانونيًا
                وواضحًا لاستخدام الملعب خلال الموسم.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {/* Question 4.1 */}
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل تملك الأكاديمية حق استخدام الملعب قانونيًا؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.pitchUsageRight.hasLegalUsageRight === "نعم"}
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "hasLegalUsageRight",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.pitchUsageRight.hasLegalUsageRight === "كلا"}
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "hasLegalUsageRight",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.pitchUsageRight.hasLegalUsageRight === "نعم" && (
                <div className="mt-4">
                  <label className="block text-sm font-bold mb-2">
                    اسم الملعب
                  </label>
                  <input
                    type="text"
                    value={data.pitchUsageRight.pitchName}
                    onChange={(e) =>
                      updateSection(
                        "pitchUsageRight",
                        "pitchName",
                        e.target.value,
                      )
                    }
                    placeholder="أدخل اسم الملعب المعتمد"
                    className="w-full p-3 rounded-xl border border-[#E5DED0] focus:outline-none focus:border-[#C9A227] text-sm font-bold"
                  />
                </div>
              )}
              {data.pitchUsageRight.hasLegalUsageRight === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدم وجود حق قانوني واضح لاستخدام الملعب يعني أن هذا المتطلب
                  غير مكتمل.
                </div>
              )}
            </div>

            {/* Question 4.2 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل مدة استخدام الملعب تغطي الموسم؟
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.pitchUsageDuration === "موسم واحد"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "pitchUsageDuration",
                        "موسم واحد",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">موسم واحد</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.pitchUsageDuration === "موسمان"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "pitchUsageDuration",
                        "موسمان",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">موسمان</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.pitchUsageDuration === "ثلاثة مواسم"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "pitchUsageDuration",
                        "ثلاثة مواسم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">ثلاثة مواسم</span>
                </label>
              </div>
            </div>

            {/* Question 4.3 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-2">
                هل عدد الحصص الأسبوعية المتاحة كافٍ؟
              </p>
              <p className="text-xs text-[#64748B] mb-4">
                يجب أن تتوفر ثلاث حصص تدريبية أسبوعيًا لكل فئة عمرية.
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.hasEnoughWeeklySessions === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "hasEnoughWeeklySessions",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.hasEnoughWeeklySessions === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "hasEnoughWeeklySessions",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.pitchUsageRight.hasEnoughWeeklySessions === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  عدد الحصص الأسبوعية غير كافٍ. المطلوب ثلاث حصص تدريبية لكل
                  فئة.
                </div>
              )}
            </div>

            {/* Question 4.4 */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                هل يمكن استخدام الملعب للمباريات الرسمية؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.canHostOfficialMatches === "نعم"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "canHostOfficialMatches",
                        "نعم",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={
                      data.pitchUsageRight.canHostOfficialMatches === "كلا"
                    }
                    onChange={() =>
                      updateSection(
                        "pitchUsageRight",
                        "canHostOfficialMatches",
                        "كلا",
                      )
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
            </div>

            {/* Question 4.5 -> Section End */}
            <div className="pt-8 border-t border-[#E5DED0]">
              <p className="font-bold text-[#022C22] mb-4">
                ما هو نوع حق استخدام الملعب؟
              </p>
              <select
                value={data.pitchUsageRight.usageRightType}
                onChange={(e) =>
                  updateSection(
                    "pitchUsageRight",
                    "usageRightType",
                    e.target.value,
                  )
                }
                className="w-full p-3 rounded-xl border border-[#E5DED0] focus:outline-none focus:border-[#C9A227] font-bold mb-4 text-sm"
              >
                <option value="">-- اختر نوع الاستخدام --</option>
                <option value="ملكية">ملكية</option>
                <option value="إيجار">إيجار</option>
                <option value="استثمار">استثمار</option>
                <option value="اتفاق خطي">اتفاق خطي</option>
                <option value="كتاب سماح بالاستخدام">
                  كتاب سماح بالاستخدام
                </option>
              </select>

              {data.pitchUsageRight.usageRightType && (
                <div className="mt-4">
                  {renderUploadBox(
                    "pitchUsageRight",
                    "pitchUsageRightDocument",
                    "رفع مستند حق استخدام الملعب",
                    "يرجى رفع عقد ملكية أو إيجار أو استثمار أو اتفاق خطي أو كتاب سماح يثبت حق استخدام الملعب.",
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Completion Summary */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#E5DED0] mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-[#022C22]">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-4 ${progress.percentage === 100 ? "bg-green-100 border-green-500 text-green-700" : "bg-[#FFF9E6] border-[#C9A227] text-[#C9A227]"}`}
              >
                {progress.percentage}%
              </div>
              <div>
                <h3 className="font-black text-xl mb-1">ملخص المحور</h3>
                <p className="text-[#64748B] text-sm font-bold">
                  {progress.percentage === 100
                    ? "اكتملت جميع متطلبات هذا المحور"
                    : "يرجى إكمال المتطلبات المتبقية لإنهاء المحور"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-10 border-t border-[#E5DED0]">
          <button
            onClick={() => {
              saveProgress();
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            }}
            className="w-full md:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#064E3B] hover:border-[#064E3B] transition-all text-center flex items-center justify-center gap-2 shadow-sm order-2 md:order-1 mr-auto"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            حفظ كمسودة
          </button>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 order-1 md:order-2">
            <Link
              to="/classification/a/budget"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: الميزانية
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/health"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
            >
              التالي: الصحة
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
