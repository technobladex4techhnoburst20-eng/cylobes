import React from "react";
import { AppSection, User } from "../types";
import { authStorage } from "../services/api";
import {
  GraduationCap,
  BookOpen,
  MessageSquare,
  Image,
  ShieldAlert,
  Code2,
  LogOut,
  UserCheck,
  Bot,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../firebase/AuthContext";

interface NavigationProps {
  currentSection: AppSection;
  onNavigate: (section: AppSection) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: (tab?: "signin" | "signup") => void;
  onOpenProfilePic: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentSection,
  onNavigate,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenProfilePic,
}) => {
  const { firebaseUser, studentUser, signInWithGoogle, logout: firebaseLogout } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn("Google sign in note:", err);
      onOpenAuth("signin");
    }
  };

  const activeUser = studentUser || currentUser;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f0f4f8]/90 backdrop-blur-md border-b border-[#1a2a40]/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#003d80] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Cormorant_Garamond',serif] text-xl font-semibold tracking-tight text-[#003d80]">
                College Memories
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#0056b3]/10 text-[#003d80]">
                24–25
              </span>
            </div>
            <span className="hidden sm:block text-[10px] text-[#4a5e7a] font-['Noto_Sans_Kannada',sans-serif]">
              ಡಿಜಿಟಲ್ ಟೈಮ್ ಕ್ಯಾಪ್ಸೂಲ್
            </span>
          </div>
        </button>

        {/* Section Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onNavigate("home")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "home"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span>Home</span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ಮುಖಪುಟ</span>
          </button>

          {/* Gemini AI Tab */}
          <button
            onClick={() => onNavigate("gemini-chat")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer relative ${
              currentSection === "gemini-chat"
                ? "text-[#003d80] bg-[#0056b3]/15 font-bold shadow-2xs"
                : "text-[#0056b3] hover:bg-[#0056b3]/10"
            }`}
          >
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-[#d97706]" />
              <span>Gemini AI</span>
            </span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-80 normal-case text-amber-700">ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ</span>
          </button>

          <button
            onClick={() => onNavigate("notes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "notes"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span>Campus Notes</span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ಕ್ಯಾಂಪಸ್ ಟಿಪ್ಪಣಿಗಳು</span>
          </button>

          <button
            onClick={() => onNavigate("chats")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "chats"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span>Night Chats</span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ರಾತ್ರಿ ಚಾಟ್</span>
          </button>

          <button
            onClick={() => onNavigate("yearbook")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "yearbook"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span>Yearbook</span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ಸ್ಮರಣಿಕೆ</span>
          </button>

          <button
            onClick={() => onNavigate("media")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "media"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span className="flex items-center gap-1">
              <span>Reels & Videos</span>
            </span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ರೀಲ್ಸ್ ಮತ್ತು ವೀಡಿಯೊ</span>
          </button>

          <button
            onClick={() => onNavigate("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex flex-col items-center cursor-pointer ${
              currentSection === "admin"
                ? "text-[#003d80] bg-[#0056b3]/10 font-semibold"
                : "text-[#4a5e7a] hover:text-[#003d80] hover:bg-black/5"
            }`}
          >
            <span>Admin</span>
            <span className="text-[9px] font-['Noto_Sans_Kannada'] opacity-70 normal-case">ಮಾಡರೇಶನ್</span>
          </button>
        </nav>

        {/* User Auth Action & Standalone View */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeUser ? (
            <div className="flex items-center gap-2 bg-white/80 border border-[#1a2a40]/10 px-2.5 py-1 rounded-full shadow-xs">
              <button
                onClick={onOpenProfilePic}
                title="Click to edit/upload Profile Picture"
                className="relative group cursor-pointer"
              >
                {activeUser.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-[#003d80]/30 group-hover:ring-[#003d80] transition-all"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#003d80] text-white text-xs font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-[#003d80] text-white p-0.5 rounded-full text-[8px] leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                  📷
                </span>
              </button>

              <div
                onClick={onOpenProfilePic}
                className="hidden sm:block text-left pr-1 cursor-pointer hover:opacity-80 transition-opacity"
                title="Click to change profile picture or details"
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-[#1a2a40] block leading-none">
                    {activeUser.name}
                  </span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                    Firebase
                  </span>
                </div>
                <span className="text-[9px] font-mono text-[#0056b3] leading-none">
                  {activeUser.branch || "Class of 2025"} &bull; Synced
                </span>
              </div>
              <button
                onClick={() => {
                  firebaseLogout();
                  onLogout();
                }}
                title="Log out"
                className="text-[#7a8fa8] hover:text-red-600 transition-colors p-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth("signin")}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#1a2a40] hover:bg-white/80 border border-[#1a2a40]/15 transition-all shadow-2xs cursor-pointer"
                title="Sign in with Email & Password"
              >
                Sign In
              </button>

              <button
                onClick={() => onOpenAuth("signup")}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#003d80] hover:bg-[#0056b3] transition-all shadow-xs cursor-pointer"
                title="Create a new student account"
              >
                Sign Up
              </button>

              <button
                onClick={handleGoogleLogin}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#1a2a40]/20 text-[#1a2a40] hover:bg-gray-50 transition-all shadow-xs cursor-pointer"
                title="Sign in securely with Google and Firebase"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>
            </div>
          )}

          {/* Quick link to Original Standalone Pages */}
          <button
            onClick={() => onNavigate("standalone")}
            className={`hidden lg:inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md border border-[#1a2a40]/15 transition-colors cursor-pointer ${
              currentSection === "standalone"
                ? "bg-[#003d80] text-white border-transparent"
                : "text-[#4a5e7a] hover:bg-white"
            }`}
            title="View original standalone HTML templates"
          >
            <span>Standalone HTML</span>
          </button>
        </div>
      </div>

      {/* Mobile Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-[#1a2a40]/10 py-1.5 bg-[#f0f4f8] overflow-x-auto">
        <button
          onClick={() => onNavigate("home")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "home" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Home
        </button>
        <button
          onClick={() => onNavigate("gemini-chat")}
          className={`px-2 py-1 text-[11px] font-bold ${currentSection === "gemini-chat" ? "text-[#003d80]" : "text-[#0056b3]"}`}
        >
          ✨ Gemini AI
        </button>
        <button
          onClick={() => onNavigate("notes")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "notes" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Notes
        </button>
        <button
          onClick={() => onNavigate("chats")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "chats" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Chats
        </button>
        <button
          onClick={() => onNavigate("yearbook")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "yearbook" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Yearbook
        </button>
        <button
          onClick={() => onNavigate("media")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "media" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Reels
        </button>
        <button
          onClick={() => onNavigate("admin")}
          className={`px-2 py-1 text-[11px] font-medium ${currentSection === "admin" ? "text-[#003d80] font-bold" : "text-[#4a5e7a]"}`}
        >
          Admin
        </button>
      </div>
    </header>
  );
};
