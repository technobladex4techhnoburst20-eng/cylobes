import React, { useState, useEffect, useRef } from "react";
import { AppSection, User } from "./types";
import { api, authStorage } from "./services/api";
import { Navigation } from "./components/Navigation";
import { HomeSection } from "./components/HomeSection";
import { NotesSection } from "./components/NotesSection";
import { ChatsSection } from "./components/ChatsSection";
import { YearbookSection } from "./components/YearbookSection";
import { MediaSection } from "./components/MediaSection";
import { AdminSection } from "./components/AdminSection";
import { ApiExplorerSection } from "./components/ApiExplorerSection";
import { StandaloneSection } from "./components/StandaloneSection";
import { ProfilePictureModal } from "./components/ProfilePictureModal";
import { BirthdayBanner } from "./components/BirthdayBanner";
import { MusicPlayer } from "./components/MusicPlayer";
import { FallingPetals3D } from "./components/FallingPetals3D";
import { GeminiChatbot } from "./components/GeminiChatbot";
import { AuthModal } from "./components/AuthModal";
import { AuthProvider, useAuth } from "./firebase/AuthContext";
import { GraduationCap, Heart, Image as ImageIcon, Trash2 } from "lucide-react";

function AppContent() {
  const [currentSection, setCurrentSection] = useState<AppSection>("home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signin");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("appTheme") === "dark";
  });
  const { studentUser } = useAuth();
  
  const [bgImage, setBgImage] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Initialize and verify JWT session on mount
  useEffect(() => {
    localStorage.setItem("appTheme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    // Check if token exists in localStorage
    const savedUser = authStorage.getUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    // Verify token with backend
    api.getMe().then((verifiedUser) => {
      if (verifiedUser) {
        setCurrentUser(verifiedUser);
      }
    });

    // Load custom background from localStorage
    const savedBg = localStorage.getItem("customAppBackground");
    if (savedBg) {
      setBgImage(savedBg);
    }
  }, []);

  const handleLogout = () => {
    authStorage.removeToken();
    setCurrentUser(null);
  };

  const handleOpenAuth = (tab?: "signin" | "signup") => {
    setAuthModalTab(tab || "signin");
    setIsAuthModalOpen(true);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Resize image to prevent localStorage quota issues
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setBgImage(dataUrl);
          try {
            localStorage.setItem("customAppBackground", dataUrl);
          } catch (err) {
            console.warn("Could not save background to localStorage (quota exceeded)", err);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const clearBg = () => {
    setBgImage(null);
    localStorage.removeItem("customAppBackground");
  };

  const effectiveUser = studentUser || currentUser;

  return (
    <div 
      className={`min-h-screen flex flex-col font-['Inter',sans-serif] selection:bg-[#003d80] selection:text-white transition-colors duration-500 ${
        isDarkMode ? "bg-[#0b1120] text-slate-100 dark" : "text-[#1a2a40]"
      }`}
      style={{
        backgroundColor: bgImage ? "transparent" : isDarkMode ? "#0b1120" : "#f0f4f8",
        backgroundImage: bgImage ? `url(${bgImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* Background Overlay to ensure readability */}
      {bgImage && <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] pointer-events-none z-[0]"></div>}

      <div className="z-10 relative flex flex-col flex-1">
        {/* Top Sticky Navigation */}
        <Navigation
          currentSection={currentSection}
          onNavigate={(sec) => setCurrentSection(sec)}
          currentUser={effectiveUser as any}
          onLogout={handleLogout}
          onOpenAuth={handleOpenAuth}
          onOpenProfilePic={() => setIsProfilePicModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
        <BirthdayBanner />

        {/* Main Content View with Dynamic Routing */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative">
          {currentSection === "home" && (
            <HomeSection onNavigate={(sec) => setCurrentSection(sec)} />
          )}

        {currentSection === "gemini-chat" && <GeminiChatbot />}

        {currentSection === "notes" && (
          <NotesSection
            currentUser={effectiveUser as any}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentSection === "chats" && (
          <ChatsSection
            currentUser={effectiveUser as any}
            setCurrentUser={setCurrentUser}
            onOpenProfilePic={() => setIsProfilePicModalOpen(true)}
          />
        )}

        {currentSection === "yearbook" && (
          <YearbookSection
            currentUser={effectiveUser as any}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentSection === "media" && (
          <MediaSection
            currentUser={effectiveUser as any}
            onOpenProfilePic={() => setIsProfilePicModalOpen(true)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {currentSection === "admin" && <AdminSection />}

        {currentSection === "api-docs" && <ApiExplorerSection />}

        {currentSection === "standalone" && <StandaloneSection />}
      </main>

      {/* Profile Picture Studio Modal */}
      <ProfilePictureModal
        currentUser={effectiveUser as any}
        isOpen={isProfilePicModalOpen}
        onClose={() => setIsProfilePicModalOpen(false)}
        onUpdated={(updatedUser) => setCurrentUser(updatedUser)}
      />

      {/* Firebase Sign In & Sign Up / Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Persistent Audio Melodic Player */}
      <MusicPlayer />

      {/* Change Background Floating Button */}
      <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2">
        <button
          onClick={() => bgInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md border border-[#1a2a40]/15 rounded-full shadow-lg text-xs font-medium text-[#1a2a40] hover:bg-[#003d80] hover:text-white transition-colors cursor-pointer"
          title="Change Background Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Set Background</span>
        </button>
        {bgImage && (
          <button
            onClick={clearBg}
            className="flex items-center gap-1.5 p-2 bg-white/90 backdrop-blur-md border border-red-200 rounded-full shadow-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Remove Background"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={bgInputRef}
          onChange={handleBgUpload}
          className="hidden"
        />
      </div>

      {/* 3D Falling Petals effect across all pages */}
      <FallingPetals3D />

      {/* Footer */}
      <footer className="border-t border-[#1a2a40]/10 bg-white/60 backdrop-blur-md py-8 text-center text-xs text-[#7a8fa8] z-10 relative">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#003d80]" />
            <span className="font-['Cormorant_Garamond',serif] text-base font-semibold text-[#1a2a40]">
              College Memories · Batch 2024–2025
            </span>
          </div>

          <p className="font-['Noto_Sans_Kannada',sans-serif] text-[11px] text-[#4a5e7a]">
            ನಾವು ಅಪರಿಚಿತರಾಗಿ ಬಂದೆವು, ಕುಟುಂಬವಾಗಿ ಬದುಕಿದೆವು, ಮತ್ತು ಎಂದಿಗೂ ಮರೆಯಲಾಗದ ಸ್ನೇಹದೊಂದಿಗೆ ನಿರ್ಗಮಿಸುತ್ತೇವೆ.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#4a5e7a] pt-1">
            <span>Firebase Auth & Firestore Cloud</span>
            <span>&bull;</span>
            <span>Google Search & Maps Grounding</span>
            <span>&bull;</span>
            <span>Made By Root</span>
            <span>&bull;</span>
            <span>Donars (Alok&Rahul)</span>
          </div>

          <p className="text-[10px] text-[#7a8fa8] font-mono">
            Full-Stack Digital Time Capsule &bull; All Rights Reserved
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
