import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Disc, Upload, X, Music, SkipForward, ListMusic } from "lucide-react";

interface Track {
  name: string;
  url: string;
}

const PRESET_TRACKS: Track[] = [
  { name: "Whisper of Campus Lofi", url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" },
  { name: "Golden Hour Memories", url: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg" },
  { name: "Hostel Night Breeze", url: "https://actions.google.com/sounds/v1/ambiences/night_crickets.ogg" },
  { name: "Graduation Waltz", url: "https://actions.google.com/sounds/v1/relax/meditation_bell.ogg" },
];

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>(PRESET_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTrack = playlist[currentIndex] || playlist[0];

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
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
  }, [isPlaying, currentIndex, playlist]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newTracks: Track[] = (Array.from(files) as File[]).map((file) => ({
        name: file.name.replace(/\.[^/.]+$/, ""),
        url: URL.createObjectURL(file),
      }));
      setPlaylist((prev) => [...newTracks, ...prev]);
      setCurrentIndex(0);
      setIsPlaying(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 bg-white/90 backdrop-blur-md border border-[#1a2a40]/15 px-3 py-2 rounded-full shadow-lg flex items-center gap-3 transition-all hover:scale-102">
        <audio
          ref={audioRef}
          src={currentTrack.url}
          loop
          onEnded={() => setCurrentIndex((prev) => (prev + 1) % playlist.length)}
          style={{ display: 'none' }}
        />
        
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-[#003d80] text-white flex items-center justify-center hover:bg-[#0056b3] transition-colors cursor-pointer shadow-xs"
          title={isPlaying ? "Pause Music" : "Play Music"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        <div 
          onClick={() => setShowPlaylistModal(true)}
          className="hidden sm:flex items-center gap-2 pr-2 cursor-pointer group"
          title="Click to switch songs / playlist"
        >
          <Disc
            className={`w-4 h-4 text-[#003d80] ${
              isPlaying ? "animate-spin [animation-duration:4s]" : ""
            }`}
          />
          <div className="text-left min-w-[120px] max-w-[180px]">
            <span className="text-[11px] font-medium text-[#1a2a40] group-hover:text-[#0056b3] block leading-none truncate">
              {currentTrack.name}
            </span>
            <span className="text-[9px] text-[#7a8fa8] leading-none block mt-1">
              {isPlaying ? "Playing · Tap to change" : "Paused · Tap to change"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-l pl-2 border-[#1a2a40]/10">
          <button
            onClick={handleNextTrack}
            className="w-7 h-7 rounded-full bg-gray-100 text-[#003d80] flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            title="Next Song"
          >
            <SkipForward className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowPlaylistModal(true)}
            className="w-7 h-7 rounded-full bg-gray-100 text-[#003d80] flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
            title="Open Playlist & Upload Music"
          >
            <ListMusic className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Playlist & Song Selector Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#1a2a40]/15 space-y-5 relative">
            <button
              onClick={() => setShowPlaylistModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-[#7a8fa8] hover:text-[#1a2a40] hover:bg-[#f0f4f8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="text-[11px] font-semibold text-[#0056b3] uppercase tracking-widest">
                Campus Atmosphere & Music
              </span>
              <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
                Choose or Upload Songs
              </h3>
              <p className="text-xs text-[#7a8fa8]">
                Switch between multiple curated relaxing sounds or upload your own audio tracks anytime.
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {playlist.map((track, idx) => {
                const isSelected = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPlaying(true);
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#003d80]/10 border-[#003d80] text-[#003d80] font-semibold"
                        : "bg-[#f0f4f8] border-transparent hover:bg-gray-100 text-[#1a2a40]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Music className={`w-4 h-4 ${isSelected ? "text-[#003d80]" : "text-[#7a8fa8]"}`} />
                      <span className="text-xs">{track.name}</span>
                    </div>
                    {isSelected && isPlaying && (
                      <span className="text-[10px] bg-[#003d80] text-white px-2 py-0.5 rounded-full font-medium">
                        Playing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#1a2a40]/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#003d80] text-white text-xs font-semibold rounded-xl hover:bg-[#0056b3] transition-colors shadow-sm cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Custom Audio File (.mp3/.wav)</span>
              </button>
              <input
                type="file"
                accept="audio/*"
                multiple
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

