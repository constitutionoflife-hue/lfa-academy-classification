import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { AxisSummary } from "./components/AxisSummary";
import { getRegistryData, RegistryPerson } from "./lib/registry";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

const DIPLOMA_HIERARCHY = [
  "D Diploma",
  "C Diploma",
  "Youth Level 1 Diploma",
  "B Diploma",
  "Youth Level 2 Diploma",
  "A Diploma",
  "Pro Diploma",
];

const MIN_REQUIRED_DIPLOMA = "C Diploma";

export default function ClassificationBTechnical() {
  const navigate = useNavigate();
  const [registryPeople, setRegistryPeople] = useState<RegistryPerson[]>([]);

  // State for axis data
  const [hasTwoTeams, setHasTwoTeams] = useState<boolean | null>(null);
  const [teamsParticipationConfirmed, setTeamsParticipationConfirmed] =
    useState(false);
  const [
    canCommitToCoachPlayerFieldStandards,
    setCanCommitToCoachPlayerFieldStandards,
  ] = useState<boolean | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/technical");

    // Load registry data specifically for B
    const regData = getRegistryData();
    setRegistryPeople(regData.people);

    const saved = appStorage.getItem("classificationB_technical");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasTwoTeams !== undefined)
          setHasTwoTeams(parsed.hasTwoTeams);
        if (parsed.teamsParticipationConfirmed !== undefined)
          setTeamsParticipationConfirmed(parsed.teamsParticipationConfirmed);
        if (parsed.canCommitToCoachPlayerFieldStandards !== undefined)
          setCanCommitToCoachPlayerFieldStandards(
            parsed.canCommitToCoachPlayerFieldStandards,
          );
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  const coachU12 = registryPeople.find(
    (p) => p.roleKey === "bCoachU12" || p.roles?.includes("مدرب دون 12"),
  );
  const coachU13 = registryPeople.find(
    (p) => p.roleKey === "bCoachU13" || p.roles?.includes("مدرب دون 13"),
  );

  const checkDiplomaValidity = (diploma?: string) => {
    if (!diploma) return false;
    const index = DIPLOMA_HIERARCHY.indexOf(diploma);
    const minIndex = DIPLOMA_HIERARCHY.indexOf(MIN_REQUIRED_DIPLOMA);
    return index >= minIndex;
  };

  const saveProgress = (currentData: Record<string, any>) => {
    const prog = calculateCompletion(currentData);
    const dataToSave = {
      ...currentData,
      completionPercentage: prog.percentage,
      status: prog.status,
      lastUpdated: new Date().toISOString(),
    };
    appStorage.setItem("classificationB_technical", JSON.stringify(dataToSave));
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const calculateCompletion = (
    currentData: any = {
      hasTwoTeams,
      teamsParticipationConfirmed,
      canCommitToCoachPlayerFieldStandards,
    },
  ) => {
    const required = [
      currentData.hasTwoTeams === true,
      currentData.teamsParticipationConfirmed === true,
      currentData.canCommitToCoachPlayerFieldStandards === true,
      coachU12 !== undefined,
      coachU13 !== undefined,
      checkDiplomaValidity(coachU12?.certificateType),
      checkDiplomaValidity(coachU13?.certificateType),
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
    setData((prev) => {
      const newData = { ...prev, ...updates };
      saveProgress(newData);
      return newData;
    });
  };

  const progress = calculateCompletion();

  useEffect(() => {
    const saved = appStorage.getItem("classificationB_technical");
    const parsed = saved ? JSON.parse(saved) : {};
    if (parsed.completionPercentage !== progress.percentage) {
      const payload = {
        ...parsed,
        completionPercentage: progress.percentage,
        status: progress.status !== "لم يبدأ" ? progress.status : parsed.status,
      };
      if (progress.percentage === 0 && !parsed.status)
        payload.status = "لم يبدأ";
      if (progress.percentage > 0)
        payload.status = progress.percentage === 100 ? "مكتمل" : "مكتمل جزئيًا";
      appStorage.setItem("classificationB_technical", JSON.stringify(payload));
    }
  }, [progress.percentage]);

  const standards = [
    { age: "دون 10", certificate: "D Diploma", players: 14, ball: 4 },
    { age: "دون 11", certificate: "D Diploma", players: 14, ball: 4 },
    { age: "دون 12", certificate: "C Diploma", players: 18, ball: 5 },
    { age: "دون 13", certificate: "C Diploma", players: 18, ball: 5 },
  ];

  const [data, setData] = useState<Record<string, any>>({});

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
            <span className="text-white text-xs opacity-70">الجانب الفني</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/organization"
          nextPath="/classification/b/facilities"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#064E3B]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            تصنيف B - المحور الرابع: الجانب الفني
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور جاهزية الأكاديمية الفنية للمشاركة في دوريات
            الواعدين من خلال وجود فريقين على الأقل، وتوفر المدربين واللاعبين
            والملاعب وفق الشروط المحددة.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                sports_soccer
              </span>
              المحور 4 من 7
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

        {/* Section 1: Teams */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">فرق الواعدين</h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5DED0] p-6 md:p-8 space-y-6">
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل يوجد فريقان على الأقل للمشاركة في دوريات الواعدين؟
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setHasTwoTeams(true);
                    handleUpdate({ hasTwoTeams: true });
                  }}
                  className={`px-8 py-3 rounded-xl font-bold transition-all border-2 ${hasTwoTeams === true ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
                >
                  نعم
                </button>
                <button
                  onClick={() => {
                    setHasTwoTeams(false);
                    handleUpdate({ hasTwoTeams: false });
                  }}
                  className={`px-8 py-3 rounded-xl font-bold transition-all border-2 ${hasTwoTeams === false ? "bg-red-500 text-white border-red-500" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
                >
                  كلا
                </button>
              </div>
            </div>

            {hasTwoTeams === false && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
                <p className="text-sm text-red-800 leading-relaxed font-bold">
                  عدم وجود فريقين على الأقل يعني أن محور الجانب الفني غير مكتمل،
                  لأن تصنيف B يتطلب جاهزية فنية للمشاركة بفريقين على الأقل في
                  دوريات الواعدين.
                </p>
              </div>
            )}

            {hasTwoTeams === true && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                        الشرط
                      </div>
                      <p className="font-bold text-[#022C22]">
                        وجود فريقين على الأقل للمشاركة في دوريات الواعدين
                      </p>
                    </div>
                    <div className="md:text-left">
                      <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                        الدليل المطلوب
                      </div>
                      <p className="font-bold text-[#C9A227]">
                        التأكيد على مشاركة فريقين وتحميل كافة البيانات المتعلقة
                        باللاعبين والأجهزة الفنية لكل فريق
                      </p>
                    </div>
                  </div>
                </div>

                <label
                  className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${teamsParticipationConfirmed ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-gray-50/50 border-[#E5DED0] hover:border-gray-200"}`}
                >
                  <div
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${teamsParticipationConfirmed ? "bg-[#064E3B] border-[#064E3B] text-white" : "bg-white border-gray-300"}`}
                  >
                    {teamsParticipationConfirmed && (
                      <span className="material-symbols-outlined text-[18px]">
                        check
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={teamsParticipationConfirmed}
                    onChange={(e) => {
                      setTeamsParticipationConfirmed(e.target.checked);
                      handleUpdate({
                        teamsParticipationConfirmed: e.target.checked,
                      });
                    }}
                  />
                  <div className="space-y-1">
                    <p className="font-bold text-[#022C22]">
                      {teamsParticipationConfirmed
                        ? "تم التأكيد"
                        : "أؤكد أن الأكاديمية قادرة على المشاركة بفريقين على الأقل في دوريات الواعدين."}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Coaches & Fields Standard */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              2
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">
              المدربون والملاعب
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5DED0] p-6 md:p-8 space-y-8">
            <div>
              <p className="font-bold text-[#022C22] mb-4">
                هل بإمكان الأكاديمية الالتزام بالشروط التالية؟
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCanCommitToCoachPlayerFieldStandards(true);
                    handleUpdate({
                      canCommitToCoachPlayerFieldStandards: true,
                    });
                  }}
                  className={`px-8 py-3 rounded-xl font-bold transition-all border-2 ${canCommitToCoachPlayerFieldStandards === true ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
                >
                  نعم
                </button>
                <button
                  onClick={() => {
                    setCanCommitToCoachPlayerFieldStandards(false);
                    handleUpdate({
                      canCommitToCoachPlayerFieldStandards: false,
                    });
                  }}
                  className={`px-8 py-3 rounded-xl font-bold transition-all border-2 ${canCommitToCoachPlayerFieldStandards === false ? "bg-red-500 text-white border-red-500" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
                >
                  كلا
                </button>
              </div>
            </div>

            {canCommitToCoachPlayerFieldStandards === false && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
                <p className="text-sm text-red-800 leading-relaxed font-bold">
                  عدم الالتزام بشروط المدربين واللاعبين والملاعب يعني أن المحور
                  غير مكتمل.
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-right border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[#E5DED0]">
                <thead className="bg-[#022C22] text-white">
                  <tr>
                    <th className="py-4 px-6 font-bold text-sm">
                      الفئة العمرية
                    </th>
                    <th className="py-4 px-6 font-bold text-sm border-r border-white/10">
                      الشهادة التدريبية للمدرب
                    </th>
                    <th className="py-4 px-6 font-bold text-sm border-r border-white/10">
                      عدد اللاعبين
                    </th>
                    <th className="py-4 px-6 font-bold text-sm border-r border-white/10">
                      قياس الكرة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {standards.map((s, i) => (
                    <tr
                      key={i}
                      className="border-t border-[#E5DED0] hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-[#064E3B] text-sm">
                        {s.age}
                      </td>
                      <td className="py-4 px-6 text-[#022C22] font-medium text-sm border-r border-[#E5DED0]">
                        {s.certificate}
                      </td>
                      <td className="py-4 px-6 text-[#022C22] font-medium text-sm border-r border-[#E5DED0]">
                        {s.players} لاعب
                      </td>
                      <td className="py-4 px-6 text-[#022C22] font-medium text-sm border-r border-[#E5DED0]">
                        {s.ball}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Registered Coaches */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                3
              </div>
              <h2 className="text-xl font-bold text-[#022C22]">
                المدربون المسجلون في سجل الأكاديمية
              </h2>
            </div>
            <Link
              to="/academy-registry"
              className="text-sm font-bold text-[#064E3B] hover:underline flex items-center gap-1"
            >
              تحديث سجل الأكاديمية
              <span className="material-symbols-outlined text-[18px]">
                open_in_new
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CoachRegistryCard person={coachU12} roleLabel="مدرب دون 12" />
            <CoachRegistryCard person={coachU13} roleLabel="مدرب دون 13" />
          </div>
        </section>

        {/* Section 4: Summary */}
        <AxisSummary
          title="ملخص جاهزية الجانب الفني"
          icon="sports_soccer"
          percentage={progress.percentage}
          status={progress.status}
          subTitle="تصنيف B - المحور الثالث"
          backLink="/dashboard"
          items={[
            { label: "حالة وجود فريقين", isActive: hasTwoTeams === true },
            { label: "تأكيد المشاركة", isActive: teamsParticipationConfirmed },
            {
              label: "الالتزام بالشروط",
              isActive: canCommitToCoachPlayerFieldStandards === true,
            },
            { label: "مدرب دون 12", isActive: !!coachU12 },
            { label: "مدرب دون 13", isActive: !!coachU13 },
            {
              label: "شهادة مدرب دون 12 (C+)",
              isActive: checkDiplomaValidity(coachU12?.certificateType),
            },
            {
              label: "شهادة مدرب دون 13 (C+)",
              isActive: checkDiplomaValidity(coachU13?.certificateType),
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/b/organization"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
              السابق: التنظيم
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-gray-500 hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/b/facilities"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
            >
              التالي: الملعب والمرافق
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

function CoachRegistryCard({
  person,
  roleLabel,
}: {
  person?: RegistryPerson;
  roleLabel: string;
}) {
  const DIPLOMA_HIERARCHY = [
    "D Diploma",
    "C Diploma",
    "Youth Level 1 Diploma",
    "B Diploma",
    "Youth Level 2 Diploma",
    "A Diploma",
    "Pro Diploma",
  ];
  const MIN_REQUIRED_DIPLOMA = "C Diploma";

  if (!person) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E5DED0] rounded-[32px] p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[220px] shadow-sm">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <span className="material-symbols-outlined text-4xl">sports</span>
        </div>
        <div>
          <div className="text-xs font-black text-[#64748B] mb-1 uppercase tracking-widest">
            {roleLabel}
          </div>
          <p className="text-sm text-gray-400 italic">
            لم يتم تسجيل المدرب في سجل الأكاديمية.
          </p>
        </div>
        <Link
          to="/academy-registry"
          className="px-6 py-3 bg-[#064E3B] text-white text-xs font-bold rounded-xl hover:bg-[#022C22] transition-all flex items-center gap-2 mt-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">
            add_circle
          </span>
          إضافة في السجل
        </Link>
      </div>
    );
  }

  const isValidLicense = (diploma?: string) => {
    if (!diploma) return false;
    const index = DIPLOMA_HIERARCHY.indexOf(diploma);
    const minIndex = DIPLOMA_HIERARCHY.indexOf(MIN_REQUIRED_DIPLOMA);
    return index >= minIndex;
  };

  const licenseStatus = isValidLicense(person.certificateType);

  return (
    <div className="bg-white border border-[#E5DED0] rounded-[32px] p-6 flex flex-col gap-6 hover:shadow-md hover:border-[#C9A227]/50 transition-all group shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-[#F6F1E7] rounded-2xl flex items-center justify-center text-[#064E3B] shrink-0 overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform shadow-inner">
          {person.files.profilePhoto?.preview ? (
            <img
              src={(person?.files?.profilePhoto?.preview || person?.files?.profilePhoto?.downloadURL || person?.files?.profilePhoto?.url)}
              alt={person.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-4xl font-light">
              account_circle
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="inline-flex px-2 py-0.5 bg-[#064E3B]/10 text-[#064E3B] text-[10px] font-black rounded-lg mb-2">
            {roleLabel}
          </div>
          <h4 className="font-bold text-[#022C22] truncate text-lg group-hover:text-[#064E3B] transition-colors">
            {person.fullName}
          </h4>
          <div className="mt-2 space-y-1">
            {person.phone && (
              <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
                  call
                </span>
                {person.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#F8F9FA] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#64748B]">
            الشهادة التدريبية
          </span>
          {person.certificateType ? (
            <span
              className={`px-2 py-1 rounded-lg text-[10px] font-black ${licenseStatus ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}
            >
              {person.certificateType}
            </span>
          ) : (
            <span className="text-[10px] text-red-500 font-bold italic">
              غير محددة
            </span>
          )}
        </div>

        {!person.certificateType ? (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
            <span className="material-symbols-outlined text-red-500 text-[18px]">
              error
            </span>
            <span className="text-[10px] text-red-700 font-bold leading-relaxed">
              لم يتم رفع أو تحديد شهادة التدريب في سجل الأكاديمية.
            </span>
          </div>
        ) : !licenseStatus ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="material-symbols-outlined text-amber-600 text-[18px]">
              warning
            </span>
            <span className="text-[10px] text-amber-700 font-bold leading-relaxed">
              الشهادة غير كافية لهذا الدور. الحد الأدنى المطلوب: C Diploma أو
              أعلى.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100">
            <span className="material-symbols-outlined text-green-600 text-[18px]">
              verified
            </span>
            <span className="text-[10px] text-green-700 font-bold leading-relaxed">
              الشهادة التدريبية مطابقة لمعايير تصنيف B.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link
          to="/academy-registry"
          className="flex items-center gap-2 text-xs font-bold text-[#064E3B] hover:underline"
        >
          تعديل في سجل الأكاديمية
          <span className="material-symbols-outlined text-[18px]">
            edit_square
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-[10px] font-black text-[#64748B]">مسجل</span>
        </div>
      </div>
    </div>
  );
}
