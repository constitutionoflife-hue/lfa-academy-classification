import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Prefer VITE_ env vars; fall back to the committed config for AI Studio compatibility
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'AIzaSyBk_Wn_n0-7CGUKAcqTO3m_8iqms4QOVNU',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'gen-lang-client-0765986975.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'gen-lang-client-0765986975',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'gen-lang-client-0765986975.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '750735113966',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '1:750735113966:web:080faed4b31ddb87d0bdff',
};

const firestoreDbId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DB_ID ||
  'ai-studio-96a38454-7ac4-423c-8de5-613854918323';

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app, firestoreDbId);
export const storage = getStorage(app);
