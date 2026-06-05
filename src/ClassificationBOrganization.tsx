import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { getRegistryData, RegistryPerson } from "./lib/registry";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { AxisSummary } from "./components/AxisSummary";

export default function ClassificationBOrganization() {
  const navigate = useNavigate();
  const [registryPeople, setRegistryPeople] = useState<RegistryPerson[]>([]);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/organization");

    // Load registry data specifically for B
    const regData = getRegistryData();
    setRegistryPeople(regData.people);

    const saved = appStorage.getItem("classificationB_organization");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.confirmationChecked !== undefined)
          setConfirmationChecked(parsed.confirmationChecked);
        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  // Helper to find specific role
  const getRole = (roleKind: string) => {
    return registryPeople.find(
      (p) =>
        p.roleKey === roleKind ||
        p.roles?.includes(roleKind) ||
        p.roles?.includes(getTranslatedRole(roleKind)),
    );
  };

  const getRoles = (roleKind: string) => {
    return registryPeople.filter(
      (p) =>
        p.roleKey === roleKind ||
        p.roles?.includes(roleKind) ||
        p.roles?.includes(getTranslatedRole(roleKind)),
    );
  };

  const getTranslatedRole = (roleKind: string) => {
    const map: Record<string, string> = {
      bOwner: "مالك الأكاديمية",
      bGeneralSupervisor: "مشرف عام",
      bAdministrativeCoordinator: "منسق إداري",
      bCoachU12: "مدرب دون 12",
      bCoachU13: "مدرب دون 13",
      bPhysiotherapist: "معالج",
    };
    return map[roleKind] || roleKind;
  };

  const peopleB = {
    owner: getRole("bOwner"),
    supervisor: getRole("bGeneralSupervisor"),
    coordinators: getRoles("bAdministrativeCoordinator"),
    coach12: getRole("bCoachU12"),
    coach13: getRole("bCoachU13"),
    physios: getRoles("bPhysiotherapist"),
  };

  const saveProgress = (currentData: Record<string, any>) => {
    const prog = calculateCompletion(currentData);
    const dataToSave = {
      ...currentData,
      completionPercentage: prog.percentage,
      status: prog.status,
      lastUpdated: new Date().toISOString(),
    };
    appStorage.setItem(
      "classificationB_organization",
      JSON.stringify(dataToSave),
    );
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const calculateCompletion = (currentData: any = { confirmationChecked }) => {
    const { confirmationChecked } = currentData;
    const required = [
      peopleB.owner,
      peopleB.supervisor,
      peopleB.coordinators.length > 0,
      peopleB.coach12,
      peopleB.coach13,
      confirmationChecked,
    ];

    const metCount = required.filter(Boolean).length;
    const totalRequired = required.length;
    const percentage = Math.round((metCount / totalRequired) * 100);

    let status = "لم يبدأ";
    if (percentage === 100) status = "مكتمل";
    else if (percentage >= 50) status = "مكتمل جزئيًا";
    else if (percentage > 0) status = "قيد التعبئة";

    return { percentage, status };
  };

  const progress = calculateCompletion();

  useEffect(() => {
    const saved = appStorage.getItem("classificationB_organization");
    const parsed = saved ? JSON.parse(saved) : {};
    if (parsed.completionPercentage !== progress.percentage) {
      const payload = {
        ...parsed,
        completionPercentage: progress.percentage,
        status: progress.status,
      };
      appStorage.setItem(
        "classificationB_organization",
        JSON.stringify(payload),
      );
    }
  }, [progress.percentage, progress.status]);

  const updateConfirmation = (checked: boolean) => {
    setConfirmationChecked(checked);
    const currentData = {
      confirmationChecked: checked,
    };
    saveProgress(currentData);
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
            <span className="text-white text-xs opacity-70">التنظيم</span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/planning"
          nextPath="/classification/b/technical"
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#064E3B]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            تصنيف B - المحور الثالث: التنظيم
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور وضوح الهيكل التنظيمي الأساسي للأكاديمية من خلال
            تحديد أسماء المسؤولين ومواقعهم ضمن نموذج رسم بياني مبسط.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                account_tree
              </span>
              المحور 3 من 7
            </div>
            <div className="text-[#064E3B] font-bold">
              {progress.percentage}% مكتمل
            </div>
          </div>
          <div className="h-2.5 w-full bg-[#E5DED0] rounded-full overflow-hidden text-right">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-1000"
              style={{ width: `${progress.percentage || 43}%` }}
            ></div>
          </div>
        </div>

        {/* Organization Chart Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              1
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">
              الهيكل التنظيمي
            </h2>
          </div>

          <div className="bg-white rounded-[40px] border border-[#E5DED0] p-8 md:p-12 relative overflow-hidden shadow-sm overflow-x-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#064E3B]/5 rounded-bl-[100px]"></div>

            <div className="relative z-10 flex flex-col items-center gap-16 min-w-[700px]">
              {/* Level 1: Owner */}
              <div className="relative group">
                <div
                  className={`w-64 p-6 rounded-2xl border-2 text-center transition-all shadow-md ${peopleB.owner ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white border-[#E5DED0] text-gray-400 border-dashed italic"}`}
                >
                  <div
                    className={`text-[10px] font-black uppercase mb-1 ${peopleB.owner ? "text-[#C9A227]" : "text-gray-400"}`}
                  >
                    مالك الأكاديمية
                  </div>
                  <div className="font-bold text-lg">
                    {peopleB.owner?.fullName || "غير مسجل"}
                  </div>
                </div>
                {/* Vertical Line Connector */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-16 bg-[#E5DED0]"></div>
              </div>

              {/* Horizontal Connector Line Row 2 */}
              <div className="relative w-full max-w-[600px] flex items-center justify-between">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5DED0]"></div>

                {/* Level 2 Nodes */}
                <div className="flex justify-between w-full relative">
                  {/* Supervisor */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                    <div
                      className={`w-56 p-5 rounded-2xl border-2 text-center transition-all shadow-sm ${peopleB.supervisor ? "bg-white border-[#064E3B] text-[#064E3B]" : "bg-white border-[#E5DED0] text-gray-400 border-dashed italic"}`}
                    >
                      <div className="text-[10px] font-black uppercase text-[#C9A227] mb-1">
                        مشرف فني / إداري
                      </div>
                      <div className="font-bold text-base">
                        {peopleB.supervisor?.fullName || "غير مسجل"}
                      </div>
                    </div>
                  </div>

                  {/* Coordinator Group */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                    <div
                      className={`w-56 p-5 rounded-2xl border-2 text-center transition-all shadow-sm ${peopleB.coordinators.length > 0 ? "bg-white border-[#064E3B] text-[#064E3B]" : "bg-white border-[#E5DED0] text-gray-400 border-dashed italic"}`}
                    >
                      <div className="text-[10px] font-black uppercase text-[#C9A227] mb-1">
                        منسق إداري
                      </div>
                      <div className="font-bold text-base text-center">
                        {peopleB.coordinators.length > 0
                          ? peopleB.coordinators.length === 1
                            ? peopleB.coordinators[0].fullName
                            : `${peopleB.coordinators.length} منسقين إداريين`
                          : "غير مسجل"}
                      </div>
                      {peopleB.coordinators.length > 1 && (
                        <div className="mt-2 text-[10px] text-[#64748B] flex flex-wrap gap-1 justify-center">
                          {peopleB.coordinators.map((c, i) => (
                            <span
                              key={i}
                              className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
                            >
                              {c.fullName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Line down to row 3 */}
                    <div className="w-0.5 h-20 bg-[#E5DED0]"></div>
                  </div>
                </div>
              </div>

              {/* Level 3 Horizontal Bar */}
              <div className="relative w-full max-w-[800px]">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5DED0]"></div>

                <div className="flex justify-between w-full">
                  {/* Physios */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                    <div
                      className={`w-48 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.physios.length > 0 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                    >
                      <div className="text-[9px] font-black uppercase text-[#C9A227] mb-1">
                        معالجون
                      </div>
                      <div className="font-bold text-sm truncate">
                        {peopleB.physios.length > 0
                          ? peopleB.physios.length === 1
                            ? peopleB.physios[0].fullName
                            : `${peopleB.physios.length} معالجين`
                          : "غير مسجل"}
                      </div>
                    </div>
                  </div>

                  {/* Administrative Staff */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                    <div
                      className={`w-48 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.coordinators.length > 0 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                    >
                      <div className="text-[9px] font-black uppercase text-[#C9A227] mb-1">
                        إداريون
                      </div>
                      <div className="font-bold text-sm">
                        {peopleB.coordinators.length > 0
                          ? `${peopleB.coordinators.length} إداري`
                          : "غير مسجل"}
                      </div>
                    </div>
                  </div>

                  {/* Coaches */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                    <div
                      className={`w-64 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.coach12 || peopleB.coach13 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                    >
                      <div className="text-[9px] font-black uppercase text-[#C9A227] mb-2 text-center">
                        مدربون
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between items-center text-[10px] gap-2">
                          <span className="text-[#64748B] whitespace-nowrap">
                            دون 12:
                          </span>
                          <span
                            className={`font-bold truncate ${peopleB.coach12 ? "text-[#022C22]" : "text-gray-400 italic"}`}
                          >
                            {peopleB.coach12?.fullName || "غير مسجل"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] gap-2">
                          <span className="text-[#64748B] whitespace-nowrap">
                            دون 13:
                          </span>
                          <span
                            className={`font-bold truncate ${peopleB.coach13 ? "text-[#022C22]" : "text-gray-400 italic"}`}
                          >
                            {peopleB.coach13?.fullName || "غير مسجل"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-amber-600">
              info
            </span>
            <div>
              <p className="text-sm text-amber-800 font-bold mb-1">
                إرشادات الهيكل
              </p>
              <p className="text-xs text-amber-800/80 leading-relaxed">
                يجب أن يتم توليد الهيكل التنظيمي تلقائيًا من سجل الأكاديمية
                الخاص بتصنيف B، دون إدخال الأسماء يدويًا داخل هذا المحور.
              </p>
            </div>
          </div>
        </section>

        {/* Registered Official Cards */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                2
              </div>
              <h2 className="text-xl font-bold text-[#022C22]">
                المسؤولون المسجلون في سجل الأكاديمية
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

          <div className="space-y-8">
            {/* Group 1: Leadership */}
            <div className="space-y-4 font-bold">
              <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                القيادة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileCard
                  person={peopleB.owner}
                  roleLabel="مالك الأكاديمية"
                  roleKey="bOwner"
                />
                <ProfileCard
                  person={peopleB.supervisor}
                  roleLabel="مشرف فني أو إداري"
                  roleKey="bGeneralSupervisor"
                />
              </div>
            </div>

            {/* Group 2: Management */}
            <div className="space-y-4">
              <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                الإدارة
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peopleB.coordinators.length > 0 ? (
                  peopleB.coordinators.map((c, i) => (
                    <ProfileCard
                      key={i}
                      person={c}
                      roleLabel="منسق إداري"
                      roleKey="bAdministrativeCoordinator"
                    />
                  ))
                ) : (
                  <ProfileCard
                    person={undefined}
                    roleLabel="منسق إداري"
                    roleKey="bAdministrativeCoordinator"
                  />
                )}
              </div>
            </div>

            {/* Group 3: Technical */}
            <div className="space-y-4">
              <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                الجهاز الفني
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileCard
                  person={peopleB.coach12}
                  roleLabel="مدرب دون 12"
                  roleKey="bCoachU12"
                />
                <ProfileCard
                  person={peopleB.coach13}
                  roleLabel="مدرب دون 13"
                  roleKey="bCoachU13"
                />
              </div>
            </div>

            {/* Group 4: Medical */}
            <div className="space-y-4">
              <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                الجهاز الطبي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peopleB.physios.length > 0 ? (
                  peopleB.physios.map((p, i) => (
                    <ProfileCard
                      key={i}
                      person={p}
                      roleLabel="معالج"
                      roleKey="bPhysiotherapist"
                    />
                  ))
                ) : (
                  <ProfileCard
                    person={undefined}
                    roleLabel="معالج"
                    roleKey="bPhysiotherapist"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Evidence & Evidence Checkbox */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
              3
            </div>
            <h2 className="text-xl font-bold text-[#022C22]">الدليل المطلوب</h2>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5DED0] p-8 space-y-8">
            <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                    الشرط
                  </div>
                  <p className="font-bold text-[#022C22]">
                    إملاء نموذج رسم بياني يتضمّن أسماء المسؤولين ومواقعهم
                  </p>
                </div>
                <div className="md:text-left">
                  <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                    الدليل المطلوب
                  </div>
                  <p className="font-bold text-[#C9A227]">
                    نموذج رسم بياني للهيكل التنظيمي
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5DED0] flex items-center gap-2 text-[#64748B] text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">
                  sync
                </span>
                يتم توليد النموذج تلقائيًا من سجل الأكاديمية - تصنيف B
              </div>
            </div>

            <label
              className={`flex items-start gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${confirmationChecked ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-gray-50/50 border-[#E5DED0] hover:border-gray-200"}`}
            >
              <div
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${confirmationChecked ? "bg-[#064E3B] border-[#064E3B] text-white" : "bg-white border-gray-300"}`}
              >
                {confirmationChecked && (
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={confirmationChecked}
                onChange={(e) => updateConfirmation(e.target.checked)}
              />
              <div className="space-y-1">
                <p className="font-bold text-[#022C22]">
                  {confirmationChecked
                    ? "تم التأكيد"
                    : "أؤكد صحة الهيكل التنظيمي"}
                </p>
                <p className="text-sm text-[#64748B]">
                  أؤكد أن الهيكل التنظيمي المعروض يعكس المسؤولين المعتمدين في
                  الأكاديمية.
                </p>
              </div>
            </label>
          </div>
        </section>

        <AxisSummary
          title="ملخص محور الهيكل التنظيمي (تصنيف B)"
          icon="account_tree"
          items={[
            { label: "مالك الأكاديمية (تصنيف B)", isActive: registryPeople.some(p => p.roleKey === "bOwner") },
            { label: "المشرف الفني أو الإداري (تصنيف B)", isActive: registryPeople.some(p => p.roleKey === "bGeneralSupervisor") },
            { label: "مدرب دون 12 (تصنيف B)", isActive: registryPeople.some(p => p.roleKey === "bCoachU12") },
            { label: "مدرب دون 13 (تصنيف B)", isActive: registryPeople.some(p => p.roleKey === "bCoachU13") },
            { label: "معالج فيزيائي (تصنيف B)", isActive: registryPeople.some(p => p.roleKey === "bPhysiotherapist") },
          ]}
          percentage={progress.percentage}
          status={progress.status}
          subTitle={progress.percentage === 100 ? "اكتملت جميع الأدوار المطلوبة" : "يرجى استكمال الأدوار المطلوبة في سجل الكوادر"}
          backLink="/dashboard"
        >
          <Link
            to="/classification/b/planning"
            className="px-6 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            السابق: التخطيط
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            العودة للوحة الرئيسية
          </Link>
          <Link
            to="/classification/b/technical"
            className="px-6 py-3.5 bg-[#064E3B] text-white hover:bg-[#022C22] rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
          >
            التالي: الجانب الفني
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
        </AxisSummary>
      </main>
    </div>
  );
}

interface ProfileCardProps {
  person?: RegistryPerson;
  roleLabel: string;
  roleKey: string;
  key?: any;
}

function ProfileCard({ person, roleLabel, roleKey }: ProfileCardProps) {
  if (!person) {
    return (
      <div className="bg-white border-2 border-dashed border-[#E5DED0] rounded-[24px] p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] shadow-sm">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <span className="material-symbols-outlined text-2xl">person_off</span>
        </div>
        <div>
          <div className="text-xs font-black text-[#64748B] mb-1">
            {roleLabel}
          </div>
          <p className="text-xs text-gray-400 italic">
            لم يتم تسجيل المسؤول في سجل الأكاديمية.
          </p>
        </div>
        <Link
          to="/academy-registry"
          className="px-4 py-2 bg-[#064E3B]/5 text-[#064E3B] text-[10px] font-bold rounded-lg hover:bg-[#064E3B]/10 transition-colors flex items-center gap-1 mt-2"
        >
          <span className="material-symbols-outlined text-[14px]">
            add_circle
          </span>
          إضافة في السجل
        </Link>
      </div>
    );
  }

  const uploadedFilesCount = Object.values(person.files).filter(
    (f) => f?.uploaded,
  ).length;

  return (
    <div className="bg-white border border-[#E5DED0] rounded-[24px] p-6 flex items-start gap-4 hover:border-[#C9A227] transition-all group shrink-0 shadow-sm">
      <div className="w-16 h-16 bg-[#F6F1E7] rounded-2xl flex items-center justify-center text-[#064E3B] shrink-0 overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform shadow-inner">
        {person.files.profilePhoto?.preview ? (
          <img
            src={(person?.files?.profilePhoto?.preview || person?.files?.profilePhoto?.downloadURL || person?.files?.profilePhoto?.url)}
            alt={person.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-3xl">
            account_circle
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="font-bold text-[#022C22] truncate text-base">
            {person.fullName}
          </h4>
          <span className="px-2 py-0.5 bg-[#064E3B]/10 text-[#064E3B] text-[9px] font-black rounded-lg whitespace-nowrap">
            {roleLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
          {person.phone && (
            <div className="flex items-center gap-1 text-[#64748B] text-[10px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-[#C9A227]">
                call
              </span>
              {person.phone}
            </div>
          )}
          {person.email && (
            <div className="flex items-center gap-1 text-[#64748B] text-[10px] font-medium">
              <span className="material-symbols-outlined text-[14px] text-[#C9A227]">
                mail
              </span>
              <span className="truncate max-w-[120px]">{person.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${Math.min(100, (uploadedFilesCount / 4) * 100)}%`,
                }}
              ></div>
            </div>
            <span className="text-[10px] font-black text-[#64748B]">
              {uploadedFilesCount} مستندات
            </span>
          </div>
          <Link
            to="/academy-registry"
            className="text-[11px] font-black text-[#064E3B] hover:underline flex items-center gap-1"
          >
            تعديل
            <span className="material-symbols-outlined text-[14px]">
              edit_square
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
