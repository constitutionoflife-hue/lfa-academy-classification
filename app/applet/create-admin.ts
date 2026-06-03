import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const configStr = fs.readFileSync('firebase-applet-config.json', 'utf-8');
const config = JSON.parse(configStr);

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'grassroots@the-lfa.com.lb', 'Grassroots12!@');
    await setDoc(doc(db, 'users', cred.user.uid), {
      id: cred.user.uid,
      loginEmail: 'grassroots@the-lfa.com.lb',
      academyName: 'Admin',
      isAdmin: true,
      isEmailVerified: true,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    });
    console.log("Admin account created successfully.");
    process.exit(0);
  } catch(e: any) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('Account already exists, just setting admin flag...');
      // To set the doc we need uid. Can't retrieve it without sign in, let's just sign in.
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const signInCred = await signInWithEmailAndPassword(auth, 'grassroots@the-lfa.com.lb', 'Grassroots12!@');
      await setDoc(doc(db, 'users', signInCred.user.uid), {
        id: signInCred.user.uid,
        loginEmail: 'grassroots@the-lfa.com.lb',
        academyName: 'Admin',
        isAdmin: true,
        isEmailVerified: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now()
      }, { merge: true });
      console.log("Admin account updated successfully.");
      process.exit(0);
    } else {
      console.error(e);
      process.exit(1);
    }
  }
}

createAdmin();
