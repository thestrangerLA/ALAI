// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  "projectId": "studio-7907390526-508e3",
  "appId": "1:591025345708:web:3ecf0024f008996d8abb09",
  "apiKey": "AIzaSyDG3Xlfzln_FqyKwAHGTVhlMtjz1VnLzA4",
  "authDomain": "studio-7907390526-508e3.firebaseapp.com",
  "messagingSenderId": "591025345708"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
