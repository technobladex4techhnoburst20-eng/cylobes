import React, { useState, useEffect, useRef } from "react";
import { Memory, User } from "../types";
import { api } from "../services/api";
import { useAuth } from "../firebase/AuthContext";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  Sparkles,
  Edit2,
  Check,
  X,
  Lock,
  LogIn,
} from "lucide-react";
import confetti from "canvas-confetti";

interface YearbookSectionProps {
  currentUser: User | null;
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

export const YearbookSection: React.FC<YearbookSectionProps> = ({ currentUser, onOpenAuth }) => {
  const { studentUser } = useAuth();
  const effectiveUser = studentUser || currentUser;

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form input states
  const [captionInput, setCaptionInput] = useState("");
  const [authorInput, setAuthorInput] = useState(effectiveUser?.name || "");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");

  const loadMemories = async () => {
    try {
      setLoading(true);
      const data = await api.getMemories();
      setMemories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  useEffect(() => {
    if (effectiveUser?.name) {
      setAuthorInput(effectiveUser.name);
    }
  }, [effectiveUser]);

  // Handle file select or drag drop with authentication guard
  const handleFile = (file: File) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to upload photos to the yearbook.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to upload photos.");
      return;
    }
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to upload photos.");
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Submit new photo (POST /api/memories) with authentication guard
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to upload photos to the yearbook.");
      return;
    }
    if (!previewImage) {
      alert("Please choose a photo to plant in the garden!");
      return;
    }

    try {
      setUploading(true);
      const newMemory = await api.createMemory(
        previewImage,
        captionInput.trim(),
        authorInput.trim() || undefined
      );
      setMemories([newMemory, ...memories]);
      setPreviewImage(null);
      setCaptionInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      confetti({ particleCount: 45, spread: 60 });
    } catch (err: any) {
      alert(err.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  // Delete memory (DELETE /api/memories/:id) with authentication guard
  const handleDelete = async (id: string) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to remove photos from the Yearbook.");
      return;
    }
    if (!confirm("Are you sure you want to remove this photo from the Yearbook?")) return;
    try {
      await api.deleteMemory(id);
      setMemories(memories.filter((m) => m.id !== id));
    } catch (err) {
      alert("Failed to delete memory");
    }
  };

  // Update caption (PUT /api/memories/:id) with authentication guard
  const handleSaveCaption = async (id: string) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to edit photo captions.");
      return;
    }
    try {
      const updated = await api.updateMemory(id, editCaption);
      setMemories(memories.map((m) => (m.id === id ? updated : m)));
      setEditingId(null);
    } catch (err) {
      alert("Failed to update caption");
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
          Archive 03 · ಆರ್ಕೈವ್ ೦೩
        </span>
        <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#1a2a40]">
          The Yearbook Polaroid Board
        </h1>
        <p className="font-['Noto_Sans_Kannada'] text-sm text-[#4a5e7a]">
          ನೆನಪುಗಳ ಉದ್ಯಾನ ಮತ್ತು ಸ್ಮರಣೀಯ ಛಾಯಾಚಿತ್ರಗಳು
        </p>
      </div>

      {/* Upload Component (Drag & Drop + File Select) */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#1a2a40]/10 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-[#003d80]">
          <Camera className="w-5 h-5 text-[#0056b3]" />
          <h2 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
            Plant a Photo Memory (Create Operation)
          </h2>
        </div>

        {!effectiveUser ? (
          <div className="rounded-xl border border-dashed border-[#003d80]/20 bg-linear-to-b from-[#f0f4f8] to-white p-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#003d80]/10 flex items-center justify-center text-[#003d80]">
              <Lock className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
                Sign In Required to Upload Photos
              </h3>
              <p className="text-xs text-[#4a5e7a] leading-relaxed">
                Only registered students and batchmates can post or plant memory pictures in the campus yearbook. Please sign in to share your photos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenAuth?.("signin")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#003d80] to-[#0056b3] text-white text-xs font-semibold hover:brightness-110 shadow-sm cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register to Upload Photos</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1a2a40]/20 hover:border-[#003d80] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#f0f4f8]/50 hover:bg-[#f0f4f8]"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileInputChange}
                accept="image/*"
                className="hidden"
              />
              {previewImage ? (
                <div className="space-y-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg shadow-sm object-cover"
                  />
                  <p className="text-xs text-[#0056b3] font-medium">
                    Click or drop another file to replace
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <Upload className="w-8 h-8 text-[#7a8fa8] mx-auto" />
                  <p className="text-xs font-semibold text-[#1a2a40]">
                    Drag and drop a photo here, or click to browse
                  </p>
                  <p className="text-[11px] text-[#7a8fa8]">
                    Supports PNG, JPG, WEBP formats up to 10MB
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                  Batchmate / Submitter
                </label>
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="e.g. Priya Hegde"
                  className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                  Caption / Story behind the photo
                </label>
                <input
                  type="text"
                  value={captionInput}
                  onChange={(e) => setCaptionInput(e.target.value)}
                  placeholder="e.g. Canteen samosa party after 4th sem finals"
                  className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={uploading || !previewImage}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{uploading ? "Uploading Memory..." : "Pin Polaroid to Board"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Data Display: Polaroid Photo Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-3">
          <div>
            <h2 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
              Captured Moments · ನಮ್ಮ ನೆನಪುಗಳ ಆಲ್ಬಮ್ ({memories.length})
            </h2>
            <p className="text-xs text-[#7a8fa8]">
              Hover to examine notes or edit captions.
            </p>
          </div>

          <button
            onClick={() => loadMemories()}
            className="text-xs text-[#0056b3] hover:underline cursor-pointer"
          >
            Refresh Board
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-[#7a8fa8]">
            Developing polaroids...
          </div>
        ) : memories.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-[#1a2a40]/10 text-xs text-[#7a8fa8]">
            No photos pinned yet. Be the first to add one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {memories.map((mem, idx) => {
              // Alternate subtle rotation angles for classic polaroid feel
              const rotation = idx % 4 === 0 ? "-rotate-1" : idx % 4 === 1 ? "rotate-1" : idx % 4 === 2 ? "-rotate-2" : "rotate-2";

              return (
                <div
                  key={mem.id}
                  className={`bg-white p-3 pb-5 rounded-md border border-[#1a2a40]/15 shadow-md hover:shadow-xl transition-all duration-300 hover:rotate-0 hover:scale-105 group relative flex flex-col justify-between ${rotation}`}
                >
                  {/* Photo area */}
                  <div className="aspect-square overflow-hidden rounded-xs bg-[#1a2a40]/5 relative">
                    <img
                      src={mem.src}
                      alt={mem.caption || "Campus memory"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={() => handleDelete(mem.id)}
                      title="Delete Memory (DELETE)"
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Caption area */}
                  <div className="pt-3 space-y-1">
                    {editingId === mem.id ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          className="w-full text-xs p-1 border border-[#003d80] rounded"
                        />
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-gray-500 hover:text-black cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleSaveCaption(mem.id)}
                            className="p-1 text-[#003d80] hover:text-[#0056b3] cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-['Caveat',cursive] text-lg text-[#1a2a40] leading-tight">
                            {mem.caption || "Uncaptioned memory"}
                          </p>
                          <span className="text-[10px] text-[#7a8fa8] block font-mono">
                            By {mem.author || "Batchmate"} · {new Date(mem.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (!effectiveUser) {
                              onOpenAuth?.("signin");
                              alert("Sign In Required: You must sign in to edit photo captions.");
                              return;
                            }
                            setEditingId(mem.id);
                            setEditCaption(mem.caption);
                          }}
                          className="text-[#7a8fa8] hover:text-[#003d80] opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
