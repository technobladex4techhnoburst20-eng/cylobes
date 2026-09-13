import React, { useState } from "react";
import { ExternalLink, Layers, Monitor, Smartphone, RefreshCw } from "lucide-react";

interface StandalonePage {
  title: string;
  subtitle: string;
  path: string;
  description: string;
}

const PAGES: StandalonePage[] = [
  {
    title: "Classic Home",
    subtitle: "ಮುಖಪುಟ",
    path: "/classic-home.html",
    description: "Classic landing page with 3D Three.js canvas and PWA service worker integration.",
  },
  {
    title: "Campus Notes (Letters)",
    subtitle: "ಕ್ಯಾಂಪಸ್ ಟಿಪ್ಪಣಿಗಳು",
    path: "/letters.html",
    description: "Interactive folding letter envelopes with 3D CSS and local thought wall.",
  },
  {
    title: "Night Chats (Sky)",
    subtitle: "ರಾತ್ರಿ ಚಾಟ್",
    path: "/sky.html",
    description: "Starlit rooftop chat with guest/member modes and anonymous confession stars.",
  },
  {
    title: "The Yearbook (Garden)",
    subtitle: "ಸ್ಮರಣಿಕೆ",
    path: "/garden.html",
    description: "Yearbook photo gallery with IndexedDB reel recording and confetti effects.",
  },
  {
    title: "Admin Panel",
    subtitle: "ಮಾಡರೇಶನ್",
    path: "/admin.html",
    description: "Original standalone administration panel with local moderation counters.",
  },
];

export const StandaloneSection: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState(PAGES[0].path);
  const [iframeKey, setIframeKey] = useState(0);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
          Standalone PWA Templates · ಸ್ವತಂತ್ರ ಕಡತಗಳು
        </span>
        <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#1a2a40]">
          Original Static HTML Documents
        </h1>
        <p className="text-xs text-[#4a5e7a]">
          Your standalone HTML, CSS, Three.js, and Service Worker assets preserved verbatim in <code className="bg-gray-100 px-1 py-0.5 rounded text-[#003d80]">/public</code>.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PAGES.map((page) => {
          const isActive = selectedPath === page.path;
          return (
            <button
              key={page.path}
              onClick={() => setSelectedPath(page.path)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[#003d80] text-white shadow-xs"
                  : "bg-white text-[#4a5e7a] border border-[#1a2a40]/10 hover:bg-[#f0f4f8]"
              }`}
            >
              <span>{page.title}</span>
              <span className="text-[10px] opacity-70 ml-1.5 font-['Noto_Sans_Kannada']">
                {page.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Frame Preview Container */}
      <div className="bg-white rounded-2xl border border-[#1a2a40]/10 overflow-hidden shadow-xs">
        {/* Frame Action Bar */}
        <div className="bg-[#f0f4f8] border-b border-[#1a2a40]/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#003d80] font-semibold">
              {selectedPath}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="text-xs text-[#4a5e7a] hover:text-[#003d80] inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reload Frame</span>
            </button>
            <a
              href={selectedPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#003d80] font-medium hover:underline"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Live Iframe */}
        <div className="w-full h-[650px] bg-white">
          <iframe
            key={iframeKey}
            src={selectedPath}
            title="Standalone Preview"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
