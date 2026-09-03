import { type FirebaseApp, deleteApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
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
let auth: Auth | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn("Failed to initialize Firebase:", error);
  }
} else if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn("Server Firebase initialization note:", error);
  }
}

/**
 * Creates an ephemeral secondary Firebase app instance.
 * Useful when an already authenticated developer creates a new user account
 * without disrupting the developer's active authentication session.
 */
export function getSecondaryAuth(): { secondaryAuth: Auth; cleanup: () => Promise<void> } | null {
  if (!isFirebaseConfigured()) return null;
  try {
    const secondaryAppName = `SecondaryApp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);
    return {
      secondaryAuth,
      cleanup: async () => {
        try {
          await deleteApp(secondaryApp);
        } catch {
          // ignore cleanup error
        }
      },
    };
  } catch (err) {
    console.warn("Could not create secondary auth app:", err);
    return null;
  }
}

export { app, db, auth, firebaseConfig };

