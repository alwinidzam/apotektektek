"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import {
  initializeFirestore,
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Firebase Configuration from Environment Variables with Safe Production Fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApotekKersoWarasDemoKey2026",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "apotek-kerso-waras.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "apotek-kerso-waras",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "apotek-kerso-waras.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "100827110405",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:100827110405:web:89a0f44bc912389d0",
};

// Primary Admin Email specified by User
export const PRIMARY_OWNER_EMAIL = process.env.NEXT_PUBLIC_PRIMARY_OWNER_EMAIL || "alwinizam0405@gmail.com";

// Check if Firebase has custom production credentials
export const isLiveFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("DemoKey")
);

// Singleton Firebase App instance
export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth with browser local persistence
export const firebaseAuth: Auth = getAuth(firebaseApp);
if (typeof window !== "undefined") {
  setPersistence(firebaseAuth, browserLocalPersistence).catch((err) => {
    console.warn("[Firebase Auth] Local persistence notice:", err);
  });
}

// Initialize Firestore with multi-tab offline caching
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch (e) {
  // Fallback if already initialized (e.g. during Next.js hot reload)
  firestoreDb = initializeFirestore(firebaseApp, {});
}

export const firestore = firestoreDb;
