import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPeopleByRole,
  getPersonByRole,
  getRegistryData,
  RegistryPerson,
} from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

interface PersonCardProps {
  person?: RegistryPerson;
  roleLabel: string;
  roleKey: string;
  key?: string | number;
}

const PersonCard = ({ person, roleLabel, roleKey }: PersonCardProps) => {
  if (!person) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E5DED0] rounded-2xl p-6 flex flex-col items-center justify-center text-center group hover:border-[#C9A227] transition-all">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-[#C9A227]/10 transition-colors">
          <span className="material-symbols-outlined text-gray-400 group-hover:text-[#C9A227]">
            person_add
          </span>
        </div>
        <h4 className="font-bold text-[#022C22] text-sm mb-1">{roleLabel}</h4>
        <p className="text-xs text-red-400 mb-4 font-bold">
          لم يتم تسجيل {roleLabel} في سجل الأكاديمية
        </p>
        <Link
          to="/academy-registry"
          className="text-xs bg-[#064E3B] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#022C22] transition-colors"
        >
          إضافة في السجل
        </Link>
      </div>
    );
  }

  const hasJD = person.files?.jobDescription?.uploaded;
  const hasCV =
    person.files?.cv?.uploaded || person.files?.supportingDocument?.uploaded;
  const hasCert = person.files?.certificate?.uploaded;
  const hasContract = person.files?.contract?.uploaded;

  const isTechnical =
    roleKey.startsWith("coach") ||
    roleKey === "technicalSupervisor" ||
    roleKey === "medicalManager" ||
    roleKey === "doctor";
  const needsContract = [
    "administrativeManager",
    "technicalSupervisor",
    "coachU10",
    "coachU11",
    "coachU12",
    "coachU13",
    "medicalManager",
    "doctor",
  ].includes(roleKey);

  return (
    <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-1.5 h-full bg-[#064E3B]"></div>

      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
          {person.files?.profilePhoto?.preview ? (
            <img
              src={(person?.files?.profilePhoto?.preview || person?.files?.profilePhoto?.downloadURL || person?.files?.profilePhoto?.url)}
              alt={person.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-gray-300 text-3xl">
              account_circle
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="font-bold text-[#022C22] text-base truncate"
            title={person.fullName}
          >
            {person.fullName}
          </h4>
          <div className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
            {roleLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {person.phone && (
              <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
                <span className="material-symbols-outlined text-[12px]">
                  phone
                </span>
                {person.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {/* Job Description Status */}
        <div
          className={`flex items-center justify-between p-2 rounded-lg border ${hasJD ? "bg-[#064E3B]/5 border-[#064E3B]/10" : "bg-red-50 border-red-100"}`}
        >
          <span className="text-[10px] font-bold text-[#022C22]">
            المسمى الوظيفي
          </span>
          {hasJD ? (
            <div className="flex items-center gap-1 text-[#064E3B] font-bold text-[9px]">
              <span className="material-symbols-outlined text-[14px]">
                check_circle
              </span>
              موجود
            </div>
          ) : (
            <div className="text-[9px] text-red-500 font-bold italic">ناقص</div>
          )}
        </div>

        {/* Certificate Status if applicable */}
        {isTechnical && (
          <div
            className={`flex items-center justify-between p-2 rounded-lg border ${hasCert ? "bg-[#064E3B]/5 border-[#064E3B]/10" : "bg-red-50 border-red-100"}`}
          >
            <span className="text-[10px] font-bold text-[#022C22]">
              الشهادة / المؤهل
            </span>
            {hasCert ? (
              <div className="flex items-center gap-1 text-[#064E3B] font-bold text-[9px]">
                <span className="material-symbols-outlined text-[14px]">
                  verified
                </span>
                {person.certificateType || "موجودة"}
              </div>
            ) : (
              <div className="text-[9px] text-red-500 font-bold italic">
                ناقصة
              </div>
            )}
          </div>
        )}

        {/* Contract Status if applicable */}
        {needsContract && (
          <div
            className={`flex items-center justify-between p-2 rounded-lg border ${hasContract ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"}`}
          >
            <span className="text-[10px] font-bold text-[#022C22]">
              عقد العمل
            </span>
            {hasContract ? (
              <div className="flex items-center gap-1 text-amber-700 font-bold text-[9px]">
                <span className="material-symbols-outlined text-[14px]">
                  assignment
                </span>
                موجود
              </div>
            ) : (
              <div className="text-[9px] text-red-500 font-bold italic">
                ناقص
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link
            to="/academy-registry"
            state={{ editPersonId: person.id }}
            className="flex items-center justify-center gap-1.5 w-full py-2 border border-[#064E3B]/20 text-[#064E3B] rounded-lg text-[11px] font-bold hover:bg-[#064E3B]/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">
              edit_note
            </span>
            تحديث في السجل
          </Link>
        </div>
      </div>
    </div>
  );
};

const ROLE_GROUPS = [
  {
    id: "leadership",
    title: "القيادة والإدارة",
    icon: "corporate_fare",
    roles: [
      { key: "owner", label: "مالك الأكاديمية" },
      { key: "administrativeManager", label: "المدير الإداري" },
    ],
  },
  {
    id: "finance",
    title: "المسؤول المالي",
    icon: "account_balance_wallet",
    roles: [{ key: "financeOfficer", label: "المسؤول المالي" }],
  },
  {
    id: "technical",
    title: "الجهاز الفني",
    icon: "sports_soccer",
    roles: [
      { key: "technicalSupervisor", label: "المشرف الفني" },
      { key: "coachU10", label: "مدرب دون 10" },
      { key: "coachU11", label: "مدرب دون 11" },
      { key: "coachU12", label: "مدرب دون 12" },
      { key: "coachU13", label: "مدرب دون 13" },
    ],
  },
  {
    id: "media",
    title: "الإعلام والتواصل",
    icon: "campaign",
    roles: [
      { key: "mediaOfficer", label: "المسؤول الإعلامي" },
      { key: "socialMediaOfficer", label: "مسؤول التواصل الاجتماعي" },
      { key: "photographer", label: "المصورين", repeatable: true },
    ],
  },
  {
    id: "medical",
    title: "الجهاز الطبي",
    icon: "health_and_safety",
    roles: [
      { key: "medicalManager", label: "مدير العلاج" },
      { key: "doctor", label: "طبيب" },
      { key: "physiotherapist", label: "المعالج الفيزيائي", repeatable: true },
      { key: "paramedic", label: "المسعف", repeatable: true },
      { key: "otherMedicalStaff", label: "مؤهل صحي آخر", repeatable: true },
    ],
  },
];

export default function ClassificationAOrganization() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [registryData, setRegistryData] = useState(getRegistryData());
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/organization");
    const saved = appStorage.getItem("classificationA_organization");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
    // Refresh registry data on mount
    setRegistryData(getRegistryData());
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
    appStorage.setItem("classificationA_organization", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
  };

  const handleRequirementFileUpload = async (
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

  const handleRequirementFileCancel = (id: string) => {
    setData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      saveProgress(newData);
      return newData;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    const mandatoryRoles = [
      "owner",
      "administrativeManager",
      "financeOfficer",
      "technicalSupervisor",
      "coachU10",
      "coachU11",
      "coachU12",
      "coachU13",
      "mediaOfficer",
      "socialMediaOfficer",
      "medicalManager",
    ];

    const rolesRequiringContract = [
      "administrativeManager",
      "technicalSupervisor",
      "coachU10",
      "coachU11",
      "coachU12",
      "coachU13",
      "medicalManager",
      "doctor",
    ];

    let totalPoints = 0;
    let earnedPoints = 0;

    mandatoryRoles.forEach((rk) => {
      totalPoints += 2; // Exist + JD
      const person = registryData.people.find((p) => p.roleKey === rk);
      if (person) {
        earnedPoints += 1;
        if (person.files?.jobDescription?.uploaded) {
          earnedPoints += 1;
        }

        if (rolesRequiringContract.includes(rk)) {
          totalPoints += 1; // Contract
          if (person.files?.contract?.uploaded) {
            earnedPoints += 1;
          }
        }
      } else {
        if (rolesRequiringContract.includes(rk)) {
          totalPoints += 1;
        }
      }
    });

    // Add internal rules file as a requirement
    totalPoints += 1;
    if (currentData.internal_rules?.uploaded) {
      earnedPoints += 1;
    }

    const percentage =
      totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    return { earnedPoints, totalPoints, percentage };
  };

  const progress = calculateProgress();

  const getStatusLabel = () => {
    if (progress.percentage === 0) return "غير مكتمل";
    if (progress.percentage === 100) return "مكتمل";
    return "مكتمل جزئيًا";
  };

  const renderInternalRules = (
    id: string,
    condition: string,
    label: string,
  ) => {
    const isCompleted = data[id]?.type === "file" && data[id]?.uploaded;

    return (
      <div
        key={id}
        className="py-6 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
      >
        <div className="flex-1">
          <p className="font-bold text-[#022C22] mb-1 leading-relaxed">
            {condition}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <span className="material-symbols-outlined text-[16px]">
                attach_file
              </span>
              <span>{label}</span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
          {isCompleted ? (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-200 justify-center">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                تم رفع الملف
              </span>
              <button
                onClick={() => handleRequirementFileCancel(id)}
                className="text-sm text-red-600 underline hover:text-red-800"
              >
                إلغاء الملف
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-center gap-2 bg-[#064E3B] text-white px-6 py-2.5 rounded-xl cursor-pointer hover:bg-[#022C22] transition-colors w-full md:w-auto shadow-sm">
                <span className="material-symbols-outlined text-[20px]">
                  upload
                </span>
                <span className="font-bold text-sm">
                  رفع نسخة النظام الداخلي
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleRequirementFileUpload(id, e)}
                />
              </label>
            </div>
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
            <span className="text-white font-bold">التنظيم</span>
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
        <AxisTopNav
          prevPath="/classification/a/planning"
          nextPath="/classification/a/technical"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الثالث: التنظيم
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور وضوح الهيكلية الإدارية والفنية داخل الأكاديمية،
            وتوثيق بيانات الموظفين المسجلين في "سجل الأكاديمية" مع التأكد من
            وجود المسميات الوظيفية والأدلة المطلوبة.
          </p>
        </div>

        {/* Informational Box */}
        <div className="bg-[#064E3B] text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#C9A227]"></div>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#C9A227]">
                account_tree
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#C9A227] mb-3">
                الربط مع سجل الأكاديمية
              </h3>
              <p className="text-white/90 leading-relaxed text-sm">
                يقرأ هذا المحور البيانات تلقائيًا من{" "}
                <strong>سجل الأكاديمية</strong>. إذا كان هناك نقص في الأسماء أو
                المسميات الوظيفية أو الشهادات، يرجى تحديثها من السجل مباشرة.
                يعتمد اكتمال هذا المحور على تسجيل الكوادر الأساسية الموضحة
                أدناه.
              </p>
            </div>
          </div>
        </div>

        {/* Role Sections */}
        {ROLE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-white border border-[#E5DED0] rounded-xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[#064E3B] font-bold">
                  {group.icon}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-[#022C22]">
                {group.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.roles.map((role) => {
                if (role.repeatable) {
                  const items = getPeopleByRole(role.key);
                  if (items.length === 0) {
                    return (
                      <PersonCard
                        key={role.key}
                        roleLabel={role.label}
                        roleKey={role.key}
                      />
                    );
                  }
                  return items.map((p) => (
                    <PersonCard
                      key={p.id}
                      person={p}
                      roleLabel={role.label}
                      roleKey={role.key}
                    />
                  ));
                }
                const person = getPersonByRole(role.key);
                return (
                  <PersonCard
                    key={role.key}
                    person={person}
                    roleLabel={role.label}
                    roleKey={role.key}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Internal Rules Section */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden mt-8">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                gavel
              </span>
              النظام الداخلي
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              خانة خاصة بالنظام الداخلي حيث يجب رفع نسخة عنه موقعة من المالك
              والمدير الإداري والمشرف الفني.
            </p>
          </div>
          <div className="p-6">
            {renderInternalRules(
              "internal_rules",
              "رفع نسخة النظام الداخلي الموقعة من الكادر القيادي",
              "النظام الداخلي (PDF)",
            )}
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية الهيكل التنظيمي"
          icon="account_tree"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - محور الهيكل التنظيمي"
          backLink="/dashboard"
          items={[
            { label: "مدير الأكاديمية", isActive: !!getPersonByRole("owner") },
            {
              label: "المدير الإداري",
              isActive: !!getPersonByRole("administrativeManager"),
            },
            {
              label: "المشرف الفني",
              isActive: !!getPersonByRole("technicalSupervisor"),
            },
            {
              label: "الجهاز الطبي",
              isActive: !!getPersonByRole("medicalManager"),
            },
            { label: "النظام الداخلي", isActive: !!data.internal_rules_doc },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/a/planning"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
              المحور السابق
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-colors text-center"
            >
              الرجوع للوحة
            </Link>
            <button
              onClick={() => navigate("/classification/a/technical")}
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
