import { appStorage } from "./appStorage";

export interface FileData {
  name: string;
  uploaded: boolean; // Keep for backward compatibility
  preview?: string; // Keep for UI displaying images
  type?: string;
  size?: number;
  url?: string;
  storagePath?: string;
  base64?: string;
  data?: string; // Keep for backward compatibility
  downloadURL?: string; // Keep for backward compatibility
  uploadedAt?: string;
  uploadStatus?: "uploaded" | "local_fallback" | "failed";
}

export interface RegistryPerson {
  id: string;
  fullName: string;
  roleKey: string;
  roleLabel: string;
  roles?: string[];
  dateOfBirth?: string;
  nationality?: string;
  phone?: string;
  phoneCode?: string;
  phoneNum?: string;
  email?: string;
  certificateType?: string;
  ageCategory?: string; // e.g. for coaches U10
  files: {
    idDocument?: FileData;
    certificate?: FileData;
    criminalRecord?: FileData;
    cv?: FileData;
    contract?: FileData;
    signedDeclaration?: FileData;
    supportingDocument?: FileData;
    profilePhoto?: FileData;
    jobDescription?: FileData;
    residencyPermit?: FileData;
  };
  notes?: string;
  reviewStatus?: "under_review" | "accepted" | "rejected";
  acceptedAt?: number;
  acceptedBy?: string;
  needsReview?: boolean;
}

export interface RegistryData {
  people: RegistryPerson[];
}

export const ROLE_KEYS = {
  owner: "مالك الأكاديمية",
  administrativeManager: "المدير الإداري",
  technicalSupervisor: "المشرف الفني",
  coachU10: "مدرب دون 10",
  coachU11: "مدرب دون 11",
  coachU12: "مدرب دون 12",
  coachU13: "مدرب دون 13",
  financeOfficer: "المسؤول المالي",
  mediaOfficer: "المسؤول الإعلامي",
  socialMediaOfficer: "مسؤول التواصل الاجتماعي",
  photographer: "مصور",
  assistantCoach: "مدرب مساعد",
  technicalStaff: "إداري فني",
  medicalManager: "مدير العلاج",
  doctor: "طبيب",
  physiotherapist: "معالج فيزيائي",
  paramedic: "مسعف",
  otherMedicalStaff: "مؤهل صحي آخر",
  // Classification B Roles
  bOwner: "مالك الأكاديمية (تصنيف B)",
  bGeneralSupervisor: "مشرف فني أو إداري (تصنيف B)",
  bAdministrativeCoordinator: "منسق إداري (تصنيف B)",
  bCoachU13: "مدرب دون 13 (تصنيف B)",
  bCoachU12: "مدرب دون 12 (تصنيف B)",
  bPhysiotherapist: "معالج (تصنيف B)",
};

export const UNIQUE_ROLES = [
  "owner",
  "administrativeManager",
  "technicalSupervisor",
  "coachU10",
  "coachU11",
  "coachU12",
  "coachU13",
  "financeOfficer",
  "medicalManager",
  "doctor",
  "mediaOfficer",
  "socialMediaOfficer",
  // Classification B
  "bOwner",
  "bGeneralSupervisor",
  "bCoachU13",
  "bCoachU12",
];

const mapOldRoleToKey = (oldRole: string): string => {
  for (const [key, label] of Object.entries(ROLE_KEYS)) {
    if (label === oldRole || oldRole.includes(label)) return key;
  }
  
  if (oldRole === "مدير إداري") return "administrativeManager";
  if (oldRole === "مشرف فني") return "technicalSupervisor";
  if (oldRole === "مسؤول مالي") return "financeOfficer";
  if (oldRole === "مسؤول إعلامي") return "mediaOfficer";
  if (oldRole === "مسؤول تواصل اجتماعي") return "socialMediaOfficer";
  if (oldRole === "مؤهل صحي آخر" || oldRole === "otherMedical") return "otherMedicalStaff";

  return "other";
};

export const getRegistryData = (): RegistryData => {
  const selectedType = appStorage.getItem("selectedApplicationType") || "A";
  const storageKey = selectedType === "B" ? "classificationB_registry" : "classificationA_registry";
  
  // Try to load classification-specific data first
  const saved = appStorage.getItem(storageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.people && Array.isArray(parsed.people)) {
        return parsed as RegistryData;
      }
    } catch {}
  }

  // If not found, try to migrate from old academyRegistry
  const oldSaved = appStorage.getItem("academyRegistry");
  if (oldSaved) {
    try {
      const raw = JSON.parse(oldSaved);
      
      // Determine if clearly related to the current selectedType
      let clearlyRelated = false;
      const allPeople: any[] = [];
      if (Array.isArray(raw.people)) allPeople.push(...raw.people);
      if (Array.isArray(raw.management)) allPeople.push(...raw.management);
      if (Array.isArray(raw.technical)) allPeople.push(...raw.technical);
      if (Array.isArray(raw.medical)) allPeople.push(...raw.medical);

      if (selectedType === "A") {
        // A roles: owner, administrativeManager, technicalSupervisor, etc.
        const aRoles = ["owner", "administrativeManager", "technicalSupervisor", "coachU10", "coachU11", "coachU12", "coachU13"];
        clearlyRelated = allPeople.some(p => aRoles.includes(p.roleKey) || (p.role && aRoles.includes(mapOldRoleToKey(p.role))));
      } else if (selectedType === "B") {
        // B roles: bOwner, bGeneralSupervisor, etc.
        const bRoles = ["bOwner", "bGeneralSupervisor", "bCoachU12", "bCoachU13"];
        clearlyRelated = allPeople.some(p => bRoles.includes(p.roleKey) || (p.role && bRoles.includes(mapOldRoleToKey(p.role))));
      }

      if (clearlyRelated) {
        // Migration logic
        const unifiedData: RegistryData = { people: [] };
        
        const migrateItem = (item: any, sectionMatch?: string): RegistryPerson => {
          let rawRole = item.role || item.technicalRole || item.ageCategory || item.medicalRole || '';
          let roleKey = item.roleKey || mapOldRoleToKey(rawRole);
          if (roleKey === 'other' || roleKey === '') {
             if (sectionMatch === 'technical') roleKey = selectedType === 'A' ? 'coachU10' : 'bCoachU12';
             else if (sectionMatch === 'medical') roleKey = selectedType === 'A' ? 'otherMedicalStaff' : 'bPhysiotherapist';
          }

          return {
            id: item.id || Math.random().toString(36).substr(2, 9),
            fullName: item.name || item.fullName || '',
            roleKey,
            roleLabel: item.role || item.technicalRole || item.ageCategory || item.medicalRole || ROLE_KEYS[roleKey as keyof typeof ROLE_KEYS] || rawRole,
            dateOfBirth: item.dob || item.dateOfBirth || '',
            nationality: item.nationality || '',
            phone: item.phone || '',
            email: item.email || '',
            certificateType: item.certificate || item.certificateType || '',
            ageCategory: item.ageCategory || item.technicalRole,
            files: item.files || {
              idDocument: item.idFile,
              certificate: item.certFile,
            }
          };
        };

        if (raw.people && Array.isArray(raw.people)) {
          unifiedData.people.push(...raw.people);
        } else {
          if (raw.management) unifiedData.people.push(...raw.management.map((i: any) => migrateItem(i, 'management')));
          if (raw.technical) unifiedData.people.push(...raw.technical.map((i: any) => migrateItem(i, 'technical')));
          if (raw.medical) unifiedData.people.push(...raw.medical.map((i: any) => migrateItem(i, 'medical')));
        }

        // Save migrated data to new key
        appStorage.setItem(storageKey, JSON.stringify(unifiedData));
        return unifiedData;
      }
    } catch (e) {
      console.error("Migration failed", e);
    }
  }

  return { people: [] };
};

export const saveRegistryData = (data: RegistryData) => {
  const selectedType = appStorage.getItem("selectedApplicationType") || "A";
  const storageKey = selectedType === "B" ? "classificationB_registry" : "classificationA_registry";
  appStorage.setItem(storageKey, JSON.stringify(data));
};

export const getPersonByRole = (roleKey: string): RegistryPerson | undefined => {
  const data = getRegistryData();
  return data.people.find(p => p.roleKey === roleKey || p.roles?.includes(roleKey));
};

export const getPeopleByRole = (roleKey: string): RegistryPerson[] => {
  const data = getRegistryData();
  return data.people.filter(p => p.roleKey === roleKey || p.roles?.includes(roleKey));
};

export const isPersonComplete = (p: RegistryPerson): boolean => {
  if (!p.fullName || !p.dateOfBirth || !p.nationality || !p.phone || !p.email) return false;
  
  const rolesRequiringCert = ['technicalSupervisor', 'coachU10', 'coachU11', 'coachU12', 'coachU13', 'bCoachU12', 'bCoachU13'];
  if (rolesRequiringCert.includes(p.roleKey) && !p.certificateType) return false;

  if (p.roleKey === 'bGeneralSupervisor' && !p.notes) return false;

  // Files
  if (!p.files?.profilePhoto?.uploaded) return false;
  if (!p.files?.idDocument?.uploaded) return false;
  
  const isLebanese = 
    p.nationality?.trim().toLowerCase() === "lebanese" ||
    p.nationality?.trim() === "لبناني" ||
    p.nationality?.trim() === "لبنانية" ||
    p.nationality?.trim() === "لبنان";

  const isTargetRole = ['owner', 'bOwner', 'bGeneralSupervisor', 'technicalSupervisor'].includes(p.roleKey);

  if (isTargetRole) {
    if (isLebanese && !p.files?.criminalRecord?.uploaded) return false;
    if (!isLebanese && !p.files?.residencyPermit?.uploaded) return false;
  }
  
  if (!(p.files?.cv?.uploaded || p.files?.supportingDocument?.uploaded)) return false;
  if (!p.files?.jobDescription?.uploaded) return false;

  const rolesRequiringContract = [
    "administrativeManager", "technicalSupervisor", "coachU10", "coachU11", "coachU12", "coachU13", "medicalManager", "doctor"
  ];
  if (rolesRequiringContract.includes(p.roleKey) && !p.files?.contract?.uploaded) return false;

  const rolesRequiringCertFile = [
    'technicalSupervisor', 'coachU10', 'coachU11', 'coachU12', 'coachU13', 
    'medicalManager', 'doctor', 'bCoachU12', 'bCoachU13', 'bGeneralSupervisor', 'bPhysiotherapist'
  ];
  if (rolesRequiringCertFile.includes(p.roleKey) && !p.files?.certificate?.uploaded) return false;

  return true;
};

export const isRegistryReady = (selectedType: string | null): boolean => {
  if (!selectedType) return false;
  const data = getRegistryData();
  
  if (selectedType === 'A') {
    const requiredUnique = ["owner", "administrativeManager", "technicalSupervisor", "financeOfficer", "mediaOfficer", "medicalManager"];
    const hasUniques = requiredUnique.every(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p)));
    const technicalStaff = ["coachU10", "coachU11", "coachU12", "coachU13"];
    const hasTechnical = technicalStaff.some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p)));
    return hasUniques && hasTechnical;
  }
  
  if (selectedType === 'B') {
    const requiredUnique = ["bOwner", "bGeneralSupervisor"];
    const hasUniques = requiredUnique.every(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p)));
    const technicalStaff = ["bCoachU12", "bCoachU13"];
    const hasTechnical = technicalStaff.some(rk => data.people.some(p => p.roleKey === rk && isPersonComplete(p)));
    const hasMedical = data.people.some(p => p.roleKey === "bPhysiotherapist" && isPersonComplete(p));
    return hasUniques && hasTechnical && hasMedical;
  }
  
  return false;
};

export const FILE_KEYS = {
  profilePhoto: "الصورة الشخصية",
  jobDescription: "المسمى الوظيفي",
  idDocument: "الهوية الوطنية",
  certificate: "شهادة التدريب / المؤهل",
  criminalRecord: "السجل الجنائي",
  cv: "السيرة الذاتية",
  contract: "عقد العمل",
  signedDeclaration: "الإقرار الموقع",
  supportingDocument: "مستند داعم",
  residencyPermit: "الإقامة"
};
