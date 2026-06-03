export interface AcademyAccount {
  id: string;
  academyName: string;
  governorate: string;
  district: string;
  academyPhone: string;
  nationality: string;
  academyEmail: string;
  loginEmail: string;
  password?: string; // Mock only
  academyLogo: string | null;
  approvedStadiumName: string;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: number;
  createdAt: number;
  lastLoginAt: number;
  applicationStatus?: string;
  submittedAt?: number;
  classificationType?: string;
  role?: string;
  isAdmin?: boolean;
  adminStatus?: 'approved' | 'declined' | 'pending';
  adminFinalNote?: string;
  totalProgress?: number;
  adminAxisReviews?: Record<string, any>;
}

export interface AuthSession {
  isAuthenticated: boolean;
  accountId: string;
  loginEmail: string;
  academyName: string;
  loggedInAt: number;
  isAdmin?: boolean;
}

export interface PersonRecord {
    id: string;
    fullName: string;
    roleKey: string;
    dob?: string;
    phone?: string;
    certificateType?: string;
    notes?: string;
    files: Record<string, string>; // url or base64
}

export interface AcademyRegistryData {
    people: PersonRecord[];
}
