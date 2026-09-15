import React, { useState, useEffect, useRef } from "react";
import { MediaItem, MediaComment, User } from "../types";
import { api } from "../services/api";
import {
  Video,
  Film,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  Upload,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Plus,
  Trash2,
  Send,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Disc,
  Cloud,
  Lock,
  LogIn,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../firebase/AuthContext";
import {
  subscribeToReelsAndVideos,
  addMediaToFirestore,
  toggleMediaLikeInFirestore,
  addMediaCommentToFirestore,
  deleteMediaFromFirestore,
  FirestoreMediaItem,
} from "../firebase/firestoreService";

interface MediaSectionProps {
  currentUser: User | null;
  onOpenProfilePic?: () => void;
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  currentUser,
  onOpenProfilePic,
  onOpenAuth,
}) => {
  const { studentUser } = useAuth();
  const effectiveUser = studentUser || currentUser;

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "reel" | "video" | "photo">("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"reel" | "video" | "photo">("reel");
  const [uploadSrc, setUploadSrc] = useState<string>("");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState(effectiveUser?.name || "");
  const [uploadTags, setUploadTags] = useState("#CampusMemories");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Camera Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Active Reels Viewer state (TikTok / Reels style full immersion)
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [reelPlaying, setReelPlaying] = useState(true);
  const [reelMuted, setReelMuted] = useState(false);
  const [showCommentsFor, setShowCommentsFor] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");
  const [fullscreenPhotoItem, setFullscreenPhotoItem] = useState<MediaItem | null>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await api.getMedia({
        type: activeTab !== "all" ? activeTab : undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
      });
      setMediaList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();

    // Subscribe to Firestore for real-time live reels and videos sync
    const unsubscribe = subscribeToReelsAndVideos((fsItems) => {
      const formattedItems: MediaItem[] = (fsItems || []).map((f) => {
        const comments: MediaComment[] = (f.comments || []).map((c) => ({
          id: c.id,
          author: c.author,
          text: c.text,
          createdAt: c.timestamp || Date.now(),
          authorAvatar: c.avatar,
        }));

        return {
          id: f.id,
          type: f.type,
          src: f.src,
          caption: f.caption,
          author: f.author,
          authorId: f.authorId,
          authorAvatar: f.authorAvatar,
          likes: f.likes,
          likedBy: f.likedBy || [],
          tags: f.tags,
          aspectRatio: f.type === "reel" ? "9:16" : f.type === "video" ? "16:9" : "1:1",
          createdAt: f.createdAt,
          comments: comments,
        };
      });

      // Filter by activeTab if needed
      let result = formattedItems;
      if (activeTab !== "all") {
        result = result.filter((m) => m.type === activeTab);
      }
      if (selectedTag) {
        result = result.filter((m) => m.tags?.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())));
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter((m) => m.caption.toLowerCase().includes(q) || m.author.toLowerCase().includes(q) || m.tags?.some(t => t.toLowerCase().includes(q)));
      }

      setMediaList(result);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab, selectedTag]);

  useEffect(() => {
    if (effectiveUser) {
      setUploadAuthor(effectiveUser.name);
    }
  }, [effectiveUser]);

  // Handle Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedia();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle file selection (video or photo)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to upload photos or videos.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      alert("Please upload a valid video or image file.");
      return;
    }

    if (isVideo) {
      setUploadType("reel");
    } else {
      setUploadType("photo");
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Start Live Camera Recording
  const startRecording = async () => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to record live reels.");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: true,
      });
      streamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/mp4" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadSrc(reader.result as string);
          setUploadType("reel");
        };
        reader.readAsDataURL(blob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err: any) {
      alert("Camera/microphone access failed or unavailable: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
  };

  // Submit new media
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: You must sign in to post reels, videos, or photos.");
      return;
    }

    if (!uploadSrc) {
      alert("Please provide a video or photo to upload.");
      return;
    }

    try {
      setUploading(true);
      const tagsArray = uploadTags
        .split(/[\s,]+/)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .filter((t) => t.length > 1);

      const authorName = uploadAuthor.trim() || effectiveUser?.name || "Batchmate";

      // 1. Save to Firestore (persisted in connected Firebase project)
      try {
        await addMediaToFirestore({
          type: uploadType,
          src: uploadSrc,
          caption: uploadCaption,
          author: authorName,
          authorId: effectiveUser?.id || "anon",
          authorAvatar: effectiveUser?.avatar || "https://www.ghibli.jp/gallery/howl005.jpg",
          likes: 0,
          likedBy: [],
          tags: tagsArray,
          comments: [],
        });
      } catch (fsErr) {
        console.warn("Firestore media write note:", fsErr);
      }

      // 2. Also register with API backend for instant state & local storage
      const newItem = await api.createMedia({
        type: uploadType,
        src: uploadSrc,
        caption: uploadCaption,
        author: authorName,
        aspectRatio: uploadType === "reel" ? "9:16" : uploadType === "video" ? "16:9" : "1:1",
        tags: tagsArray,
      });

      setMediaList((prev) => [newItem, ...prev.filter((m) => m.id !== newItem.id)]);
      setIsUploadOpen(false);
      setUploadSrc("");
      setUploadCaption("");
      confetti({ particleCount: 50, spread: 70 });
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Like a media item
  const handleLike = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: Please sign in to like reels or photos.");
      return;
    }
    try {
      // Toggle in Firestore
      toggleMediaLikeInFirestore(id, effectiveUser?.id || "anonymous").catch(() => {});

      const res = await api.likeMedia(id);
      setMediaList((prev) =>
        prev.map((m) => (m.id === id ? { ...m, likes: res.likes, likedBy: res.data.likedBy } : m))
      );
      if (res.liked) {
        confetti({ particleCount: 15, spread: 40, origin: { y: 0.8 } });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post comment
  const handleAddComment = async (id: string) => {
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: Please sign in to leave comments on media.");
      return;
    }
    if (!commentInput.trim()) return;
    try {
      const authorName = effectiveUser?.name || "Student";
      // Save comment in Firestore
      addMediaCommentToFirestore(id, {
        author: authorName,
        text: commentInput.trim(),
        avatar: effectiveUser?.avatar,
      }).catch(() => {});

      const newC = await api.commentMedia(id, commentInput, authorName);
      setMediaList((prev) =>
        prev.map((m) =>
          m.id === id ? { ...m, comments: [...(m.comments || []), newC] } : m
        )
      );
      setCommentInput("");
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  // Delete media
  const handleDeleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!effectiveUser) {
      onOpenAuth?.("signin");
      alert("Sign In Required: Please sign in to delete media.");
      return;
    }
    if (!confirm("Are you sure you want to delete this media item?")) return;
    try {
      try {
        await api.deleteMedia(id);
      } catch (err) {
        console.warn("Local DB delete failed, trying Firestore...", err);
      }
      try {
        await deleteMediaFromFirestore(id);
      } catch (err) {
        console.warn("Firestore delete failed", err);
      }
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      if (activeReelIndex !== null) setActiveReelIndex(null);
    } catch (err) {
      alert("Failed to delete media");
    }
  };

  const reelsOnly = mediaList.filter((m) => m.type === "reel");

  return (
    <div className="space-y-10 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1a2a40]/10 pb-6">
        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
            Campus Cinema & Shorts · ಕ್ಯಾಂಪಸ್ ರೀಲ್ಸ್ ಮತ್ತು ವೀಡಿಯೊಗಳು
          </span>
          <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#1a2a40]">
            Reels, Videos & Photo Streams
          </h1>
          <p className="text-xs sm:text-sm text-[#4a5e7a] max-w-2xl font-['Noto_Sans_Kannada']">
            ಎಲ್ಲಾ ವಿದ್ಯಾರ್ಥಿಗಳು ಮತ್ತು ಸಹಪಾಠಿಗಳು ವೀಕ್ಷಿಸಲು ಸಾರ್ವಜನಿಕವಾಗಿ ತೆರೆದಿರುವ ಸ್ಮರಣೀಯ ರೀಲ್ಸ್, ವೀಡಿಯೊಗಳು ಮತ್ತು ಭಾವಚಿತ್ರಗಳ ಸಂಗ್ರಹ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!effectiveUser) {
                onOpenAuth?.("signin");
                alert("Sign In Required: You must sign in to upload reels, videos, or photos.");
                return;
              }
              setIsUploadOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003d80] text-white text-xs font-semibold rounded-xl hover:bg-[#0056b3] transition-all shadow-md hover:scale-102 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Reel / Video / Photo</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#1a2a40]/10 shadow-2xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-[#003d80] text-white"
                : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
            }`}
          >
            All Media ({mediaList.length})
          </button>
          <button
            onClick={() => setActiveTab("reel")}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "reel"
                ? "bg-[#003d80] text-white"
                : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Reels (9:16)</span>
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "video"
                ? "bg-[#003d80] text-white"
                : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
            }`}
          >
            <Video className="w-3 h-3" />
            <span>Campus Videos</span>
          </button>
          <button
            onClick={() => setActiveTab("photo")}
            className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "photo"
                ? "bg-[#003d80] text-white"
                : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>Photos</span>
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reels, captions, authors..."
            className="w-full text-xs px-3.5 py-2 bg-white border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80] shadow-2xs"
          />
        </div>
      </div>

      {/* Popular Tags Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#7a8fa8] font-medium mr-1">
          Explore Tags:
        </span>
        {["#CampusReels", "#Convocation", "#HostelLife", "#DanceBattle", "#SunsetMemories", "#Farewell"].map(
          (tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#003d80] text-white"
                    : "bg-white text-[#4a5e7a] border border-[#1a2a40]/10 hover:bg-[#f0f4f8]"
                }`}
              >
                {tag}
              </button>
            );
          }
        )}
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="text-[11px] text-red-600 hover:underline ml-2 cursor-pointer"
          >
            Clear tag
          </button>
        )}
      </div>

      {/* Public Media Feed Grid */}
      {loading ? (
        <div className="p-20 text-center text-xs text-[#7a8fa8] space-y-2">
          <Disc className="w-6 h-6 animate-spin mx-auto text-[#003d80]" />
          <p>Streaming campus video reels and memories...</p>
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#1a2a40]/10 text-xs text-[#7a8fa8] space-y-3">
          <Film className="w-10 h-10 text-[#7a8fa8] mx-auto opacity-50" />
          <p className="font-semibold text-sm text-[#1a2a40]">No media matches found.</p>
          <p>Be the first batchmate to upload or record a video reel!</p>
          <button
            onClick={() => {
              if (!effectiveUser) {
                onOpenAuth?.("signin");
                alert("Sign In Required: You must sign in to upload reels, videos, or photos.");
                return;
              }
              setIsUploadOpen(true);
            }}
            className="px-4 py-2 bg-[#003d80] text-white rounded-xl hover:bg-[#0056b3] cursor-pointer"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mediaList.map((item, idx) => {
            const isReel = item.type === "reel";
            const isPhoto = item.type === "photo";

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#1a2a40]/12 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                {/* Media Container */}
                <div
                  onClick={() => {
                    if (isReel) {
                      const rIndex = reelsOnly.findIndex((r) => r.id === item.id);
                      if (rIndex !== -1) setActiveReelIndex(rIndex);
                    } else {
                      setFullscreenPhotoItem(item);
                    }
                  }}
                  className={`relative overflow-hidden bg-black ${
                    isReel ? "aspect-[9/16] cursor-pointer" : "aspect-video cursor-pointer"
                  }`}
                >
                  {isPhoto ? (
                    <img
                      src={item.src}
                      alt={item.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full relative">
                      <video
                        src={item.src}
                        poster={item.thumbnail}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        loop
                        onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                        onMouseLeave={(e) => {
                          const v = e.currentTarget as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                      {/* Play badge overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-[#003d80] shadow-md group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Type Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-sm text-white border border-white/20">
                    {item.type}
                  </span>

                  {/* Delete button (only for the uploader) */}
                  {effectiveUser && (item.authorId === effectiveUser.id || item.author === effectiveUser.name) && (
                    <button
                      onClick={(e) => handleDeleteMedia(item.id, e)}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all cursor-pointer"
                      title="Delete Your Media"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Bottom Video/Reel Title */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent text-white space-y-1">
                    <p className="text-xs font-medium line-clamp-2 leading-snug drop-shadow-sm">
                      {item.caption || "Campus memory"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <img
                        src={
                          item.authorAvatar ||
                          "https://www.ghibli.jp/gallery/howl005.jpg"
                        }
                        alt={item.author}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-white/50"
                      />
                      <span className="text-[10px] text-white/90 font-medium">
                        {item.author}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Interaction Bar */}
                <div className="p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleLike(item.id, e)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a2a40] hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            item.likes > 0 ? "fill-red-500 text-red-500" : "text-[#7a8fa8]"
                          }`}
                        />
                        <span>{item.likes}</span>
                      </button>

                      <button
                        onClick={() => setShowCommentsFor(showCommentsFor === item.id ? null : item.id)}
                        className="inline-flex items-center gap-1 text-xs text-[#7a8fa8] hover:text-[#003d80] transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.comments?.length || 0}</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-[#7a8fa8]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((t, tidx) => (
                        <span
                          key={tidx}
                          className="text-[10px] text-[#0056b3] bg-[#0056b3]/5 px-1.5 py-0.5 rounded font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comments Drawer / Inline comments */}
                  {showCommentsFor === item.id && (
                    <div className="pt-2 border-t border-[#1a2a40]/10 space-y-2 animate-in fade-in">
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                        {item.comments && item.comments.length > 0 ? (
                          item.comments.map((c) => (
                            <div key={c.id} className="text-[11px] bg-[#f0f4f8] p-2 rounded-lg space-y-0.5">
                              <div className="flex items-center justify-between font-semibold text-[#1a2a40]">
                                <span>{c.author}</span>
                                <span className="text-[9px] text-[#7a8fa8] font-normal">
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-[#4a5e7a]">{c.text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-[#7a8fa8] py-1 text-center">
                            No comments yet. Write one below!
                          </p>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(item.id)}
                          placeholder="Write a batch comment..."
                          className="flex-1 text-xs px-2.5 py-1.5 bg-[#f0f4f8] rounded-lg border border-[#1a2a40]/10 focus:outline-hidden focus:border-[#003d80]"
                        />
                        <button
                          onClick={() => handleAddComment(item.id)}
                          className="p-1.5 bg-[#003d80] text-white rounded-lg hover:bg-[#0056b3] cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Vertical Reels Player (TikTok / IG Reels Style) */}
      {activeReelIndex !== null && reelsOnly[activeReelIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4 backdrop-blur-md">
          {/* Close button */}
          <button
            onClick={() => setActiveReelIndex(null)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Reel Frame */}
          <div className="relative w-full max-w-sm h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between">
            {/* Reel Video */}
            <video
              src={reelsOnly[activeReelIndex].src}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              loop
              muted={reelMuted}
              onClick={() => setReelPlaying(!reelPlaying)}
              ref={(el) => {
                if (el) {
                  if (reelPlaying) el.play().catch(() => {});
                  else el.pause();
                }
              }}
            />

            {/* Top Bar Controls */}
            <div className="relative z-10 p-4 flex items-center justify-between text-white bg-linear-to-b from-black/60 to-transparent">
              <span className="text-xs font-mono tracking-wider font-semibold uppercase">
                Reel {activeReelIndex + 1} of {reelsOnly.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReelMuted(!reelMuted)}
                  className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white cursor-pointer"
                >
                  {reelMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Right Side Vertical Action Stack */}
            <div className="relative z-10 self-end p-4 space-y-4 text-white flex flex-col items-center">
              {/* Like */}
              <button
                onClick={() => handleLike(reelsOnly[activeReelIndex].id)}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Heart
                    className={`w-6 h-6 ${
                      reelsOnly[activeReelIndex].likes > 0
                        ? "fill-red-500 text-red-500"
                        : "text-white"
                    }`}
                  />
                </div>
                <span className="text-[11px] font-bold">
                  {reelsOnly[activeReelIndex].likes}
                </span>
              </button>

              {/* Comments */}
              <button
                onClick={() =>
                  setShowCommentsFor(
                    showCommentsFor === reelsOnly[activeReelIndex].id
                      ? null
                      : reelsOnly[activeReelIndex].id
                  )
                }
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-bold">
                  {reelsOnly[activeReelIndex].comments?.length || 0}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  alert("Link to reel copied to clipboard!");
                }}
                className="flex flex-col items-center gap-1 cursor-pointer group"
              >
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px]">Share</span>
              </button>
            </div>

            {/* Bottom Details & Author */}
            <div className="relative z-10 p-5 bg-linear-to-t from-black/90 via-black/50 to-transparent text-white space-y-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    reelsOnly[activeReelIndex].authorAvatar ||
                    "https://www.ghibli.jp/gallery/howl005.jpg"
                  }
                  alt={reelsOnly[activeReelIndex].author}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
                />
                <div>
                  <span className="text-xs font-semibold block">
                    {reelsOnly[activeReelIndex].author}
                  </span>
                  <span className="text-[10px] text-white/70">
                    Batch of 2025 &bull; Campus Reel
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/95 leading-relaxed drop-shadow-sm">
                {reelsOnly[activeReelIndex].caption}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {reelsOnly[activeReelIndex].tags?.map((t, idx) => (
                  <span key={idx} className="text-[10px] text-blue-300 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Prev / Next Reel Navigation Arrows */}
            {activeReelIndex > 0 && (
              <button
                onClick={() => setActiveReelIndex(activeReelIndex - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {activeReelIndex < reelsOnly.length - 1 && (
              <button
                onClick={() => setActiveReelIndex(activeReelIndex + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal (Videos, Reels & Photos) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-[#1a2a40]/15 max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                cancelRecording();
                setIsUploadOpen(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full text-[#7a8fa8] hover:text-[#1a2a40] hover:bg-[#f0f4f8] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1">
              <span className="text-[11px] font-semibold text-[#0056b3] uppercase tracking-widest">
                Media Studio · ಅಪ್‌ಲೋಡ್ ಕೇಂದ್ರ
              </span>
              <h2 className="font-['Cormorant_Garamond',serif] text-3xl font-semibold text-[#1a2a40]">
                Publish a Reel, Video or Photo
              </h2>
              <p className="text-xs text-[#7a8fa8]">
                Publicly viewable by all classmates and visitors across the college network.
              </p>
            </div>

            {!effectiveUser ? (
              <div className="rounded-2xl border border-dashed border-[#003d80]/20 bg-linear-to-b from-[#f0f4f8] to-white p-8 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#003d80]/10 flex items-center justify-center text-[#003d80]">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
                    Sign In Required to Upload Media
                  </h3>
                  <p className="text-xs text-[#4a5e7a] leading-relaxed">
                    You must be signed in to upload photos, reels, or videos to the campus network. Please sign in or register with your college account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    onOpenAuth?.("signin");
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[#003d80] to-[#0056b3] text-white text-xs font-semibold hover:brightness-110 shadow-sm cursor-pointer transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register Now</span>
                </button>
              </div>
            ) : (
              <>
                {/* Media Type Chooser */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-[#f0f4f8] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setUploadType("reel")}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadType === "reel"
                        ? "bg-[#003d80] text-white shadow-xs"
                        : "text-[#4a5e7a] hover:bg-white/50"
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Reel (9:16)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType("video")}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadType === "video"
                        ? "bg-[#003d80] text-white shadow-xs"
                        : "text-[#4a5e7a] hover:bg-white/50"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Video (16:9)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadType("photo")}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      uploadType === "photo"
                        ? "bg-[#003d80] text-white shadow-xs"
                        : "text-[#4a5e7a] hover:bg-white/50"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Photo</span>
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  {/* File Upload & Live Camera Recording options */}
                  <div className="space-y-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="video/*,image/*"
                      className="hidden"
                    />

                    {/* Dropzone / Preview Area */}
                    <div className="border-2 border-dashed border-[#1a2a40]/20 rounded-2xl p-5 text-center bg-[#f0f4f8]/50 hover:bg-[#f0f4f8] transition-colors">
                      {isRecording ? (
                        <div className="space-y-3">
                          <video
                            ref={videoPreviewRef}
                            className="max-h-60 mx-auto rounded-xl object-cover aspect-[9/16] bg-black"
                            muted
                            autoPlay
                            playsInline
                          />
                          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-red-600">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                            <span>Recording Live Campus Reel ({recordingTime}s)</span>
                          </div>
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 cursor-pointer"
                            >
                              Stop & Keep Clip
                            </button>
                            <button
                              type="button"
                              onClick={cancelRecording}
                              className="px-4 py-2 bg-gray-200 text-xs font-semibold rounded-xl hover:bg-gray-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : uploadSrc ? (
                        <div className="space-y-3">
                          {uploadType === "photo" ? (
                            <img
                              src={uploadSrc}
                              alt="Upload preview"
                              className="max-h-48 mx-auto rounded-xl shadow-xs object-cover"
                            />
                          ) : (
                            <video
                              src={uploadSrc}
                              controls
                              className="max-h-48 mx-auto rounded-xl shadow-xs object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => setUploadSrc("")}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Remove and replace media
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 py-2">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                if (!effectiveUser) {
                                  onOpenAuth?.("signin");
                                  alert("Sign In Required: You must sign in to upload photos or videos.");
                                  return;
                                }
                                fileInputRef.current?.click();
                              }}
                              className="px-4 py-2.5 bg-white border border-[#1a2a40]/15 hover:border-[#003d80] rounded-xl text-xs font-semibold text-[#003d80] shadow-2xs flex items-center gap-2 cursor-pointer"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Select Video / Photo File</span>
                            </button>

                            <button
                              type="button"
                              onClick={startRecording}
                              className="px-4 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-semibold text-red-700 shadow-2xs flex items-center gap-2 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>Record Live Reel</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-[#7a8fa8]">
                            Supports MP4, WebM, MOV video clips or high-res photos up to 50MB
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Or Paste direct URL */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-[#4a5e7a]">
                        Or Paste Direct Media URL (Video or Image)
                      </label>
                      <input
                        type="url"
                        value={uploadSrc.startsWith("data:") ? "" : uploadSrc}
                        onChange={(e) => setUploadSrc(e.target.value)}
                        placeholder="https://.../video.mp4 or photo.jpg"
                        className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                      />
                    </div>
                  </div>

                  {/* Caption & Submitter */}
                  <div className="space-y-3 pt-2 border-t border-[#1a2a40]/10">
                    <div>
                      <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                        Caption / Reel Story
                      </label>
                      <textarea
                        rows={2}
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="What happened in this clip? e.g. Final day countdown at canteen stairs..."
                        className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                          Author / Submitter
                        </label>
                        <input
                          type="text"
                          value={uploadAuthor}
                          onChange={(e) => setUploadAuthor(e.target.value)}
                          placeholder="e.g. Arjun Rao"
                          className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                          Tags (space-separated)
                        </label>
                        <input
                          type="text"
                          value={uploadTags}
                          onChange={(e) => setUploadTags(e.target.value)}
                          placeholder="#CampusReels #Farewell #Fest"
                          className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-[#1a2a40]/10 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-[#4a5e7a] hover:bg-[#f0f4f8] rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={uploading || !uploadSrc}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003d80] text-white text-xs font-semibold rounded-xl hover:bg-[#0056b3] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{uploading ? "Publishing..." : "Post Publicly to Campus Feed"}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal for Photos & Videos */}
      {fullscreenPhotoItem && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <button
            onClick={() => setFullscreenPhotoItem(null)}
            className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl w-full max-h-[90vh] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/10">
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[50vh] md:min-h-[75vh]">
              {fullscreenPhotoItem.type === "photo" ? (
                <img
                  src={fullscreenPhotoItem.src}
                  alt={fullscreenPhotoItem.caption}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : (
                <video
                  src={fullscreenPhotoItem.src}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
            </div>

            {/* Sidebar with Details & Comments */}
            <div className="w-full md:w-80 bg-white p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-1">
                <div className="flex items-center gap-3 border-b border-[#1a2a40]/10 pb-4">
                  <img
                    src={fullscreenPhotoItem.authorAvatar || "https://www.ghibli.jp/gallery/howl005.jpg"}
                    alt={fullscreenPhotoItem.author}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#003d80]/30"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#1a2a40] block">
                      {fullscreenPhotoItem.author}
                    </span>
                    <span className="text-[10px] text-[#7a8fa8]">
                      {new Date(fullscreenPhotoItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#1a2a40] leading-relaxed font-medium">
                  {fullscreenPhotoItem.caption}
                </p>

                {fullscreenPhotoItem.tags && fullscreenPhotoItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {fullscreenPhotoItem.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] text-[#0056b3] bg-[#0056b3]/10 px-2 py-0.5 rounded font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Likes & Actions */}
              <div className="pt-4 border-t border-[#1a2a40]/10 flex items-center justify-between">
                <button
                  onClick={(e) => handleLike(fullscreenPhotoItem.id, e)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a2a40] hover:text-red-600 transition-colors cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${fullscreenPhotoItem.likes > 0 ? "fill-red-500 text-red-500" : "text-[#7a8fa8]"}`} />
                  <span>{fullscreenPhotoItem.likes} Likes</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert("Link copied!");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-[#7a8fa8] hover:text-[#003d80] cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
