import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AcademyAccount, AuthSession } from '../types';
export { auth } from './firebase';
import { getAppStorageKey, clearStorageForEmail } from './appStorage';

const SESSION_KEY = 'currentAcademySession';

// Helper to pull cloud data into local storage
export const restoreCloudToLocal = async (uid: string, email: string) => {
  try {
    const sanitizedEmail = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    const progressRef = collection(db, 'users', uid, 'progress');
    const snapshot = await getDocs(progressRef);
    
    // Clear local storage for this email first so cloud becomes the exact source of truth
    clearStorageForEmail(email);
    
    snapshot.forEach(docSnap => {
      const { key, data } = docSnap.data();
      if (key && data) {
        try {
          localStorage.setItem(`${key}_${sanitizedEmail}`, data);
        } catch (e: any) {
          console.warn(`Could not restore ${key} to local storage (likely quota exceeded). Data will still be available via cloud sync logic if fallback is implemented.`);
        }
      }
    });
  } catch (error) {
    console.error("Cloud restoration failed:", error);
  }
};

export const getCurrentSession = (): AuthSession | null => {
  const session = localStorage.getItem(SESSION_KEY);
  if (session) {
     const parsed = JSON.parse(session);
     const adminEmails = ['grassroots@the-lfa.com.lb', 'constitutionoflife@gmail.com'];
     if (parsed.isAdmin && !adminEmails.includes((parsed.loginEmail || '').toLowerCase())) {
        parsed.isAdmin = false;
        localStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
     }
     return parsed;
  }
  return null;
};

export const saveSession = (session: AuthSession) => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn("Could not save session to local storage (likely quota exceeded).", e);
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("adminViewEmail");
};

export interface AuthResult {
  success: boolean;
  error?: string;
  account?: AcademyAccount;
  debugCode?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
}

export const registerAccount = async (data: Partial<AcademyAccount>): Promise<AuthResult> => {
  try {
    const trimmedEmail = (data.loginEmail || '').trim().toLowerCase();
    const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, data.password!);
    const firebaseUser = userCredential.user;

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    const newAccount: AcademyAccount = {
      id: firebaseUser.uid,
      academyName: data.academyName || '',
      governorate: data.governorate || '',
      district: data.district || '',
      academyPhone: data.academyPhone || '',
      nationality: 'لبنانية',
      academyEmail: data.academyEmail || '',
      loginEmail: trimmedEmail,
      academyLogo: data.academyLogo || null,
      approvedStadiumName: data.approvedStadiumName || '',
      isEmailVerified: true, // Auto-verified due to SMTP failure
      verificationCode: null as any,
      verificationCodeExpiresAt: null as any,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newAccount);
    
    // Call server API to send email
    try {
      await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: verificationCode })
      });
    } catch (err) {
      console.error("Failed to call send-verification API:", err);
    }

    // Clear local storage for this email to prevent reuse issues
    clearStorageForEmail(trimmedEmail);

    // Ensure cloud is primary source
    await restoreCloudToLocal(firebaseUser.uid, newAccount.loginEmail);
    
    // Auto login
    const session: AuthSession = {
      isAuthenticated: true,
      accountId: firebaseUser.uid,
      loginEmail: newAccount.loginEmail,
      academyName: newAccount.academyName || 'مستخدم جديد',
      loggedInAt: Date.now(),
      isAdmin: false
    };
    saveSession(session);
    
    return { success: true, account: newAccount, debugCode: verificationCode };
  } catch (error: any) {
    console.error("Registration error:", error);
    let message = 'حدث خطأ أثناء إنشاء الحساب.';
    if (error.code === 'auth/email-already-in-use') message = 'هذا البريد الإلكتروني مسجل مسبقًا.';
    if (error.code === 'auth/invalid-email') message = 'البريد الإلكتروني غير صالح.';
    if (error.code === 'auth/weak-password') message = 'كلمة المرور ضعيفة جدًا.';
    else if (!error.code?.startsWith('auth/')) message = `حدث خطأ: ${error.message} (${error.code})`;
    return { success: false, error: message };
  }
};

export const updateAccountProfile = async (uid: string, data: Partial<AcademyAccount>): Promise<{ success: boolean; error?: string }> => {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { success: false, error: 'حدث خطأ أثناء تحديث الملف الشخصي.' };
  }
};

export const login = async (email: string, pass: string): Promise<AuthResult> => {
  try {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
    const firebaseUser = userCredential.user;

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    let userData = userDoc.data() as AcademyAccount;

    const adminEmails = ['grassroots@the-lfa.com.lb', 'constitutionoflife@gmail.com'];
    const isAdminUser = adminEmails.includes(trimmedEmail);

    if (!userData) {
      // Self-healing: if auth is successful but doc is missing, create a skeleton one
      userData = {
        id: firebaseUser.uid,
        academyName: isAdminUser ? 'Admin' : '',
        governorate: '',
        district: '',
        academyPhone: '',
        nationality: 'لبنانية',
        academyEmail: '',
        loginEmail: trimmedEmail,
        academyLogo: null,
        approvedStadiumName: '',
        isEmailVerified: true,
        isAdmin: isAdminUser,
        role: isAdminUser ? 'admin' : 'user',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    } else if (isAdminUser && userData.role !== 'admin') {
      userData.isAdmin = true;
      userData.role = 'admin';
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        isAdmin: true,
        role: 'admin'
      });
    } else if (!isAdminUser && (userData.role === 'admin' || userData.isAdmin)) {
      userData.isAdmin = false;
      userData.role = 'user';
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        isAdmin: false,
        role: 'user'
      });
    }

    if (!userData.isEmailVerified) {
      // Auto-verify user due to SMTP failure
      userData.isEmailVerified = true;
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        isEmailVerified: true
      });
    }

    // Update last login
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLoginAt: Date.now()
    });

    const session: AuthSession = {
      isAuthenticated: true,
      accountId: firebaseUser.uid,
      loginEmail: userData.loginEmail,
      academyName: userData.academyName || 'مستخدم جديد',
      loggedInAt: Date.now(),
      isAdmin: userData.isAdmin === true || isAdminUser
    };
    saveSession(session);

    // Restore data
    await restoreCloudToLocal(firebaseUser.uid, userData.loginEmail);
    
    return { success: true, isAdmin: session.isAdmin };
  } catch (error: any) {
    console.error("LOGIN ERROR", error);
    // Only log internally if needed, but avoid console.error to prevent user panic
    let message = 'حدث خطأ أثناء تسجيل الدخول.';
    
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات أو استخدام رابط "نسيت كلمة المرور" لاستعادة حسابك.';
    } else if (error.code === 'auth/operation-not-allowed') {
      message = 'تسجيل الدخول بالبريد الإلكتروني غير مفعل حالياً في إعدادات النظام.';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'لقد تم حظر الدخول مؤقتًا بسبب كثرة المحاولات الخاطئة. يرجى المحاولة بعد قليل أو استعادة كلمة المرور.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'صيغة البريد الإلكتروني غير صحيحة.';
    } else {
      message = `حدث خطأ أثناء تسجيل الدخول: ${error.message} (${error.code})`;
    }
    
    return { success: false, error: message };
  }
};

export const logout = async () => {
  await signOut(auth);
  clearSession();
};

export const waitForAuth = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const lowEmail = (email || '').trim().toLowerCase();
    await sendPasswordResetEmail(auth, lowEmail);
    return { success: true };
  } catch (error: any) {
    console.error("Reset password error:", error);
    let message = 'حدث خطأ أثناء محاولة إرسال رابط استعادة كلمة المرور.';
    if (error.code === 'auth/user-not-found') {
      message = 'لا يوجد مستخدم مسجل بهذا البريد الإلكتروني.';
    } else if (error.code === 'auth/invalid-email') {
      message = 'البريد الإلكتروني غير صالح.';
    }
    return { success: false, error: message };
  }
};

export const isProfileComplete = async (email: string): Promise<boolean> => {
  try {
    const lowEmail = email.toLowerCase();
    const accountsRef = collection(db, 'users');
    const q = await getDocs(accountsRef);
    const account = q.docs.find(d => (d.data().loginEmail || '').toLowerCase() === lowEmail);
    if (!account) return false;
    const data = account.data();
    return !!(data && data.academyName && data.governorate);
  } catch (e) {
    return false;
  }
};

export const getRegisteredAccounts = (): AcademyAccount[] => {
  // This is a stub for backward compatibility with local checks
  // Ideally components should use Firestore queries
  return [];
};

export const saveAccounts = (accounts: AcademyAccount[]) => {
  // Stub for backward compatibility
};

export const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "يجب تسجيل الدخول أولاً." };

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return { success: false, error: "المستخدم غير موجود." };

    const userData = userDoc.data() as AcademyAccount;

    if (userData.verificationCode !== code) {
      return { success: false, error: "رمز التحقق غير صحيح." };
    }

    if (userData.verificationCodeExpiresAt && Date.now() > userData.verificationCodeExpiresAt) {
      return { success: false, error: "انتهت صلاحية الرمز. يرجى طلب رمز جديد." };
    }

    await updateDoc(doc(db, 'users', user.uid), {
      isEmailVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null
    });

    const session: AuthSession = {
      isAuthenticated: true,
      accountId: user.uid,
      loginEmail: userData.loginEmail,
      academyName: userData.academyName || 'مستخدم جديد',
      loggedInAt: Date.now()
    };
    saveSession(session);

    return { success: true };
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: "حدث خطأ أثناء التحقق." };
  }
};

export const resendVerificationCode = async (email: string): Promise<{ success: boolean; error?: string; code?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: "يجب تسجيل الدخول أولاً." };

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await updateDoc(doc(db, 'users', user.uid), {
      verificationCode,
      verificationCodeExpiresAt: expiresAt
    });

    await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: verificationCode })
    });

    return { success: true, code: verificationCode };
  } catch (error) {
    console.error("Resend error:", error);
    return { success: false, error: "حدث خطأ أثناء إرسال الرمز." };
  }
};

