import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getRegistryData, saveRegistryData, RegistryData, RegistryPerson, ROLE_KEYS, UNIQUE_ROLES, FileData, isRegistryReady, isPersonComplete } from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import AppHeader from "./components/AppHeader";
import { getRegisteredAccounts } from "./lib/auth";
import { useAuth } from "./lib/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { AcademyAccount } from "./types";
import { compressImage } from "./lib/imageUtils";
import { NATIONALITIES, COUNTRY_CODES } from "./lib/constants";

export default function AcademyRegistry() {
  const navigate = useNavigate();
  const [data, setData] = useState<RegistryData>({ people: [] });
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

  const [activeTab, setActiveTab] = useState<"leadership" | "finance" | "technical" | "media" | "medical">("leadership");
  const [selectedClassification, setSelectedClassification] = useState<string>("A");
  const [selectedRoleKey, setSelectedRoleKey] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Forms states
  const [formState, setFormState] = useState<Partial<RegistryPerson>>({});

  const isRegistryFinished = isRegistryReady(selectedClassification);

  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/signin");
      return;
    }

    setData(getRegistryData());
    const savedCls = appStorage.getItem("selectedApplicationType");
    if (savedCls) setSelectedClassification(savedCls);

    const fetchAccountData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const account = userDoc.data() as AcademyAccount;
          setAcademyName(account.academyName || "");
          setAcademyLogo(account.academyLogo || null);
          
          if (session?.loginEmail) {
            const { restoreCloudToLocal } = await import('./lib/auth');
            await restoreCloudToLocal(user.uid, session.loginEmail);
            setData(getRegistryData());
          }

          // Also sync legacy fallback
          localStorage.setItem("academyBasicInfo", JSON.stringify({ ...account, id: user.uid }));
        } else {
          // Fallback to legacy
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
        console.error("Error fetching registry account data:", error);
      }
    };

    fetchAccountData();
  }, [selectedClassification, navigate]);

  if (!selectedClassification || selectedClassification === "AffiliationOnly") {
    return (
      <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-24" dir="rtl">
        <AppHeader academyName={academyName} academyLogo={academyLogo} showBackToDashboard />
        <main className="max-w-[800px] mx-auto px-4 md:px-6 py-20 text-center space-y-8 animate-in fade-in duration-700">
           <div className="w-24 h-24 bg-[#C9A227]/10 rounded-full flex items-center justify-center mx-auto text-[#C9A227] border-4 border-white shadow-xl">
              <span className="material-symbols-outlined text-5xl">lock</span>
           </div>
           <div>
              <h1 className="text-3xl font-bold text-[#022C22] mb-4">اختر نوع التصنيف أولاً</h1>
              <p className="text-[#64748B] text-lg leading-relaxed">
                يختلف سجل الأكاديمية (الأدوار والمستندات المطلوبة) بحسب نوع التصنيف المطلوب. يرجى اختيار تصنيف A أو تصنيف B قبل تعبئة السجل.
              </p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-10">
              <button 
                onClick={() => {
                  appStorage.setItem("selectedApplicationType", "A");
                  setSelectedClassification("A");
                }}
                className="p-6 bg-white border-2 border-[#E5DED0] hover:border-[#064E3B] rounded-3xl transition-all group"
              >
                 <div className="w-12 h-12 bg-[#F6F1E7] text-[#064E3B] rounded-xl flex items-center justify-center font-bold text-xl mb-4 mx-auto group-hover:bg-[#064E3B] group-hover:text-white transition-colors">A</div>
                 <div className="font-bold text-[#022C22]">بدء سجل تصنيف A</div>
              </button>

              <button 
                onClick={() => {
                  appStorage.setItem("selectedApplicationType", "B");
                  setSelectedClassification("B");
                }}
                className="p-6 bg-white border-2 border-[#E5DED0] hover:border-[#064E3B] rounded-3xl transition-all group"
              >
                 <div className="w-12 h-12 bg-[#F6F1E7] text-[#064E3B] rounded-xl flex items-center justify-center font-bold text-xl mb-4 mx-auto group-hover:bg-[#C9A227] group-hover:text-[#022C22] transition-colors">B</div>
                 <div className="font-bold text-[#022C22]">بدء سجل تصنيف B</div>
              </button>
           </div>
           
           <div className="pt-6">
              <Link to="/dashboard" className="text-sm font-bold text-[#64748B] hover:text-[#064E3B] flex items-center justify-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                 العودة للوحة الأكاديمية
              </Link>
           </div>
        </main>
      </div>
    );
  }

  const handleSaveData = (newData: RegistryData) => {
    try {
      setData(newData);
      saveRegistryData(newData);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert('خطأ أثناء الحفظ. قد يكون حجم الملفات كبيراً جداً (أكثر من 5 ميغابايت). يرجى محاولة تقليل حجم الملفات.');
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getCategorizedPeople = (tab: "leadership" | "finance" | "technical" | "media" | "medical") => {
    if (selectedClassification === 'B') {
        const roleMap: Record<string, string[]> = {
            leadership: ["bOwner", "bGeneralSupervisor", "bAdministrativeCoordinator"],
            finance: [],
            technical: ["bCoachU12", "bCoachU13"],
            media: [],
            medical: ["bPhysiotherapist"]
        };
        const validRoles = roleMap[tab] || [];
        return data.people.filter(p => p.roleKey && validRoles.includes(p.roleKey));
    }

    const roleMap = {
      leadership: ["owner", "administrativeManager"],
      finance: ["financeOfficer"],
      technical: ["technicalSupervisor", "coachU10", "coachU11", "coachU12", "coachU13", "assistantCoach", "technicalStaff"],
      media: ["mediaOfficer", "socialMediaOfficer", "photographer"],
      medical: ["medicalManager", "doctor", "physiotherapist", "paramedic", "otherMedicalStaff"]
    };

    const validRoles = roleMap[tab];
    return data.people.filter(p => p.roleKey && validRoles.includes(p.roleKey));
  };

  const handleRoleSelect = (type: "leadership" | "finance" | "technical" | "media" | "medical", roleKey: string, arabicRole: string) => {
    setActiveTab(type);
    setSelectedRoleKey(roleKey);
    setEditingId(null);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    // For UNIQUE roles, check if one already exists
    if (UNIQUE_ROLES.includes(roleKey)) {
      const existing = data.people.find(p => p.roleKey === roleKey);
      if (existing) {
        setFormState(existing);
        setEditingId(existing.id);
        return;
      }
    }
    
    // For Repeatable or New Unique
    setFormState({ roleKey, roleLabel: arabicRole, files: {}, nationality: "لبنانية", phoneCode: "+961" });
  };

  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const validateForm = () => {
    const errors: string[] = [];
    if (!formState.fullName) errors.push("الاسم الكامل مطلوب");
    if (!formState.dateOfBirth) errors.push("تاريخ الميلاد مطلوب");
    if (!formState.nationality) errors.push("الجنسية مطلوبة");
    const phoneValue = (formState as any).phoneNum || (formState as any).phone;
    if (!phoneValue) errors.push("رقم الهاتف مطلوب");
    if (!formState.email) errors.push("البريد الإلكتروني مطلوب");
    
    if ((formState.roleKey === 'technicalSupervisor' || 
         formState.roleKey?.startsWith('coach') || 
         formState.roleKey?.startsWith('bCoach')) && !formState.certificateType) {
      errors.push("شهادة التدريب مطلوبة");
    }

    if (formState.roleKey === 'bGeneralSupervisor' && !formState.notes) {
      errors.push("نوع الخبرة مطلوب");
    }

    // File validation
    if (!formState.files?.profilePhoto?.uploaded) errors.push("الصورة الشخصية مطلوبة");
    if (!formState.files?.idDocument?.uploaded) errors.push("الهوية الوطنية مطلوبة");
    
    const isLebanese = 
      formState.nationality?.trim().toLowerCase() === "lebanese" ||
      formState.nationality?.trim() === "لبناني" ||
      formState.nationality?.trim() === "لبنانية" ||
      formState.nationality?.trim() === "لبنان";

    const isTargetRole = ['owner', 'bOwner', 'bGeneralSupervisor', 'technicalSupervisor'].includes(formState.roleKey || "");

    if (isTargetRole) {
      if (isLebanese && !formState.files?.criminalRecord?.uploaded) errors.push("السجل العدلي مطلوب");
      if (!isLebanese && !formState.files?.residencyPermit?.uploaded) errors.push("صورة الإقامة مطلوبة");
    }

    if (!(formState.files?.cv?.uploaded || formState.files?.supportingDocument?.uploaded)) errors.push("السيرة الذاتية مطلوبة");
    if (!formState.files?.jobDescription?.uploaded) errors.push("المسمى الوظيفي مطلوب");

    if (rolesRequiringContract.includes(formState.roleKey || "") && !formState.files?.contract?.uploaded) {
      errors.push("عقد العمل مطلوب");
    }

    const rolesRequiringCertFile = [
      'technicalSupervisor', 'coachU10', 'coachU11', 'coachU12', 'coachU13', 
      'medicalManager', 'doctor', 'bCoachU12', 'bCoachU13', 'bGeneralSupervisor', 'bPhysiotherapist'
    ];
    if (rolesRequiringCertFile.includes(formState.roleKey || "") && !formState.files?.certificate?.uploaded) {
      errors.push("شهادة التأهيل مطلوبة");
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: document.body.scrollHeight - 500, behavior: 'smooth' });
      return;
    }

    const newData = { ...data };
    const submission = { 
      ...formState, 
      phone: `${(formState as any).phoneCode || '+961'}${(formState as any).phoneNum || (formState as any).phone || ''}` 
    };
    
    // Auto deduplication is handled by pre-filling or forcing update if unique
    if (formState.roleKey && UNIQUE_ROLES.includes(formState.roleKey) && !editingId) {
      const exists = newData.people.find(p => p.roleKey === formState.roleKey);
      if (exists) {
        alert("تم تسجيل هذا الدور مسبقًا. يمكنك تعديل السجل الحالي بدل إضافة سجل مكرر.");
        return;
      }
    }

    let statusChangedToUnderReview = false;
    let targetPersonId = "";

    if (editingId) {
      newData.people = newData.people.map(p => {
        if (p.id === editingId) {
          const updatedPerson = { ...p, ...submission } as RegistryPerson;
          // Check if there's a real change and status was accepted
          if (p.reviewStatus === "accepted" || p.reviewStatus === "rejected") {
            // Simplified deep compare by stringifying without internal tracking fields
            const { reviewStatus, acceptedAt, acceptedBy, needsReview, ...oldFields } = p;
            const { reviewStatus: _r, acceptedAt: _a, acceptedBy: _b, needsReview: _n, ...newFields } = updatedPerson;
            if (JSON.stringify(oldFields) !== JSON.stringify(newFields)) {
              updatedPerson.reviewStatus = "under_review";
              updatedPerson.needsReview = true;
              statusChangedToUnderReview = true;
              targetPersonId = p.id;
            }
          }
          return updatedPerson;
        }
        return p;
      });
    } else {
      newData.people.push({ ...submission, id: generateId(), files: formState.files || {}, reviewStatus: "under_review" } as RegistryPerson);
    }
    
    handleSaveData(newData);
    
    if (statusChangedToUnderReview && targetPersonId) {
       try {
         const user = await waitForAuth();
         if (user) {
             const reviewDoc = doc(db, "users", user.uid, "adminReviews", `registry_${targetPersonId}`);
             await setDoc(reviewDoc, {
               status: "قيد المراجعة",
               note: "تم التعديل من قبل المستخدم",
               reviewedAt: Date.now(),
             }, { merge: true });
         }
       } catch (err) {
         console.error("Failed to reset adminReview status to under_review:", err);
       }
    }

    cancelEdit();
  };

  const getManagementProgress = () => {
    const keys = ["owner", "administrativeManager"];
    const completed = data.people.filter(p => keys.includes(p.roleKey));
    return completed.length;
  };

  const getFinanceProgress = () => {
    return data.people.filter(p => p.roleKey === "financeOfficer").length;
  };

  const getMediaProgress = () => {
    const uniqueKeys = ["mediaOfficer", "socialMediaOfficer"];
    const completedUnique = data.people.filter(p => uniqueKeys.includes(p.roleKey));
    return completedUnique.length;
  };

  const getTechnicalProgress = () => {
    if (selectedClassification === 'B') {
        const keys = ["bCoachU12", "bCoachU13"];
        const completed = data.people.filter(p => keys.includes(p.roleKey));
        const unique = Array.from(new Set(completed.map(item => item.roleKey)));
        return unique.length;
    }
    const keys = ["technicalSupervisor", "coachU10", "coachU11", "coachU12", "coachU13"];
    const completed = data.people.filter(p => keys.includes(p.roleKey));
    const unique = Array.from(new Set(completed.map(item => item.roleKey)));
    return unique.length;
  };

  const getCertOptions = (roleKey: string | undefined) => {
    if (roleKey === 'technicalSupervisor') return ['B Diploma', 'A Diploma', 'Pro Diploma'];
    if (roleKey === 'coachU10' || roleKey === 'coachU11') return ['C Diploma', 'Youth Level 1 Diploma', 'Youth Level 2 Diploma', 'B Diploma', 'A Diploma', 'Pro Diploma'];
    if (roleKey === 'coachU12' || roleKey === 'coachU13' || roleKey === 'bCoachU12' || roleKey === 'bCoachU13') return ['C Diploma', 'Youth Level 1 Diploma', 'Youth Level 2 Diploma', 'B Diploma', 'A Diploma', 'Pro Diploma'];
    return ['C Diploma', 'Youth Level 1 Diploma', 'Youth Level 2 Diploma', 'B Diploma', 'A Diploma', 'Pro Diploma', 'أخرى'];
  };

  const getCertHelper = (roleKey: string | undefined) => {
    if (roleKey === 'technicalSupervisor') return 'الحد الأدنى المطلوب للمشرف الفني: B Diploma أو أعلى';
    if (roleKey === 'coachU10' || roleKey === 'coachU11') return 'الحد الأدنى المطلوب: C Diploma أو أعلى';
    if (roleKey === 'coachU12' || roleKey === 'coachU13' || roleKey === 'bCoachU12' || roleKey === 'bCoachU13') return 'الحد الأدنى المطلوب: C Diploma أو أعلى';
    return '';
  };

  const deleteRecord = (id: string) => {
    const newData = { ...data };
    newData.people = newData.people.filter(p => p.id !== id);
    handleSaveData(newData);
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  const editRecord = (record: RegistryPerson, tab: "leadership" | "finance" | "technical" | "media" | "medical") => {
    const updatedRecord = { ...record } as any;
    if (updatedRecord.files) {
      if (updatedRecord.files.supportingDocument && !updatedRecord.files.cv) {
        updatedRecord.files.cv = updatedRecord.files.supportingDocument;
      }
      if (updatedRecord.files.identityDocument && !updatedRecord.files.idDocument) {
        updatedRecord.files.idDocument = updatedRecord.files.identityDocument;
      }
      if (updatedRecord.files.identity && !updatedRecord.files.idDocument) {
        updatedRecord.files.idDocument = updatedRecord.files.identity;
      }
      if (updatedRecord.files.criminalRecordFile && !updatedRecord.files.criminalRecord) {
        updatedRecord.files.criminalRecord = updatedRecord.files.criminalRecordFile;
      }
      if (updatedRecord.files.residency && !updatedRecord.files.residencyPermit) {
        updatedRecord.files.residencyPermit = updatedRecord.files.residency;
      }
      if (updatedRecord.files.photo && !updatedRecord.files.profilePhoto) {
        updatedRecord.files.profilePhoto = updatedRecord.files.photo;
      }
    }
    
    let pCode = "+961";
    let pNum = updatedRecord.phone || "";
    
    for (const c of COUNTRY_CODES) {
      if (pNum.startsWith(c.code)) {
        pCode = c.code;
        pNum = pNum.substring(c.code.length);
        break;
      }
    }
    
    updatedRecord.phoneCode = pCode;
    updatedRecord.phoneNum = pNum;

    setFormState(updatedRecord);
    setEditingId(record.id);
    setActiveTab(tab);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleFileUpload = async (
    field: keyof RegistryPerson["files"],
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'profilePhoto' && !file.type.startsWith('image/')) {
       alert("يرجى رفع صورة فقط بصيغة JPG أو PNG أو WEBP");
       e.target.value = '';
       return;
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`حجم الملف كبير جداً. الحد الأقصى المسموح به هو ${MAX_FILE_SIZE_MB} ميغابايت.`);
      e.target.value = '';
      return;
    }

    // Determine preview
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;

    // 1. Immediately update UI local state before cloud upload
    setFormState(prev => ({
      ...prev,
      files: {
        ...(prev.files || {}),
        [field]: { 
          name: file.name, 
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          uploadStatus: "uploaded", // optimistic
          uploaded: true, // for backwards compat
          preview: previewUrl
        }
      }
    }));

    try {
      let user = auth.currentUser;
      if (!user) user = await waitForAuth();
      if (!user) throw new Error("يجب تسجيل الدخول");
      
      const fileData = await uploadFileAndReturnMetadata(file, user.uid, "registry");
      
      // Update with success
      setFormState(prev => ({
        ...prev,
        files: {
          ...(prev.files || {}),
          [field]: { 
            ...(prev.files?.[field] || {}),
            ...fileData,
            uploadStatus: "uploaded",
            preview: (typeof fileData !== "undefined" && fileData ? fileData.downloadURL : previewUrl),
          }
        }
      }));
    } catch (err) {
      console.error("Upload failed", err);
      alert("تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
      e.target.value = '';
      return;
    }
    
    e.target.value = '';
  };

  const handleFileCancel = (field: keyof RegistryPerson["files"]) => {
    setFormState(prev => {
      const newFiles = { ...(prev.files || {}) };
      delete newFiles[field];
      return { ...prev, files: newFiles };
    });
  };

  const rolesRequiringContract = [
    "administrativeManager",
    "technicalSupervisor",
    "coachU10",
    "coachU11",
    "coachU12",
    "coachU13",
    "medicalManager",
    "doctor"
  ];

  const renderProfilePhotoField = (currentFile?: FileData) => {
    return (
      <div className="flex flex-col items-center sm:items-start gap-4">
        <div className={`relative group w-40 h-40 rounded-full border-2 transition-all overflow-hidden ${currentFile?.uploaded ? 'border-[#064E3B] bg-white shadow-md' : 'border-dashed border-[#E5DED0] bg-[#FFFDF7] hover:border-[#064E3B] hover:bg-[#F6F1E7]'}`}>
          {!currentFile?.uploaded ? (
            <UploadTrigger className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4" accept=".png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}>
              <div className="text-[#064E3B]/40 group-hover:text-[#064E3B] transition-colors">
                <span className="material-symbols-outlined text-[48px]">account_circle</span>
              </div>
              <div className="text-[10px] font-bold text-[#64748B] mt-1 text-center">أضف صورة شخصية</div>
            </UploadTrigger>
          ) : (
            <div className="w-full h-full relative group/hasphoto">
              <img 
                src={(currentFile.preview || currentFile.url  || currentFile.preview) || `https://ui-avatars.com/api/?name=${encodeURIComponent(formState.fullName || 'User')}&background=064E3B&color=fff&bold=true&size=512`} 
                alt="Profile Preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/hasphoto:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <UploadTrigger className="p-2 bg-white text-[#064E3B] rounded-full cursor-pointer hover:bg-gray-100 transition-all shadow-lg" accept=".png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}>
<span className="material-symbols-outlined text-[20px]" title="تغيير الصورة">photo_camera</span>
</UploadTrigger>
              </div>
              <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-md border border-white">
                 <span className="material-symbols-outlined text-[14px]">check</span>
              </div>
            </div>
          )}
        </div>
        
        {currentFile?.uploaded ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              تم الرفع
            </span>
            <button 
              type="button"
              onClick={() => handleFileCancel("profilePhoto")}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              إزالة الصورة
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-[#64748B]">PNG, JPG (يفضل صورة مربعة)</div>
        )}
      </div>
    );
  };

  const renderReviewBadge = (record?: RegistryPerson) => {
    if (!record || !record.id) return null;
    const status = record.reviewStatus || "under_review";
    if (status === "accepted") {
      return <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200" title="مقبول">مقبول</span>;
    }
    if (status === "rejected") {
      return <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200" title="مرفوض">مرفوض</span>;
    }
    return <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="قيد المراجعة">قيد المراجعة</span>;
  };

  const renderDocumentField = (
    field: keyof RegistryPerson["files"],
    label: string,
    currentFile?: FileData,
    helperText?: string
  ) => {
    return (
      <div className="flex flex-col gap-2">
        <div className={`relative group transition-all duration-300 min-h-[140px] flex flex-col`}>
          {!currentFile?.uploaded && (<UploadTrigger className="absolute inset-0 opacity-0 cursor-pointer z-10 block" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(field, e)}><div></div></UploadTrigger>)}
          
          <div className={`flex-1 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 p-4 transition-all ${
            currentFile?.uploaded 
              ? 'bg-white border-[#064E3B] border-solid shadow-sm' 
              : 'bg-[#FFFDF7] border-[#E5DED0] hover:border-[#064E3B] group-hover:bg-[#F6F1E7]'
          }`}>
            
            <div className={`shrink-0 flex items-center justify-center rounded-2xl w-12 h-12 ${currentFile?.uploaded ? 'bg-green-50 text-green-600' : 'bg-[#064E3B]/5 text-[#064E3B]/40'}`}>
              <span className="material-symbols-outlined text-[28px]">
                {currentFile?.uploaded ? 'task_alt' : 'upload_file'}
              </span>
            </div>

            <div className="text-center">
              <div className="text-sm font-bold text-[#022C22] mb-1">{label}</div>
              {currentFile?.uploaded ? (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-green-600 flex items-center justify-center gap-1">
                    تم الرفع ✓
                  </div>
                  <div className="text-[10px] text-[#64748B] truncate max-w-[150px]" dir="ltr">{currentFile.name}</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-[#064E3B]">اضغط لرفع الملف</div>
                  <div className="text-[9px] text-[#64748B]">PDF, JPG, PNG</div>
                </div>
              )}
            </div>
          </div>

          {currentFile?.uploaded && (
            <div className="absolute top-2 left-2 flex gap-1 z-20">
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); handleFileCancel(field); }}
                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
                title="إزالة"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}
        </div>
        
        {helperText && (
          <div className="text-center mt-1">
            <span className="text-[10px] text-[#64748B] block mb-1 leading-tight">{helperText}</span>
          </div>
        )}

        {currentFile?.uploaded && (
          <div className="flex justify-center mt-1">
             <UploadTrigger className="text-[10px] font-bold text-[#064E3B] cursor-pointer hover:underline flex items-center gap-1" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(field, e)}>
                <span className="material-symbols-outlined text-[14px]">edit_note</span>
                تعديل الملف
                </UploadTrigger>
          </div>
        )}
      </div>
    );
  };


  const cancelEdit = () => {
    setEditingId(null);
    setSelectedRoleKey(null);
    setFormState({});
    setFormErrors([]);
  };


  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-24" dir="rtl">
      <AppHeader academyName={academyName} academyLogo={academyLogo} showBackToDashboard />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 shadow-2xl relative z-10 max-w-[400px] w-full text-center space-y-6"
              dir="rtl"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                <span className="material-symbols-outlined text-5xl">warning</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-[#022C22]">هل أنت متأكد؟</h3>
                <p className="text-[#64748B]">سيتم حذف هذا السجل نهائياً بكافة مستنداته المرفوعة. لا يمكن التراجع عن هذا الإجراء.</p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button 
                  onClick={() => deleteId && deleteRecord(deleteId)}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 transition-colors shadow-md active:scale-95 text-center"
                >
                  نعم، احذف السجل
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full bg-[#F6F1E7] text-[#64748B] py-4 rounded-2xl font-bold hover:bg-[#E5DED0] transition-colors text-center"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#022C22] text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-3 transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
        <span className="material-symbols-outlined text-[#C9A227]">check_circle</span>
        تم حفظ السجل بنجاح
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#022C22] mb-2">سجل الكوادر البشرية</h1>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${selectedClassification === 'A' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-[#C9A227] text-[#022C22] border-[#C9A227]'}`}>
                  سجل تصنيف {selectedClassification}
                </span>
                <span className="text-[#64748B] text-sm font-bold">
                  {selectedClassification === 'A' ? 'المتطلبات الاحترافية' : 'المتطلبات الأساسية'}
                </span>
              </div>
            </div>
            
            <div className="bg-white px-4 py-2 rounded-xl border border-[#E5DED0] shadow-sm hidden md:block">
              <div className="text-[10px] font-black text-[#64748B] uppercase mb-1">حالة السجل</div>
              <div className="flex items-center gap-2 text-[#064E3B] font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                {data.people.length} أفراد مسجلون
              </div>
            </div>
          </div>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            قم بتوثيق كافة الكوادر الإدارية والفنية والطبية المطلوبة. سيتم استخدام هذه البيانات تلقائياً في محاور التصنيف.
          </p>
        </div>

        {/* Classification Selection (Simplified status display) */}
        {!editingId && !selectedRoleKey && (
          <div className="bg-white p-4 rounded-2xl border border-[#E5DED0] flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${selectedClassification === 'A' ? 'bg-[#064E3B] text-white' : 'bg-[#C9A227] text-[#022C22]'}`}>
                  {selectedClassification}
               </div>
               <div>
                  <div className="font-bold text-[#022C22]">التصنيف الحالي: {selectedClassification === 'A' ? 'تصنيف A' : 'تصنيف B'}</div>
                  <div className="text-xs text-[#64748B]">يتم عرض الأدوار المطلوبة لهذا المستوى فقط.</div>
               </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 no-scrollbar">
          {[
            { id: "leadership", label: "القيادة والإدارة", icon: "corporate_fare", show: true },
            { id: "finance", label: "المسؤول المالي", icon: "payments", show: selectedClassification === 'A' },
            { id: "technical", label: "الجهاز الفني", icon: "sports_soccer", show: true },
            { id: "media", label: "الإعلام والتواصل", icon: "campaign", show: selectedClassification === 'A' },
            { id: "medical", label: "الجهاز الطبي", icon: "health_and_safety", show: true }
          ].filter(t => t.show).map(tab => {
            const count = getCategorizedPeople(tab.id as any).length;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); cancelEdit(); }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-colors border ${activeTab === tab.id ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-white text-[#64748B] border-[#E5DED0] hover:bg-gray-50'}`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ml-2 ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Leadership Tab */}
        {activeTab === "leadership" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-5 border border-[#E5DED0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#022C22]">القيادة والإدارة</h3>
                <span className="text-sm font-bold text-[#064E3B] bg-[#064E3B]/10 px-3 py-1 rounded-full border border-[#064E3B]/20">
                  {selectedClassification === 'A' ? `${getManagementProgress()} / 2` : `${getCategorizedPeople('leadership').length} مسجل`}
                </span>
              </div>
              <p className="text-sm text-[#64748B] mb-6">
                {selectedClassification === 'A' ? 'يسمح ببروفايل واحد فقط لكل دور في هذا القسم.' : 'أدخل بيانات المالك والمشرف العام والمنسقين الإداريين.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedClassification === 'A' ? [
                  { key: "owner", title: "مالك الأكاديمية" },
                  { key: "administrativeManager", title: "المدير الإداري" }
                ] : [
                  { key: "bOwner", title: "مالك الأكاديمية" },
                  { key: "bGeneralSupervisor", title: "مشرف فني أو إداري" }
                ]).map(role => {
                  const record = data.people.find(r => r.roleKey === role.key);
                  const exists = !!record;
                  const isCompleted = record ? isPersonComplete(record) : false;
                  
                  return (
                    <div 
                      key={role.key} 
                      onClick={() => handleRoleSelect("leadership", role.key, role.title)}
                      className={`p-5 rounded-[24px] border-2 transition-all flex flex-col items-center text-center gap-3 group relative cursor-pointer ${selectedRoleKey === role.key ? 'bg-[#064E3B] border-[#064E3B] text-white shadow-xl scale-[1.02]' : exists ? 'bg-white border-[#064E3B]/20 text-[#022C22] hover:border-[#064E3B]' : 'bg-white border-[#E5DED0] text-[#64748B] hover:border-[#064E3B]/30'}`}
                    >
                      {exists && selectedRoleKey !== role.key && (
                         <div className="absolute top-3 right-3 flex flex-col gap-2">
                           <div className={`w-7 h-7 ${isCompleted ? 'bg-green-500' : 'bg-amber-500 animate-pulse'} text-white rounded-full flex items-center justify-center shadow-md`} title={isCompleted ? "كامل" : "غير مكتمل - اضغط لإكمال البيانات"}>
                             <span className="material-symbols-outlined text-[16px]">{isCompleted ? 'check' : 'warning'}</span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); confirmDelete(record!.id); }}
                             className="w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-all border border-red-100"
                             title="حذف البيانات"
                           >
                             <span className="material-symbols-outlined text-[16px]">delete</span>
                           </button>
                         </div>
                      )}

                      <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-2 shadow-inner transition-all ${selectedRoleKey === role.key ? 'bg-white/10 border-white/20' : exists ? 'bg-[#F6F1E7] border-[#064E3B]/10' : 'bg-gray-50 border-gray-100'}`}>
                        {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                          <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={`material-symbols-outlined text-3xl ${selectedRoleKey === role.key ? 'text-white' : exists ? 'text-[#064E3B]' : 'text-gray-300'}`}>
                            {exists ? 'person' : 'person_add'}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className={`text-xs font-black uppercase tracking-wider mb-1 ${selectedRoleKey === role.key ? 'text-white/60' : 'text-[#64748B]'}`}>
                          {role.title}
                        </div>
                        <div className={`font-bold text-sm ${selectedRoleKey === role.key ? 'text-white' : exists ? 'text-[#022C22]' : 'text-gray-400'}`}>
                          {exists ? (
                            <div className="flex items-center gap-1 flex-col">
                              <span>{record.fullName}</span>
                              {renderReviewBadge(record)}
                            </div>
                          ) : 'غير مسجل'}
                        </div>
                      </div>
                      
                      <div className={`mt-auto pt-2 text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${selectedRoleKey === role.key ? 'bg-white/10 border-white/20 text-white' : exists ? 'bg-[#064E3B]/5 border-[#064E3B]/10 text-[#064E3B]' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                        {exists ? (isCompleted ? 'تعديل المعلومات' : 'استكمال المعلومات الإلزامية') : 'إضافة هذا الدور'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* B Repeatable: Administrative Coordinator */}
              {selectedClassification === 'B' && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-[#064E3B]">المنسقون الإداريون</h4>
                        <button 
                            onClick={() => handleRoleSelect("leadership", "bAdministrativeCoordinator", "منسق إداري")}
                            className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#022C22] transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            إضافة منسق إداري
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.people.filter(p => p.roleKey === "bAdministrativeCoordinator").map(record => (
                            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#E5DED0] group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                                        {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                                            <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                                        ) : <span className="material-symbols-outlined text-gray-400">person</span>}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-[#022C22]">{record.fullName}</div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => editRecord(record, "leadership")} className="text-[#064E3B] p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                    <button onClick={() => confirmDelete(record.id)} className="text-red-500 p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && selectedClassification === 'A' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-5 border border-[#E5DED0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#022C22]">المسؤول المالي</h3>
                <span className="text-sm font-bold text-[#064E3B] bg-[#064E3B]/10 px-3 py-1 rounded-full border border-[#064E3B]/20">
                  {getFinanceProgress()} / 1
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "financeOfficer", title: "المسؤول المالي" }
                ].map(role => {
                  const record = data.people.find(r => r.roleKey === role.key);
                  const exists = !!record;
                  const isCompleted = record ? isPersonComplete(record) : false;
                  return (
                    <div 
                      key={role.key} 
                      onClick={() => handleRoleSelect("finance", role.key, role.title)}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all group relative ${selectedRoleKey === role.key ? 'bg-[#064E3B]/10 border-[#064E3B] ring-2 ring-[#064E3B]/20 shadow-md' : exists ? (isCompleted ? 'bg-[#064E3B]/5 border-[#064E3B]/30 hover:bg-[#064E3B]/10' : 'bg-amber-50 border-amber-200 hover:bg-amber-100') : 'bg-gray-50 border-[#E5DED0] hover:bg-gray-100'}`}
                    >
                      {exists && (
                        <div className="absolute -top-1.5 -left-1.5 flex gap-1 z-10 scale-0 group-hover:scale-100 transition-transform">
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(record!.id); }}
                            className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-md border border-red-200 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      )}
                      
                      {exists && (
                        <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 ${isCompleted ? 'bg-green-500' : 'bg-amber-500'} text-white rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
                           <span className="material-symbols-outlined text-[14px]">{isCompleted ? 'check' : 'warning'}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                            {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                              <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt={record.fullName} className="w-full h-full object-cover" />
                            ) : (
                               <span className={`material-symbols-outlined ${exists ? 'text-[#064E3B]' : 'text-gray-300'}`}>
                                  {exists ? 'person' : 'person_add'}
                               </span>
                            )}
                         </div>
                         <div className="min-w-0">
                           <div className="font-bold text-[#022C22] truncate">{role.title}</div>
                           {exists && (
                             <div className="space-y-0.5">
                                <div className={`text-xs ${isCompleted ? 'text-[#064E3B]' : 'text-amber-700'} font-bold truncate underline underline-offset-2 flex items-center gap-2`}>
                                  {record.fullName}
                                  {renderReviewBadge(record)}
                                </div>
                             </div>
                           )}
                         </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Technical Tab */}
        {activeTab === "technical" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-5 border border-[#E5DED0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#022C22]">الجهاز الفني</h3>
                <span className="text-sm font-bold text-[#064E3B] bg-[#064E3B]/10 px-3 py-1 rounded-full border border-[#064E3B]/20">
                  {getTechnicalProgress()} / {selectedClassification === 'A' ? '5' : '2'}
                </span>
              </div>
              <p className="text-sm text-[#64748B] mb-6">يسمح ببروفايل واحد فقط لكل دور تدريبي هنا.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {(selectedClassification === 'A' ? [
                  { key: "technicalSupervisor", role: "المشرف الفني" },
                  { key: "coachU10", role: "مدرب دون 10" },
                  { key: "coachU11", role: "مدرب دون 11" },
                  { key: "coachU12", role: "مدرب دون 12" },
                  { key: "coachU13", role: "مدرب دون 13" },
                ] : [
                  { key: "bCoachU12", role: "مدرب دون 12" },
                  { key: "bCoachU13", role: "مدرب دون 13" },
                ]).map(item => {
                  const record = data.people.find(r => r.roleKey === item.key);
                  const isCompleted = !!record;
                  return (
                    <div 
                      key={item.key} 
                      onClick={() => handleRoleSelect("technical", item.key, item.role)}
                      className={`p-4 rounded-[20px] border-2 transition-all flex flex-col items-center text-center gap-2 relative cursor-pointer ${selectedRoleKey === item.key ? 'bg-[#064E3B] border-[#064E3B] text-white shadow-lg' : isCompleted ? 'bg-white border-[#064E3B]/20 text-[#022C22] hover:border-[#064E3B]' : 'bg-white border-[#E5DED0] text-[#64748B] hover:border-[#064E3B]/30'}`}
                    >
                      {isCompleted && selectedRoleKey !== item.key && (
                         <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                           <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm border border-white">
                             <span className="material-symbols-outlined text-[14px]">check</span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); confirmDelete(record!.id); }}
                             className="w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-500 hover:text-white transition-all border border-red-100"
                             title="حذف"
                           >
                             <span className="material-symbols-outlined text-[16px]">delete</span>
                           </button>
                         </div>
                      )}
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${selectedRoleKey === item.key ? 'bg-white/20 text-white' : isCompleted ? 'bg-[#064E3B] text-white' : 'bg-gray-100 text-gray-400'}`}>
                         <span className="material-symbols-outlined text-[20px]">{isCompleted ? 'sports_soccer' : 'add'}</span>
                      </div>
                      
                      <div>
                        <div className={`text-[10px] font-black uppercase mb-0.5 ${selectedRoleKey === item.key ? 'text-white/60' : 'text-[#64748B]'}`}>{item.role}</div>
                        <div className={`font-bold text-xs truncate max-w-[100px] ${selectedRoleKey === item.key ? 'text-white' : isCompleted ? 'text-[#064E3B]' : 'text-gray-400'}`}>
                          {isCompleted ? record.fullName.split(' ')[0] : 'غير مسجل'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Repeatable: Assistant Coaches and Technical Staff */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                  <h4 className="font-bold text-[#064E3B]">مساعدو المدربين والكوادر الفنية الإضافية</h4>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRoleSelect("technical", "assistantCoach", "مدرب مساعد")}
                      className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#022C22] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      إضافة مدرب مساعد
                    </button>
                    <button 
                      onClick={() => handleRoleSelect("technical", "technicalStaff", "إداري فني")}
                      className="flex items-center gap-2 bg-[#FFFDF7] text-[#064E3B] px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#F6F1E7] border border-[#064E3B]/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      إضافة كادر فني
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.people.filter(p => p.roleKey === "assistantCoach" || p.roleKey === "technicalStaff").map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#E5DED0] group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                           {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                             <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                           ) : <span className="material-symbols-outlined text-gray-400">sports_soccer</span>}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#022C22] flex items-center gap-2">
                            {record.fullName}
                            {renderReviewBadge(record)}
                          </div>
                          <div className="text-[10px] text-[#64748B] font-bold">{record.roleLabel}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editRecord(record, "technical")} className="text-[#064E3B] p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onClick={() => confirmDelete(record.id)} className="text-red-500 p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </div>
                  ))}
                  {data.people.filter(p => p.roleKey === "assistantCoach" || p.roleKey === "technicalStaff").length === 0 && (
                    <div className="col-span-full py-6 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                      <p className="text-xs text-gray-400 font-bold">لا يوجد كوادر فنية إضافية مسجلة حاليًا</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Tab */}
        {activeTab === "media" && selectedClassification === 'A' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-5 border border-[#E5DED0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#022C22]">الإعلام والتواصل</h3>
                <span className="text-sm font-bold text-[#064E3B] bg-[#064E3B]/10 px-3 py-1 rounded-full border border-[#064E3B]/20">
                  تم تسجيل {getMediaProgress()} / 2 من الأدوار الأساسية
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "mediaOfficer", title: "المسؤول الإعلامي" },
                  { key: "socialMediaOfficer", title: "مسؤول التواصل الاجتماعي" }
                ].map(role => {
                  const record = data.people.find(r => r.roleKey === role.key);
                  const isCompleted = !!record;
                  return (
                    <div key={role.key} onClick={() => handleRoleSelect("media", role.key, role.title)} className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all group relative ${selectedRoleKey === role.key ? 'bg-[#064E3B]/10 border-[#064E3B] ring-2 ring-[#064E3B]/20 shadow-md' : isCompleted ? 'bg-[#064E3B]/5 border-[#064E3B]/30 hover:bg-[#064E3B]/10' : 'bg-gray-50 border-[#E5DED0] hover:bg-gray-100'}`} >
                      {isCompleted && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); confirmDelete(record!.id); }}
                          className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-md border border-red-200 hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100 z-10"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      )}
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                            {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                              <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt={record.fullName} className="w-full h-full object-cover" />
                            ) : record?.files?.profilePhoto?.uploaded ? (
                              <div className="w-full h-full bg-[#064E3B] text-white flex items-center justify-center text-[10px] font-bold">صورة</div>
                            ) : (
                               <span className={`material-symbols-outlined ${isCompleted ? 'text-[#064E3B]' : 'text-gray-300'}`}>
                                  {isCompleted ? 'person' : 'person_add'}
                               </span>
                            )}
                         </div>
                         <div className="min-w-0">
                           <div className="font-bold text-[#022C22] truncate">{role.title}</div>
                           {isCompleted && (
                             <div className="space-y-0.5">
                                <div className="text-xs text-[#064E3B] font-bold truncate flex items-center gap-2">
                                  {record.fullName}
                                  {renderReviewBadge(record)}
                                </div>
                             </div>
                           )}
                         </div>
                      </div>
                      <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                    </div>
                  );
                })}
              </div>

              {/* Repeatable: Photographer */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[#064E3B]">المصورين</h4>
                  <button 
                    onClick={() => handleRoleSelect("media", "photographer", "مصور")}
                    className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#022C22] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    إضافة مصور
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.people.filter(p => p.roleKey === "photographer").map(record => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#E5DED0] group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                           {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                             <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                           ) : <span className="material-symbols-outlined text-gray-400">photo_camera</span>}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#022C22] flex items-center gap-2">
                            {record.fullName}
                            {renderReviewBadge(record)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editRecord(record, "media")} className="text-[#064E3B] p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onClick={() => confirmDelete(record.id)} className="text-red-500 p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Tab */}
        {activeTab === "medical" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white rounded-2xl p-5 border border-[#E5DED0] shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#022C22]">الجهاز الطبي</h3>
              </div>
              <p className="text-sm text-[#64748B] mb-6">
                {selectedClassification === 'A' ? 'تشمل الأدوار الفريدة (مدير العلاج والطبيب) والأدوار المتكررة.' : 'أدخل بيانات المعالجين الفيزيائيين.'}
              </p>
              
              {selectedClassification === 'A' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                    { key: "medicalManager", title: "مدير العلاج" },
                    { key: "doctor", title: "طبيب" }
                    ].map(role => {
                    const record = data.people.find(r => r.roleKey === role.key);
                    const exists = !!record;
                    const isCompleted = record ? isPersonComplete(record) : false;
                    return (
                        <div 
                        key={role.key} 
                        onClick={() => handleRoleSelect("medical", role.key, role.title)}
                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all group relative ${selectedRoleKey === role.key ? 'bg-[#064E3B]/10 border-[#064E3B] ring-2 ring-[#064E3B]/20 shadow-md' : exists ? (isCompleted ? 'bg-[#064E3B]/5 border-[#064E3B]/30 hover:bg-[#064E3B]/10' : 'bg-amber-50 border-amber-200 shadow-sm') : 'bg-gray-50 border-[#E5DED0] hover:bg-gray-100'}`}
                        >
                        {exists && (
                          <div className={`absolute -top-1.5 -right-1.5 w-6 h-6 ${isCompleted ? 'bg-green-500' : 'bg-amber-500'} text-white rounded-full flex items-center justify-center shadow-md border-2 border-white`}>
                           <span className="material-symbols-outlined text-[14px]">{isCompleted ? 'check' : 'warning'}</span>
                          </div>
                        )}
                        {exists && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(record!.id); }}
                            className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-md border border-red-200 hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100 z-10"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        )}
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                                {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                                <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt={record.fullName} className="w-full h-full object-cover" />
                                ) : (
                                <span className={`material-symbols-outlined ${exists ? 'text-[#064E3B]' : 'text-gray-300'}`}>
                                    {exists ? 'person' : 'person_add'}
                                </span>
                                )}
                            </div>
                            <div className="min-w-0">
                            <div className="font-bold text-[#022C22] truncate">{role.title}</div>
                            {exists && (
                                <div className="space-y-0.5">
                                    <div className={`text-xs ${isCompleted ? 'text-[#064E3B]' : 'text-amber-700'} font-bold truncate flex items-center gap-2`}>
                                      {record.fullName}
                                      {renderReviewBadge(record)}
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                        </div>
                    );
                    })}
                </div>
              )}

              {/* Repeatable Medical Roles */}
              {(selectedClassification === 'A' ? [
                { key: "physiotherapist", label: "معالج فيزيائي", btn: "إضافة معالج فيزيائي" },
                { key: "paramedic", label: "مسعف", btn: "إضافة مسعف" },
                { key: "otherMedicalStaff", label: "مؤهل صحي آخر", btn: "إضافة مؤهل آخر" }
              ] : [
                { key: "bPhysiotherapist", label: "معالج", btn: "إضافة معالج" }
              ]).map(section => (
                <div key={section.key} className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-[#064E3B]">{section.label}</h4>
                    <button 
                      onClick={() => handleRoleSelect("medical", section.key, section.label)}
                      className="flex items-center gap-2 bg-[#064E3B] text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-[#022C22] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      {section.btn}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.people.filter(p => p.roleKey === section.key).map(record => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-[#E5DED0] group">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-white flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E5DED0]">
                            {(record?.files?.profilePhoto?.preview || record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url) ? (
                              <img src={record.files.profilePhoto.preview || record.files.profilePhoto.downloadURL || record.files.profilePhoto.url} alt="" className="w-full h-full object-cover" />
                            ) : <span className="material-symbols-outlined text-gray-400">person</span>}
                         </div>
                         <div>
                           <div className="font-bold text-sm text-[#022C22] flex items-center gap-2">
                             {record.fullName}
                             {renderReviewBadge(record)}
                           </div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editRecord(record, "medical")} className="text-[#064E3B] p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onClick={() => confirmDelete(record.id)} className="text-red-500 p-1 hover:bg-white rounded-lg transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unified Input Form */}
        {(selectedRoleKey || editingId) && (
          <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-md border border-[#064E3B] animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-[#022C22] mb-6 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#064E3B]">edit_square</span>
                {editingId ? `تحديث بروفايل: ${formState.roleLabel}` : `إضافة بروفايل: ${formState.roleLabel}`}
              </div>
              <span className="text-xs text-red-500 font-bold">* جميع الحقول مطلوبة</span>
            </h2>
            
            {formErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  يرجى اكمال البيانات التالية:
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {formErrors.map((err, i) => (
                    <li key={i} className="text-xs text-red-600 font-medium">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#064E3B] border-b border-[#E5DED0] pb-2">أ. بيانات الشخص</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5">الاسم الكامل *</label>
                    <input required type="text" value={formState.fullName || ''} onChange={e => setFormState({...formState, fullName: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] text-sm shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5">الدور المحدد</label>
                    <div className="w-full bg-[#F6F1E7] border border-[#E5DED0] rounded-lg px-4 py-2.5 font-bold text-[#064E3B] text-sm">
                      {formState.roleLabel}
                    </div>
                  </div>
                  {(formState.roleKey === 'technicalSupervisor' || 
                    formState.roleKey === 'coachU10' || 
                    formState.roleKey === 'coachU11' || 
                    formState.roleKey === 'coachU12' || 
                    formState.roleKey === 'coachU13' ||
                    formState.roleKey === 'bCoachU12' ||
                    formState.roleKey === 'bCoachU13') && (
                    <div>
                      <label className="block text-sm font-bold text-[#022C22] mb-1.5">شهادة التدريب *</label>
                      <select required value={formState.certificateType || ''} onChange={e => setFormState({...formState, certificateType: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] text-sm appearance-none shadow-sm">
                        <option value="" disabled>اختر الشهادة...</option>
                        {getCertOptions(formState.roleKey).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      {getCertHelper(formState.roleKey) && <p className="text-[10px] text-amber-600 mt-1 font-bold">{getCertHelper(formState.roleKey)}</p>}
                    </div>
                  )}
                  {formState.roleKey === 'bGeneralSupervisor' && (
                    <div>
                        <label className="block text-sm font-bold text-[#022C22] mb-1.5">نوع الخبرة أو الصفة *</label>
                        <select required value={formState.notes || ''} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] text-sm appearance-none shadow-sm">
                            <option value="" disabled>اختر النوع...</option>
                            <option value="فني">فني</option>
                            <option value="إداري">إداري</option>
                        </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5">تاريخ الميلاد *</label>
                    <input required type="date" value={formState.dateOfBirth || ''} onChange={e => setFormState({...formState, dateOfBirth: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] text-sm shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5">الجنسية *</label>
                    <select required value={formState.nationality || 'لبنانية'} onChange={e => setFormState({...formState, nationality: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] text-sm appearance-none shadow-sm">
                      {NATIONALITIES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    {['owner', 'bOwner', 'bGeneralSupervisor', 'technicalSupervisor'].includes(formState.roleKey || "") && (
                       <p className="text-[10px] text-[#064E3B] mt-2 font-medium">
                         تتغير المستندات المطلوبة تلقائيًا بحسب الجنسية.
                         <br/>
                         {formState.nationality?.trim().toLowerCase() === "lebanese" || formState.nationality?.trim() === "لبناني" || formState.nationality?.trim() === "لبنانية" || formState.nationality?.trim() === "لبنان" || !formState.nationality ? "بما أن الجنسية لبنانية، يجب رفع سجل عدلي نظيف." : "بما أن الجنسية غير لبنانية، يجب رفع الإقامة القانونية."}
                       </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5 text-right">رقم الهاتف *</label>
                    <div className="flex flex-row-reverse gap-2">
                       <select 
                        value={(formState as any).phoneCode || '+961'} 
                        onChange={e => setFormState({...formState, phoneCode: e.target.value} as any)} 
                        className="w-1/3 bg-white border border-[#E5DED0] rounded-lg px-1 py-2.5 outline-none focus:border-[#064E3B] text-xs appearance-none shadow-sm text-center font-bold"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.label}</option>
                        ))}
                      </select>
                      <input required type="tel" value={(formState as any).phoneNum || (formState as any).phone || ''} onChange={e => setFormState({...formState, phoneNum: e.target.value} as any)} className="flex-1 bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] text-sm shadow-sm text-right font-bold" dir="ltr" placeholder="71 000000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[#022C22] mb-1.5">البريد الإلكتروني *</label>
                    <input required type="email" value={formState.email || ''} onChange={e => setFormState({...formState, email: e.target.value})} className="w-full bg-white border border-[#E5DED0] rounded-lg px-4 py-2.5 outline-none focus:border-[#064E3B] text-sm shadow-sm" />
                  </div>
                </div>
              </div>
              
              {/* B. الصورة الشخصية */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#064E3B] border-b border-[#E5DED0] pb-2">ب. الصورة الشخصية *</h3>
                {renderProfilePhotoField(formState.files?.profilePhoto)}
              </div>

              {/* C. المستندات المطلوبة */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#064E3B] border-b border-[#E5DED0] pb-2">ج. المستندات المطلوبة (جميعها إلزامية)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {renderDocumentField("idDocument", "رفع الهوية *", formState.files?.idDocument)}
                  
                  {['owner', 'bOwner', 'bGeneralSupervisor', 'technicalSupervisor'].includes(formState.roleKey || "") ? (
                    (formState.nationality?.trim().toLowerCase() === "lebanese" || formState.nationality?.trim() === "لبناني" || formState.nationality?.trim() === "لبنانية" || formState.nationality?.trim() === "لبنان" || !formState.nationality) ? 
                    renderDocumentField("criminalRecord", "سجل عدلي نظيف *", formState.files?.criminalRecord, "يرجى رفع نسخة حديثة وواضحة من السجل العدلي.") :
                    renderDocumentField("residencyPermit", "الإقامة *", formState.files?.residencyPermit, "يرجى رفع نسخة واضحة عن الإقامة القانونية.")
                  ) : (
                    formState.roleKey === 'administrativeManager' && (formState.nationality === 'لبناني' || !formState.nationality) && 
                    renderDocumentField("criminalRecord", "السجل العدلي *", formState.files?.criminalRecord)
                  )}
                  
                  {renderDocumentField("cv", "السيرة الذاتية *", formState.files?.cv || formState.files?.supportingDocument)}
                  {renderDocumentField("jobDescription", "المسمى الوظيفي *", formState.files?.jobDescription)}
                  
                  {rolesRequiringContract.includes(formState.roleKey || "") && 
                    renderDocumentField("contract", "عقد العمل *", formState.files?.contract)
                  }
                  
                  {(formState.roleKey === 'technicalSupervisor' || 
                    formState.roleKey === 'coachU10' || 
                    formState.roleKey === 'coachU11' || 
                    formState.roleKey === 'coachU12' || 
                    formState.roleKey === 'coachU13' || 
                    formState.roleKey === 'medicalManager' || 
                    formState.roleKey === 'doctor' ||
                    formState.roleKey === 'bCoachU12' ||
                    formState.roleKey === 'bCoachU13' ||
                    formState.roleKey === 'bGeneralSupervisor' ||
                    formState.roleKey === 'bPhysiotherapist') && 
                    renderDocumentField("certificate", "رفع الشهادة أو الإفادة *", formState.files?.certificate)
                  }
                </div>
              </div>

              {/* D. أزرار التحكم */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[#E5DED0]">
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-[#064E3B] text-white px-10 py-3.5 rounded-xl font-bold text-base hover:bg-[#022C22] transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">save</span>
                  {editingId ? 'تحديث البروفايل' : 'حفظ البروفايل'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit}
                  className="w-full sm:w-auto bg-white border border-[#E5DED0] text-[#64748B] px-10 py-3.5 rounded-xl font-bold text-base hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {!isRegistryFinished && (
          <div className="bg-amber-50 rounded-3xl p-8 border-2 border-amber-200 space-y-6 mb-10">
             <div className="flex items-center gap-3 text-amber-900">
               <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md">
                 <span className="material-symbols-outlined">assignment_turned_in</span>
               </div>
               <div>
                  <h3 className="font-black text-lg">المتطلبات المتبقية لفتح المحاور</h3>
                  <p className="text-xs font-bold text-amber-700/70">يجب استكمال هذه الأدوار (بيانات + ملفات) لتتمكن من المتابعة</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 font-bold text-sm">
                {selectedClassification === 'A' ? (
                  <>
                    {[
                      { key: 'owner', label: 'المالك' },
                      { key: 'administrativeManager', label: 'المدير الإداري' },
                      { key: 'technicalSupervisor', label: 'المشرف الفني' },
                      { key: 'financeOfficer', label: 'المسؤول المالي' },
                      { key: 'mediaOfficer', label: 'المسؤول الإعلامي' },
                      { key: 'medicalManager', label: 'مدير العلاج' }
                    ].map(role => {
                      const complete = data.people.some(p => p.roleKey === role.key && isPersonComplete(p));
                      return (
                        <div key={role.key} className="flex items-center gap-2">
                           <span className={`material-symbols-outlined ${complete ? 'text-green-600' : 'text-gray-300'}`}>
                             {complete ? 'check_circle' : 'circle'}
                           </span>
                           <span className={complete ? 'line-through opacity-50 font-normal' : 'text-amber-900'}>{role.label}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2">
                       <span className={`material-symbols-outlined ${["coachU10", "coachU11", "coachU12", "coachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'text-green-600' : 'text-gray-300'}`}>
                         {["coachU10", "coachU11", "coachU12", "coachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'check_circle' : 'circle'}
                       </span>
                       <span className={["coachU10", "coachU11", "coachU12", "coachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'line-through opacity-50 font-normal' : 'text-amber-900'}>مدرب فني (واحد على الأقل)</span>
                    </div>
                  </>
                ) : (
                  <>
                    {[
                      { key: 'bOwner', label: 'مالك الأكاديمية' },
                      { key: 'bGeneralSupervisor', label: 'المشرف العام' },
                      { key: 'bPhysiotherapist', label: 'المعالج' }
                    ].map(role => {
                      const complete = data.people.some(p => p.roleKey === role.key && isPersonComplete(p));
                      return (
                        <div key={role.key} className="flex items-center gap-2">
                           <span className={`material-symbols-outlined ${complete ? 'text-green-600' : 'text-gray-300'}`}>
                             {complete ? 'check_circle' : 'circle'}
                           </span>
                           <span className={complete ? 'line-through opacity-50 font-normal' : 'text-amber-900'}>{role.label}</span>
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-2">
                       <span className={`material-symbols-outlined ${["bCoachU12", "bCoachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'text-green-600' : 'text-gray-300'}`}>
                         {["bCoachU12", "bCoachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'check_circle' : 'circle'}
                       </span>
                       <span className={["bCoachU12", "bCoachU13"].some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p))) ? 'line-through opacity-50 font-normal' : 'text-amber-900'}>مدرب فئات (واحد على الأقل)</span>
                    </div>
                  </>
                )}
             </div>
             <p className="text-[10px] text-amber-600 italic border-t border-amber-200 pt-3 opacity-70">
                ملاحظة: "الاسم مكتوب عليه خط" يعني تم استيفاء الدور وتوثيق كافة المستندات المطلوبة له. 
             </p>
          </div>
        )}


        <div className="pt-10 flex flex-col items-center gap-4 border-t border-[#E5DED0] mt-10 w-full">
            <button 
              onClick={() => {
                if (isRegistryFinished) {
                  navigate("/dashboard");
                }
              }}
              disabled={!isRegistryFinished}
              className={`px-12 py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center gap-3 w-full sm:w-auto justify-center ${isRegistryFinished ? 'bg-[#064E3B] text-white hover:bg-[#022C22] cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none opacity-80'}`}
            >
              {isRegistryFinished ? 'جاهز! الانتقال لتعبئة المحاور' : 'بانتظار استكمال الكوادر المطلوبة...'}
              <span className="material-symbols-outlined">{isRegistryFinished ? 'rocket_launch' : 'lock'}</span>
            </button>
            <p className="text-xs font-bold text-[#64748B] text-center max-w-[600px] leading-relaxed px-6">
              {isRegistryFinished 
              ? "تم استكمال الحد الأدنى من الكوادر. يمكنك الآن البدء بتعبئة محاور التصنيف." 
              : "يرجى إضافة كافة المناصب الأساسية المطلوبة لتصنيف " + selectedClassification + " لتفعيل الانتقال للمحاور."}
            </p>
            <div className="pt-4">
              <Link to="/dashboard" className="text-xs font-bold text-[#64748B] hover:text-[#064E3B] underline decoration-dashed">
                العودة للوحة الأكاديمية (مسودة)
              </Link>
            </div>
        </div>

      </main>
    </div>
  );
}
