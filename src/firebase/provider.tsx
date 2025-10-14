'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseServices } from './types';

const FirebaseContext = createContext<FirebaseServices | null>(null);

export const FirebaseProvider = ({
  children,
  ...services
}: {
  children: React.ReactNode;
} & FirebaseServices) => {
  return (
    <FirebaseContext.Provider value={services}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  return useContext(FirebaseContext);
};

export const useFirebaseApp = (): FirebaseApp => {
  const services = useFirebase();
  if (!services) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return services.firebaseApp;
};

export const useFirestore = (): Firestore => {
  const services = useFirebase();
  if (!services) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return services.firestore;
};

export const useAuth = (): Auth => {
  const services = useFirebase();
  if (!services) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return services.auth;
};
