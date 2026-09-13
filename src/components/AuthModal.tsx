import React, { useState } from "react";
import { useAuth } from "../firebase/AuthContext";
import {
  X,
  Mail,
  Lock,
  User,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Globe,
} from "lucide-react";
import confetti from "canvas-confetti";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
  initialTab?: "signin" | "signup" | "forgot";
}

const GHIBLI_AVATARS = [
  { name: "Howl", url: "https://www.ghibli.jp/gallery/howl005.jpg" },
  { name: "Chihiro", url: "https://www.ghibli.jp/gallery/chihiro014.jpg" },
  { name: "Haku", url: "https://www.ghibli.jp/gallery/chihiro021.jpg" },
  { name: "Kiki", url: "https://www.ghibli.jp/gallery/majo018.jpg" },
  { name: "Sophie", url: "https://www.ghibli.jp/gallery/howl017.jpg" },
  { name: "Totoro", url: "https://www.ghibli.jp/gallery/totoro024.jpg" },
  { name: "San", url: "https://www.ghibli.jp/gallery/mononoke012.jpg" },
  { name: "Ashitaka", url: "https://www.ghibli.jp/gallery/mononoke029.jpg" },
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Science",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Business & Management (MBA/BBA)",
  "Arts, Media & Design",
  "Commerce & Economics",
  "Natural Sciences",
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "signin",
  initialTab,
}) => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    sendPasswordReset,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "forgot">(
    initialTab || defaultTab
  );

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState(DEPARTMENTS[0]);
  const [graduationYear, setGraduationYear] = useState("2025");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(GHIBLI_AVATARS[0].url);
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  if (!isOpen) return null;

  const getFriendlyError = (err: any): string => {
    const code = err?.code || "";
    if (code === "auth/unauthorized-domain" || err?.message?.includes("unauthorized-domain")) {
      setIsUnauthorizedDomain(true);
      return "Google Sign-In is blocked: Current domain is not authorized in your Firebase Console.";
    }
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Please sign in instead.";
    }
    if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
      return "Incorrect email or password. Please verify your details.";
    }
    if (code === "auth/user-not-found") {
      return "No account found with this email. Please sign up.";
    }
    if (code === "auth/weak-password") {
      return "Password is too weak. Please use at least 6 characters.";
    }
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }
    if (code === "auth/popup-closed-by-user") {
      return "Google Sign-in was cancelled.";
    }
    return err?.message || "An error occurred. Please try again.";
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmail(email.trim(), password);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setSuccessMsg("Welcome back! Signed in successfully.");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please provide your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Please provide a valid email.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      await signUpWithEmail({
        email: email.trim(),
        password,
        name: name.trim(),
        branch,
        graduationYear,
        bio: bio.trim() || `Class of ${graduationYear} senior.`,
        avatar: selectedAvatar,
      });

      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      setSuccessMsg("Account registered and saved to Firebase Firestore!");
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      setLoading(true);
      await signInWithGoogle();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setSuccessMsg("Signed in with Google!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg("Please enter your email to receive a password reset link.");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordReset(email.trim());
      setSuccessMsg("Password reset link sent to your email!");
    } catch (err: any) {
      setErrorMsg(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1a2a40]/10 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title & Tabs */}
        <div className="bg-linear-to-r from-[#003d80] to-[#0056b3] text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-['Cormorant_Garamond',serif] text-xl font-bold tracking-tight">
                College Time Capsule
              </h2>
              <p className="text-[11px] text-white/80">
                Connected to Firebase: <span className="font-mono font-semibold">codex-33403</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 p-1 bg-black/20 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "signin"
                  ? "bg-white text-[#003d80] shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-white text-[#003d80] shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Sign Up (Register)
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Interactive Firebase Unauthorized Domain Helper Card */}
          {isUnauthorizedDomain && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-amber-950 text-xs space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Fix Google Sign-In: Authorize Current Domain</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Firebase blocks Google Sign-In until this app's domain is added to your project's whitelist. This is a security setting in <strong>Firebase Authentication</strong> (not Firestore Rules).
              </p>

              <div className="bg-white border border-amber-200 rounded-lg p-2.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Domain to copy:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentHostname) {
                        navigator.clipboard.writeText(currentHostname);
                        setCopiedDomain(true);
                        setTimeout(() => setCopiedDomain(false), 2500);
                      }
                    }}
                    className="text-[11px] text-[#003d80] hover:text-[#0056b3] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedDomain ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Domain</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] font-semibold text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 select-all break-all">
                  {currentHostname || "ais-dev-m5bsxycl6rt7bb2xfm6mia-700104481770.asia-southeast1.run.app"}
                </div>
              </div>

              <div className="text-[11px] text-amber-900 space-y-1 pt-0.5">
                <p className="font-bold text-amber-950">Quick 3-step fix in Firebase Console:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-800">
                  <li>Go to <strong>Firebase Console &gt; Authentication &gt; Settings</strong> tab.</li>
                  <li>Scroll to <strong>Authorized domains</strong> and click <strong>Add domain</strong>.</li>
                  <li>Paste the copied domain and click <strong>Done</strong>.</li>
                </ol>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-amber-200">
                <a
                  href="https://console.firebase.google.com/project/codex-33403/authentication/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#003d80] hover:underline font-bold"
                >
                  <span>Open Firebase Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-[10px] text-amber-800 font-medium">
                  Instant fallback: Sign In with Email/Password below
                </span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          {activeTab !== "forgot" && (
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-white border border-[#1a2a40]/20 hover:bg-[#f0f4f8] text-[#1a2a40] text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1a2a40]/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-white px-2 text-[#7a8fa8]">
                    Or with Firebase Email
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#1a2a40]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forgot")}
                    className="text-[11px] text-[#0056b3] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#7a8fa8] hover:text-[#1a2a40] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#003d80] hover:bg-[#0056b3] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? "Signing In..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Demo quick fill button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("rootname@college.edu");
                    setPassword("localhost");
                  }}
                  className="text-[11px] text-[#7a8fa8] hover:text-[#0056b3] transition-colors cursor-pointer"
                >
                  Fill sample test credentials (rootname / localhost)
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SIGN UP (REGISTER) */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Full Name / Batchmate Alias *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="MrRobot"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rootname@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Create Password * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#7a8fa8] hover:text-[#1a2a40] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-[#1a2a40] mb-1">
                    Department
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] outline-none bg-white"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1a2a40] mb-1">
                    Batch Year
                  </label>
                  <select
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] outline-none bg-white"
                  >
                    <option value="2025">Class of 2025</option>
                    <option value="2024">Class of 2024</option>
                    <option value="2026">Class of 2026</option>
                    <option value="Faculty">Faculty / Staff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Senior Farewell Quote / Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Library sunsets, canteen chai, and memories that last a lifetime..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] focus:ring-1 focus:ring-[#003d80] outline-none"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1.5">
                  Pick Ghibli Avatar
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GHIBLI_AVATARS.map((av) => (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => setSelectedAvatar(av.url)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer ${
                        selectedAvatar === av.url
                          ? "border-[#003d80] scale-105 shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5">
                        {av.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-linear-to-r from-[#003d80] to-[#0056b3] hover:brightness-110 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{loading ? "Registering in Firebase..." : "Create Account & Store Data"}</span>
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-[#4a5e7a]">
                Enter your registered college email and Firebase will send you a secure link to reset your password.
              </p>

              <div>
                <label className="block text-xs font-semibold text-[#1a2a40] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7a8fa8] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#1a2a40]/20 rounded-xl focus:border-[#003d80] outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-[#1a2a40] text-xs font-medium rounded-xl cursor-pointer"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-[#003d80] hover:bg-[#0056b3] text-white text-xs font-medium rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="bg-[#f0f4f8] px-5 py-3 border-t border-[#1a2a40]/10 flex items-center justify-between text-[11px] text-[#7a8fa8]">
          <span>Firebase Auth & Firestore persistent storage</span>
          <span className="font-mono">SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
};
