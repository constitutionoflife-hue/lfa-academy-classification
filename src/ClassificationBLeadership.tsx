import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPersonByRole, RegistryPerson } from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

interface Requirement {
  id: string;
  condition: string;
  proofType: "file" | "checkbox" | "note";
  proofLabel: string;
}

const getOwnerRequirements = (nationality?: string): Requirement[] => {
  const reqs: Requirement[] = [
    {
      id: "owner_1",
      condition: "سجل عدلي نظيف (لا حكم عليه)",
      proofType: "file",
      proofLabel: "سجل عدلي",
    },
    {
      id: "owner_2",
      condition: "أن يكون عمره 28 سنة وما فوق",
      proofType: "checkbox",
      proofLabel: "تم التحقق من الهوية أو تاريخ الميلاد",
    },
    {
      id: "owner_3",
      condition:
        "أن يمثل الأكاديمية أمام الاتحاد اللبناني لكرة القدم والجهات الرسمية الأخرى",
      proofType: "checkbox",
      proofLabel: "تأكيد",
    },
    {
      id: "owner_4",
      condition: "يُمنع عليه إشغال أي منصب آخر ضمن الأكاديمية",
      proofType: "checkbox",
      proofLabel: "تأكيد",
    },
  ];

  return reqs;
};

const getSupervisorRequirements = (
  supervisorType?: string,
  nationality?: string,
): Requirement[] => {
  const reqs: Requirement[] = [
    {
      id: "sup_1",
      condition: "سجل عدلي لا يعود لأكثر من 3 أشهر",
      proofType: "file",
      proofLabel: "سجل عدلي",
    },
    {
      id: "sup_2",
      condition: "أن يكون عمره 28 سنة وما فوق",
      proofType: "checkbox",
      proofLabel: "تم التحقق من الهوية أو تاريخ الميلاد",
    },
    {
      id: "sup_3",
      condition: "أن يكون لديه خبرة في العمل الاداري أو الرياضي لا تقل عن 3 سنوات",
      proofType: "file",
      proofLabel: "سيرة ذاتية",
    },
    {
      id: "sup_4",
      condition: "شهادة التدريب كحد أدنى مستوى B",
      proofType: "file",
      proofLabel: "صورة عن الشهادة",
    },
    {
      id: "sup_5",
      condition: "عقد عمل موقع من الطرفين",
      proofType: "file",
      proofLabel: "صورة عن عقد العمل",
    },
  ];

  return reqs;
};

export default function ClassificationBLeadership() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);

  const bOwner = getPersonByRole("bOwner");
  const bGeneralSupervisor = getPersonByRole("bGeneralSupervisor");

  const ownerRequirements = getOwnerRequirements(bOwner?.nationality);
  const supervisorRequirements = getSupervisorRequirements(
    bGeneralSupervisor?.notes,
    bGeneralSupervisor?.nationality,
  );

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/leadership");
    const saved = appStorage.getItem("classificationB_leadership");
    if (saved) {
      try {
        setData(JSON.parse(saved));
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
    appStorage.setItem("classificationB_leadership", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
    appStorage.setItem("selectedClassification", "B");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
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
          const newData = {
            ...prev,
            [id]: fileData,
          };
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

  const isRegistryReqCompleted = (id: string) => {
    // Check if identity/cert is implicitly completed through the registry's files
    const ownerPerson = getPersonByRole("bOwner");
    const supPerson = getPersonByRole("bGeneralSupervisor");

    if (id === "owner_1" && ownerPerson) {
      if (ownerPerson.files?.criminalRecord?.uploaded) return true;
    }
    if (id === "owner_2" && ownerPerson?.dateOfBirth) return true;

    if (id === "sup_1" && supPerson) {
      if (supPerson.files?.criminalRecord?.uploaded) return true;
    }
    if (id === "sup_2" && supPerson?.dateOfBirth) return true;
    if (id === "sup_3" && supPerson?.files?.cv?.uploaded) return true;
    if (id === "sup_4" && supPerson?.files?.certificate?.uploaded) return true;
    if (id === "sup_5" && supPerson?.files?.contract?.uploaded) return true;

    return false;
  };

  const isSectionCompleted = (reqs: Requirement[]) => {
    return reqs.every((req) => {
      if (req.proofType === "note") return true;
      if (isRegistryReqCompleted(req.id)) return true;
      if (data[req.id]) {
        if (data[req.id].type === "file" && data[req.id].uploaded) return true;
        if (data[req.id].type === "checkbox" && data[req.id].checked)
          return true;
      }
      return false;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    let total = 0;
    let completed = 0;

    const checkList = [...ownerRequirements, ...supervisorRequirements];
    checkList.forEach((req) => {
      if (req.proofType === "note") {
        completed++;
        total++;
      } else {
        total++;
        if (isRegistryReqCompleted(req.id)) {
          completed++;
        } else if (currentData[req.id]) {
          if (
            currentData[req.id].type === "file" &&
            currentData[req.id].uploaded
          )
            completed++;
          if (
            currentData[req.id].type === "checkbox" &&
            currentData[req.id].checked
          )
            completed++;
        }
      }
    });

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  useEffect(() => {
    const saved = appStorage.getItem("classificationB_leadership");
    const parsed = saved ? JSON.parse(saved) : {};
    if (parsed.completionPercentage !== progress.percentage) {
      const payload = {
        ...parsed,
        completionPercentage: progress.percentage,
        status:
          progress.percentage === 0
            ? "لم يبدأ"
            : progress.percentage === 100
              ? "مكتمل"
              : progress.percentage >= 50
                ? "مكتمل جزئيًا"
                : "قيد التعبئة",
      };
      appStorage.setItem("classificationB_leadership", JSON.stringify(payload));
    }
  }, [progress.percentage]);

  const getStatusLabel = () => {
    if (progress.percentage === 0) return "غير مكتمل";
    if (progress.percentage === 100) return "مكتمل";
    return "مكتمل جزئيًا";
  };

  const renderRequirement = (req: Requirement) => {
    const fromRegistry = isRegistryReqCompleted(req.id);
    const isCompleted =
      req.proofType === "note"
        ? true
        : fromRegistry ||
          (data[req.id]?.type === "file" && data[req.id]?.uploaded) ||
          (data[req.id]?.type === "checkbox" && data[req.id]?.checked);

    let docName = data[req.id]?.name;
    const supPerson = getPersonByRole("bGeneralSupervisor");
    const ownerPerson = getPersonByRole("bOwner");
    if (fromRegistry) {
      if (req.id === "owner_1")
        docName = ownerPerson?.files?.criminalRecord?.name;
      if (req.id === "sup_1") docName = supPerson?.files?.criminalRecord?.name;
      if (req.id === "sup_3") docName = supPerson?.files?.cv?.name;
      if (req.id === "sup_4") docName = supPerson?.files?.certificate?.name;
      if (req.id === "sup_5") docName = supPerson?.files?.contract?.name;
    }

    return (
      <div
        key={req.id}
        className="py-4 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
      >
        <div className="flex-1">
          <p className="font-bold text-[#022C22] mb-1">{req.condition}</p>
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <span className="material-symbols-outlined text-[16px]">
              {req.proofType === "file"
                ? "attach_file"
                : req.proofType === "checkbox"
                  ? "check_box"
                  : "info"}
            </span>
            <span>{req.proofLabel}</span>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex items-center md:justify-end">
          {req.proofType === "note" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold border border-gray-200">
              <span className="material-symbols-outlined text-[16px]">
                schedule
              </span>
              يُحدد لاحقاً
            </span>
          ) : isCompleted ? (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${fromRegistry ? "bg-[#064E3B]/10 text-[#064E3B] border-[#064E3B]/20" : "bg-green-50 text-green-700 border-green-200"} rounded-lg text-sm font-bold border w-full md:w-auto justify-center`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                {fromRegistry
                  ? "مستخرج من السجل"
                  : req.proofType === "checkbox"
                    ? "تم التأكيد"
                    : "تم الرفع"}
              </span>
              {req.proofType === "file" && docName && (
                <span
                  className="text-sm text-[#64748B] max-w-[150px] truncate block"
                  dir="ltr"
                  title={docName}
                >
                  {docName}
                </span>
              )}
              {!fromRegistry && (
                <label className="text-sm text-[#064E3B] underline cursor-pointer hover:text-[#022C22] shrink-0">
                  تعديل
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileUpload(req.id, e)}
                  />
                </label>
              )}
              {!fromRegistry && req.proofType === "file" && (
                <button
                  onClick={() => handleFileCancel(req.id)}
                  className="text-sm text-red-600 underline hover:text-red-800 shrink-0"
                >
                  إلغاء الملف
                </button>
              )}
            </div>
          ) : (
            <div className="w-full md:w-auto">
              {req.proofType === "file" ? (
                <label className="flex items-center justify-center gap-2 bg-white border border-[#E5DED0] text-[#064E3B] px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full">
                  <span className="material-symbols-outlined text-[20px]">
                    upload
                  </span>
                  <span className="font-bold text-sm">رفع الدليل</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileUpload(req.id, e)}
                  />
                </label>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white border border-[#E5DED0] rounded-lg w-full">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[#064E3B] rounded"
                    onChange={(e) => handleCheckboxChange(req.id, e)}
                  />
                  <span className="text-sm font-bold text-[#022C22]">
                    تأكيد
                  </span>
                </label>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProfileCard = (roleKey: string, title: string) => {
    const person = getPersonByRole(roleKey);
    if (!person) {
      return (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined">person_off</span>
            </div>
            <div>
              <div className="text-red-800 font-bold mb-1">
                بيانات {title} غير مكتملة
              </div>
              <div className="text-xs text-red-600">
                يرجى إضافة الشخص في سجل الأكاديمية لاستخراج بياناته الأساسية
                تلقائيًا.
              </div>
            </div>
          </div>
          <Link
            to="/academy-registry"
            className="shrink-0 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
          >
            اذهب للسجل
          </Link>
        </div>
      );
    }

    return (
      <div className="mb-6 p-4 rounded-xl border border-[#064E3B]/20 bg-[#064E3B]/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white border border-[#064E3B]/20 flex items-center justify-center text-[#064E3B] font-bold text-xl">
            {person.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-[#022C22] text-lg">
              {person.fullName}
            </div>
            <div className="text-sm text-[#64748B] flex items-center gap-2">
              <span>{title}</span>
              {person.nationality && <span>• {person.nationality}</span>}
            </div>
          </div>
        </div>
        <Link
          to="/academy-registry"
          className="text-sm text-[#064E3B] font-bold underline hover:text-[#022C22]"
        >
          تعديل البيانات الأساسية
        </Link>
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
        تم الحفظ تلقائياً
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
            <span className="text-white/80">تصنيف B</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">القيادة</span>
          </div>
          <Link
            to="/academy-registry"
            className="flex items-center gap-2 px-3 py-1 bg-[#C9A227] text-[#022C22] rounded-lg font-bold text-xs hover:bg-[#D4B145] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            سجل الأكاديمية
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav nextPath="/classification/b/planning" />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف B
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الأول B: القيادة والمشرف العام
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور وضوح القيادة الإدارية والفنية داخل الأكاديمية،
            وتحديد الأشخاص المسؤولين أمام الاتحاد، مع تقديم الأدلة المطلوبة
            لإثبات الجاهزية التنظيمية.
          </p>
        </div>

        {/* Intro */}
        <div className="bg-[#064E3B] text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#C9A227]"></div>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#C9A227]">
                supervisor_account
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#C9A227] mb-3">
                ما المطلوب في محور القيادة (B)؟
              </h3>
              <p className="text-white/90 leading-relaxed">
                يُشترط أن تمتلك الأكاديمية قيادة واضحة تتمثل في مالك الأكاديمية
                والمشرف العام (الفني أو الإداري حسب دورهم)، مع تقديم المستندات
                التي تثبت الأهلية والخبرة.
              </p>
            </div>
          </div>
        </div>

        {/* Section A: Owner */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                أ
              </div>
              مالك الأكاديمية
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              مالك الأكاديمية يكون مسؤولًا عن اتخاذ القرار والإشراف الإداري
              العام ولضمان الالتزام بأنظمة الاتحاد، ويمثل الأكاديمية رسميًا
              كمتحدث مفوض.
            </p>
          </div>
          <div className="p-6">
            {renderProfileCard("bOwner", "مالك الأكاديمية")}
            <div className="flex flex-col">
              {ownerRequirements.map(renderRequirement)}
            </div>
          </div>
        </div>

        {/* Section B: General Supervisor */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                ب
              </div>
              المشرف العام ({bGeneralSupervisor?.notes || "فني أو إداري"})
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              المشرف العام هو من يضمن تناسق العمليات ويملك الخبرات المطلوبة سواء
              أكان دوره إدارياً أم فنياً. يجب أن يعمل بموجب عقد موقع من الطرفين،
              ويكون مسؤولاً عن جودة التنظيم.
            </p>
          </div>
          <div className="p-6">
            {renderProfileCard("bGeneralSupervisor", "المشرف العام")}
            <div className="flex flex-col">
              {supervisorRequirements.map(renderRequirement)}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية القيادة والمشرف العام"
          icon="admin_panel_settings"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف B - المحور الأول"
          backLink="/dashboard"
          items={[
            {
              label: "مالك الأكاديمية",
              isActive: isSectionCompleted(ownerRequirements),
            },
            {
              label: "المشرف العام",
              isActive: isSectionCompleted(supervisorRequirements),
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-colors text-center"
            >
              الرجوع للوحة
            </Link>
            <button
              onClick={() => navigate("/classification/b/planning")}
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              المحور التالي
              <span className="material-symbols-outlined text-[20px] rotate-180">
                arrow_forward
              </span>
            </button>
          </div>
        </AxisSummary>
      </main>
    </div>
  );
}
