import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { getRegistryData, ROLE_KEYS } from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";

interface Requirement {
  id: string;
  condition: string;
  proofType: "file" | "checkbox" | "text" | "date";
  proofLabel: string;
  details?: string;
  optional?: boolean;
  placeholder?: string;
}

export default function ClassificationAHealth() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);
  const [medicalStaff, setMedicalStaff] = useState<any[]>([]);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/health");

    // Load Axis Data
    const saved = appStorage.getItem("classificationA_health");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved data");
      }
    }

    // Load Medical Staff from Registry
    const registry = getRegistryData();
    const medicalRoles = [
      "medicalManager",
      "doctor",
      "physiotherapist",
      "paramedic",
      "otherMedicalStaff",
    ];
    const filtered = registry.people.filter((p) =>
      medicalRoles.includes(p.roleKey),
    );
    setMedicalStaff(filtered);
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
    appStorage.setItem("classificationA_health", JSON.stringify(payload));
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

  const handleInputChange = (id: string, value: string) => {
    setData((prev) => {
      const newData = { ...prev, [id]: { type: "text", value } };
      saveProgress(newData);
      return newData;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    let completedCount = 0;
    const requirements = [
      { status: "first_aid_kit_status", file: "first_aid_kit_file" },
      { status: "on_site_medic_status" },
      { status: "injury_protocol_status", file: "injury_protocol_file" },
      {
        status: "emergency_transport_status",
        text: "emergency_transport_desc",
      },

      { status: "facility_cleaning_status", file: "facility_cleaning_file" },
      { status: "potable_water_status" },
      { status: "safe_facility_confirm_status" },
      { status: "evacuation_plan_status", file: "evacuation_plan_file" },
      { status: "waste_management_status", file: "waste_management_file" },
      { status: "assembly_point_status", file: "assembly_point_file" },

      { status: "insurance_policy_status", file: "insurance_policy" },
      { status: "insured_players_list_status", file: "insured_players_list" },
    ];

    requirements.forEach((req) => {
      const statusVal = currentData[req.status]?.value;
      if (statusVal === "كلا") {
        completedCount++;
      } else if (statusVal === "نعم") {
        let isComplete = true;
        if (req.file && !currentData[req.file]?.uploaded) isComplete = false;
        if (
          req.text &&
          (!currentData[req.text]?.value ||
            currentData[req.text].value.trim() === "")
        )
          isComplete = false;
        if (isComplete) completedCount++;
      }
    });

    if (currentData["insurance_policy_status"]?.value === "نعم") {
      const extraFields = [
        "insurance_hospital",
        "insurance_hospital_file",
        "insurance_start_date",
        "insurance_end_date",
      ];
      extraFields.forEach((f) => {
        const field = currentData[f];
        if (field?.uploaded || (field?.value && field.value.trim() !== ""))
          completedCount++;
      });
    }

    // Medical staff check
    const hasStaff = medicalStaff.length > 0;
    if (hasStaff) completedCount++;

    const total =
      requirements.length +
      (currentData["insurance_policy_status"]?.value === "نعم" ? 4 : 0) +
      1;
    return {
      total,
      completed: completedCount,
      percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
      hasStaff,
      hasInsurance: !!currentData.insurance_policy?.uploaded,
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
                {helperText || "صورة أو PDF (JPG, PNG)"}
              </span>
            </div>
            </UploadTrigger>
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
              <span className="text-sm font-bold text-[#022C22]">تأكيد</span>
              {data[req.id]?.checked && (
                <span className="material-symbols-outlined text-green-600 text-[18px] mr-auto">
                  check_circle
                </span>
              )}
            </label>
          ) : (
            <input
              type={req.proofType === "date" ? "date" : "text"}
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

  const renderYesNoRequirement = (
    label: string,
    statusKey: string,
    fileKey?: string,
    fileLabel?: string,
    textKey?: string,
    textPlaceholder?: string,
    noMessage?: string,
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
        تم حفظ محور الصحة كمسودة
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
            <span className="text-white font-bold">الصحة</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/facilities"
          nextPath="/classification/a/safeguarding"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور السابع: الصحة
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور جاهزية الأكاديمية الصحية والطبية من حيث وجود جهاز
            طبي، حقيبة إسعافات، بروتوكول إصابات، مستشفى مرجعي، وتأمين صحي
            للاعبين.
          </p>
        </div>

        {/* Section 1: Medical Staff */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              الجهاز الطبي الأساسي
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              يُشترط توفر جهاز طبي مؤهل للتعامل مع الإصابات والحالات الطارئة.
            </p>
          </div>
          <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-[#064E3B]">
                الجهاز الطبي المسجل (من سجل الأكاديمية)
              </h3>
              <Link
                to="/academy-registry"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#064E3B] hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">
                  edit
                </span>
                تعديل في السجل
              </Link>
            </div>

            {medicalStaff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicalStaff.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 bg-white border border-[#E5DED0] rounded-2xl flex items-start gap-4 hover:border-[#064E3B] transition-colors group"
                  >
                    <div className="w-12 h-12 bg-[#064E3B]/5 rounded-full flex items-center justify-center text-[#064E3B] group-hover:bg-[#064E3B] group-hover:text-white transition-all text-xl font-bold overflow-hidden">
                      {person.files?.profilePhoto?.preview ? (
                        <img
                          src={(person?.files?.profilePhoto?.preview || person?.files?.profilePhoto?.downloadURL || person?.files?.profilePhoto?.url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined">
                          person
                        </span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-[#022C22]">
                          {person.fullName}
                        </h4>
                        <span className="text-[10px] bg-[#064E3B]/10 text-[#064E3B] px-2 py-0.5 rounded-full font-bold">
                          {ROLE_KEYS[
                            person.roleKey as keyof typeof ROLE_KEYS
                          ] || person.roleLabel}
                        </span>
                      </div>
                      <div className="text-xs text-[#64748B] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">
                          phone
                        </span>
                        {person.phone || "لا يوجد هاتف"}
                      </div>
                      <div className="text-xs text-[#64748B] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">
                          school
                        </span>
                        {person.certificateType || "لا يوجد مؤهل مسجل"}
                      </div>
                      <div className="pt-2">
                        {person.files?.certificate?.uploaded ? (
                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 font-bold flex items-center w-fit gap-1">
                            <span className="material-symbols-outlined text-[12px]">
                              verified
                            </span>
                            المؤهل مرفوع
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 font-bold flex items-center w-fit gap-1">
                            <span className="material-symbols-outlined text-[12px]">
                              warning
                            </span>
                            المؤهل غير مرفوع
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#BA1A1A]/5 border border-[#BA1A1A]/20 p-8 rounded-3xl text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-[#BA1A1A]/10 rounded-full flex items-center justify-center text-[#BA1A1A]">
                  <span className="material-symbols-outlined text-4xl">
                    medical_services
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-[#BA1A1A] text-lg">
                    لم يتم تسجيل أي عضو من الجهاز الطبي
                  </h4>
                  <p className="text-[#BA1A1A]/70 text-sm mt-1">
                    يجب إضافة طبيب أو معالج أو مدير علاج في سجل الأكاديمية
                    لاستيفاء هذا المتطلب.
                  </p>
                </div>
                <Link
                  to="/academy-registry"
                  className="px-6 py-3 bg-[#BA1A1A] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#930006] transition-all"
                >
                  إضافة في سجل الأكاديمية
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Medical Readiness */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">pill</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                الجاهزية الطبية الأساسية
              </h2>
              <p className="text-xs text-[#64748B]">
                الحقائب الطبية والبروتوكولات.
              </p>
            </div>
          </div>
          <div className="p-6">
            {renderYesNoRequirement(
              "هل تتوفر حقيبة إسعافات أولية في كل حصة تدريب أو مباراة؟",
              "first_aid_kit_status",
              "first_aid_kit_file",
              "صورة حقيبة الإسعافات أو قائمة محتوياتها",
            )}
            {renderYesNoRequirement(
              "هل يتواجد طبيب أو معالج في الحصص التدريبية والمباريات أو عند الحاجة؟",
              "on_site_medic_status",
            )}
            {renderYesNoRequirement(
              "هل يوجد بروتوكول واضح ومكتوب للتعامل مع الاصابات؟",
              "injury_protocol_status",
              "injury_protocol_file",
              "نسخة عن بروتوكول الإصابات",
            )}
            {renderYesNoRequirement(
              "هل تتوفر وسيلة نقل أو خطة إسعاف للحالات الطارئة؟",
              "emergency_transport_status",
              undefined,
              undefined,
              "emergency_transport_desc",
              "اكتب التفاصيل هنا...",
            )}
          </div>
        </div>

        {/* Section 3: Safety & Hygiene */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">
                cleaning_services
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                السلامة والنظافة داخل المنشأة
              </h2>
              <p className="text-xs text-[#64748B]">
                بيئة تدريب صحية وآمنة ومخارج طوارئ.
              </p>
            </div>
          </div>
          <div className="p-6">
            {renderYesNoRequirement(
              "هل يوجد بروتوكول مكتوب لتنظيف غرف الملابس ودورات المياه؟",
              "facility_cleaning_status",
              "facility_cleaning_file",
              "صور أو جدول تنظيف",
            )}
            {renderYesNoRequirement(
              "هل تتوفر مياه صالحة للشرب؟",
              "potable_water_status",
            )}
            {renderYesNoRequirement(
              "هل تخلو المنشأة من مخاطر واضحة؟",
              "safe_facility_confirm_status",
            )}
            {renderYesNoRequirement(
              "هل توجد خطة طوارق مكتوبة في حال اندلاع حريق او اي كارثة طبيعية او حدث امن؟",
              "evacuation_plan_status",
              "evacuation_plan_file",
              "خطة إخلاء أو رسم توضيحي",
            )}
            {renderYesNoRequirement(
              "هل تتوفر وسائل جمع النفايات؟",
              "waste_management_status",
              "waste_management_file",
              "صورة فوتوغرافية",
            )}
            {renderYesNoRequirement(
              "هل تم تحديد نقطة تجمع آمنة في حال الطوارئ؟",
              "assembly_point_status",
              "assembly_point_file",
              "ملف داعم",
            )}
          </div>
        </div>

        {/* Section 4: Health Insurance */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">
                health_and_safety
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                التأمين الصحي
              </h2>
              <p className="text-xs text-[#64748B]">
                تغطية صحية شاملة للاعبين.
              </p>
            </div>
          </div>
          <div className="p-6">
            <p className="mb-6 text-sm text-[#64748B] leading-relaxed bg-[#F6F1E7] p-4 rounded-2xl italic border-r-4 border-[#C9A227]">
              يُشترط للأكاديمية المصنفة مستوى A أن تضمن تغطية صحية كافية
              للاعبين، سواء من خلال تأمين صحي خاص أو بوليصة حوادث رياضية أو
              إثبات آلية واضحة للتعامل مع الإصابات.
            </p>
            <div className="mb-6">
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد تأمين صحي أو بوليصة حوادث للاعبين؟
              </p>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.insurance_policy_status?.value === "نعم"}
                    onChange={() =>
                      handleInputChange("insurance_policy_status", "نعم")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">نعم</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={data.insurance_policy_status?.value === "كلا"}
                    onChange={() =>
                      handleInputChange("insurance_policy_status", "كلا")
                    }
                    className="accent-[#064E3B] w-4 h-4"
                  />
                  <span className="text-sm font-bold">كلا</span>
                </label>
              </div>
              {data.insurance_policy_status?.value === "نعم" && (
                <div className="mt-4 border-t border-[#E5DED0] pt-4">
                  {renderUploadField(
                    "insurance_policy",
                    "رفع نسخة عن بوليصة التأمين أو إثبات التغطية",
                  )}
                </div>
              )}
              {data.insurance_policy_status?.value === "كلا" && (
                <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                  هذا المتطلب إلزامي لاستكمال الملف. يجب توفير تأمين صحي.
                </div>
              )}
            </div>

            {data.insurance_policy_status?.value === "نعم" && (
              <div className="border-t border-[#E5DED0] pt-4">
                <div className="mb-6">
                  <p className="font-bold text-[#022C22] mb-4">
                    هل توجد لائحة بأسماء اللاعبين المشمولين بالتغطية؟
                  </p>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={
                          data.insured_players_list_status?.value === "نعم"
                        }
                        onChange={() =>
                          handleInputChange(
                            "insured_players_list_status",
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
                          data.insured_players_list_status?.value === "كلا"
                        }
                        onChange={() =>
                          handleInputChange(
                            "insured_players_list_status",
                            "كلا",
                          )
                        }
                        className="accent-[#064E3B] w-4 h-4"
                      />
                      <span className="text-sm font-bold">كلا</span>
                    </label>
                  </div>
                  {data.insured_players_list_status?.value === "نعم" && (
                    <div className="mt-4 border-t border-[#E5DED0] pt-4">
                      {renderUploadField(
                        "insured_players_list",
                        "لائحة أسماء اللاعبين المشمولين بالتغطية",
                      )}
                    </div>
                  )}
                  {data.insured_players_list_status?.value === "كلا" && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-200 mt-4">
                      هذا المتطلب إلزامي لاستكمال الملف.
                    </div>
                  )}
                </div>
                <div className="border-t border-[#E5DED0] pt-2">
                  {[
                    {
                      id: "insurance_hospital",
                      condition:
                        "هل تم تحديد المستشفى أو المركز الطبي المعتمد؟",
                      proofType: "text",
                      proofLabel: "اسم المستشفى/المركز",
                      placeholder: "أدخل اسم المستشفى المعتمد ضمن التأمين",
                    },
                    {
                      id: "insurance_hospital_file",
                      condition: "مستند يثبت اعتماد المركز",
                      proofType: "file",
                      proofLabel: "ملف داعم",
                    },
                    {
                      id: "insurance_start_date",
                      condition: "تاريخ بداية التغطية",
                      proofType: "date",
                      proofLabel: "تاريخ البداية",
                    },
                    {
                      id: "insurance_end_date",
                      condition: "تاريخ نهاية التغطية",
                      proofType: "date",
                      proofLabel: "تاريخ النهاية",
                    },
                  ].map((req) => renderRequirement(req as any))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الصحة"
          icon="monitor_heart"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - محور الصحة"
          backLink="/dashboard"
          items={[
            { label: "تسجيل الجهاز الطبي", isActive: progress.hasStaff },
            { label: "وثيقة التأمين الصحي", isActive: progress.hasInsurance },
            {
              label: "الملحقات المرفوعة",
              isActive:
                Object.values(data).filter(
                  (v: any) => v.type === "file" && v.uploaded,
                ).length > 0,
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/a/facilities"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: الملعب والمرافق
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/safeguarding"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-md active:scale-95 group"
            >
              التالي: الرعاية والتعليم
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
