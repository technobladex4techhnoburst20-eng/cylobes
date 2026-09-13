import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as fbUpdateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, googleProvider, db } from "./config";
import { authStorage } from "../services/api";

export interface StudentProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  branch?: string;
  graduationYear?: string;
  bio?: string;
  pronouns?: string;
  dob?: string;
  location?: string;
  isPrivate?: boolean;
  status?: string;
  createdAt?: number;
  authProvider?: "google" | "email" | "local";
}

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  branch?: string;
  graduationYear?: string;
  bio?: string;
  avatar?: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  studentUser: StudentProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<StudentProfile>;
  signUpWithEmail: (params: SignUpParams) => Promise<StudentProfile>;
  signInWithEmail: (email: string, password: string) => Promise<StudentProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [studentUser, setStudentUser] = useState<StudentProfile | null>(() => {
    const cached = localStorage.getItem("college_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const syncBackendToken = async (p: StudentProfile) => {
    try {
      const res = await fetch("/api/auth/firebase-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: p.id,
          email: p.email,
          name: p.name,
          branch: p.branch,
          avatar: p.avatar,
          bio: p.bio,
        }),
      });
      const json = await res.json();
      if (res.ok && json.token) {
        authStorage.setToken(json.token);
      }
    } catch (e) {
      console.warn("Backend token sync warning:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          // Check if user exists in Firestore
          const userDocRef = doc(db, "users", fbUser.uid);
          const docSnap = await getDoc(userDocRef);

          let profile: StudentProfile;

          if (docSnap.exists()) {
            profile = {
              id: fbUser.uid,
              ...(docSnap.data() as any),
            };
          } else {
            // First time sign in: create initial document in Firestore
            profile = {
              id: fbUser.uid,
              name: fbUser.displayName || "Graduating Senior",
              email: fbUser.email || "",
              avatar:
                fbUser.photoURL ||
                "https://www.ghibli.jp/gallery/howl005.jpg",
              branch: "Class of 2025",
              graduationYear: "2025",
              bio: "Graduating senior, memory keeper, and proud batchmate.",
              pronouns: "They/Them",
              location: "Campus",
              dob: "2003-01-01",
              isPrivate: false,
              status: "active",
              createdAt: Date.now(),
              authProvider: fbUser.providerData.some((p) => p.providerId === "google.com")
                ? "google"
                : "email",
            };

            try {
              await setDoc(userDocRef, {
                ...profile,
                serverCreatedAt: serverTimestamp(),
              });
            } catch (setErr) {
              console.warn("Firestore user creation sync note:", setErr);
            }
          }

          setStudentUser(profile);
          localStorage.setItem("college_user", JSON.stringify(profile));
          await syncBackendToken(profile);
        } catch (err: any) {
          console.warn("Firestore user sync notice (using auth profile fallback):", err?.message || err);
          // Fallback to basic profile from Firebase user
          const fallbackProfile: StudentProfile = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || "Graduating Senior",
            email: fbUser.email || "",
            avatar:
              fbUser.photoURL ||
              "https://www.ghibli.jp/gallery/howl005.jpg",
            branch: "Class of 2025",
            graduationYear: "2025",
            bio: "Memory keeper & campus senior.",
            authProvider: fbUser.providerData.some((p) => p.providerId === "google.com")
              ? "google"
              : "email",
            createdAt: Date.now(),
          };
          setStudentUser(fallbackProfile);
          localStorage.setItem(
            "college_user",
            JSON.stringify(fallbackProfile)
          );
        }
      } else {
        // If not signed in via Firebase, check if there is a local demo user or clear
        const cached = localStorage.getItem("college_user");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.authProvider === "google" || parsed.authProvider === "email") {
              setStudentUser(null);
              localStorage.removeItem("college_user");
            } else {
              setStudentUser(parsed);
            }
          } catch (e) {
            setStudentUser(null);
          }
        } else {
          setStudentUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Sign In With Google
  const signInWithGoogle = async (): Promise<StudentProfile> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      let profile: StudentProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || "Graduating Senior",
        email: fbUser.email || "",
        avatar:
          fbUser.photoURL ||
          "https://www.ghibli.jp/gallery/howl005.jpg",
        branch: "Class of 2025",
        graduationYear: "2025",
        bio: "Graduating senior, memory keeper, and proud batchmate.",
        pronouns: "They/Them",
        location: "Campus",
        dob: "2003-01-01",
        isPrivate: false,
        status: "active",
        createdAt: Date.now(),
        authProvider: "google",
      };

      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          profile = {
            id: fbUser.uid,
            ...(docSnap.data() as any),
          };
        } else {
          try {
            await setDoc(userDocRef, {
              ...profile,
              serverCreatedAt: serverTimestamp(),
            });
          } catch (writeErr) {
            console.warn("Firestore user profile save note:", writeErr);
          }
        }
      } catch (firestoreErr) {
        console.warn("Firestore profile read note:", firestoreErr);
      }

      setStudentUser(profile);
      localStorage.setItem("college_user", JSON.stringify(profile));
      await syncBackendToken(profile);
      return profile;
    } catch (err: any) {
      console.warn("Google sign in notice:", err?.message || err);
      throw err;
    }
  };

  // 2. Sign Up With Email and Password
  const signUpWithEmail = async ({
    email,
    password,
    name,
    branch = "Computer Science",
    graduationYear = "2025",
    bio = "Making memories that last a lifetime.",
    avatar = "https://www.ghibli.jp/gallery/howl005.jpg",
  }: SignUpParams): Promise<StudentProfile> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const fbUser = userCredential.user;

      // Update auth profile display name and photo
      try {
        await fbUpdateProfile(fbUser, {
          displayName: name.trim(),
          photoURL: avatar,
        });
      } catch (profileErr) {
        console.warn("Update profile note:", profileErr);
      }

      const profile: StudentProfile = {
        id: fbUser.uid,
        name: name.trim(),
        email: fbUser.email || email.trim(),
        avatar: avatar,
        branch: branch.trim(),
        graduationYear: graduationYear.trim(),
        bio: bio.trim(),
        pronouns: "Student",
        location: "Campus",
        status: "active",
        createdAt: Date.now(),
        authProvider: "email",
      };

      // Store in Firestore users collection
      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        await setDoc(userDocRef, {
          ...profile,
          serverCreatedAt: serverTimestamp(),
        });
      } catch (docErr) {
        console.warn("Firestore profile sync warning:", docErr);
      }

      setStudentUser(profile);
      localStorage.setItem("college_user", JSON.stringify(profile));
      await syncBackendToken(profile);
      return profile;
    } catch (err: any) {
      console.warn("Sign up notice:", err?.message || err);
      throw err;
    }
  };

  // 3. Sign In With Email and Password
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<StudentProfile> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const fbUser = userCredential.user;

      // Fetch user profile from Firestore
      let profile: StudentProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Senior",
        email: fbUser.email || "",
        avatar:
          fbUser.photoURL ||
          "https://www.ghibli.jp/gallery/howl005.jpg",
        branch: "Class of 2025",
        graduationYear: "2025",
        bio: "Memory keeper & campus senior.",
        createdAt: Date.now(),
        authProvider: "email",
      };

      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          profile = {
            id: fbUser.uid,
            ...(docSnap.data() as any),
          };
        } else {
          try {
            await setDoc(userDocRef, {
              ...profile,
              serverCreatedAt: serverTimestamp(),
            });
          } catch (writeErr) {
            console.warn("Firestore profile save note:", writeErr);
          }
        }
      } catch (docErr) {
        console.warn("Firestore sign-in doc sync warning:", docErr);
      }

      setStudentUser(profile);
      localStorage.setItem("college_user", JSON.stringify(profile));
      await syncBackendToken(profile);
      return profile;
    } catch (err: any) {
      console.warn("Sign in notice:", err?.message || err);
      throw err;
    }
  };

  // 4. Send Password Reset Email
  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error("Password reset error:", err);
      throw err;
    }
  };

  // 5. Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error("Sign out error", e);
    }
    setStudentUser(null);
    localStorage.removeItem("college_user");
    localStorage.removeItem("college_token");
  };

  // 6. Update Profile
  const updateProfile = async (data: Partial<StudentProfile>) => {
    if (!studentUser) return;
    const updated = { ...studentUser, ...data, updatedAt: Date.now() };
    setStudentUser(updated);
    localStorage.setItem("college_user", JSON.stringify(updated));

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await updateDoc(userDocRef, {
          ...data,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.warn("Could not sync profile to Firestore:", err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        studentUser,
        loading,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendPasswordReset,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

