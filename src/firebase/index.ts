import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

import { firebaseConfig } from './config';

export function initializeFirebase() {
  const isConfigured = getApps().length > 0;
  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  
  if (!isConfigured) {
    if (process.env.NEXT_PUBLIC_EMULATOR_HOST) {
      const host = process.env.NEXT_PUBLIC_EMULATOR_HOST;
      console.log(`Connecting to Firebase emulators on ${host}`);
      // Set up emulators
      connectAuthEmulator(auth, `http://${host}:9099`, {
        disableWarnings: true,
      });
      connectFirestoreEmulator(firestore, host, 8080);
    }
  }

  return { firebaseApp, auth, firestore };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useUser } from './auth/use-user';
