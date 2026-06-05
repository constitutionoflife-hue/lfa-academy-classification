import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getRegistryData, isRegistryReady, isPersonComplete } from "./lib/registry";
import { isApplicationStarted, setApplicationStarted } from "./lib/appState";
import { appStorage } from "./lib/appStorage";
import AppHeader from "./components/AppHeader";
import { useAuth } from "./lib/AuthContext";
import { getRegisteredAccounts, waitForAuth } from "./lib/auth";
import { doc, getDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./lib/firebase";
import { AcademyAccount } from "./types";

// Defined outside the component so they can be used in lazy useState initializers
const AXES_A = [
  { id: "leadership", name: "القيادة", route: "/classification/a/leadership", storageKey: "classificationA_leadership", isBuilt: true },
  { id: "planning", name: "التخطيط", route: "/classification/a/planning", storageKey: "classificationA_planning", isBuilt: true },
  { id: "organization", name: "التنظيم", route: "/classification/a/organization", storageKey: "classificationA_organization", isBuilt: true },
  { id: "technical", name: "الجانب الفني", route: "/classification/a/technical", storageKey: "classificationA_technical", isBuilt: true },
  { id: "budget", name: "الميزانية", route: "/classification/a/budget", storageKey: "classificationA_budget", isBuilt: true },
  { id: "facilities", name: "الملعب والمرافق", route: "/classification/a/facilities", storageKey: "classificationA_facilities", isBuilt: true },
  { id: "health", name: "الصحة", route: "/classification/a/health", storageKey: "classificationA_health", isBuilt: true },
  { id: "care", name: "الرعاية والتعليم", route: "/classification/a/safeguarding", storageKey: "classificationA_safeguarding", isBuilt: true },
  { id: "equipment", name: "المعدات والتجهيزات", route: "/classification/a/equipment", storageKey: "classificationA_equipment", isBuilt: true },
  { id: "social", name: "التواصل الاجتماعي", route: "/classification/a/social-media", storageKey: "classificationA_social_media", isBuilt: true },
];

const AXES_B = [
  { id: "leadership", name: "القيادة", route: "/classification/b/leadership", storageKey: "classificationB_leadership", isBuilt: true },
  { id: "planning", name: "التخطيط", route: "/classification/b/planning", storageKey: "classificationB_planning", isBuilt: true },
  { id: "organization", name: "التنظيم", route: "/classification/b/organization", storageKey: "classificationB_organization", isBuilt: true },
  { id: "technical", name: "الجانب الفني", route: "/classification/b/technical", storageKey: "classificationB_technical", isBuilt: true },
  { id: "facilities", name: "الملعب والمرافق الأخرى", route: "/classification/b/facilities", storageKey: "classificationB_facilities", isBuilt: true },
  { id: "care", name: "الرعاية والتعليم", route: "/classification/b/safeguarding", storageKey: "classificationB_safeguarding", isBuilt: true },
  { id: "equipment", name: "المعدات والتجهيزات", route: "/classification/b/equipment", storageKey: "classificationB_equipment", isBuilt: true },
];

function getAxesForType(cls: string | null) {
  if (cls === 'B') return AXES_B;
  if (cls === 'A') return AXES_A;
  return AXES_A; // default
}

export default function AcademyDashboard() {
  const navigate = useNavigate();
  const [academyName, setAcademyName] = useState(() => {
    const basicInfoStr = localStorage.getItem("academyBasicInfo");
    if (basicInfoStr) {
      try {
        const basicInfo = JSON.parse(basicInfoStr);
        return basicInfo.academyName || "";
      } catch (e) { return ""; }
    }
    return "";
  });
  const [academyLogo, setAcademyLogo] = useState<string | null>(() => {
    const basicInfoStr = localStorage.getItem("academyBasicInfo");
    if (basicInfoStr) {
      try {
        const basicInfo = JSON.parse(basicInfoStr);
        return basicInfo.academyLogo || null;
      } catch (e) { return null; }
    }
    return null;
  });

  // Lazy-initialize from localStorage so the first render already shows the
  // correct customized dashboard — no flash of the selection screen on sign-in.
  const [selectedClassification, setSelectedClassification] = useState<string | null>(() =>
    appStorage.getItem("selectedApplicationType")
  );
  const [activeAxes, setActiveAxes] = useState<any[]>(() =>
    getAxesForType(appStorage.getItem("selectedApplicationType"))
  );

  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('draft');
  const [registryCounts, setRegistryCounts] = useState({ management: 0, technical: 0, medical: 0 });
  const [appStarted, setAppStarted] = useState(false);
  const [showChangeConfirm, setShowChangeConfirm] = useState(false);
  const [adminReviews, setAdminReviews] = useState<Record<string, any>>({});
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [adminFinalNote, setAdminFinalNote] = useState<string | null>(null);

  // Keep local aliases for backward compat with code below that still refs axesA/axesB
  const axesA = AXES_A;
  const axesB = AXES_B;

  const [refreshKey, setRefreshKey] = useState(0);

  const { user, isAdmin, isLoading } = useAuth();
  
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }

    const fetchAccountData = async () => {
      try {
        const adminViewUid = isAdmin ? localStorage.getItem("adminViewUid") : null;
        const targetUid = adminViewUid || user.uid;
        const userDoc = await getDoc(doc(db, 'users', targetUid));
        if (userDoc.exists()) {
          const account = userDoc.data() as AcademyAccount;
          setAcademyName(account.academyName || "");
          setAcademyLogo(account.academyLogo || null);
          if (account.applicationStatus) setApplicationStatus(account.applicationStatus);

          // Restore classification from Firestore when localStorage is empty
          // (e.g. fresh sign-in on a new device after restoreCloudToLocal ran)
          if (account.classificationType && !appStorage.getItem("selectedApplicationType")) {
            const cls = account.classificationType;
            setSelectedClassification(cls);
            setActiveAxes(getAxesForType(cls));
            appStorage.setItem("selectedApplicationType", cls);
          }

          setAdminStatus(account.adminStatus || null);
          setAdminFinalNote(account.adminFinalNote || null);

          // Fetch individual axis subcollection reviews
          try {
             const reviewsSnap = await getDocs(collection(db, 'users', targetUid, 'adminReviews'));
             const rData: Record<string, any> = {};
             reviewsSnap.forEach(r => { rData[r.id] = r.data(); });
             setAdminReviews(rData);
          } catch(e) {}
          
          // Sync to email-scoped storage so it doesn't bleed between users
          appStorage.setItem("academyBasicInfo", JSON.stringify({ ...account, id: user.uid }));
        } else {
          // Fallback to legacy if account not found in firestore
          const basicInfoStr = localStorage.getItem("academyBasicInfo");
          if (basicInfoStr) {
            try {
              const basicInfo = JSON.parse(basicInfoStr);
              if (basicInfo && basicInfo.academyName) setAcademyName(basicInfo.academyName);
              if (basicInfo && basicInfo.academyLogo) setAcademyLogo(basicInfo.academyLogo);
            } catch (e) {}
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard account data:", error);
      }
    };

    fetchAccountData();

    const savedClassification = appStorage.getItem("selectedApplicationType");
    if (savedClassification) {
      setSelectedClassification(savedClassification);
      if (savedClassification === 'B') {
        setActiveAxes(axesB);
      } else {
        setActiveAxes(axesA);
      }
    } else {
      setActiveAxes(axesA);
    }

    const registryData = getRegistryData();
    const mgmtRoles = ["owner", "administrativeManager", "financeOfficer", "mediaOfficer", "socialMediaOfficer", "photographer", "bOwner", "bGeneralSupervisor", "bAdministrativeCoordinator"];
    const techRoles = ["technicalSupervisor", "coachU10", "coachU11", "coachU12", "coachU13", "additionalCoach", "bCoachU12", "bCoachU13"];
    const medRoles = ["medicalManager", "doctor", "physiotherapist", "paramedic", "otherMedicalStaff", "bPhysiotherapist"];

    setRegistryCounts({
      management: registryData.people.filter(p => p.roleKey && mgmtRoles.includes(p.roleKey)).length,
      technical: registryData.people.filter(p => p.roleKey && techRoles.includes(p.roleKey)).length,
      medical: registryData.people.filter(p => p.roleKey && medRoles.includes(p.roleKey)).length
    });

    const isStarted = isApplicationStarted();
    
    // Check if any axis has data to auto-start
    const hasAnyDraft = [...axesA, ...axesB].some(axis => {
      const data = appStorage.getItem(axis.storageKey);
      return !!data;
    });

    if (hasAnyDraft && !isStarted && (savedClassification === 'A' || savedClassification === 'B')) {
      setApplicationStarted(true);
      setAppStarted(true);
    } else {
      setAppStarted(isStarted);
    }
  }, [navigate, refreshKey]);

  useEffect(() => {
    // Refresh data when dashboard mounts or state changes
    setRefreshKey(prev => prev + 1);
  }, [selectedClassification]);

  useEffect(() => {
    const handleFocus = () => setRefreshKey(prev => prev + 1);
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleResetClassification = () => {
    setShowChangeConfirm(true);
  };

  const confirmReset = () => {
    const axisKeys = [
      "applicationStarted", "selectedApplicationType", "lastOpenedAxis", 
      "classificationA_leadership", "classificationA_planning", "classificationA_organization", "classificationA_technical", "classificationA_budget", "classificationA_facilities", "classificationA_health", "classificationA_safeguarding", "classificationA_equipment", "classificationA_social_media",
      "classificationB_leadership", "classificationB_planning", "classificationB_organization", "classificationB_technical", "classificationB_facilities", "classificationB_safeguarding", "classificationB_equipment",
      "classificationA_registry", "classificationB_registry", "registryData"
    ];
    axisKeys.forEach(k => appStorage.removeItem(k));
    setSelectedClassification(null);
    setAppStarted(false);
    setApplicationStarted(false);
    setShowChangeConfirm(false);
    // Explicitly clear all registry data to start from zero as requested
    localStorage.removeItem("registryData");
    window.location.reload();
  };

  const handleSelectClassification = async (cls: string) => {
    if (selectedClassification && appStarted) {
      const confirm = window.confirm("لديك ملف قيد التعبئة. تغيير نوع الطلب سيعرض ملفًا منفصلًا ولن يحذف البيانات السابقة. هل تريد الاستمرار؟");
      if (!confirm) return;
    }
    
    setSelectedClassification(cls);
    appStorage.setItem("selectedApplicationType", cls);
    if (cls === 'B') {
      setActiveAxes(axesB);
    } else {
      setActiveAxes(axesA);
    }
    
    // Save to Firestore
    try {
      const user = await waitForAuth();
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          classificationType: cls
        });
      }
    } catch (e) {
      console.error("Error saving classification type:", e);
    }

    // Ensure we scroll to the top when the new dashboard appears
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartApplication = () => {
    if (!isRegistryReady(selectedClassification)) {
      alert("يرجى استكمال الحد الأدنى من سجل الأكاديمية (الأدوار الأساسية) قبل البدء بتعبئة المحاور.");
      return;
    }
    setApplicationStarted(true);
    setAppStarted(true);
    if (selectedClassification === 'A') {
      navigate('/classification/a/leadership');
    } else if (selectedClassification === 'B') {
      navigate('/classification/b/leadership');
    }
  };

  const handleContinueLastAxis = () => {
    const lastAxis = appStorage.getItem("lastOpenedAxis");
    if (lastAxis) {
      navigate(lastAxis);
    } else {
      if (selectedClassification === 'B') {
        navigate("/classification/b/leadership");
      } else {
        navigate("/classification/a/leadership");
      }
    }
  };

  const isRegistryFinished = isRegistryReady(selectedClassification);

  useEffect(() => {
    if (isRegistryFinished && !appStarted && selectedClassification && selectedClassification !== 'AffiliationOnly') {
      setAppStarted(true);
      setApplicationStarted(true);
    }
  }, [isRegistryFinished, appStarted, selectedClassification]);

  const getAxisStatus = (storageKey: string | null) => {
    if (!storageKey) return { label: "قريباً", color: "text-gray-400", bg: "bg-gray-50", fill: "bg-gray-200", percent: 0 };
    
    const calculateStatus = (p: number) => {
      if (p === 0) return { label: "لم يبدأ", color: "text-[#64748B]", bg: "bg-white", fill: "bg-gray-100", percent: 0 };
      if (p === 100) return { label: "مكتمل", color: "text-[#064E3B]", bg: "bg-green-50/50", fill: "bg-green-600", percent: 100 };
      if (p >= 50) return { label: "مكتمل جزئيًا", color: "text-[#064E3B]", bg: "bg-[#064E3B]/[0.03]", fill: "bg-[#064E3B]", percent: p };
      return { label: "قيد التعبئة", color: "text-[#C9A227]", bg: "bg-[#C9A227]/[0.03]", fill: "bg-[#C9A227]", percent: p };
    };

    const data = appStorage.getItem(storageKey);
    if (!data) return calculateStatus(0);
    
    try {
      const parsed = JSON.parse(data);
      
      // Prioritize saved completion fields
      let percentage = 0;
      if (parsed.completionPercentage !== undefined) {
        percentage = parsed.completionPercentage;
      } else if (parsed.progress !== undefined) {
        percentage = parsed.progress;
      } else if (parsed.percentage !== undefined) {
        percentage = parsed.percentage;
      } else if (parsed.completedPercentage !== undefined) {
        percentage = parsed.completedPercentage;
      } else if (parsed.completion !== undefined) {
        percentage = parsed.completion;
      } else {
        // Only if absolutely no percentage field, fallback to counting some keys if they exist
        const keys = Object.keys(parsed).filter(k => !['lastUpdated', 'status', 'completionPercentage'].includes(k));
        if (keys.length > 0) {
           // This is a minimal fallback to avoid 0% if data exists but field is missing
           percentage = Math.round(Math.min(99, (keys.length / 5) * 100));
        }
      }

      const statusInfo = calculateStatus(percentage);
      
      // Preserve saved status if it's more specific, while keeping color logic consistent
      if (parsed.status && percentage > 0 && percentage < 100) {
        statusInfo.label = parsed.status;
      }

      return statusInfo;
    } catch {
      return calculateStatus(0);
    }
  };

  const getNextStep = () => {
    for (const axis of activeAxes.filter(a => a.isBuilt)) {
      const status = getAxisStatus(axis.storageKey);
      if (status.percent < 100) {
        return axis;
      }
    }
    return null;
  };

  const nextStepAxis = getNextStep();

  const handleResetApplicationState = () => {
    const axisKeys = ["applicationStarted", "selectedApplicationType", "lastOpenedAxis", 
      "classificationA_leadership", "classificationA_planning", "classificationA_organization", "classificationA_technical", "classificationA_budget", "classificationA_facilities", "classificationA_health", "classificationA_safeguarding", "classificationA_equipment", "classificationA_social_media",
      "classificationB_leadership", "classificationB_planning", "classificationB_organization", "classificationB_technical", "classificationB_facilities", "classificationB_safeguarding", "classificationB_equipment",
      "classificationA_registry", "classificationB_registry"
    ];
    axisKeys.forEach(k => appStorage.removeItem(k));
    setSelectedClassification(null);
    setAppStarted(false);
    window.location.reload();
  };

  const calculateTotalProgress = () => {
    const builtAxes = activeAxes.filter(a => a.isBuilt);
    if (builtAxes.length === 0) return 0;
    const completedCount = builtAxes.reduce((acc, current) => {
      const status = getAxisStatus(current.storageKey);
      return acc + (status.percent / 100);
    }, 0);
    return Math.round((completedCount / builtAxes.length) * 100);
  };

  const totalProgress = calculateTotalProgress();
  const registryData = getRegistryData();
  const registryPeopleCount = registryData.people.filter(p => isPersonComplete(p)).length;
  const registryTarget = selectedClassification === 'A' ? 7 : 4;
  const registryPercentage = Math.min(100, Math.round((registryPeopleCount / registryTarget) * 100));

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md" dir="rtl">
      <AppHeader academyName={academyName} academyLogo={academyLogo} />

      {selectedClassification && (selectedClassification === 'A' || selectedClassification === 'B') ? (
        <main className="max-w-[1200px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header Section: Engine Dashboard */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div className="bg-white p-8 rounded-[40px] border border-[#E5DED0] shadow-sm relative overflow-hidden group transition-all hover:shadow-md">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F6F1E7]/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-24 h-24 bg-[#F6F1E7] rounded-[32px] border-2 border-[#064E3B]/10 p-2 flex items-center justify-center shadow-inner shrink-0 scale-100 group-hover:scale-105 transition-transform duration-500">
                        {academyLogo ? (
                          <img src={academyLogo} alt="Academy Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="material-symbols-outlined text-[#064E3B] text-5xl">domain</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h1 className="font-display-md text-3xl md:text-4xl font-black text-[#022C22]">
                          {academyName ? `أكاديمية ${academyName}` : "لوحة متابعة الملف"}
                        </h1>
                        <span className={`px-4 py-1.5 rounded-full text-[12px] font-black border uppercase tracking-wider ${selectedClassification === 'A' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-[#C9A227] text-[#022C22] border-[#C9A227]'}`}>
                           المستوى {selectedClassification}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#64748B] font-bold">
                        <span className="material-symbols-outlined text-sm">rocket_launch</span>
                        <span>{selectedClassification === 'A' ? 'مسار التميز الاحترافي' : 'مسار التطوير الكلاسيكي'}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleResetClassification}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#E5DED0] text-[#64748B] rounded-2xl font-black text-sm hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all group"
                  >
                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">swap_horiz</span>
                    تغيير التصنيف
                  </button>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#022C22] text-white rounded-[40px] p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="text-[#C9A227] font-black text-sm uppercase tracking-widest mb-2">إجمالي الإنجاز</div>
                      <div className="text-6xl font-black">{totalProgress}%</div>
                    </div>
                    <div className="w-24 h-24 relative flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 96 96" className="absolute inset-0 w-full h-full transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-white/10"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - totalProgress / 100)}
                          strokeLinecap="round"
                          className="text-[#C9A227] transition-all duration-1000"
                        />
                      </svg>
                      <span className="relative z-10 material-symbols-outlined text-4xl text-[#C9A227]">trending_up</span>
                    </div>
                  </div>
                </div>

                <div className={`rounded-[40px] p-8 border-2 flex flex-col justify-between transition-all ${isRegistryFinished ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isRegistryFinished ? 'bg-green-600 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                      <span className="material-symbols-outlined">{isRegistryFinished ? 'verified' : 'pending_actions'}</span>
                    </div>
                    <div>
                      <div className={`font-black text-lg ${isRegistryFinished ? 'text-green-900' : 'text-amber-900'}`}>
                        {isRegistryFinished ? 'سجل الكوادر مكتمل' : 'استكمال سجل الكوادر'}
                      </div>
                      <div className="text-xs font-bold opacity-70">الخطوة الأساسية لتفعيل الملف</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] font-black mb-1 opacity-60">
                      <span>جاهزية السجل</span>
                      <span>{registryPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${isRegistryFinished ? 'bg-green-500' : 'bg-amber-500'}`} 
                        style={{ width: `${registryPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className={`text-xs font-bold leading-relaxed mb-6 space-y-1 ${isRegistryFinished ? 'text-green-800/80' : 'text-amber-800/80'}`}>
                    {isRegistryFinished 
                      ? 'لقد أضفت كافة الكوادر المطلوبة لهذا المستوى. يمكنك الآن التركيز على تعبئة المحاور الفنية.' 
                      : (
                        <div className="space-y-2">
                          <p>يرجى استكمال الأدوار الإلزامية التالية (المعلومات + الملفات) لفتح محاور التصنيف:</p>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {selectedClassification === 'A' ? (
                              <>
                                <div className={registryData.people.some(p => p.roleKey === 'owner' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المالك</div>
                                <div className={registryData.people.some(p => p.roleKey === 'administrativeManager' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المدير الإداري</div>
                                <div className={registryData.people.some(p => p.roleKey === 'technicalSupervisor' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المشرف الفني</div>
                                <div className={registryData.people.some(p => p.roleKey === 'financeOfficer' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المسؤول المالي</div>
                                <div className={registryData.people.some(p => p.roleKey === 'mediaOfficer' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المسؤول الإعلامي</div>
                                <div className={registryData.people.some(p => p.roleKey === 'medicalManager' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• مدير العلاج</div>
                                <div className={["coachU10", "coachU11", "coachU12", "coachU13"].some(rk => registryData.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? "line-through opacity-50" : ""}>• مدرب (فئات)</div>
                              </>
                            ) : (
                              <>
                                <div className={registryData.people.some(p => p.roleKey === 'bOwner' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المالك</div>
                                <div className={registryData.people.some(p => p.roleKey === 'bGeneralSupervisor' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المشرف العام</div>
                                <div className={["bCoachU12", "bCoachU13"].some(rk => registryData.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? "line-through opacity-50" : ""}>• مدرب (فئات)</div>
                                <div className={registryData.people.some(p => p.roleKey === 'bPhysiotherapist' && isPersonComplete(p)) ? "line-through opacity-50" : ""}>• المعالج</div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    }
                  </div>
                  <Link 
                    to="/academy-registry"
                    className={`w-full py-4 rounded-2xl font-black text-center transition-all ${isRegistryFinished ? 'bg-white border-2 border-green-200 text-green-700 hover:bg-green-100' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200'}`}
                  >
                    {isRegistryFinished ? 'تعديل بيانات الكوادر' : 'إكمال السجل الآن'}
                  </Link>
                </div>
              </div>
            </div>

            {/* Side Action: Last Step & Tips */}
            <div className="w-full lg:w-[350px] space-y-6">
               <div className="bg-white rounded-[40px] p-8 border border-[#E5DED0] shadow-sm">
                  <h3 className="font-black text-[#022C22] text-xl mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#064E3B]">tips_and_updates</span>
                    محرك التوجيه
                  </h3>
                  
                  {!isRegistryFinished ? (
                    <div className="text-center py-10 px-4 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
                        <span className="material-symbols-outlined text-3xl">lock</span>
                      </div>
                      <div className="font-black text-gray-500 mb-2">المحرك بانتظار الكوادر</div>
                      <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                        سيقوم المحرك بتوجيهك للمهمة التالية فور استكمال بيانات الكوادر البشرية.
                      </p>
                    </div>
                  ) : nextStepAxis ? (
                    <div className="space-y-6">
                      <div className="p-5 bg-[#F6F1E7] rounded-[24px] border border-[#E5DED0]/50">
                        <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-1">المهمة التالية</div>
                        <div className="text-lg font-black text-[#022C22] mb-3">محور {nextStepAxis.name}</div>
                        <p className="text-xs text-[#64748B] font-bold leading-relaxed mb-4">
                           تحتاج لاستكمال تعبئة الوثائق والبيانات في هذا المحور لرفع نسبة الإنجاز الكلية.
                        </p>
                        <Link 
                          to={nextStepAxis.route}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#064E3B] text-white rounded-xl font-bold text-sm hover:scale-[1.02] transition-all"
                        >
                          بدء المحور
                          <span className="material-symbols-outlined text-sm rotate-180">arrow_right_alt</span>
                        </Link>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex gap-4 items-start">
                           <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                             <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                           </div>
                           <p className="text-[11px] font-bold text-[#64748B] leading-relaxed">
                              تأكد من وضوح نسخة الهوية والشهادات المرفوعة لتسريع عملية المراجعة.
                           </p>
                         </div>
                         <div className="flex gap-4 items-start">
                           <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                             <span className="material-symbols-outlined text-[18px]">info</span>
                           </div>
                           <p className="text-[11px] font-bold text-[#64748B] leading-relaxed">
                              يتم حفظ بياناتك تلقائياً في كل مرة تقوم فيها برفع ملف أو كتابة معلومة.
                           </p>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                       <span className="material-symbols-outlined text-5xl text-green-500 mb-4">verified</span>
                       <div className="font-black text-[#022C22]">أحسنت!</div>
                       <p className="text-xs text-[#64748B] font-bold mt-2">لقد أتممت كافة محاور الملف.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/* Engine grid of axes */}
          <div className="space-y-8">
            <div className="flex items-center justify-between border-b-2 border-[#E5DED0] pb-4">
               <h2 className="text-3xl font-black text-[#022C22] flex items-center gap-4">
                 <span className="material-symbols-outlined text-4xl text-[#064E3B]">lan</span>
                 محاور التصنيف
               </h2>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E5DED0] text-[#64748B] text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    مكتمل
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-[#E5DED0] text-[#64748B] text-xs font-bold">
                    <div className="w-2 h-2 rounded-full bg-[#C9A227]"></div>
                    قيد العمل
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeAxes.map((axis, i) => {
                const status = getAxisStatus(axis.storageKey);
                const isLocked = !isRegistryFinished;
                
                return (
                  <motion.div 
                    key={i}
                    whileHover={axis.isBuilt && !isLocked ? { y: -5 } : {}}
                    className={`bg-white rounded-[32px] p-6 border-2 transition-all group ${
                      isLocked && axis.isBuilt
                        ? 'opacity-75 border-gray-200 bg-gray-50/50' 
                        : axis.isBuilt 
                          ? (status.percent === 100 ? 'border-green-200 hover:border-green-400' : 'border-[#E5DED0] hover:border-[#064E3B]') 
                          : 'border-dashed border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                             isLocked && axis.isBuilt ? 'bg-gray-200 text-gray-500' :
                             axis.isBuilt ? (status.percent === 100 ? 'bg-green-600 text-white' : 'bg-[#064E3B] text-white') : 'bg-gray-100 text-gray-400'
                           }`}>
                             {isLocked && axis.isBuilt ? (
                               <span className="material-symbols-outlined text-xl">lock</span>
                             ) : (
                               i + 1
                             )}
                           </div>
                           {axis.isBuilt && (
                             <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${isLocked ? 'bg-gray-100 text-gray-400' : `${status.bg} ${status.color}`} border border-current/10`}>
                               {isLocked ? 'مغلق' : status.label}
                             </div>
                           )}
                        </div>
                        <h3 className={`text-xl font-black mb-2 transition-colors ${isLocked && axis.isBuilt ? 'text-gray-400' : 'text-[#022C22]'}`}>{axis.name}</h3>
                        {axis.isBuilt && (
                          <div className={`space-y-3 ${isLocked ? 'opacity-40' : ''}`}>
                            <div className="flex items-center justify-between text-[11px] font-black text-[#64748B] uppercase">
                               <span>نسبة الإنجاز</span>
                               <span className={status.color}>{status.percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${status.fill}`} 
                                style={{ width: `${status.percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {axis.isBuilt && adminReviews[axis.storageKey] && (
                        <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-bold flex flex-col gap-1 border ${
                          adminReviews[axis.storageKey].status === 'مقبول' 
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : adminReviews[axis.storageKey].status === 'مرفوض'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                           <div className="flex items-center gap-1.5">
                             <span className="material-symbols-outlined text-[14px]">shield_person</span>
                             مراجعة الإدارة: {adminReviews[axis.storageKey].status}
                           </div>
                           {adminReviews[axis.storageKey].note && (
                             <div className="text-[10px] opacity-80 mt-1 font-normal leading-relaxed">
                               {adminReviews[axis.storageKey].note}
                             </div>
                           )}
                        </div>
                      )}

                      {axis.isBuilt ? (
                        isLocked ? (
                          <div className="w-full py-4 rounded-xl font-black text-xs text-gray-400 bg-gray-100 text-center border border-gray-200 flex items-center justify-center gap-2">
                             <span className="material-symbols-outlined text-[18px]">lock</span>
                             استكمل السجل للفتح
                          </div>
                        ) : (
                          <Link 
                            to={axis.route} 
                            onClick={() => appStorage.setItem("lastOpenedAxis", axis.route)}
                            className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all ${status.percent === 100 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-50 text-[#022C22] hover:bg-gray-100 border border-gray-200'}`}
                          >
                             {status.percent === 100 ? 'مكتمل - تصفح المرفقات' : 'بدء تعبئة المحور'}
                             <span className="material-symbols-outlined text-[18px] rtl:rotate-180">arrow_forward</span>
                          </Link>
                        )
                      ) : (
                        <div className="w-full py-4 rounded-xl font-black text-xs text-gray-400 bg-gray-50 text-center border border-dashed border-gray-200">
                           قريباً...
                        </div>
                      )}
                    </div>
                 </motion.div>
                );
              })}
          </div>

          {/* Submission Gate */}
          <div className="bg-[#022C22] rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-right">
             <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#C9A227]/20 rounded-full blur-3xl"></div>
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1">
                   <h2 className="text-4xl font-black text-[#C9A227] mb-4">اكتمال الملف والإرسال</h2>
                   <p className="text-white/70 text-lg leading-relaxed max-w-2xl">
                     {applicationStatus === 'submitted'
                       ? "تم إرسال طلبك بنجاح. وهو الآن قيد المراجعة من قبل الاتحاد اللبناني لكرة القدم."
                       : "تستطيع إرسال الملف بمجرد وصول نسبة الإنجاز في جميع المحاور إلى 100% واستكمال سجل الكوادر."}
                   </p>
                </div>
                <div className="shrink-0 space-y-4 w-full md:w-auto">
                   <button 
                     disabled={totalProgress < 100 || !isRegistryFinished || submitting || applicationStatus === 'submitted'}
                     onClick={async () => {
                       try {
                         const user = await waitForAuth();
                         if (!user) {
                             alert("يرجى تسجيل الدخول.");
                             return;
                         }
                         setSubmitting(true);
                         await updateDoc(doc(db, 'users', user.uid), {
                           applicationStatus: 'submitted',
                           classificationType: selectedClassification,
                           totalProgress: totalProgress,
                           submittedAt: Date.now()
                         });
                         setApplicationStatus('submitted');
                         alert("تم إرسال الملف بنجاح.");
                       } catch (e: any) {
                         alert("حدث خطأ أثناء إرسال الملف: " + e.message);
                       } finally {
                         setSubmitting(false);
                       }
                     }}
                     className={`w-full md:w-auto px-16 py-6 rounded-[30px] font-black text-2xl flex items-center justify-center gap-5 transition-all ${totalProgress < 100 || !isRegistryFinished || submitting || applicationStatus === 'submitted' ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-[#C9A227] text-[#022C22] hover:bg-[#D4B145] hover:scale-105 shadow-xl shadow-[#C9A227]/10'}`}
                   >
                     <span>
                        {submitting ? 'جاري الإرسال...' : applicationStatus === 'submitted' ? 'تم الإرسال للمراجعة' : 'إرسال الملف النهائي'}
                     </span>
                     <span className="material-symbols-outlined font-black text-3xl">send</span>
                   </button>
                   <div className="text-center text-[11px] text-white/50 font-bold">
                      {applicationStatus === 'submitted' 
                        ? 'مُكتمل' 
                        : totalProgress < 100 ? `تحتاج لـ ${100 - totalProgress}% إضافية للتفعيل` : 'جاهز للإرسال الآن'}
                   </div>
                </div>
             </div>
          </div>
          </div>

        </main>
      ) : selectedClassification === 'AffiliationOnly' ? (
        <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-10 animate-in fade-in duration-700">
          <div>
            <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
              نظام الانتساب فقط
            </h1>
            <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
              أهلاً بكم في نظام الانتساب الرسمي بالاتحاد اللبناني لكرة القدم.
            </p>
          </div>

          <div className="bg-[#022C22] text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
             <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#C9A227] text-[#022C22] px-4 py-1.5 rounded-full font-bold text-sm">
                  تنبيه هام
                </div>
                <h2 className="text-3xl font-bold">الانتساب ليس تصنيفاً</h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  الانتساب فقط يمنح الأكاديمية صفة رسمية تحت مظلة الاتحاد، ولا يفتح ملف التصنيف أو المشاركة في المسابقات الرسمية للأكاديميات. يمكنكم التقدم للتصنيف A أو B لاحقاً عند الجاهزية.
                </p>
                <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
                   <Link to="/academy-registry" className="px-8 py-4 bg-[#C9A227] text-[#022C22] rounded-xl font-bold hover:bg-[#D4B145] transition-all">إدارة سجل الأكاديمية</Link>
                   <button onClick={handleResetClassification} className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 border border-white/20 transition-all">تغيير نوع الطلب</button>
                </div>
             </div>
          </div>
        </main>
      ) : (
        <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-10 animate-in fade-in duration-700">
          
          {/* Admin Review Status Banner */}
          {applicationStatus === 'submitted' && (
            <div className={`p-6 rounded-3xl border shadow-sm ${adminStatus === 'approved' ? 'bg-green-50 border-green-200' : adminStatus === 'declined' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
               <div className="flex items-start gap-4">
                 <span className={`material-symbols-outlined text-3xl ${adminStatus === 'approved' ? 'text-green-600' : adminStatus === 'declined' ? 'text-red-600' : 'text-blue-600'}`}>
                    {adminStatus === 'approved' ? 'check_circle' : adminStatus === 'declined' ? 'cancel' : 'info'}
                 </span>
                 <div>
                    <h3 className={`text-lg font-black mb-1 ${adminStatus === 'approved' ? 'text-green-800' : adminStatus === 'declined' ? 'text-red-800' : 'text-blue-800'}`}>
                       حالة المراجعة: {adminStatus === 'approved' ? 'تم اعتماد الملف والموافقة عليه' : adminStatus === 'declined' ? 'مرفوض - نعتذر لعدم استيفاء الشروط' : 'الملف قيد المراجعة لدى الإدارة الفنية'}
                    </h3>
                    <p className={`text-sm font-bold ${adminStatus === 'approved' ? 'text-green-700' : adminStatus === 'declined' ? 'text-red-700' : 'text-blue-700'}`}>
                       تم إرسال الملف بنجاح. سنقوم بمراجعة جميع المحاور وإبلاغكم بالنتيجة النهائية هنا.
                    </p>
                    {adminFinalNote && (
                      <div className="mt-4 p-4 bg-white/60 rounded-xl border border-white/50 text-gray-800 text-sm font-bold shadow-inner">
                        <span className="block text-xs uppercase text-gray-500 mb-1">ملاحظة من الإدارة:</span>
                        {adminFinalNote}
                      </div>
                    )}
                 </div>
               </div>
            </div>
          )}

          {selectedClassification && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-[#E5DED0] shadow-sm">
               <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-[#F6F1E7] rounded-[32px] border-2 border-[#064E3B]/10 p-2 flex items-center justify-center shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => navigate("/academy-registry")}>
                    {academyLogo ? (
                      <img src={academyLogo} alt="Academy Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-[#064E3B] text-5xl">domain</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h1 className="font-display-md text-3xl md:text-3xl font-black text-[#022C22]">
                        أكاديمية {academyName || "..."}
                      </h1>
                      {isRegistryFinished && (
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black border border-green-200">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          السجل مكتمل
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${selectedClassification === 'A' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-[#C9A227] text-[#022C22] border-[#C9A227]'}`}>
                        مسار التصنيف {selectedClassification}
                      </span>
                      <span className="text-[#64748B] text-xs font-bold">
                        {selectedClassification === 'A' ? 'الاحترافي المتكامل' : 'الأساسيات والتطوير'}
                      </span>
                    </div>
                  </div>
               </div>
               
               <div className="flex flex-col items-end gap-2">
                  <button onClick={handleResetClassification} className="text-xs font-bold text-[#64748B] hover:text-[#064E3B] flex items-center gap-1 border-b border-dashed border-[#64748B] hover:border-[#064E3B] transition-colors">
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    تغيير نوع الطلب
                  </button>
               </div>
            </div>
          )}

          {selectedClassification && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Registry Card (Dynamic) */}
               <div className={`md:col-span-2 rounded-[40px] p-8 md:p-10 border transition-all flex flex-col justify-between ${isRegistryFinished ? 'bg-white border-[#064E3B] shadow-lg shadow-[#064E3B]/5' : 'bg-white border-[#E5DED0] shadow-sm'}`}>
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isRegistryFinished ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                         <span className="material-symbols-outlined text-3xl">
                            {isRegistryFinished ? 'verified_user' : 'group_add'}
                         </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-[#022C22]">
                          {isRegistryFinished ? "سجل الكوادر مكتمـل" : "استكمال سجل الأكاديمية"}
                        </h3>
                        <p className="text-[#64748B] font-bold text-sm">المرحلة الأولى: توثيق الفريق الإداري والفني</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                      <p className="text-[#64748B] leading-relaxed">
                        {isRegistryFinished 
                          ? "لقد قمت بإضافة كافة الأدوار الأساسية المطلوبة لهذا المستوى من التصنيف. يمكنك الآن مراجعة بيانات فريقك أو الانتقال للمرحلة التالية."
                          : `يتطلب تصنيف ${selectedClassification} إضافة الأدوار الأساسية (المالك، المدير، المدربين، الجهاز الطبي) لفتح ملف المحاور الفنية.`
                        }
                      </p>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                          <span className="material-symbols-outlined text-[18px] text-[#064E3B]">badge</span>
                          {registryCounts.management} إداريين
                        </div>
                        <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                          <span className="material-symbols-outlined text-[18px] text-[#064E3B]">sports_soccer</span>
                          {registryCounts.technical} مدربين
                        </div>
                        <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                          <span className="material-symbols-outlined text-[18px] text-[#064E3B]">medical_services</span>
                          {registryCounts.medical} جهاز طبي
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link to="/academy-registry" className={`w-full py-5 rounded-2xl font-black text-center transition-all flex items-center justify-center gap-3 ${isRegistryFinished ? 'bg-white border-2 border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white' : 'bg-[#064E3B] text-white hover:bg-[#022C22] shadow-xl'}`}>
                    <span className="material-symbols-outlined">group</span>
                    {isRegistryFinished ? 'مراجعة وتعديل السجل' : 'البدء بإضافة الكوادر'}
                  </Link>
               </div>

               {/* Pillar Access Card (Depends on Registry) */}
               <div className={`rounded-[40px] p-8 md:p-10 border transition-all flex flex-col justify-between ${isRegistryFinished ? 'bg-[#022C22] text-white border-[#022C22] shadow-2xl scale-105' : 'bg-gray-50 border-[#E5DED0] opacity-80'}`}>
                  <div className="space-y-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isRegistryFinished ? 'bg-[#C9A227] text-[#022C22]' : 'bg-gray-200 text-gray-400'}`}>
                       <span className="material-symbols-outlined text-3xl">
                          {isRegistryFinished ? 'rocket_launch' : 'lock'}
                       </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black mb-2">محاور التصنيف</h3>
                      <p className={`text-sm ${isRegistryFinished ? 'text-white/70' : 'text-gray-400'} leading-relaxed`}>
                        {isRegistryFinished 
                          ? "سجل الأكاديمية مكتمل بنجاح. يمكنك الآن البدء بتعبئة المحاور الفنية والوثائق المطلوبة." 
                          : "سيتم تفعيل هذا القسم فور اكتمال الحد الأدنى من سجل الكوادر البشرية للأكاديمية."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8">
                    {isRegistryFinished ? (
                      <button onClick={handleStartApplication} className="w-full py-5 bg-[#C9A227] text-[#022C22] rounded-2xl font-black hover:bg-[#D4B145] transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95">
                        <span className="material-symbols-outlined">edit_document</span>
                        بدء تعبئة المحاور
                      </button>
                    ) : (
                      <div className="w-full py-5 bg-gray-200 text-gray-400 rounded-2xl font-black text-center border border-gray-300">
                        بانتظار السجل...
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {selectedClassification && !isRegistryFinished && (
            <div className="bg-[#FFF9E6] border border-[#F0D0A0] p-6 rounded-[32px] flex items-start gap-4 animate-pulse">
               <span className="material-symbols-outlined text-[#C9A227] text-2xl mt-1">info</span>
               <div>
                  <h4 className="font-bold text-[#8A6D1B] mb-1 text-lg">لماذا يجب إكمال السجل أولاً؟</h4>
                  <p className="text-[#8A6D1B]/80 text-sm leading-relaxed">
                    نظام التصنيف موجه للأفراد والمناصب. عند تعبئة المحاور الفنية، سيقوم النظام بسحب بيانات المدربين والمشرفين تلقائياً من السجل المكتمل، مما يوفر عليك الوقت ويمنع تكرار إدخال البيانات.
                  </p>
               </div>
            </div>
          )}

        {/* 4. Classification Guide Section */}
        <div className="space-y-12">
          {/* Header Banner */}
          <div className="bg-[#064E3B] text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
            <div className="absolute -top-12 -left-12 opacity-10 pointer-events-none text-white">
               <span className="material-symbols-outlined text-[150px]">menu_book</span>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="w-16 h-16 bg-[#C9A227]/20 border border-[#C9A227]/30 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                 <span className="material-symbols-outlined text-4xl text-[#C9A227]">menu_book</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#C9A227] mb-2">دليل اختيار التصنيف</h2>
                <p className="text-white/90 font-medium leading-relaxed text-lg">
                  يحدد نوع التصنيف الفوارق الجوهرية في متطلبات الجهاز الإداري والفني والمنهجية المتبعة. يرجى مراجعة الجدول والهيكل التنظيمي المقترح لكل مستوى.
                </p>
              </div>
            </div>
          </div>

          {/* Hierarchy Examples Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             {/* Example A */}
             <div className="bg-white rounded-[32px] p-6 md:p-10 border border-[#E5DED0] shadow-sm flex flex-col h-full hover:border-[#064E3B] transition-all group">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#064E3B] text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-[#064E3B]/20 group-hover:scale-110 transition-transform">A</div>
                      <div className="text-right">
                         <h3 className="text-xl font-bold text-[#022C22]">هيكل الأكاديمية - تصنيف A</h3>
                         <p className="text-xs text-[#64748B] font-bold">نموذج الهيكلية الإدارية والفنية المتكاملة</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 bg-[#C9A227]/10 rounded-full flex items-center justify-center">
                     <span className="material-symbols-outlined text-[#C9A227] text-lg font-bold">verified</span>
                   </div>
                </div>

                <div className="flex-1 space-y-0 relative pb-4">
                   {/* Owner Node - Centered */}
                   <div className="flex justify-center">
                     <div className="z-10 bg-white border-2 border-[#064E3B]/10 p-5 rounded-3xl flex items-center justify-between shadow-md hover:shadow-lg transition-all w-full max-w-[420px]">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#064E3B] to-[#022C22] rounded-2xl flex items-center justify-center text-white shadow-lg"><span className="material-symbols-outlined text-3xl">person</span></div>
                          <div className="text-right">
                            <div className="text-base font-black text-[#022C22]">المالك</div>
                            <div className="text-xs text-[#64748B] font-bold">صاحب الترخيص القانوني</div>
                          </div>
                        </div>
                        <div className="bg-[#C9A227] text-[#022C22] px-3 py-1 rounded-full text-[10px] font-black mr-4">رأس الهرم</div>
                     </div>
                   </div>

                   {/* Vertical Connector */}
                   <div className="flex justify-center">
                     <div className="w-1 h-10 bg-gray-200"></div>
                   </div>

                   {/* Operational Head - Administrative Manager */}
                   <div className="relative z-10 bg-[#F8F9FA] border-2 border-[#064E3B]/5 p-6 rounded-3xl flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 bg-[#064E3B] rounded-2xl flex items-center justify-center text-[#C9A227] shadow-lg"><span className="material-symbols-outlined text-3xl">account_balance</span></div>
                         <div className="text-right flex-1">
                            <div className="text-xl font-black text-[#022C22]">المدير الإداري</div>
                            <div className="text-[11px] font-bold text-[#64748B] flex items-center gap-2 mt-1">
                               <span className="material-symbols-outlined text-[14px] text-[#C9A227]">verified_user</span>
                               المسؤول الأول عن كافة شؤون الأكاديمية
                            </div>
                         </div>
                      </div>
                      
                      {/* Sub-branching Line inside card */}
                      <div className="relative pt-4 border-t border-gray-200 mt-2">
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 w-1 h-6 bg-gray-200"></div>
                        <div className="absolute left-1/4 right-1/4 top-10 h-1 bg-gray-200 rounded-full"></div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12">
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-[#064E3B]/5 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg text-[#064E3B]">engineering</span>
                                 </div>
                                 <span className="text-xs font-black text-[#022C22] uppercase tracking-wider">الطاقم الإداري</span>
                              </div>
                              <div className="space-y-2">
                                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs font-black text-[#022C22] flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></div>
                                   المسؤول المالي
                                </div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 text-xs font-black text-[#022C22] flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-[#C9A227]"></div>
                                   المسؤول الإعلامي
                                </div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-4 sm:border-r border-gray-100 sm:pr-6">
                              <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#C9A227]/5 rounded-lg flex items-center justify-center">
                                       <span className="material-symbols-outlined text-lg text-[#C9A227]">sports_soccer</span>
                                    </div>
                                    <span className="text-xs font-black text-[#022C22] uppercase tracking-wider">القسم الفني</span>
                                 </div>
                                 <div className="mr-11">
                                    <span className="text-[10px] bg-[#022C22] text-[#C9A227] px-3 py-0.5 rounded-full font-black">4 فئات</span>
                                 </div>
                              </div>
                              
                              <div className="mt-2">
                                 <div className="text-sm font-black text-[#022C22] border-b border-gray-200 pb-2">المشرف الفني <span className="text-[10px] text-[#64748B] block mt-1">(A/B License)</span></div>
                                 <div className="grid grid-cols-2 gap-2 mt-3">
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-[9px] text-[#022C22] font-black text-center shadow-sm">مدرب فئة U10</div>
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-[9px] text-[#022C22] font-black text-center shadow-sm">مدرب فئة U11</div>
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-[9px] text-[#022C22] font-black text-center shadow-sm">مدرب فئة U12</div>
                                    <div className="bg-white p-2 rounded-xl border border-gray-100 text-[9px] text-[#022C22] font-black text-center shadow-sm">مدرب فئة U13</div>
                                 </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-200">
                                 <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                       <span className="material-symbols-outlined text-lg text-blue-600">health_and_safety</span>
                                    </div>
                                    <span className="text-xs font-black text-[#022C22] uppercase tracking-wider">قسم العلاج</span>
                                 </div>
                                 <div className="flex flex-row gap-2">
                                    <div className="bg-[#022C22] p-2 rounded-xl text-[9px] text-white font-black text-center shadow-lg flex-1 whitespace-nowrap">مدير العلاج</div>
                                    <div className="bg-[#064E3B] p-2 rounded-xl text-[9px] text-white font-black text-center shadow-lg flex-1 whitespace-nowrap">طبيب معتمد</div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Footer Info */}
                   <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-[#E5DED0] text-center mt-6">
                     <p className="text-[10px] text-[#64748B] font-bold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        يتطلب هذا المستوى 4 فئات عمرية وجهازاً إدارياً فصلاً.
                     </p>
                   </div>
                </div>
             </div>

             {/* Example B */}
             <div className="bg-white rounded-[32px] p-6 md:p-10 border border-[#E5DED0] shadow-sm flex flex-col h-full hover:border-[#C9A227] transition-all group">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#022C22] text-[#C9A227] rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-[#022C22]/20 group-hover:scale-110 transition-transform">B</div>
                      <div className="text-right">
                         <h3 className="text-xl font-bold text-[#022C22]">هيكل الأكاديمية - تصنيف B</h3>
                         <p className="text-xs text-[#64748B] font-bold">نموذج الهيكل التنظيمي الأساسي المرن</p>
                      </div>
                   </div>
                   <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                     <span className="material-symbols-outlined text-gray-400 text-lg">handyman</span>
                   </div>
                </div>

                <div className="flex-1 space-y-0 relative pb-4">
                   {/* Owner Node - Centered */}
                   <div className="flex justify-center">
                     <div className="z-10 bg-white border-2 border-[#022C22]/10 p-5 rounded-3xl flex items-center justify-between shadow-md hover:shadow-lg transition-all w-full max-w-[420px]">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-[#022C22] to-[#011F18] rounded-2xl flex items-center justify-center text-[#C9A227] shadow-lg"><span className="material-symbols-outlined text-3xl">person</span></div>
                          <div className="text-right">
                            <div className="text-base font-black text-[#022C22]">المالك</div>
                            <div className="text-xs text-[#64748B] font-bold">صاحب الترخيص</div>
                          </div>
                        </div>
                        <div className="bg-[#C9A227] text-[#022C22] px-3 py-1 rounded-full text-[10px] font-black mr-4">رأس الهرم</div>
                     </div>
                   </div>

                   {/* Vertical Connector */}
                   <div className="flex justify-center">
                     <div className="w-1 h-10 bg-gray-200"></div>
                   </div>

                   {/* Operational Head - General Supervisor */}
                   <div className="relative z-10 bg-[#FDFBF7] border-2 border-[#C9A227]/10 p-6 rounded-3xl flex flex-col gap-6 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-16 h-16 bg-[#C9A227]/10 rounded-2xl flex items-center justify-center text-[#C9A227] shadow-inner"><span className="material-symbols-outlined text-3xl">manage_accounts</span></div>
                         <div className="text-right flex-1">
                            <div className="text-xl font-black text-[#022C22]">المشرف العام للأكاديمية</div>
                            <div className="text-[11px] font-bold text-[#64748B] flex items-center gap-2 mt-1">
                               <span className="material-symbols-outlined text-[14px] text-[#C9A227]">info</span>
                               يدمج المهام الفنية والإدارية معاً
                            </div>
                         </div>
                      </div>
                      
                      {/* Sub-branching Line inside card */}
                      <div className="relative pt-4 border-t border-gray-200 mt-2">
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 w-1 h-6 bg-gray-200"></div>
                        <div className="absolute left-1/4 right-1/4 top-10 h-1 bg-gray-200 rounded-full"></div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12">
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#022C22]/5 rounded-lg flex items-center justify-center">
                                       <span className="material-symbols-outlined text-lg text-[#022C22]">groups</span>
                                    </div>
                                    <span className="text-xs font-black text-[#022C22] uppercase tracking-wider">القسم الفني</span>
                                 </div>
                                 <span className="text-[10px] bg-[#022C22] text-[#C9A227] px-2 py-0.5 rounded-full font-black">فئتان</span>
                              </div>
                              <div className="flex flex-row gap-2">
                                 <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs font-black text-[#64748B] text-center flex-1 whitespace-nowrap">مدرب فئة U12</div>
                                 <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs font-black text-[#64748B] text-center flex-1 whitespace-nowrap">مدرب فئة U13</div>
                              </div>
                           </div>
                           <div className="flex flex-col gap-4 sm:border-r border-gray-100 sm:pr-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                    <span className="material-symbols-outlined text-lg text-red-600">health_and_safety</span>
                                 </div>
                                 <span className="text-xs font-black text-[#022C22] uppercase tracking-wider">القسم الصحي</span>
                              </div>
                              <div className="bg-white p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                                 <div className="w-2 h-2 rounded-full bg-[#C9A227]"></div>
                                 <span className="text-xs font-black text-[#64748B]">مسعف أو معالج</span>
                              </div>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* Footer Info */}
                   <div className="p-4 bg-gray-50/50 rounded-2xl border border-dashed border-[#E5DED0] text-center mt-6">
                     <p className="text-[10px] text-[#64748B] font-bold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        هذا المستوى يكتفي بفئتين عمريتين: دون 12 ودون 13.
                     </p>
                   </div>
                </div>
             </div>
          </div>
        </div>

          <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
            <div className="p-6 md:p-8 border-b border-[#E5DED0] bg-gray-50/50">
              <h2 className="text-2xl font-bold text-[#022C22] mb-3">المحاور العشر للتصنيف</h2>
              <p className="text-[#64748B] leading-relaxed text-lg max-w-4xl">
                توزع متطلبات التصنيف على عشرة محاور استراتيجية. تفوق الأكاديمية في هذه المحاور يحدد المستوى الذي تستحق الحصول عليه.
              </p>
            </div>
            {/* Table... */}
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#022C22] text-[#C9A227]">
                  <th className="py-5 px-6 font-bold text-lg">المحور</th>
                  <th className="py-5 px-6 font-bold text-lg border-r border-[#064E3B]">مستوى A</th>
                  <th className="py-5 px-6 font-bold text-lg border-r border-[#064E3B]">مستوى B</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { axis: "القيادة", a: "إدارة متكاملة وواضحة", b: "إدارة أساسية" },
                  { axis: "التخطيط", a: "خطة واضحة للتطوير", b: "تخطيط أسبوعي بسيط" },
                  { axis: "التنظيم", a: "تنظيم إداري متقدم", b: "تنظيم أساسي" },
                  { axis: "الجانب الفني", a: "برنامج تدريبي متكامل", b: "تدريب عام" },
                  { axis: "الميزانية", a: "ميزانية واضحة ومفصلة", b: "ميزانية عامة" },
                  { axis: "الملعب والمرافق", a: "ملعب ومرافق معتمدة", b: "ملعب بإمكانات محدودة" },
                  { axis: "الصحة", a: "متابعة صحية منتظمة/تأمين", b: "متابعة صحية منتظمة/تأمين" },
                  { axis: "الرعاية والتعليم", a: "برامج رعاية وسياسة حماية الطفل", b: "تطبيق سياسة حماية الطفل" },
                  { axis: "المعدات والتجهيزات", a: "تجهيزات كاملة وموحدة", b: "تجهيزات أساسية" },
                  { axis: "التواصل الاجتماعي", a: "محتوى نشط ومنظم", b: "محتوى بسيط وعام" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-[#E5DED0] hover:bg-[#F6F1E7]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#064E3B]">{row.axis}</td>
                    <td className="py-4 px-6 text-[#111827] border-r border-[#E5DED0]">{row.a}</td>
                    <td className="py-4 px-6 text-[#111827] border-r border-[#E5DED0]">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Tips & Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0] flex flex-col items-start border-r-4 border-r-[#C9A227]">
             <div className="w-12 h-12 bg-[#064E3B]/10 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#064E3B]">lightbulb</span>
             </div>
             <h3 className="font-bold text-[#022C22] text-xl mb-3">نصيحة مهمة</h3>
             <p className="text-[#64748B] leading-relaxed">
               يُفضَّل أن تختار الأكاديمية التصنيف الذي يتناسب مع قدراتها وإمكاناتها الفعلية، لضمان استمرارية نجاح الملف والحصول على الاعتماد الرسمي.
             </p>
          </div>

          <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0] flex flex-col items-start border-r-4 border-r-red-500">
             <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-600">warning</span>
             </div>
             <h3 className="font-bold text-[#022C22] text-xl mb-3">تنبيه</h3>
             <p className="text-[#64748B] leading-relaxed">
               اختيار تصنيف غير متوافق مع الواقع قد يؤدي لرفض الطلب أو طلب تعديلات جذرية تعيق تقدم الأكاديمية في نظام الاتحاد.
             </p>
          </div>
        </div>

        {/* 5. Choose Classification / Affiliation */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 md:p-10 shadow-sm border border-[#E5DED0]">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-[#022C22] mb-4">اختيار مسار الأكاديمية</h2>
             <p className="text-[#64748B] text-lg max-w-2xl mx-auto leading-relaxed">
               بناءً على التقييم الذاتي لجاهزيتكم، حدد المسار الذي ستبدأ العمل عليه.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div 
              onClick={() => handleSelectClassification('A')}
              className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-[#022C22] text-white shadow-lg overflow-hidden ${selectedClassification === 'A' ? 'border-[#C9A227] ring-4 ring-[#C9A227]/10' : 'border-[#064E3B] hover:border-[#C9A227]'}`}
            >
               {/* Premium Glow Effect */}
               <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C9A227]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C9A227]/20 transition-all duration-700"></div>
               
               <div className="flex-1 relative z-10">
                 <div className="flex justify-between items-start mb-8">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedClassification === 'A' ? 'bg-[#C9A227] text-[#022C22] scale-110 shadow-lg shadow-[#C9A227]/20' : 'bg-[#064E3B] text-[#C9A227]'}`}>
                      A
                   </div>
                 </div>
                 
                 <h3 className="text-2xl font-black text-white mb-4 tracking-tight">تصنيف A</h3>
                 <p className="text-white/70 leading-relaxed mb-8 text-sm font-medium">
                   للأكاديميات ذات الهيكلية الاحترافية والمتكاملة التي تطبق أعلى المعايير الفنية والإدارية بمستوى تنافسي.
                 </p>
                 
                 <ul className="space-y-3 mb-10">
                    {['هيكلية ادارية وفنية كاملة', '4 فئات عمرية على الاقل', 'برنامج تدريبي متكامل'].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-white/50">
                        <span className="material-symbols-outlined text-[14px] text-[#C9A227]">check_circle</span>
                        {feat}
                      </li>
                    ))}
                 </ul>
               </div>
               
               <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 transform ${selectedClassification === 'A' ? 'bg-[#C9A227] text-[#022C22] shadow-xl translate-y-0' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}>
                 {selectedClassification === 'A' ? 'تم اختيار تصنيف A' : 'اختيار تصنيف A'}
               </div>
            </div>

            <div 
              onClick={() => handleSelectClassification('B')}
              className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-white ${selectedClassification === 'B' ? 'border-[#064E3B] ring-4 ring-[#064E3B]/10 shadow-xl' : 'border-[#E5DED0] hover:border-[#064E3B]'}`}
            >
               <div className="flex-1 relative z-10">
                 <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedClassification === 'B' ? 'bg-[#064E3B] text-white shadow-lg' : 'bg-[#F6F1E7] text-[#064E3B]'}`}>
                    B
                 </div>
                 <h3 className="text-2xl font-black text-[#022C22] mb-4 tracking-tight">تصنيف B</h3>
                 <p className="text-[#64748B] leading-relaxed mb-8 text-sm font-medium">
                   للأكاديميات التي تركز على الأساسيات وتسعى للتطوير التدريجي والمشاركة في بيئة اتحاد منظمة.
                 </p>
                 
                 <ul className="space-y-3 mb-10">
                    {['هيكلية تنظيمية أساسية', 'فئتان عمريتان على الأقل', 'تدريب عام'].map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
                        <span className="material-symbols-outlined text-[14px] text-[#064E3B]">check_circle</span>
                        {feat}
                      </li>
                    ))}
                 </ul>
               </div>
               <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 ${selectedClassification === 'B' ? 'bg-[#064E3B] text-white shadow-lg' : 'bg-gray-100 text-[#022C22] hover:bg-gray-200'}`}>
                 {selectedClassification === 'B' ? 'تم اختيار تصنيف B' : 'اختيار تصنيف B'}
               </div>
            </div>

            <div 
              onClick={() => handleSelectClassification('AffiliationOnly')}
              className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-[#FDFBF7] ${selectedClassification === 'AffiliationOnly' ? 'border-[#C9A227] ring-4 ring-[#C9A227]/10 shadow-xl' : 'border-[#E5DED0] hover:border-[#C9A227]'}`}
            >
               <div className="flex-1 relative z-10">
                 <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 ${selectedClassification === 'AffiliationOnly' ? 'bg-[#C9A227] text-[#022C22] shadow-lg shadow-[#C9A227]/20' : 'bg-[#F6F1E7] text-[#C9A227]'}`}>
                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                 </div>
                 <h3 className="text-2xl font-black text-[#022C22] mb-4 tracking-tight">انتساب فقط</h3>
                 <p className="text-[#64748B] leading-relaxed mb-6 text-sm font-medium">
                   للحصول على المظلة الرسمية للاتحاد دون الدخول في تفاصيل التصنيف الفني الحالية.
                 </p>
                 <div className="bg-[#F6F1E7] border border-[#E5DED0] p-4 rounded-2xl text-[10px] text-[#64748B] mb-8 font-bold leading-relaxed flex items-start gap-2">
                   <span className="material-symbols-outlined text-[14px] text-[#C9A227] mt-0.5">info</span>
                   الانتساب خطوة قانونية مهمة، لكنها لا تسمح بالمشاركة في النشاطات المصنفة والمسابقات الرسمية.
                 </div>
               </div>
               <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 ${selectedClassification === 'AffiliationOnly' ? 'bg-[#022C22] text-white shadow-lg' : 'bg-white border border-[#E5DED0] text-[#022C22] hover:bg-gray-50'}`}>
                 {selectedClassification === 'AffiliationOnly' ? 'تم اختيار الانتساب' : 'اختيار انتساب فقط'}
               </div>
            </div>
          </div>
        </div>

        {/* 7. Fill File Action (Integrated Selection Status) */}
        <div id="selection-status" className="space-y-8">
          {selectedClassification && selectedClassification !== 'AffiliationOnly' && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[40px] shadow-sm border border-[#E5DED0] p-8 md:p-12 text-center relative overflow-hidden"
            >
              {/* Decorative background element from popup */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F6F1E7] rounded-full -mr-16 -mt-16 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-[#F6F1E7] text-[#064E3B] rounded-[32px] flex items-center justify-center mx-auto mb-6 border-2 border-[#064E3B]/10 shadow-inner">
                   <span className="material-symbols-outlined text-4xl">checked_bag</span>
                </div>
                
                <h2 className="text-4xl font-black text-[#022C22] mb-4 tracking-tight">لقد اخترتم المستوى {selectedClassification}</h2>
                <p className="text-[#64748B] text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-12">
                  خطوة مميزة نحو التميز! تبقى الخطوة الأولى وهي استكمال سجل الكوادر البشرية لتتمكن من البدء في الملف.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-center text-right">
                  <div 
                    onClick={() => navigate("/academy-registry")}
                    className={`md:col-span-3 p-8 rounded-[35px] border-2 flex items-center gap-6 transition-all cursor-pointer hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] ${isRegistryFinished ? 'bg-green-50 border-green-300 text-green-900 shadow-green-100' : 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100'}`}
                  >
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-lg ${isRegistryFinished ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>
                      <span className="material-symbols-outlined text-4xl">
                        {isRegistryFinished ? 'check_circle' : 'pending_actions'}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-2xl font-black mb-1">
                        {isRegistryFinished ? "سجل الكوادر مكتمل" : "استكمال سجل الكوادر"}
                      </span>
                      <p className="text-sm font-bold opacity-75 leading-relaxed mb-3">
                        {isRegistryFinished 
                          ? `سجل الأكاديمية جاهز ومكتمل لتصنيف ${selectedClassification}. يمكنك الآن البدء في تعبئة الملف.` 
                          : `يرجى إضافة الكوادر الأساسية (المدربون، الإدارة، الطبي) كما هو مطلوب للمستوى ${selectedClassification} لتفعيل زر البدء.`
                        }
                      </p>
                      <div className="flex items-center gap-3 mt-1 group">
                        <span className="text-sm font-black underline decoration-2 underline-offset-8 group-hover:text-[#064E3B] transition-colors">
                           انقر هنا للانتقال وتحديث بيانات الكوادر
                        </span>
                        <span className="material-symbols-outlined text-[24px] rotate-180 group-hover:translate-x-[-4px] transition-transform">arrow_right_alt</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col items-center gap-6">
                    <button 
                       disabled={!isRegistryFinished}
                       onClick={handleStartApplication}
                       className={`w-full py-6 rounded-[30px] font-black text-2xl flex items-center justify-center gap-4 transition-all ${!isRegistryFinished ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-[#064E3B] text-white hover:bg-[#022C22] shadow-[0_20px_50px_rgba(6,78,59,0.2)] hover:scale-105 active:scale-95'}`}
                    >
                       <span>البدء بتعبئة الملف</span>
                       <span className="material-symbols-outlined font-black">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] font-bold bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                      <span className="material-symbols-outlined text-sm">auto_mode</span>
                      يحفظ تقدمك تلقائياً بعد كل خطوة
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {(!selectedClassification || selectedClassification === 'AffiliationOnly') && (
            <div className="bg-white rounded-[40px] shadow-sm border border-[#E5DED0] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 justify-between">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#022C22] mb-4">اكتمل الاختيار؟ ابدأ المتطلبات الآن.</h2>
                <p className="text-[#64748B] text-lg leading-relaxed">
                  {selectedClassification === 'AffiliationOnly' 
                    ? "الانتساب فقط لا يفتح ملف التصنيف. يرجى إرسال سجل الأكاديمية المكتمل للبدء."
                    : "اختيار تصنيف A أو B يفتح لك مسارات التميز ويمنحك وصولاً كاملاً لمحاور التقييم."
                  }
                </p>
              </div>
              <div className="shrink-0">
                {selectedClassification === 'AffiliationOnly' ? (
                  <Link 
                    to="/academy-registry"
                    className="px-10 py-5 bg-[#022C22] text-white rounded-2xl font-bold text-xl flex items-center gap-4 hover:bg-black transition-all"
                  >
                    <span>إرسال سجل الانتساب</span>
                    <span className="material-symbols-outlined font-bold">send</span>
                  </Link>
                ) : (
                  <div className="text-[#64748B] font-bold text-center">يرجى اختيار المستوى أعلاه للمتابعة</div>
                )}
              </div>
            </div>
          )}
        </div>

        </main>
      )}

      <AnimatePresence>
        {showChangeConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] shadow-2xl p-10 max-w-[500px] w-full text-center relative border border-white"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl">warning</span>
              </div>
              <h2 className="text-3xl font-black text-[#022C22] mb-4">هل أنت متأكد؟</h2>
              <p className="text-[#64748B] font-bold leading-relaxed mb-10 text-lg">
                تغيير التصنيف سيؤدي إلى مسح كافة البيانات والملفات التي قمت بتعبئتها لهذا المستوى. ستبدأ من نقطة الصفر.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowChangeConfirm(false)}
                  className="py-4 bg-gray-100 text-[#64748B] rounded-2xl font-black hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmReset}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 shadow-xl shadow-red-200 transition-all"
                >
                  نعم، امسح وابدأ من جديد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-[#022C22] border-t border-[#C9A227]/20 mt-12 py-8">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link to="/" className="text-white font-bold hover:text-[#C9A227] transition-colors">الرئيسية</Link>
            <Link to="/standards" className="text-white font-bold hover:text-[#C9A227] transition-colors">المعايير</Link>
            <Link to="/faq" className="text-white font-bold hover:text-[#C9A227] transition-colors">الأسئلة الشائعة</Link>
            <Link to="/contact" className="text-white font-bold hover:text-[#C9A227] transition-colors">اتصل بنا</Link>
          </div>
          <div className="flex items-center gap-4 text-white/50 text-xs font-bold">
            <img src="/logo.png" className="h-6 object-contain grayscale opacity-50" alt="LFA Logo" />
            <span>الاتحاد اللبناني لكرة القدم &copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
