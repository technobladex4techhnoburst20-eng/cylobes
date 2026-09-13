import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Disc, Upload, X, Music } from "lucide-react";

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState("No Track Selected");
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (audioRef.current && customAudioUrl) {
      if (isPlaying) {
        // Adding a small timeout ensures the audio element has processed the src change
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("Audio playback error:", err);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, customAudioUrl]);

  const togglePlay = () => {
    if (customAudioUrl) {
      setIsPlaying(!isPlaying);
    } else {
      // If no track is loaded, clicking play opens the file picker
      fileInputRef.current?.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomAudioUrl(url);
      setTrackName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      setIsPlaying(true); // Auto-play the new track
    }
  };

  const clearCustomMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (customAudioUrl) {
      URL.revokeObjectURL(customAudioUrl);
    }
    setCustomAudioUrl(null);
    setTrackName("No Track Selected");
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-md border border-[#1a2a40]/15 px-3 py-2 rounded-full shadow-lg flex items-center gap-3 transition-all hover:scale-102">
      {/* Always render audio to keep the ref intact */}
      <audio
        ref={audioRef}
        src={customAudioUrl || undefined}
        loop
        onEnded={() => setIsPlaying(false)}
        style={{ display: 'none' }}
      />
      
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-[#003d80] text-white flex items-center justify-center hover:bg-[#0056b3] transition-colors cursor-pointer shadow-xs"
        title={isPlaying ? "Pause Music" : customAudioUrl ? "Play Music" : "Upload Music"}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : customAudioUrl ? (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        ) : (
          <Music className="w-3.5 h-3.5" />
        )}
      </button>

      <div className="hidden sm:flex items-center gap-2 pr-2">
        <Disc
          className={`w-4 h-4 text-[#003d80] ${
            isPlaying ? "animate-spin [animation-duration:4s]" : ""
          }`}
        />
        <div className="text-left min-w-[120px] max-w-[200px]">
          <span className="text-[11px] font-medium text-[#1a2a40] block leading-none truncate">
            {trackName}
          </span>
          <span className="text-[9px] text-[#7a8fa8] leading-none block mt-1">
            {customAudioUrl ? (isPlaying ? "Now Playing" : "Paused") : "Click to upload a song"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-l pl-2 border-[#1a2a40]/10">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-7 h-7 rounded-full bg-gray-100 text-[#003d80] flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
          title="Add your own music"
        >
          <Upload className="w-3 h-3" />
        </button>
        {customAudioUrl && (
          <button
            onClick={clearCustomMusic}
            className="w-7 h-7 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer"
            title="Remove custom music"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};
