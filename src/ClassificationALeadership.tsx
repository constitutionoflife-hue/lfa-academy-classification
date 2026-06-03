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
  return [
    {
      id: "owner_1",
      condition: "سجل عدلي نظيف (لا حكم عليه)",
      proofType: "file",
      proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر",
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
      proofLabel: "تأكيد واعتماد ضمن الطلب",
    },
    {
      id: "owner_4",
      condition: "يُمنع عليه إشغال أي منصب آخر ضمن الأكاديمية",
      proofType: "checkbox",
      proofLabel: "تأكيد",
    },
  ];
};

const getManagerRequirements = (nationality?: string): Requirement[] => {
  return [
    {
      id: "manager_1",
      condition: "سجل عدلي نظيف (لا حكم عليه)",
      proofType: "file",
      proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر",
    },
    {
      id: "manager_2",
      condition: "أن يكون عمره 25 سنة وما فوق",
      proofType: "checkbox",
      proofLabel: "تم التحقق من الهوية أو تاريخ الميلاد",
    },
    {
      id: "manager_4",
      condition:
        "أن يكون لديه خبرة في العمل الإداري أو الرياضي لا تقل عن 3 سنوات",
      proofType: "file",
      proofLabel: "سيرة ذاتية",
    },
    {
      id: "manager_5",
      condition:
        "أن يمتلك مهارات في القيادة والتواصل وقادر على التنسيق بين الأقسام المختلفة",
      proofType: "checkbox",
      proofLabel: "تأكيد ضمن الطلب أو مقابلة عند الحاجة",
    },
    {
      id: "manager_6",
      condition: "يجب أن يكون حائزًا على شهادة ثانوية عامة أو ما يعادلها",
      proofType: "file",
      proofLabel: "صورة عن الشهادة",
    },
    {
      id: "manager_7",
      condition: "أن يعمل بموجب عقد عمل موقع من الطرفين",
      proofType: "file",
      proofLabel: "صورة عن عقد العمل",
    },
  ];
};

const getTechnicalRequirements = (nationality?: string): Requirement[] => {
  return [
    {
      id: "tech_1",
      condition: "سجل عدلي نظيف (لا حكم عليه)",
      proofType: "file",
      proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر",
    },
    {
      id: "tech_3",
      condition:
        "أن يكون حائزًا على شهادة تدريب A أو B الآسيوية أو ما يعادلهما",
      proofType: "file",
      proofLabel: "نسخة عن الشهادة",
    },
    {
      id: "tech_4",
      condition:
        "أن يكون حائزًا على شهادة الثانوية العامة على الأقل أو ما يعادلها",
      proofType: "file",
      proofLabel: "نسخة عن الشهادة",
    },
    {
      id: "tech_5",
      condition:
        "أن يكون لديه خبرة لا تقل عن 5 سنوات في مجال التدريب أو الإشراف الفني في أكاديميات الواعدين",
      proofType: "file",
      proofLabel: "سيرة ذاتية",
    },
    {
      id: "tech_6",
      condition:
        "أن يكون لديه القدرة على قيادة الجهاز الفني والتخطيط اليومي والأسبوعي والفصلي لجميع الفئات العمرية",
      proofType: "note",
      proofLabel: "مقابلة في الدائرة الفنية",
    },
    {
      id: "tech_7",
      condition: "أن يعمل بموجب عقد عمل موقع من الطرفين",
      proofType: "file",
      proofLabel: "صورة عن عقد العمل",
    },
  ];
};

export default function ClassificationALeadership() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);

  const ownerPerson = getPersonByRole("owner");
  const adminPerson = getPersonByRole("administrativeManager");
  const techPerson = getPersonByRole("technicalSupervisor");

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/leadership");
    const saved = appStorage.getItem("classificationA_leadership");
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
    appStorage.setItem("classificationA_leadership", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
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

  const isRegistryReqCompleted = (id: string) => {
    // Check if identity/cert is implicitly completed through the registry's files
    const ownerPerson = getPersonByRole("owner");
    const adminPerson = getPersonByRole("administrativeManager");
    const techPerson = getPersonByRole("technicalSupervisor");

    if (id === "owner_1" && ownerPerson) {
      const isLebanese =
        ownerPerson.nationality === "لبناني" || !ownerPerson.nationality;
      if (isLebanese && ownerPerson.files?.criminalRecord?.uploaded)
        return true;
      if (!isLebanese && ownerPerson.files?.idDocument?.uploaded) return true;
    }
    if (id === "owner_2" && ownerPerson?.dateOfBirth) return true;

    if (id === "manager_1" && adminPerson) {
      const isLebanese =
        adminPerson.nationality === "لبناني" || !adminPerson.nationality;
      if (isLebanese && adminPerson.files?.criminalRecord?.uploaded)
        return true;
      if (!isLebanese && adminPerson.files?.idDocument?.uploaded) return true;
    }
    if (id === "manager_2" && adminPerson?.dateOfBirth) return true;
    if (id === "manager_4" && adminPerson?.files?.cv?.uploaded) return true;
    if (
      id === "manager_6" &&
      (adminPerson?.files?.cv?.uploaded ||
        adminPerson?.files?.certificate?.uploaded)
    )
      return true;
    if (id === "manager_7" && adminPerson?.files?.contract?.uploaded)
      return true;

    if (id === "tech_1" && techPerson) {
      const isLebanese =
        techPerson.nationality === "لبناني" || !techPerson.nationality;
      if (isLebanese && techPerson.files?.criminalRecord?.uploaded) return true;
      if (!isLebanese && techPerson.files?.idDocument?.uploaded) return true;
    }
    if (id === "tech_3" && techPerson?.files?.certificate?.uploaded)
      return true;
    if (id === "tech_5" && techPerson?.files?.cv?.uploaded) return true;
    if (id === "tech_7" && techPerson?.files?.contract?.uploaded) return true;

    return false;
  };

  const ownerRequirements = getOwnerRequirements(ownerPerson?.nationality);
  const managerRequirements = getManagerRequirements(adminPerson?.nationality);
  const technicalRequirements = getTechnicalRequirements(
    techPerson?.nationality,
  );

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

    const checkList = [
      ...ownerRequirements,
      ...managerRequirements,
      ...technicalRequirements,
    ];
    checkList.forEach((req) => {
      if (req.proofType === "note") {
        completed++; // Assume note/interview is handled externally, or just count as complete for UI
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

  const getStatusLabel = () => {
    if (progress.percentage === 0) return "غير مكتمل";
    if (progress.percentage === 100) return "مكتمل";
    return "مكتمل جزئيًا";
  };

  const renderRequirement = (req: Requirement) => {
    const ownerPerson = getPersonByRole("owner");
    const adminPerson = getPersonByRole("administrativeManager");
    const techPerson = getPersonByRole("technicalSupervisor");

    const fromRegistry = isRegistryReqCompleted(req.id);
    const isCompleted =
      req.proofType === "note"
        ? true
        : fromRegistry ||
          (data[req.id]?.type === "file" && data[req.id]?.uploaded) ||
          (data[req.id]?.type === "checkbox" && data[req.id]?.checked);

    let docName = data[req.id]?.name;
    if (fromRegistry) {
      if (req.id === "owner_1")
        docName =
          ownerPerson?.nationality === "لبناني" || !ownerPerson?.nationality
            ? ownerPerson?.files?.criminalRecord?.name
            : ownerPerson?.files?.idDocument?.name;
      if (req.id === "manager_1")
        docName =
          adminPerson?.nationality === "لبناني" || !adminPerson?.nationality
            ? adminPerson?.files?.criminalRecord?.name
            : adminPerson?.files?.idDocument?.name;
      if (req.id === "manager_6")
        docName =
          adminPerson?.files?.cv?.name || adminPerson?.files?.certificate?.name;
      if (req.id === "manager_7") docName = adminPerson?.files?.contract?.name;
      if (req.id === "tech_1")
        docName =
          techPerson?.nationality === "لبناني" || !techPerson?.nationality
            ? techPerson?.files?.criminalRecord?.name
            : techPerson?.files?.idDocument?.name;
      if (req.id === "tech_3") docName = techPerson?.files?.certificate?.name;
      if (req.id === "tech_5") docName = techPerson?.files?.cv?.name;
      if (req.id === "tech_7") docName = techPerson?.files?.contract?.name;
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
            <span className="text-white/80">تصنيف A</span>
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
        <AxisTopNav nextPath="/classification/a/planning" />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الأول: القيادة
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
                ما المطلوب في محور القيادة؟
              </h3>
              <p className="text-white/90 leading-relaxed">
                يُشترط أن تمتلك الأكاديمية قيادة واضحة ومحددة، تشمل مالك
                الأكاديمية، المدير الإداري، والمشرف الفني، مع تحديد المسؤوليات
                وتقديم المستندات التي تثبت الأهلية والخبرة وعدم تضارب المصالح.
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
              يُشترط أن يكون لدى الأكاديمية قيادة واضحة ممثلة بمالك الأكاديمية،
              على أن يكون مسؤولًا عن اتخاذ القرار والإشراف الإداري العام وضمان
              الالتزام بأنظمة الاتحاد. في حال تعدد الشركاء، يجب تحديد الشخص
              المسؤول صاحب الحصة الأكبر، وأن يكون لبناني الجنسية، ويُعد الممثل
              القانوني المعتمد أمام الاتحاد.
            </p>
          </div>
          <div className="p-6">
            {renderProfileCard("owner", "مالك الأكاديمية")}
            <div className="flex flex-col">
              {ownerRequirements.map(renderRequirement)}
            </div>
          </div>
        </div>

        {/* Section B: Admin Manager */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                ب
              </div>
              المدير الإداري
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              يُشترط تعيين مدير إداري متفرغ أو شبه متفرغ، يكون مسؤولًا عن الشؤون
              التنظيمية والإدارية للأكاديمية، والتنسيق مع الاتحاد، ومتابعة
              التسجيلات والمراسلات والالتزام بالأنظمة المعتمدة. يُعد المدير
              الإداري نقطة التواصل الرسمية بين الأكاديمية والاتحاد، ويتحمل
              مسؤولية حسن التنظيم الإداري وسلامة الإجراءات.
            </p>
          </div>
          <div className="p-6">
            {renderProfileCard("administrativeManager", "المدير الإداري")}
            <div className="flex flex-col">
              {managerRequirements.map(renderRequirement)}
            </div>
          </div>
        </div>

        {/* Section C: Technical Supervisor */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                ج
              </div>
              المشرف الفني
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              يُشترط تعيين مشرف فني مسؤول عن الإشراف على العمل الفني وتوحيد
              المنهج التدريبي ومتابعة المدربين. يجب أن يحمل شهادة تدريب مستوى A
              أو B الآسيوية أو ما يعادلهما، وأن يمتلك خبرة عملية مناسبة في العمل
              مع الفئات العمرية.
            </p>
          </div>
          <div className="p-6">
            {renderProfileCard("technicalSupervisor", "المشرف الفني")}
            <div className="flex flex-col">
              {technicalRequirements.map(renderRequirement)}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الهيكل القيادي والإداري"
          icon="admin_panel_settings"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - المحور الأول"
          backLink="/dashboard"
          items={[
            {
              label: "مالك الأكاديمية",
              isActive: isSectionCompleted(ownerRequirements),
            },
            {
              label: "المدير الإداري",
              isActive: isSectionCompleted(managerRequirements),
            },
            {
              label: "المشرف الفني",
              isActive: isSectionCompleted(technicalRequirements),
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
              onClick={() => navigate("/classification/a/planning")}
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
