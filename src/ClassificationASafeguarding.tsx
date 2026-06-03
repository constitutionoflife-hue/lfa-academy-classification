import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { getRegistryData } from "./lib/registry";
import { AxisSummary } from "./components/AxisSummary";

interface Requirement {
  id: string;
  condition: string;
  proofType: "file" | "checkbox" | "text";
  proofLabel: string;
  details?: string;
  optional?: boolean;
  placeholder?: string;
}

export default function ClassificationASafeguarding() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);
  const [registryPeople, setRegistryPeople] = useState<any[]>([]);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/safeguarding");
    const saved = appStorage.getItem("classificationA_safeguarding");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved data");
      }
    }

    // Load registry people (staff/coaches)
    const registry = getRegistryData();
    setRegistryPeople(registry.people || []);
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
    appStorage.setItem("classificationA_safeguarding", JSON.stringify(payload));
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
        alert((err as any)?.message || "فشل رفع الملف. يرجى المحاولة مرة أخرى.");
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

  const handleInputChange = (id: string, value: string) => {
    setData((prev) => {
      const newData = { ...prev, [id]: { type: "text", value } };
      saveProgress(newData);
      return newData;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    const requirements = [
      {
        status: "behavior_charter_status",
        fields: ["behavior_charter_doc", "charter_signed"],
      },
      {
        status: "cp_policy_status",
        fields: [
          "cp_policy_doc",
          "cp_reporting_mechanism_doc",
          "cp_officer_name",
        ],
      },
      {
        status: "workshop_plan_status",
        fields: [
          "workshop_plan_doc",
          "ws_content_doc",
          "ws_attendance_doc",
          "ws_coordinator_name",
        ],
      },
      { status: "parent_comm_doc_status", fields: ["parent_comm_doc"] },
      { status: "parent_notified_rules_status", fields: [] },
      {
        status: "parent_comm_channel_status",
        fields: ["parent_comm_channel_text"],
      },
      {
        status: "parent_complaints_confirm_status",
        fields: ["parent_complaints_doc"],
      },
    ];

    let completedCount = 0;
    requirements.forEach((req) => {
      if (req.status) {
        if (currentData[req.status]?.value === "كلا") {
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

  const renderYesNoRequirement = (
    label: string,
    statusKey: string,
    fileKey?: string,
    fileLabel?: string,
    textKey?: string,
    textPlaceholder?: string,
    noMessage?: string,
    selectPersonKey?: string,
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

        {data[statusKey]?.value === "نعم" && selectPersonKey && (
          <div className="mt-4 border-t border-[#E5DED0] pt-4">
            <label className="block text-sm font-bold text-[#022C22] mb-2">
              اختر الشخص المسؤول من السجل الاكتروني
            </label>
            <select
              className="w-full bg-white p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none font-bold text-sm"
              value={data[selectPersonKey]?.value || ""}
              onChange={(e) =>
                handleInputChange(selectPersonKey, e.target.value)
              }
            >
              <option value="">-- اختر --</option>
              {registryPeople.map((person, idx) => (
                <option key={idx} value={person.fullName}>
                  {person.fullName} ({person.roleLabel || "غير محدد"})
                </option>
              ))}
            </select>
            {(data[selectPersonKey]?.value === "غير ذلك" ||
              data[selectPersonKey]?.value === undefined ||
              true) && (
              <div className="mt-2">
                <input
                  className="w-full bg-white p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none font-bold text-sm"
                  placeholder="أو أدخل اسم المسؤول..."
                  value={data[selectPersonKey]?.value || ""}
                  onChange={(e) =>
                    handleInputChange(selectPersonKey, e.target.value)
                  }
                />
                <p className="text-xs text-[#64748B] mt-1">
                  تستطيع اختيار الشخص من القائمة أو كتابة اسمه يدوياً هنا.
                </p>
              </div>
            )}
          </div>
        )}

        {data[statusKey]?.value === "نعم" && textKey && !selectPersonKey && (
          <div className="mt-4 border-t border-[#E5DED0] pt-4">
            <textarea
              className="w-full p-4 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none resize-none font-bold text-sm text-[#022C22]"
              rows={3}
              placeholder={textPlaceholder || "اكتب هنا..."}
              value={data[textKey]?.value || ""}
              onChange={(e) => handleInputChange(textKey, e.target.value)}
            ></textarea>
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
          <label className="flex flex-col items-center justify-center gap-2 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] text-[#64748B] p-4 rounded-2xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group">
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
                {helperText || "صورة أو PDF (JPG, PNG)"}
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(id, e)}
            />
          </label>
        )}
      </div>
    );
  };

  const renderRequirement = (req: Requirement) => {
    return (
      <div
        key={req.id}
        className="py-5 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-6"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-[#022C22] leading-relaxed">
              {req.condition}
            </p>
            {req.optional && (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                اختياري
              </span>
            )}
          </div>
          {req.details && (
            <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
              {req.details}
            </p>
          )}
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B]">
            <span className="material-symbols-outlined text-[14px]">
              {req.proofType === "file"
                ? "description"
                : req.proofType === "checkbox"
                  ? "fact_check"
                  : "edit_note"}
            </span>
            <span>{req.proofLabel}</span>
          </div>
        </div>

        <div className="w-full md:w-[250px] shrink-0">
          {req.proofType === "file" ? (
            renderUploadField(req.id, "", "صور أو PDF")
          ) : req.proofType === "checkbox" ? (
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${data[req.id]?.checked ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-white border-[#E5DED0] hover:border-[#064E3B]"}`}
            >
              <input
                type="checkbox"
                checked={data[req.id]?.checked || false}
                onChange={(e) => handleCheckboxChange(req.id, e)}
                className="w-5 h-5 accent-[#064E3B] rounded border-[#E5DED0]"
              />
              <span className="text-sm font-bold text-[#022C22]">
                {data[req.id]?.checked ? "تم التأكيد" : "تأكيد"}
              </span>
              {data[req.id]?.checked && (
                <span className="material-symbols-outlined text-green-600 text-[18px] mr-auto">
                  check_circle
                </span>
              )}
            </label>
          ) : (
            <input
              type="text"
              value={data[req.id]?.value || ""}
              onChange={(e) => handleInputChange(req.id, e.target.value)}
              placeholder={req.placeholder}
              className="w-full p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 focus:border-[#064E3B] outline-none text-sm font-bold text-[#022C22] bg-white"
            />
          )}
        </div>
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
        تم حفظ محور الرعاية والتعليم كمسودة
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
            <span className="text-white font-bold">الرعاية والتعليم</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/health"
          nextPath="/classification/a/equipment"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الثامن: الرعاية والتعليم
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور مدى التزام الأكاديمية بحماية الطفل، السلوك
            التربوي، التوعية، وتنظيم العلاقة بين اللاعبين، المدربين، الأهالي،
            والإدارة.
          </p>
        </div>

        {/* Section 1: Behavior Charter */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              ميثاق السلوك
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              هل يوجد ميثاق سلوك واضح للاعبين والأهل والمدربين؟
            </p>
          </div>
          <div className="p-6">
            <p className="mb-6 text-sm text-[#64748B] leading-relaxed bg-[#F6F1E7] p-4 rounded-2xl italic border-r-4 border-[#C9A227]">
              يُشترط لتصنيف أكاديمية مستوى A وجود ميثاق سلوك مكتوب ومعتمد يحدد
              القواعد العامة للانضباط، الاحترام، والسلوك التربوي داخل وخارج
              الملعب.
            </p>
            <div className="mb-6">
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد ميثاق سلوك مكتوب ومعتمد؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.behavior_charter_status?.value === "نعم"}
                    onChange={() =>
                      handleInputChange("behavior_charter_status", "نعم")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.behavior_charter_status?.value === "كلا"}
                    onChange={() =>
                      handleInputChange("behavior_charter_status", "كلا")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.behavior_charter_status?.value === "نعم" && (
                <div className="mt-4 border-t border-[#E5DED0] pt-4">
                  {renderUploadField(
                    "behavior_charter_doc",
                    "رفع نسخة عن ميثاق السلوك",
                  )}
                </div>
              )}
              {data.behavior_charter_status?.value === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  هذا المتطلب إلزامي.
                </div>
              )}
            </div>

            {data.behavior_charter_status?.value === "نعم" && (
              <div className="border-t border-[#E5DED0] pt-2">
                {[
                  {
                    id: "charter_includes_players",
                    condition: "هل يشمل الميثاق اللاعبين؟",
                    proofType: "checkbox",
                    proofLabel: "تأكيد ضمن الطلب",
                  },
                  {
                    id: "charter_includes_coaches",
                    condition: "هل يشمل الميثاق المدربين؟",
                    proofType: "checkbox",
                    proofLabel: "تأكيد ضمن الطلب",
                  },
                  {
                    id: "charter_includes_parents",
                    condition: "هل يشمل الميثاق الأهالي؟",
                    proofType: "checkbox",
                    proofLabel: "تأكيد ضمن الطلب",
                  },
                  {
                    id: "charter_signed",
                    condition:
                      "هل تم توقيع أو اعتماد الميثاق من الأطراف المعنية؟",
                    proofType: "file",
                    proofLabel: "نسخة موقعة أو تعهدات مرفقة",
                  },
                  {
                    id: "charter_explained",
                    condition: "هل يتم شرح الميثاق قبل بداية الموسم؟",
                    proofType: "checkbox",
                    proofLabel: "تأكيد ضمن الطلب",
                  },
                ].map((req) => renderRequirement(req as any))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Child Protection */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              حماية الطفل
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              هل توجد سياسة مكتوبة لحماية الطفل؟
            </p>
          </div>
          <div className="p-6">
            <p className="mb-6 text-sm text-[#64748B] leading-relaxed bg-[#F6F1E7] p-4 rounded-2xl italic border-r-4 border-[#C9A227]">
              يُشترط لتصنيف أكاديمية مستوى A وجود سياسة مكتوبة وواضحة لحماية
              الطفل، تضمن التعامل الآمن وتحدد آليات الوقاية والإبلاغ.
            </p>
            <div className="mb-6">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد سياسة مكتوبة لحماية الطفل؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.cp_policy_status?.value === "نعم"}
                    onChange={() =>
                      handleInputChange("cp_policy_status", "نعم")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.cp_policy_status?.value === "كلا"}
                    onChange={() =>
                      handleInputChange("cp_policy_status", "كلا")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.cp_policy_status?.value === "نعم" && (
                <div className="mt-4 border-t border-[#E5DED0] pt-4">
                  {renderUploadField(
                    "cp_policy_doc",
                    "رفع نسخة عن سياسة حماية الطفل",
                  )}
                </div>
              )}
              {data.cp_policy_status?.value === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  هذا المتطلب إلزامي لاستكمال الملف.
                </div>
              )}
            </div>

            {data.cp_policy_status?.value === "نعم" && (
              <div className="border-t border-[#E5DED0] pt-2">
                {renderYesNoRequirement(
                  "هل تتضمن السياسة منع العنف الجسدي أو اللفظي؟",
                  "cp_no_violence_status",
                )}
                {renderYesNoRequirement(
                  "هل تتضمن السياسة منع التنمر والتمييز؟",
                  "cp_no_bullying_status",
                )}
                {renderYesNoRequirement(
                  "هل تتضمن السياسة منع التواصل الفردي غير الآمن مع اللاعبين؟",
                  "cp_safe_comm_status",
                )}
                {renderYesNoRequirement(
                  "هل توجد آلية واضحة للإبلاغ عن المخالفات؟",
                  "cp_reporting_mechanism_status",
                  "cp_reporting_mechanism_doc",
                  "شرح آلية الإبلاغ أو نموذج الإبلاغ",
                )}
                {renderYesNoRequirement(
                  "هل تم تعيين شخص مسؤول عن حماية الطفل داخل الأكاديمية؟",
                  "cp_officer_name_status",
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  "cp_officer_name",
                )}
                {renderYesNoRequirement(
                  "هل تم إبلاغ المدربين والإداريين بسياسة حماية الطفل؟",
                  "cp_staff_informed_status",
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Workshops & Awareness */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">theater_comedy</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                ورش العمل والتوعية
              </h2>
              <p className="text-xs text-[#64748B]">
                تنظيم جلسات توعية للمدربين والأهالي واللاعبين.
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <p className="font-bold text-[#022C22] mb-4">
                هل توجد خطة ورش عمل أو جلسات توعية سنوية؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.workshop_plan_status?.value === "نعم"}
                    onChange={() =>
                      handleInputChange("workshop_plan_status", "نعم")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.workshop_plan_status?.value === "كلا"}
                    onChange={() =>
                      handleInputChange("workshop_plan_status", "كلا")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.workshop_plan_status?.value === "نعم" && (
                <div className="border-t border-[#E5DED0] pt-4">
                  {renderYesNoRequirement(
                    "هل يوجد سجل حضور للورش أو التوعية؟",
                    "ws_attendance_doc_status",
                    "ws_attendance_doc",
                    "لائحة حضور أو صور من الورش",
                  )}
                  {renderYesNoRequirement(
                    "هل يوجد شخص مسؤول عن تنسيق الورش داخل الأكاديمية؟",
                    "ws_coordinator_name_status",
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    "ws_coordinator_name",
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Parent Communication */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden mb-12">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">contact_phone</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                التواصل مع الأهالي
              </h2>
              <p className="text-xs text-[#64748B]">
                آلية واضحة للتواصل التربوي والتنظيمي.
              </p>
            </div>
          </div>
          <div className="p-6">
            {renderYesNoRequirement(
              "هل توجد آلية رسمية للتواصل مع الأهالي؟",
              "parent_comm_doc_status",
              "parent_comm_doc",
              "شرح الآلية أو نموذج تواصل",
            )}
            {renderYesNoRequirement(
              "هل يتم إبلاغ الأهالي بقواعد السلوك وسياسة حماية الطفل؟",
              "parent_notified_rules_status",
            )}
            {renderYesNoRequirement(
              "هل توجد قناة تواصل معتمدة للأهالي؟",
              "parent_comm_channel_status",
              undefined,
              undefined,
              "parent_comm_channel_text",
              "مثال: مجموعات واتساب، إيميل رسمي، تطبيق",
            )}
            {renderYesNoRequirement(
              "هل يتم التعامل مع شكاوى الأهالي وفق آلية واضحة؟",
              "parent_complaints_confirm_status",
              "parent_complaints_doc",
              "نموذج شكاوى أو آلية مكتوبة",
            )}
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الرعاية والتعليم"
          icon="shield_person"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - محور الرعاية"
          backLink="/dashboard"
          items={[
            {
              label: "ميثاق السلوك",
              isActive: data.behavior_charter_doc?.uploaded ? true : false,
            },
            {
              label: "سياسة حماية الطفل",
              isActive: data.cp_policy_doc?.uploaded ? true : false,
            },
            {
              label: "الورش السنوية",
              isActive: data.workshop_plan_doc?.uploaded ? true : false,
            },
            {
              label: "نظام الشكاوى",
              isActive:
                data.parent_complaints_confirm_status === true ? true : false,
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/a/health"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: الصحة
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B]/5 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/equipment"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-md"
            >
              التالي: المعدات والتجهيزات
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
