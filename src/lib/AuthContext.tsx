import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AcademyAccount } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  account: AcademyAccount | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  account: null,
  isAdmin: false,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [account, setAccount] = useState<AcademyAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (active) {
            if (userDoc.exists()) {
              const data = userDoc.data() as AcademyAccount;
              setAccount(data);
            } else {
              setAccount(null);
            }
          }
        } else {
          if (active) {
            setUser(null);
            setAccount(null);
          }
        }
      } catch (error) {
        // Firestore fetch failed (network, rules, etc.) but the Firebase Auth
        // session is still valid — keep the user logged in, just without profile data.
        console.error("AuthContext fetch user data error:", error);
        if (active) {
          // Do NOT null out `user` — that would cause a redirect loop.
          setAccount(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isAdmin = account?.role === 'admin' || account?.isAdmin === true || user?.email === 'grassroots@the-lfa.com.lb' || user?.email === 'constitutionoflife@gmail.com';

  return (
    <AuthContext.Provider value={{ user, account, isAdmin: !!isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
