import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const cred = await signInWithEmailAndPassword(auth, 'grassroots@the-lfa.com.lb', 'Grassroots12!@');
    await updateDoc(doc(db, 'users', cred.user.uid), {
      role: 'admin'
    });
    console.log("Admin account role updated successfully.");
    process.exit(0);
  } catch(e: any) {
    if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const cred = await createUserWithEmailAndPassword(auth, 'grassroots@the-lfa.com.lb', 'Grassroots12!@');
      await setDoc(doc(db, 'users', cred.user.uid), {
        id: cred.user.uid,
        loginEmail: 'grassroots@the-lfa.com.lb',
        academyName: 'Admin',
        isAdmin: true,
        role: 'admin',
        isEmailVerified: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      });
      console.log("Admin account created with role.");
      process.exit(0);
    } else {
      console.error(e);
      process.exit(1);
    }
  }
}

createAdmin();
