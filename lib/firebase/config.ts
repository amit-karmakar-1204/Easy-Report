import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""
  ).trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim(),
  measurementId: (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "").trim(),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== "your-api-key-here" &&
      firebaseConfig.projectId &&
      firebaseConfig.projectId !== "your-project-id" &&
      firebaseConfig.appId &&
      firebaseConfig.appId !== "your-app-id",
  );
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase:", error);
  }
} else if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.warn("Server Firebase initialization note:", error);
  }
}

export { app, db, firebaseConfig };
