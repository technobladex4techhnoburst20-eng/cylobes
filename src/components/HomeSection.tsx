import React, { useState, useEffect } from "react";
import { AppSection } from "../types";
import { api } from "../services/api";
import { RealisticTreeBackground } from "./RealisticTreeBackground";
import { Clock, BookOpen, MessageCircle, Camera, ShieldCheck, Heart, Sparkles, ArrowRight, Wind } from "lucide-react";

interface HomeSectionProps {
  onNavigate: (section: AppSection) => void;
}

const COUNTDOWN_STORAGE_KEY = "campus_convocation_countdown_target";

function getOrInitTargetTime(): number {
  try {
    const stored = localStorage.getItem(COUNTDOWN_STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (!isNaN(parsed) && parsed > Date.now()) {
        return parsed;
      }
    }
  } catch (e) {}

  // 260 days + 10 hours + 45 minutes + 30 seconds
  const totalMs = (260 * 24 * 3600 + 10 * 3600 + 45 * 60 + 30) * 1000;
  const newTarget = Date.now() + totalMs;
  try {
    localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(newTarget));
  } catch (e) {}
  return newTarget;
}

function calculateRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    days: String(d),
    hours: String(h).padStart(2, "0"),
    mins: String(m).padStart(2, "0"),
    secs: String(s).padStart(2, "0"),
  };
}

export const HomeSection: React.FC<HomeSectionProps> = ({ onNavigate }) => {
  const [targetTime] = useState<number>(() => getOrInitTargetTime());
  const [timeLeft, setTimeLeft] = useState(() => calculateRemaining(getOrInitTargetTime()));
  const [stats, setStats] = useState<{
    quotesCount: number;
    publicMsgsCount: number;
    memoriesCount: number;
    usersCount: number;
  }>({
    quotesCount: 3,
    publicMsgsCount: 3,
    memoriesCount: 3,
    usersCount: 2,
  });

  useEffect(() => {
    // Fetch live counts from Node.js Express backend
    api.getAdminStats().then((data) => {
      if (data) setStats(data);
    }).catch(() => {});

    // Active live ticking countdown
    const timer = setInterval(() => {
      setTimeLeft(calculateRemaining(targetTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section with Realistic Seasonal Tree Background */}
      <section className="relative overflow-hidden rounded-3xl border border-[#1a2a40]/15 bg-gradient-to-b from-[#e3eaf3]/70 via-[#f0f4f8]/80 to-[#f0f4f8] p-8 sm:p-14 lg:p-20 text-center shadow-md">
        {/* Realistic Living Tree Backdrop with Leaves Falling Over Days */}
        <RealisticTreeBackground
          daysRemaining={Number(timeLeft.days) || 260}
          className="absolute inset-0 z-0"
        />

        {/* Subtle radial ambient lighting */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#0056b3_1px,transparent_1px)] [background-size:24px_24px] z-0" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#003d80]/15 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0056b3]" />
            <span className="text-xs font-semibold tracking-widest uppercase text-[#003d80]">
              A Digital Time Capsule · Batch 2024–2025
            </span>
          </div>

          <h1 className="font-['Cormorant_Garamond',serif] text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-[#1a2a40] leading-none">
            The Days We <br />
            <em className="font-normal italic text-[#0056b3]">Lived Together</em>
          </h1>

          <p className="font-['Noto_Sans_Kannada',sans-serif] text-xl sm:text-2xl text-[#4a5e7a] font-normal">
            ನಾವು ಜೊತೆಯಾಗಿ ಕಳೆದ ದಿನಗಳು
          </p>

          <p className="font-['Cormorant_Garamond',serif] text-xl sm:text-2xl italic text-[#4a5e7a] max-w-2xl mx-auto leading-relaxed">
            "Four years of late submissions, endless tea breaks, whispered hostel dreams, and bonds forged in lecture halls."
          </p>

          <p className="font-['Noto_Sans_Kannada',sans-serif] text-sm text-[#7a8fa8] max-w-xl mx-auto">
            ನಾಲ್ಕು ವರ್ಷಗಳ ನಗು, ಅಧ್ಯಯನ ಮತ್ತು ಎಂದಿಗೂ ಮರೆಯಲಾಗದ ಸ್ನೇಹದ ಸುಂದರ ಪಯಣ.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate("gemini-chat")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-linear-to-r from-[#003d80] via-[#0056b3] to-[#4338ca] text-white text-sm font-semibold hover:brightness-110 transition-all shadow-md cursor-pointer ring-2 ring-white/60"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Gemini AI Companion</span>
            </button>
            <button
              onClick={() => onNavigate("notes")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#003d80] border border-[#003d80]/20 text-sm font-medium hover:bg-[#f0f4f8] transition-all shadow-xs cursor-pointer"
            >
              <span>Campus Notes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate("media")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#003d80] text-white text-sm font-medium hover:bg-[#0056b3] transition-all shadow-md cursor-pointer"
            >
              <span>Watch Reels & Videos</span>
            </button>
            <button
              onClick={() => onNavigate("chats")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#003d80] border border-[#003d80]/20 text-sm font-medium hover:bg-[#f0f4f8] transition-all shadow-xs cursor-pointer"
            >
              <span>Night Chats & Firebase</span>
            </button>
          </div>
        </div>
      </section>

      {/* Convocation Countdown Timer */}
      <section className="bg-white/70 backdrop-blur-sm rounded-2xl border border-[#1a2a40]/10 p-8 sm:p-10 text-center shadow-xs">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
            <Clock className="w-4 h-4" />
            <span>Until We Walk The Stage · ಘಟಿಕೋತ್ಸವದ ಕ್ಷಣಗಣನೆ</span>
          </div>

          <h2 className="font-['Cormorant_Garamond',serif] text-3xl sm:text-4xl text-[#1a2a40] font-medium">
            Convocation Day · ಪದವಿ ಪ್ರದಾನ ಸಮಾರಂಭ
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-4 max-w-lg mx-auto">
            <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#1a2a40]/5">
              <span className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#003d80] block">
                {timeLeft.days}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#7a8fa8] font-medium">
                Days · ದಿನಗಳು
              </span>
            </div>

            <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#1a2a40]/5">
              <span className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#003d80] block">
                {timeLeft.hours}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#7a8fa8] font-medium">
                Hours · ಗಂಟೆಗಳು
              </span>
            </div>

            <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#1a2a40]/5">
              <span className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#003d80] block">
                {timeLeft.mins}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#7a8fa8] font-medium">
                Mins · ನಿಮಿಷಗಳು
              </span>
            </div>

            <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#1a2a40]/5">
              <span className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#003d80] block">
                {timeLeft.secs}
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#7a8fa8] font-medium">
                Secs · ಸೆಕೆಂಡುಗಳು
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Archive Feature Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
            Explore Our Archives · ನಮ್ಮ ನೆನಪುಗಳ ಖಜಾನೆ
          </span>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl sm:text-4xl text-[#1a2a40] font-medium">
            Every Moment Preserved in Full-Stack
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Notes */}
          <div
            onClick={() => onNavigate("notes")}
            className="group bg-white rounded-2xl border border-[#1a2a40]/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
          >
            <div className="relative aspect-video overflow-hidden bg-[#e8dfd2]">
              <img
                src="https://www.ghibli.jp/gallery/mimi014.jpg"
                alt="Notes - Whisper of the Heart"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#003d80]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                01 / ARCHIVE
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Campus Notes
                </h3>
                <span className="font-['Noto_Sans_Kannada'] text-xs text-[#4a5e7a] block">
                  ಕ್ಯಾಂಪಸ್ ಟಿಪ್ಪಣಿಗಳು
                </span>
                <p className="text-xs text-[#4a5e7a] mt-2 leading-relaxed">
                  Interactive dorm letters with unfolding envelopes, plus our Wall of Thoughts featuring full RESTful CRUD operations.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-[#003d80] font-medium">
                <span>{stats.quotesCount} quotes shared</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Chats */}
          <div
            onClick={() => onNavigate("chats")}
            className="group bg-white rounded-2xl border border-[#1a2a40]/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
          >
            <div className="relative aspect-video overflow-hidden bg-[#1a2a40]">
              <img
                src="https://www.ghibli.jp/gallery/mimi045.jpg"
                alt="Chats - Whisper of the Heart Sunset"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute top-3 left-3 bg-[#0056b3]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                02 / ARCHIVE
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Night Chats
                </h3>
                <span className="font-['Noto_Sans_Kannada'] text-xs text-[#4a5e7a] block">
                  ರಾತ್ರಿ ಚಾಟ್ (JWT Auth)
                </span>
                <p className="text-xs text-[#4a5e7a] mt-2 leading-relaxed">
                  JWT registration & login, late night rooftop talks, anonymous confessions, profile bios, and classmate search.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-[#003d80] font-medium">
                <span>{stats.publicMsgsCount} public whispers</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 3: Yearbook */}
          <div
            onClick={() => onNavigate("yearbook")}
            className="group bg-white rounded-2xl border border-[#1a2a40]/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
          >
            <div className="relative aspect-video overflow-hidden bg-[#8a9a7b]">
              <img
                src="https://www.ghibli.jp/gallery/kokurikozaka022.jpg"
                alt="Yearbook - From Up on Poppy Hill Gathering"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-[#6b7a5e]/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                03 / ARCHIVE
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  The Yearbook
                </h3>
                <span className="font-['Noto_Sans_Kannada'] text-xs text-[#4a5e7a] block">
                  ಸ್ಮರಣಿಕೆ
                </span>
                <p className="text-xs text-[#4a5e7a] mt-2 leading-relaxed">
                  Collaborative Polaroid memory board with drag-and-drop file upload, custom captions, and memory archiving.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-[#003d80] font-medium">
                <span>{stats.memoriesCount} photos planted</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 4: Reels, Videos & Photos */}
          <div
            onClick={() => onNavigate("media")}
            className="group bg-white rounded-2xl border border-[#1a2a40]/10 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
          >
            <div className="relative aspect-video overflow-hidden bg-[#1a2a40]">
              <img
                src="https://www.ghibli.jp/gallery/howl015.jpg"
                alt="Reels and Videos - Howl's Moving Castle"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                04 / REELS & VIDEOS
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                  Reels & Cinema
                </h3>
                <span className="font-['Noto_Sans_Kannada'] text-xs text-[#4a5e7a] block">
                  ರೀಲ್ಸ್, ವೀಡಿಯೊಗಳು ಮತ್ತು ಭಾವಚಿತ್ರಗಳು
                </span>
                <p className="text-xs text-[#4a5e7a] mt-2 leading-relaxed">
                  Publicly streamable shorts, batch reels with sound, live recording studio, comments & like reactions.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between text-xs text-[#003d80] font-medium">
                <span className="text-red-600 font-semibold">Public feed for all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class Vow & Manifesto */}
      <section className="bg-[#e3eaf3] rounded-2xl p-8 sm:p-12 text-center border border-[#1a2a40]/10">
        <div className="max-w-2xl mx-auto space-y-4">
          <Heart className="w-6 h-6 text-[#a05a46] mx-auto opacity-80" />
          <p className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl italic text-[#1a2a40] leading-snug">
            "We came as strangers, lived as a family, and leave as legends carrying each other's memories forever."
          </p>
          <p className="font-['Noto_Sans_Kannada'] text-sm text-[#4a5e7a] leading-relaxed">
            "ನಾವು ಅಪರಿಚಿತರಾಗಿ ಬಂದೆವು, ಕುಟುಂಬವಾಗಿ ಬದುಕಿದೆವು, ಮತ್ತು ಒಬ್ಬರನ್ನೊಬ್ಬರು ನೆನಪಿಸಿಕೊಳ್ಳುತ್ತಾ ಇತಿಹಾಸವಾಗಿ ನಿರ್ಗಮಿಸುತ್ತೇವೆ."
          </p>
          <div className="font-['Caveat',cursive] text-2xl text-[#003d80] pt-2">
            — Class of 2025 · Batch 2024–2025
          </div>
        </div>
      </section>
    </div>
  );
};
