import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPersonByRole } from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { AxisSummary } from "./components/AxisSummary";

interface CategoryRequirement {
  id: string;
  name: string;
  minCertificate: string;
  minCertLabel: string;
  minPlayers: number;
  fieldSize: string;
  ballSize: number;
  roleKey: string;
}

const categories: CategoryRequirement[] = [
  {
    id: "u10",
    name: "فئة دون 10",
    minCertificate: "C Diploma",
    minCertLabel: "C Diploma أو أعلى",
    minPlayers: 14,
    fieldSize: "50×30",
    ballSize: 4,
    roleKey: "coachU10",
  },
  {
    id: "u11",
    name: "فئة دون 11",
    minCertificate: "C Diploma",
    minCertLabel: "C Diploma أو أعلى",
    minPlayers: 14,
    fieldSize: "50×30",
    ballSize: 4,
    roleKey: "coachU11",
  },
  {
    id: "u12",
    name: "فئة دون 12",
    minCertificate: "Youth Level 1 Diploma",
    minCertLabel: "Youth Level 1 Diploma أو أعلى",
    minPlayers: 18,
    fieldSize: "65×45",
    ballSize: 5,
    roleKey: "coachU12",
  },
  {
    id: "u13",
    name: "فئة دون 13",
    minCertificate: "Youth Level 1 Diploma",
    minCertLabel: "Youth Level 1 Diploma أو أعلى",
    minPlayers: 18,
    fieldSize: "65×45",
    ballSize: 5,
    roleKey: "coachU13",
  },
];

// Helper to check certificate hierarchy
const certLevels: Record<string, number> = {
  "C Diploma": 1,
  "Youth Level 1 Diploma": 2,
  "Youth Level 2 Diploma": 3,
  "B Diploma": 4,
  "A Diploma": 5,
  "Pro Diploma": 6,
};

export default function ClassificationATechnical() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);
  const [coaches, setCoaches] = useState<Record<string, any>>({});

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/technical");

    // Load coaches from registry first
    const fetchedCoaches: Record<string, any> = {};
    categories.forEach((cat) => {
      fetchedCoaches[cat.id] = getPersonByRole(cat.roleKey);
    });
    setCoaches(fetchedCoaches);

    // Load saved form data
    const saved = appStorage.getItem("classificationA_technical");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        // Force a recalculation and save to ensure Dashboard is synced
        saveProgress(parsed, fetchedCoaches);
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
  }, []);

  const saveProgress = (
    currentData: Record<string, any>,
    currentCoaches: Record<string, any> = coaches,
  ) => {
    const stats = calculateCompletion(currentData, currentCoaches);
    const payload = {
      ...currentData,
      completionPercentage: stats.percentage,
      status:
        stats.percentage === 0
          ? "لم يبدأ"
          : stats.percentage === 100
            ? "مكتمل"
            : stats.percentage >= 50
              ? "مكتمل جزئيًا"
              : "قيد التعبئة",
      lastUpdated: Date.now(),
    };
    appStorage.setItem("classificationA_technical", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
  };

  const handleInputChange = (catId: string, field: string, value: any) => {
    setData((prev) => {
      const newData = {
        ...prev,
        [catId]: {
          ...prev[catId],
          [field]: value,
        },
      };
      saveProgress(newData);
      return newData;
    });
  };

  const handleGeneralChange = (field: string, value: boolean) => {
    setData((prev) => {
      const newData = { ...prev, [field]: value };
      saveProgress(newData);
      return newData;
    });
  };

  const isCertValid = (coach: any, minCert: string) => {
    if (!coach || !coach.certificateType) return false;
    const currentLevel = certLevels[coach.certificateType] || 0;
    const requiredLevel = certLevels[minCert] || 0;
    return currentLevel >= requiredLevel;
  };

  const calculateCompletion = (
    currentData: Record<string, any> = data,
    currentCoaches: Record<string, any> = coaches,
  ) => {
    const results = {
      categoriesCompleted: 0,
      coachesFound: 0,
      playerCountsMet: 0,
      fieldConfirmed: 0,
      ballConfirmed: 0,
      championshipsConfirmed: 0,
      totalScore: 0,
      totalPossible: categories.length * 4 + 2, // 4 items (coach, players, field, ball) per category + 2 championship confirmations
    };

    categories.forEach((cat) => {
      const coach = currentCoaches[cat.id];
      const catData = currentData[cat.id] || {};

      let catIsFullyDone = true;

      // 1. Coach
      if (coach) {
        results.coachesFound++;
        if (!isCertValid(coach, cat.minCertificate)) catIsFullyDone = false;
      } else {
        catIsFullyDone = false;
      }

      // 2. Players
      if (catData.playerCount >= cat.minPlayers && catData.teamReady) {
        results.playerCountsMet++;
      } else {
        catIsFullyDone = false;
      }

      // 3. Field
      if (catData.fieldConfirmed) {
        results.fieldConfirmed++;
      } else {
        catIsFullyDone = false;
      }

      // 4. Ball
      if (catData.ballConfirmed) {
        results.ballConfirmed++;
      } else {
        catIsFullyDone = false;
      }

      if (catIsFullyDone) results.categoriesCompleted++;
    });

    if (currentData.readyU12) results.championshipsConfirmed++;
    if (currentData.readyU13) results.championshipsConfirmed++;

    const totalMet =
      results.coachesFound +
      results.playerCountsMet +
      results.fieldConfirmed +
      results.ballConfirmed +
      results.championshipsConfirmed;
    const percentage = Math.round((totalMet / results.totalPossible) * 100);

    return { ...results, percentage };
  };

  const stats = calculateCompletion();

  const getStatusLabel = () => {
    if (stats.percentage === 0) return "غير مكتمل";
    if (stats.percentage === 100) return "مكتمل";
    return "مكتمل جزئيًا";
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
            <span className="text-white font-bold">الجانب الفني</span>
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
          prevPath="/classification/a/organization"
          nextPath="/classification/a/budget"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الرابع: الجانب الفني
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور جاهزية الأكاديمية الفنية من حيث توفر الفئات
            العمرية، المدربين المؤهلين، عدد اللاعبين، مساحة الملاعب، والأدوات
            المناسبة لكل فئة.
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-[#064E3B] text-white rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-2 h-full bg-[#C9A227]"></div>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#C9A227]">
                psychology
              </span>
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#C9A227] mb-3">
                ما المطلوب في محور الجانب الفني؟
              </h3>
              <p className="text-white/90 leading-relaxed">
                يجب أن تضم الأكاديمية أربع فرق على الأقل مسجلة وجاهزة للمشاركة
                في مسابقات الاتحاد اللبناني لكرة القدم، وذلك ضمن الفئات العمرية
                المعتمدة. يهدف هذا الشرط إلى ضمان استمرارية العمل الفني داخل
                الأكاديمية، توسيع قاعدة المشاركة، وتوفير بيئة تنافسية مناسبة
                تسهم في تطوير اللاعبين بشكل منتظم.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((cat) => {
            const coach = coaches[cat.id];
            const isValidCoach = isCertValid(coach, cat.minCertificate);
            return (
              <div
                key={cat.id}
                className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]"
              >
                <h3 className="text-xl font-bold text-[#022C22] mb-4 border-b border-[#E5DED0] pb-2">
                  {cat.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coach Profile Card */}
                  <div className={`space-y-3 bg-white p-4 rounded-2xl border-2 ${isValidCoach ? 'border-green-200' : coach ? 'border-amber-200' : 'border-red-100'}`}>
                    <h4 className="font-bold text-[#022C22] text-xs uppercase tracking-wider">
                      المدرب المعين ({cat.minCertLabel})
                    </h4>
                    {coach ? (
                      <div className="flex flex-col gap-3">
                        {/* Photo + name row */}
                        <div className="flex items-center gap-3">
                          {/* Profile photo */}
                          <div className="w-14 h-14 rounded-2xl border-2 border-[#E5DED0] overflow-hidden bg-[#F6F1E7] flex items-center justify-center shrink-0">
                            {(coach.files?.profilePhoto?.preview || coach.files?.profilePhoto?.downloadURL || coach.files?.profilePhoto?.url) ? (
                              <img
                                src={coach.files.profilePhoto.preview || coach.files.profilePhoto.downloadURL || coach.files.profilePhoto.url}
                                alt={coach.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-[#64748B] text-3xl">person</span>
                            )}
                          </div>
                          {/* Name + cert */}
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-[#022C22] text-sm truncate">
                              {coach.fullName || "—"}
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold mt-0.5 ${isValidCoach ? "text-green-600" : "text-amber-600"}`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {isValidCoach ? "verified" : "warning"}
                              </span>
                              {coach.certificateType || "شهادة غير مسجلة"}
                            </div>
                          </div>
                        </div>
                        {/* Details grid */}
                        <div className="grid grid-cols-1 gap-1.5 text-xs">
                          {coach.dateOfBirth && (
                            <div className="flex items-center gap-2 text-[#64748B]">
                              <span className="material-symbols-outlined text-[14px] text-[#064E3B]">cake</span>
                              <span className="font-bold">تاريخ الميلاد:</span>
                              <span dir="ltr">{coach.dateOfBirth}</span>
                            </div>
                          )}
                          {(coach.phoneNum || coach.phone) && (
                            <div className="flex items-center gap-2 text-[#64748B]">
                              <span className="material-symbols-outlined text-[14px] text-[#064E3B]">phone</span>
                              <span className="font-bold">الهاتف:</span>
                              <span dir="ltr">{coach.phoneNum || coach.phone}</span>
                            </div>
                          )}
                          {coach.email && (
                            <div className="flex items-center gap-2 text-[#64748B] min-w-0">
                              <span className="material-symbols-outlined text-[14px] text-[#064E3B] shrink-0">email</span>
                              <span className="font-bold shrink-0">الإيميل:</span>
                              <span className="truncate" dir="ltr">{coach.email}</span>
                            </div>
                          )}
                        </div>
                        {/* Cert validity badge */}
                        {!isValidCoach && (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                            الشهادة الحالية أقل من الحد المطلوب ({cat.minCertLabel})
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                          <span className="material-symbols-outlined text-red-400 text-2xl">person_off</span>
                        </div>
                        <div className="text-xs font-bold text-red-600">غير مسجل في سجل الأكاديمية</div>
                        <Link to="/academy-registry" className="text-[10px] font-black text-[#064E3B] underline hover:no-underline">
                          إضافة المدرب للسجل ←
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E5DED0]">
                      <label className="text-sm font-bold">
                        عدد اللاعبين (أدنى: {cat.minPlayers})
                      </label>
                      <input
                        type="number"
                        value={data[cat.id]?.playersCount || ""}
                        onChange={(e) =>
                          handleInputChange(
                            cat.id,
                            "playersCount",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-20 bg-[#F6F1E7] border border-[#E5DED0] rounded-lg px-2 py-1 text-center outline-none focus:border-[#C9A227]"
                      />
                    </div>

                    <label className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E5DED0] cursor-pointer">
                      <span className="text-sm font-bold">
                        تأكيد توفر مساحة {cat.fieldSize}
                      </span>
                      <input
                        type="checkbox"
                        checked={data[cat.id]?.fieldConfirmed || false}
                        onChange={(e) =>
                          handleInputChange(
                            cat.id,
                            "fieldConfirmed",
                            e.target.checked,
                          )
                        }
                        className="w-5 h-5 accent-[#064E3B]"
                      />
                    </label>

                    <label className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#E5DED0] cursor-pointer">
                      <span className="text-sm font-bold">
                        تأكيد توفر كرات حجم {cat.ballSize}
                      </span>
                      <input
                        type="checkbox"
                        checked={data[cat.id]?.ballConfirmed || false}
                        onChange={(e) =>
                          handleInputChange(
                            cat.id,
                            "ballConfirmed",
                            e.target.checked,
                          )
                        }
                        className="w-5 h-5 accent-[#064E3B]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0] space-y-4">
          <h3 className="text-xl font-bold text-[#022C22] mb-4">
            بطولات الاتحاد اللبناني
          </h3>
          <label className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E5DED0] cursor-pointer">
            <span className="font-bold text-[#022C22]">
              جاهزية فريق U12 للمشاركة في المسابقات
            </span>
            <input
              type="checkbox"
              checked={data.readyU12 || false}
              onChange={(e) =>
                handleGeneralChange("readyU12", e.target.checked)
              }
              className="w-6 h-6 accent-[#064E3B]"
            />
          </label>
          <label className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E5DED0] cursor-pointer">
            <span className="font-bold text-[#022C22]">
              جاهزية فريق U13 للمشاركة في المسابقات
            </span>
            <input
              type="checkbox"
              checked={data.readyU13 || false}
              onChange={(e) =>
                handleGeneralChange("readyU13", e.target.checked)
              }
              className="w-6 h-6 accent-[#064E3B]"
            />
          </label>
        </div>

        <AxisSummary
          title="ملخص محور الجانب الفني والتدريبي"
          icon="sports_soccer"
          items={[
            ...categories.map(cat => ({
              label: `مدرب ${cat.name} — شهادة ${cat.minCertLabel} + ${cat.minPlayers} لاعبًا`,
              isActive: !!(coaches[cat.id] && isCertValid(coaches[cat.id], cat.minCertificate) && (data[cat.id]?.playerCount >= cat.minPlayers) && data[cat.id]?.teamReady && data[cat.id]?.fieldConfirmed && data[cat.id]?.ballConfirmed),
            })),
            { label: "تأكيد المشاركة في البطولات (U12 و U13)", isActive: !!(data.readyU12 && data.readyU13) },
          ]}
          percentage={stats.percentage}
          status={getStatusLabel()}
          subTitle={stats.percentage === 100 ? "اكتملت جميع متطلبات الجانب الفني" : `${stats.totalPossible - (stats.coachesFound + stats.playerCountsMet + stats.fieldConfirmed + stats.ballConfirmed + stats.championshipsConfirmed)} نقطة متبقية من أصل ${stats.totalPossible}`}
          backLink="/dashboard"
          onSave={() => saveProgress(data)}
        >
          <Link
            to="/classification/a/organization"
            className="px-6 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            السابق: التنظيم
          </Link>
          <button
            onClick={() => saveProgress(data)}
            className="px-6 py-3.5 bg-[#C9A227] text-white hover:bg-[#B38D1F] rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">save</span>
            حفظ التقدم
          </button>
          <Link
            to="/classification/a/budget"
            className="px-6 py-3.5 bg-[#064E3B] text-white hover:bg-[#022C22] rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"
          >
            التالي: الميزانية
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
        </AxisSummary>
      </main>
    </div>
  );
}
