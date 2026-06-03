
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

export const getAppStorageKey = (key: string): string => {
  const adminViewEmail = localStorage.getItem("adminViewEmail");
  if (adminViewEmail) {
    const sanitizedEmail = adminViewEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
    return `${key}_${sanitizedEmail}`;
  }

  const sessionJson = localStorage.getItem("currentAcademySession");
  if (sessionJson) {
    try {
      const session = JSON.parse(sessionJson);
      if (session.loginEmail) {
        // Lowercase and sanitize email for use in storage key
        const sanitizedEmail = session.loginEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
        return `${key}_${sanitizedEmail}`;
      }
    } catch (e) {
      console.error("Error parsing session from localStorage", e);
    }
  }
  return key;
};

// Background sync helper
const syncToCloud = async (key: string, value: string | null) => {
  if (localStorage.getItem("adminViewEmail")) return; // Admin viewing cannot sync changes
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const docRef = doc(db, 'users', currentUser.uid, 'progress', key);
    
    if (value !== null && value.length > 950000) {
      console.warn(`Data for ${key} exceeds 950KB, skipping sync. Length: ${value.length}`);
      return;
    }

    if (value === null) {
      // In a real app we might delete, but setting to empty/null is safer for simple sync
      await setDoc(docRef, { userId: currentUser.uid, key, data: "", updatedAt: Date.now() });
    } else {
      await setDoc(docRef, { userId: currentUser.uid, key, data: value, updatedAt: Date.now() });
    }
  } catch (error: any) {
    console.error(`Sync to cloud failed for ${key}:`, error);
  }
};

export const clearStorageForEmail = (email: string) => {
  const sanitizedEmail = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const suffix = `_${sanitizedEmail}`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.endsWith(suffix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
};

export const appStorage = {
  getItem: (key: string): string | null => {
    return localStorage.getItem(getAppStorageKey(key));
  },
  setItem: (key: string, value: string): void => {
    // Attempt local save
    try {
      localStorage.setItem(getAppStorageKey(key), value);
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
        console.warn('Local storage quota exceeded. Change will only be saved to cloud.');
      } else {
        console.error('Error saving to local storage:', e);
      }
    }
    // Always trigger background sync
    syncToCloud(key, value);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(getAppStorageKey(key));
    // Background sync
    syncToCloud(key, null);
  }
};

