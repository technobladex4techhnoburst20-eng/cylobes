import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import firebaseConfigFile from "../../firebase-applet-config.json";

// User's provided Firebase configuration for codex-33403
export const firebaseConfig = {
  apiKey: "AIzaSyAM1RJYYZzGQaHcWGFdczio0wfHUazeEcg",
  authDomain: "codex-33403.firebaseapp.com",
  projectId: "codex-33403",
  storageBucket: "codex-33403.firebasestorage.app",
  messagingSenderId: "410407721636",
  appId: "1:410407721636:web:484c636f684e82a1c76431",
  measurementId: "G-3X0RN3J0BV",
  firestoreDatabaseId: "(default)",
  ...firebaseConfigFile,
};

const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export const db: Firestore = getFirestore(app);

// Initialize analytics safely if supported in client browser environment
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        getAnalytics(app);
      } catch (e) {
        console.info("Analytics initialization note:", e);
      }
    }
  });
}

export default app;

