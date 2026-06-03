import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";

export default function ClassificationAEquipment() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/equipment");
    const saved = appStorage.getItem("classificationA_equipment");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        // Force a recalculation and save to ensure Dashboard is synced
        saveProgress(parsed);
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
  }, []);

  const saveProgress = (currentData: Record<string, any>) => {
    const progress = calculateProgress(currentData);
    const payload = {
      ...currentData,
      completionPercentage: progress.percentage,
      status:
        progress.percentage === 0
          ? "لم يبدأ"
          : progress.percentage === 100
            ? "مكتمل"
            : progress.percentage >= 50
              ? "مكتمل جزئيًا"
              : "قيد التعبئة",
      lastUpdated: Date.now(),
    };
    appStorage.setItem("classificationA_equipment", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
  };

  const handleFileUpload = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { waitForAuth } = await import("./lib/auth");
                const user = await waitForAuth();
        if (!user) return;
        
        const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        setData((prev) => {
          const newData = { ...prev, [id]: fileData };
          saveProgress(newData);
          return newData;
        });
      } catch (err) {
        console.error("Upload failed", err);
        alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const handleFileCancel = (id: string) => {
    setData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      saveProgress(newData);
      return newData;
    });
  };

  const handleCheckboxChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setData((prev) => {
      const newData = {
        ...prev,
        [id]: { type: "checkbox", checked: e.target.checked },
      };
      saveProgress(newData);
      return newData;
    });
  };

  const handleNumberChange = (id: string, value: string) => {
    setData((prev) => {
      const newData = { ...prev, [id]: { ...prev[id], type: "number", value } };
      saveProgress(newData);
      return newData;
    });
  };

  const handleInputChange = (id: string, value: string) => {
    setData((prev) => {
      const newData = { ...prev, [id]: { type: "text", value } };
      saveProgress(newData);
      return newData;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    const requirements = [
      { status: "team_jersey_status", fields: ["team_jersey_photo"] },
      { status: "jersey_numbers_status", fields: [] },
      { status: "jersey_logo_status", fields: ["jersey_logo_photo"] },
      { status: "goalkeeper_kit_status", fields: ["goalkeeper_kit_photo"] },
      { status: "alternate_kit_status", fields: ["alternate_kit_photo"] },
      { status: "balls_stock_status", fields: ["balls_stock_photo"] },
      { status: "cones_stock_status", fields: ["cones_stock_photo"] },
      { status: "bibs_stock_status", fields: ["bibs_stock_photo"] },
      { status: "extra_tools_status", fields: ["extra_tools_photo"] },
      {
        status: "equipment_storage_status",
        fields: ["equipment_storage_photo"],
      },
      { status: "goals_status", fields: ["goals_photo"] },
      { status: "goals_safe_status", fields: [] },
      { status: "goal_nets_status", fields: ["goal_nets_photo"] },
      { status: "goal_size_status", fields: [] },
    ];

    let completedCount = 0;
    requirements.forEach((req) => {
      if (req.status) {
        if (currentData[req.status]?.value === "كلا") {
          // If no, and there is no file to upload, we might say it's complete, but maybe we should still consider it complete or incomplete? Let's say complete since they answered.
          completedCount++;
        } else if (currentData[req.status]?.value === "نعم") {
          let reqComplete = true;
          req.fields.forEach((field) => {
            const f = currentData[field];
            if (
              !(
                f?.uploaded ||
                f?.checked ||
                (f?.value && f.value.trim() !== "")
              )
            ) {
              reqComplete = false;
            }
          });
          if (reqComplete) completedCount++;
        }
      } else {
        let reqComplete = true;
        req.fields.forEach((field) => {
          const f = currentData[field];
          if (
            !(f?.uploaded || f?.checked || (f?.value && f.value.trim() !== ""))
          ) {
            reqComplete = false;
          }
        });
        if (reqComplete) completedCount++;
      }
    });

    const total = requirements.length;
    return {
      total,
      completed: completedCount,
      percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  const renderUploadField = (
    id: string,
    label: string,
    helperText?: string,
  ) => {
    const currentFile = data[id];
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-[#022C22] mb-2">
            {label}
          </label>
        )}
        {currentFile?.uploaded ? (
          <div className="flex items-center gap-3 bg-[#064E3B]/5 px-4 py-3 rounded-xl border border-[#064E3B]/20">
            <span className="material-symbols-outlined text-[20px] text-[#064E3B]">
              check_circle
            </span>
            <span className="text-sm font-bold text-[#022C22] truncate flex-1">
              {currentFile.name}
            </span>
            <div className="flex items-center gap-3">
              <UploadTrigger className="text-xs text-[#064E3B] font-bold underline cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(id, e)}>تعديل</UploadTrigger>
              <button
                type="button"
                onClick={() => handleFileCancel(id)}
                className="text-xs text-red-600 font-bold underline"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <UploadTrigger className="flex flex-col items-center justify-center gap-2 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] text-[#64748B] p-4 rounded-2xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(id, e)}>
            <div className="w-10 h-10 bg-[#064E3B]/5 rounded-full flex items-center justify-center text-[#064E3B] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">
                upload_file
              </span>
            </div>
            <div className="text-center">
              <span className="font-bold text-sm block text-[#064E3B]">
                اضغط لرفع الملف
              </span>
              <span className="text-[10px]">
                {helperText || "صورة مفصلة (JPG, PNG, PDF)"}
              </span>
            </div>
            </UploadTrigger>
        )}
      </div>
    );
  };

  const renderYesNoRequirement = (
    label: string,
    statusKey: string,
    fileKey?: string,
    fileLabel?: string,
    textKey?: string,
    textPlaceholder?: string,
    noMessage?: string,
    numberKey?: string,
    numberLabel?: string,
  ) => {
    return (
      <div className="py-5 border-b border-[#E5DED0] last:border-0">
        <p className="font-bold text-[#022C22] mb-4">{label}</p>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={data[statusKey]?.value === "نعم"}
              onChange={() => handleInputChange(statusKey, "نعم")}
              className="accent-[#064E3B] w-4 h-4"
            />
            <span className="text-sm font-bold">نعم</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={data[statusKey]?.value === "كلا"}
              onChange={() => handleInputChange(statusKey, "كلا")}
              className="accent-[#064E3B] w-4 h-4"
            />
            <span className="text-sm font-bold">كلا</span>
          </label>
        </div>

        {data[statusKey]?.value === "نعم" && fileKey && (
          <div className="mt-4 border-t border-[#E5DED0] pt-4">
            {renderUploadField(fileKey, fileLabel || "المستند الداعم")}
          </div>
        )}

        {data[statusKey]?.value === "نعم" && textKey && (
          <div className="mt-4 border-t border-[#E5DED0] pt-4">
            <textarea
              className="w-full p-4 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none resize-none font-bold text-sm text-[#022C22]"
              rows={3}
              placeholder={textPlaceholder || "أدخل التفاصيل هنا..."}
              value={data[textKey]?.value || ""}
              onChange={(e) => handleInputChange(textKey, e.target.value)}
            ></textarea>
          </div>
        )}

        {data[statusKey]?.value === "نعم" && numberKey && (
          <div className="mt-4 border-t border-[#E5DED0] pt-4">
            <label className="block text-sm font-bold text-[#022C22] mb-2">
              {numberLabel || "العدد"}
            </label>
            <input
              type="number"
              className="w-24 p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none font-bold text-sm text-[#022C22]"
              placeholder="0"
              value={data[numberKey]?.value || ""}
              onChange={(e) => handleNumberChange(numberKey, e.target.value)}
            />
          </div>
        )}

        {data[statusKey]?.value === "كلا" && noMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
            {noMessage}
          </div>
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
        تم حفظ محور المعدات والتجهيزات كمسودة
      </div>

      {/* Breadcrumbs Sub-Header */}
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
            <span className="text-white font-bold">المعدات والتجهيزات</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/safeguarding"
          nextPath="/classification/a/social-media"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور التاسع: المعدات والتجهيزات
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور توفر المعدات والتجهيزات الأساسية والمناسبة للفئات
            العمرية، بما يضمن تنفيذ الحصص التدريبية بشكل آمن ومنظم.
          </p>
        </div>

        {/* Section 1: Kits */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              الأطقم واللباس الرسمي
            </h2>
            <p className="text-xs text-[#64748B] mt-1 italic">
              يجب أن تمتلك الأكاديمية أطقمًا واضحة وموحدة للاعبين.
            </p>
          </div>
          <div className="p-6">
            {renderYesNoRequirement(
              "هل يوجد قميص موحد خاص لكل فريق؟",
              "team_jersey_status",
              "team_jersey_photo",
              "صورة للطقم الموحد",
            )}
            {renderYesNoRequirement(
              "هل يوجد رقم لكل لاعب على القميص؟",
              "jersey_numbers_status",
            )}
            {renderYesNoRequirement(
              "هل يوجد شعار على القميص؟",
              "jersey_logo_status",
              "jersey_logo_photo",
              "صورة واضحة للشعار على القميص",
            )}
            {renderYesNoRequirement(
              "هل يوجد لباس خاص لحارس المرمى يميزه عن باقي اللاعبين؟",
              "goalkeeper_kit_status",
              "goalkeeper_kit_photo",
              "صورة طقم حراس المرمى",
            )}
            {renderYesNoRequirement(
              "هل يوجد طقم آخر بديل للفريق؟",
              "alternate_kit_status",
              "alternate_kit_photo",
              "صورة الطقم البديل (اختياري)",
            )}
          </div>
        </div>

        {/* Section 2: Training Tools */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">dataset</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                الأدوات التدريبية الأساسية
              </h2>
              <p className="text-xs text-[#64748B]">
                الكرات، الأقماع، الصدريات والتخزين.
              </p>
            </div>
          </div>
          <div className="p-6">
            {renderYesNoRequirement(
              "هل يوجد عدد كافٍ من الكرات المناسبة للفئات العمرية؟",
              "balls_stock_status",
              "balls_stock_photo",
              "صورة لنموذج الكرة",
              undefined,
              undefined,
              undefined,
              "balls_stock_count",
              "عدد الكرات المتوفرة",
            )}
            {renderYesNoRequirement(
              "هل توجد أقماع تدريب كافية؟",
              "cones_stock_status",
              "cones_stock_photo",
              "صور الأقماع",
              undefined,
              undefined,
              undefined,
              "cones_stock_count",
              "عدد الأقماع المتوفرة",
            )}
            {renderYesNoRequirement(
              "هل توجد قمصان تدريب Bibs بألوان مختلفة؟",
              "bibs_stock_status",
              "bibs_stock_photo",
              "صور قمصان التدريب",
              undefined,
              undefined,
              undefined,
              "bibs_stock_count",
              "عدد قمصان التدريب المتوفرة",
            )}
            {renderYesNoRequirement(
              "هل توجد أدوات تدريب مساعدة مثل السلالم، الحواجز، أو العلامات؟",
              "extra_tools_status",
              "extra_tools_photo",
              "صور الأدوات التدريبية الإضافية (اختياري)",
            )}
            {renderYesNoRequirement(
              "هل توجد حقيبة أو مكان مخصص لحفظ المعدات؟",
              "equipment_storage_status",
              "equipment_storage_photo",
              "صور مكان حفظ المعدات",
            )}
          </div>
        </div>

        {/* Section 3: Goals */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C9A227] text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              المرمى والمواصفات الفنية
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              المواصفات المطلوبة للمرمى بحسب الفئات العمرية.
            </p>
          </div>
          <div className="p-6">
            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-sm text-right border-collapse bg-white rounded-2xl overflow-hidden border border-[#E5DED0]">
                <thead>
                  <tr className="bg-[#022C22] text-[#C9A227]">
                    <th className="p-4 border border-white/10 font-bold">
                      الفئة
                    </th>
                    <th className="p-4 border border-white/10 font-bold">
                      قياس العرض
                    </th>
                    <th className="p-4 border border-white/10 font-bold">
                      قياس الارتفاع
                    </th>
                    <th className="p-4 border border-white/10 font-bold">
                      قياس العمق
                    </th>
                    <th className="p-4 border border-white/10 font-bold">
                      المواد المستعملة
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[#022C22]">
                  <tr className="bg-gray-50/50">
                    <td className="p-4 border border-[#E5DED0] font-bold">
                      دون 10 ودون 11
                    </td>
                    <td className="p-4 border border-[#E5DED0]">
                      5 - 5.5 أمتار
                    </td>
                    <td className="p-4 border border-[#E5DED0]">2 متر</td>
                    <td className="p-4 border border-[#E5DED0]">
                      متر على الأقل
                    </td>
                    <td className="p-4 border border-[#E5DED0]">ألومنيوم</td>
                  </tr>
                  <tr>
                    <td className="p-4 border border-[#E5DED0] font-bold">
                      دون 12 ودون 13
                    </td>
                    <td className="p-4 border border-[#E5DED0]">5 - 6 أمتار</td>
                    <td className="p-4 border border-[#E5DED0]">2 متر</td>
                    <td className="p-4 border border-[#E5DED0]">
                      متر على الأقل
                    </td>
                    <td className="p-4 border border-[#E5DED0]">ألومنيوم</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {renderYesNoRequirement(
              "هل يوجد مرميان ضمن المواصفات المطلوبة؟",
              "goals_status",
              "goals_photo",
              "صور المرمى",
            )}
            {renderYesNoRequirement(
              "هل المرمى ثابت وآمن وغير مكسور؟",
              "goals_safe_status",
            )}
            {renderYesNoRequirement(
              "هل يوجد شباك صالحة وغير ممزقة؟",
              "goal_nets_status",
              "goal_nets_photo",
              "صور الشباك",
            )}
            {renderYesNoRequirement(
              "هل حجم المرمى مناسب للفئات دون 10 حتى دون 13؟",
              "goal_size_status",
            )}
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية المعدات والتجهيزات"
          icon="inventory_2"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - محور المعدات والتجهيزات"
          backLink="/dashboard"
          items={[
            {
              label: "الطقم الرسمي",
              isActive: !!data.team_jersey_photo?.uploaded,
            },
            {
              label: "طقم الحارس",
              isActive: !!data.goalkeeper_kit_photo?.uploaded,
            },
            {
              label: "الكرات الأساسية",
              isActive: !!data.balls_stock_photo?.uploaded,
            },
            {
              label: "قمصان التدريب",
              isActive: !!data.bibs_stock_photo?.uploaded,
            },
            {
              label: "المرمى والشباك",
              isActive:
                data.goals_photo?.uploaded &&
                data.goals_safe_status?.value === "نعم",
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/a/safeguarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: الرعاية والتعليم
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/social-media"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 group"
            >
              التالي: التواصل الاجتماعي
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </Link>
          </div>
        </AxisSummary>
      </main>
    </div>
  );
}
