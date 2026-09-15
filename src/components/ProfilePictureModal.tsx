import React, { useState, useRef, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";
import { useAuth } from "../firebase/AuthContext";
import { Camera, Upload, Check, X, Sparkles, User as UserIcon, AtSign, Calendar } from "lucide-react";

interface ProfilePictureModalProps {
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedUser: User) => void;
}

const PRESET_AVATARS = [
  { name: "Shizuku (Whisper)", url: "https://www.ghibli.jp/gallery/mimi025.jpg" },
  { name: "Seiji (Luthier)", url: "https://www.ghibli.jp/gallery/mimi038.jpg" },
  { name: "Howl (Wizard)", url: "https://www.ghibli.jp/gallery/howl005.jpg" },
  { name: "Sophie (Hatmaker)", url: "https://www.ghibli.jp/gallery/howl017.jpg" },
  { name: "Chihiro (Spirit)", url: "https://www.ghibli.jp/gallery/chihiro001.jpg" },
  { name: "Haku (River Spirit)", url: "https://www.ghibli.jp/gallery/chihiro018.jpg" },
  { name: "Umi (Flags)", url: "https://www.ghibli.jp/gallery/kokurikozaka005.jpg" },
  { name: "Shun (Editor)", url: "https://www.ghibli.jp/gallery/kokurikozaka012.jpg" },
];

export const ProfilePictureModal: React.FC<ProfilePictureModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { updateProfile: updateAuthProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || PRESET_AVATARS[0].url);
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [dob, setDob] = useState(currentUser?.dob || "");
  const [customUrl, setCustomUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
      setSelectedAvatar(currentUser.avatar || PRESET_AVATARS[0].url);
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setDob(currentUser.dob || "");
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      alert("Sign In Required: Please sign in or register to set or upload a profile picture.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

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
      alert("Please log in or create an account first.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        username: username.trim(),
        dob: dob,
        avatar: selectedAvatar,
      };

      // 1. Sync update to Firebase AuthContext (Firestore users/{uid} & state)
      if (updateAuthProfile) {
        await updateAuthProfile(payload);
      }

      // 2. Sync update to backend API storage
      let updatedUser: User;
      try {
        const res = await api.updateProfile(payload);
        updatedUser = res;
      } catch {
        updatedUser = {
          ...currentUser,
          ...payload,
        } as User;
      }

      onUpdated(updatedUser);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
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
            Profile & Identity Studio · ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್ಸ್
          </span>
          <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-semibold text-[#1a2a40]">
            Edit Profile & Avatar
          </h2>
          <p className="text-xs text-[#7a8fa8]">
            Update your full name, username, birthday, and profile photo visible to everyone in campus.
          </p>
        </div>

        {/* Current Active Preview */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#003d80]/20 shadow-md bg-[#f0f4f8]">
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
        </div>

        {/* Name, Username & Birthday Fields */}
        <div className="space-y-4 pt-2 border-t border-[#1a2a40]/10">
          <div>
            <label className="block text-xs font-semibold text-[#1a2a40] mb-1">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7a8fa8]">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ananya Sharma"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a2a40] mb-1">Username (Handle)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7a8fa8]">
                <AtSign className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., ananya_cse"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1a2a40] mb-1">Birthday (Date of Birth)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7a8fa8]">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
              />
            </div>
            <p className="text-[10px] text-[#7a8fa8] mt-1">Used to alert campus friends on your birthday!</p>
          </div>
        </div>

        {/* Upload Custom Photo Option */}
        <div className="space-y-3 pt-2 border-t border-[#1a2a40]/10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1a2a40]">Profile Picture</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  alert("Sign In Required: Please sign in or register to set or upload a profile picture.");
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f0f4f8] hover:bg-[#003d80]/10 text-[#003d80] rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className="flex-1 text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
            />
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  alert("Sign In Required: Please sign in or register to set or upload a profile picture.");
                  return;
                }
                if (customUrl.trim()) {
                  setSelectedAvatar(customUrl.trim());
                  setCustomUrl("");
                }
              }}
              className="px-3 py-2 bg-[#003d80] text-white text-xs font-medium rounded-xl hover:bg-[#0056b3] cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Curated Batch Avatars */}
        <div className="space-y-2 pt-2 border-t border-[#1a2a40]/10">
          <span className="text-xs font-semibold text-[#1a2a40] block">Or Choose Batch Avatar</span>
          <div className="grid grid-cols-4 gap-2.5">
            {PRESET_AVATARS.map((av, idx) => {
              const isSelected = selectedAvatar === av.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative p-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected ? "border-[#003d80] bg-[#f0f4f8]" : "border-transparent hover:border-[#1a2a40]/20"
                  }`}
                >
                  <img src={av.url} alt={av.name} className="w-11 h-11 rounded-full object-cover" />
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
                <span>Profile Updated!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Profile Changes"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
