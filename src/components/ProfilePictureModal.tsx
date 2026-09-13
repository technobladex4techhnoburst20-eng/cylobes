import React, { useState, useRef } from "react";
import { User } from "../types";
import { api, authStorage } from "../services/api";
import { Camera, Upload, Check, X, Sparkles, Image as ImageIcon, UserCheck } from "lucide-react";

interface ProfilePictureModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  {
    name: "Shizuku (Whisper)",
    url: "https://www.ghibli.jp/gallery/mimi025.jpg",
  },
  {
    name: "Seiji (Luthier)",
    url: "https://www.ghibli.jp/gallery/mimi038.jpg",
  },
  {
    name: "Howl (Wizard)",
    url: "https://www.ghibli.jp/gallery/howl005.jpg",
  },
  {
    name: "Sophie (Hatmaker)",
    url: "https://www.ghibli.jp/gallery/howl017.jpg",
  },
  {
    name: "Chihiro (Spirit)",
    url: "https://www.ghibli.jp/gallery/chihiro001.jpg",
  },
  {
    name: "Haku (River Spirit)",
    url: "https://www.ghibli.jp/gallery/chihiro018.jpg",
  },
  {
    name: "Umi (Flags)",
    url: "https://www.ghibli.jp/gallery/kokurikozaka005.jpg",
  },
  {
    name: "Shun (Editor)",
    url: "https://www.ghibli.jp/gallery/kokurikozaka012.jpg",
  },
];

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || PRESET_AVATARS[0].url);
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose a valid photo file (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser) {
      alert("Please log in or create an account first to update your profile photo.");
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateProfile({ avatar: selectedAvatar });
      onUpdated(updated);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile picture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#1a2a40]/15 max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7a8fa8] hover:text-[#1a2a40] hover:bg-[#f0f4f8] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5">
          <span className="text-[11px] font-semibold text-[#0056b3] uppercase tracking-widest">
            Identity & Avatar · ಪ್ರೊಫೈಲ್ ಚಿತ್ರ
          </span>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-semibold text-[#1a2a40]">
            Profile Picture Studio
          </h2>
          <p className="text-xs text-[#7a8fa8]">
            Upload your graduation photo, choose a batch avatar, or upload any custom photo.
          </p>
        </div>

        {/* Current Active Preview */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-[#003d80]/20 shadow-md bg-[#f0f4f8]">
              <img
                src={selectedAvatar}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-[#003d80] text-white rounded-full shadow-lg hover:bg-[#0056b3] transition-colors cursor-pointer"
              title="Upload new photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm font-semibold text-[#1a2a40] block">
              {currentUser?.name || "Student Profile"}
            </span>
            <span className="text-xs text-[#7a8fa8]">
              @{currentUser?.username || "guest"} &bull; {currentUser?.branch || "College Batch"}
            </span>
          </div>
        </div>

        {/* Upload Custom Photo Option */}
        <div className="space-y-3 pt-2 border-t border-[#1a2a40]/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1a2a40]">Upload Custom Picture</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4f8] hover:bg-[#003d80]/10 text-[#003d80] rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Browse Device Photos</span>
            </button>
          </div>

          {/* Or Paste URL */}
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Or paste an image web URL..."
              className="flex-1 text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
            />
            <button
              type="button"
              onClick={() => {
                if (customUrl.trim()) {
                  setSelectedAvatar(customUrl.trim());
                  setCustomUrl("");
                }
              }}
              className="px-3 py-2 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Choose From Curated Batch Avatars */}
        <div className="space-y-2.5 pt-2 border-t border-[#1a2a40]/10">
          <span className="text-xs font-semibold text-[#1a2a40] block">
            Select from Batch Style Avatars
          </span>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_AVATARS.map((av, idx) => {
              const isSelected = selectedAvatar === av.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative p-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 group cursor-pointer ${
                    isSelected
                      ? "border-[#003d80] bg-[#f0f4f8] shadow-sm"
                      : "border-transparent hover:border-[#1a2a40]/20"
                  }`}
                >
                  <img
                    src={av.url}
                    alt={av.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="text-[10px] text-[#4a5e7a] text-center font-medium line-clamp-1">
                    {av.name.split(" ")[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-[#003d80] text-white rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[#1a2a40]/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#4a5e7a] hover:bg-[#f0f4f8] rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003d80] text-white text-xs font-semibold rounded-xl hover:bg-[#0056b3] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {successMsg ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Profile Photo Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{saving ? "Updating..." : "Save as My Profile Picture"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
