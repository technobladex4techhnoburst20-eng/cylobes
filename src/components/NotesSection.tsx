import React, { useState, useEffect, useMemo } from "react";
import { Quote, User } from "../types";
import { api } from "../services/api";
import {
  Mail,
  MailOpen,
  Send,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Sparkles,
  Quote as QuoteIcon,
  Copy,
  Tv,
  Image as ImageIcon,
  Flame,
  Heart,
  Smile,
  Compass,
  Gamepad2,
  Trophy,
  Trees,
  Shield,
  Feather,
  Wand2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  subscribeToQuotes,
  addQuoteToFirestore,
  deleteQuoteFromFirestore,
} from "../firebase/firestoreService";
import { useAuth } from "../firebase/AuthContext";
import {
  ANIME_CATEGORIES_LIST,
  ANIME_CATEGORY_META,
} from "../data/animeQuotesDataset";

interface NotesSectionProps {
  currentUser: User | null;
}

// Popular primary categories with dedicated icons
const POPULAR_CATEGORIES = [
  { id: "all", label: "All Quotes", icon: Sparkles },
  { id: "Motivation", label: "Motivation", icon: Flame },
  { id: "Friends", label: "Friends", icon: Heart },
  { id: "Psycho", label: "Psycho / Dark", icon: Shield },
  { id: "Comedy", label: "Comedy", icon: Smile },
  { id: "Love", label: "Love & Romance", icon: Heart },
  { id: "Drama", label: "Drama", icon: Tv },
  { id: "Care", label: "Care & Kindness", icon: Feather },
  { id: "Fairy", label: "Cartoons & Fairy", icon: Wand2 },
  { id: "Fantasy", label: "Fantasy", icon: Wand2 },
  { id: "Peace", label: "Peace & Philosophy", icon: Feather },
  { id: "Adventure", label: "Adventure", icon: Compass },
  { id: "Gaming", label: "Gaming & Strategy", icon: Gamepad2 },
  { id: "Sports", label: "Sports & Spirit", icon: Trophy },
  { id: "Nature", label: "Nature & Animals", icon: Trees },
  { id: "Birds", label: "Birds & Freedom", icon: Feather },
];

const PAGE_SIZE = 24;

export const NotesSection: React.FC<NotesSectionProps> = ({ currentUser }) => {
  const { studentUser } = useAuth();
  const effectiveUser = studentUser || currentUser;

  // Envelope toggle states
  const [openLetter1, setOpenLetter1] = useState(false);
  const [openLetter2, setOpenLetter2] = useState(false);

  // Quotes state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [spotlightQuote, setSpotlightQuote] = useState<Quote | null>(null);

  // Create quote form inputs
  const [characterInput, setCharacterInput] = useState("");
  const [animeTitleInput, setAnimeTitleInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("Motivation");
  const [imageInput, setImageInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // AI Generator state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState("Motivation");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editCharacter, setEditCharacter] = useState("");
  const [editAnimeTitle, setEditAnimeTitle] = useState("");
  const [editCategory, setEditCategory] = useState("Motivation");
  const [editImageUrl, setEditImageUrl] = useState("");

  const loadQuotes = async (search?: string, cat?: string) => {
    try {
      setLoading(true);
      const data = await api.getQuotes(search, cat);
      if (data && data.length > 0) {
        setQuotes(data);
      }
    } catch (err) {
      console.error("Failed to load quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Cloud Firestore subscription + local API loader
  useEffect(() => {
    loadQuotes(searchQuery, selectedCategory);
    const unsubscribe = subscribeToQuotes((firestoreQuotes) => {
      if (firestoreQuotes && firestoreQuotes.length > 0) {
        setQuotes((prev) => {
          const map = new Map<string, Quote>();
          prev.forEach((q) => map.set(q.id, q));
          firestoreQuotes.forEach((fq) => {
            const existing = map.get(fq.id);
            map.set(fq.id, {
              id: fq.id,
              text: fq.text,
              author: fq.author,
              createdAt: fq.createdAt,
              character: existing?.character || fq.author,
              animeTitle: existing?.animeTitle,
              category: existing?.category || "Motivation",
              imageUrl: existing?.imageUrl,
            });
          });
          return Array.from(map.values()).sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
          );
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Filter quotes locally or reload
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchCat =
        selectedCategory === "all" ||
        (q.category &&
          q.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      const qSearch = searchQuery.toLowerCase().trim();
      const matchSearch =
        !qSearch ||
        q.text.toLowerCase().includes(qSearch) ||
        q.author.toLowerCase().includes(qSearch) ||
        (q.character && q.character.toLowerCase().includes(qSearch)) ||
        (q.animeTitle && q.animeTitle.toLowerCase().includes(qSearch)) ||
        (q.category && q.category.toLowerCase().includes(qSearch));

      return matchCat && matchSearch;
    });
  }, [quotes, selectedCategory, searchQuery]);

  // Paginated quotes
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const paginatedQuotes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredQuotes.slice(start, start + PAGE_SIZE);
  }, [filteredQuotes, currentPage]);

  // AI Quote / Anime quote generation using Gemini API
  const handleAIGenerateQuote = async () => {
    setAiGenerating(true);
    try {
      const prompt = `Give me a famous or profound anime quote related to the category "${aiPromptTopic}".
Return a JSON object in this exact format:
{
  "quote": "The quote text here without extra quotation marks",
  "character": "Character Name",
  "anime": "Anime Title",
  "category": "${aiPromptTopic}",
  "imageUrl": "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80"
}`;

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          role: "anime-scholar",
          model: "gemini-3.1-flash-lite",
        }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        try {
          const cleanJson = data.text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          setTextInput(parsed.quote || parsed.text || data.text);
          setCharacterInput(parsed.character || "");
          setAnimeTitleInput(parsed.anime || "");
          setCategoryInput(parsed.category || aiPromptTopic);
          if (parsed.imageUrl) setImageInput(parsed.imageUrl);
        } catch {
          setTextInput(data.text.trim());
          setCategoryInput(aiPromptTopic);
        }
        setFeedbackMsg(`✨ Gemini drafted an iconic ${aiPromptTopic} anime quote!`);
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch (err) {
      console.warn("AI generation error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Random Wisdom / Inspire Me Picker
  const handleInspireMe = () => {
    if (filteredQuotes.length === 0) return;
    const rand = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    setSpotlightQuote(rand);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
  };

  // Handle Copy Quote
  const handleCopyQuote = (q: Quote) => {
    const quoteStr = `"${q.text}" — ${q.character || q.author}${
      q.animeTitle ? ` (${q.animeTitle})` : ""
    }`;
    navigator.clipboard.writeText(quoteStr);
    setCopiedId(q.id);
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.9 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Create Quote (POST /api/quotes & Cloud Firestore)
  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    try {
      setSubmitting(true);
      const charName = characterInput.trim() || effectiveUser?.name || "Anime Hero";
      const fullAuthor = animeTitleInput.trim()
        ? `${charName} (${animeTitleInput.trim()})`
        : charName;

      // 1. Write to Firestore for persistent Cloud database storage
      let fsQuoteId = "";
      try {
        const fq = await addQuoteToFirestore(
          textInput.trim(),
          fullAuthor,
          effectiveUser?.id
        );
        fsQuoteId = fq.id;
      } catch (fsErr) {
        console.warn("Firestore quote sync note:", fsErr);
      }

      // 2. Also write to backend API
      const newQuote = await api.createQuote(textInput.trim(), fullAuthor, {
        category: categoryInput,
        imageUrl:
          imageInput.trim() ||
          ANIME_CATEGORY_META[categoryInput]?.image ||
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80",
        animeTitle: animeTitleInput.trim(),
        character: charName,
      });

      setQuotes((prev) => [
        {
          id: fsQuoteId || newQuote.id,
          text: textInput.trim(),
          author: fullAuthor,
          character: charName,
          animeTitle: animeTitleInput.trim(),
          category: categoryInput,
          imageUrl:
            imageInput.trim() ||
            ANIME_CATEGORY_META[categoryInput]?.image ||
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80",
          createdAt: Date.now(),
        },
        ...prev,
      ]);

      setTextInput("");
      setCharacterInput("");
      setAnimeTitleInput("");
      setImageInput("");
      setFeedbackMsg("Anime quote pinned to Campus Notes & Wall of Thoughts! 📌");
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.8 } });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      setFeedbackMsg(err.message || "Failed to post quote");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Quote (DELETE /api/quotes/:id)
  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Are you sure you want to remove this quote?")) return;
    try {
      try {
        await api.deleteQuote(id);
      } catch (err) {
        console.warn("Could not delete from local db, attempting Firestore delete...", err);
      }
      try {
        await deleteQuoteFromFirestore(id);
      } catch (err) {
        console.warn("Could not delete from Firestore", err);
      }
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setFeedbackMsg("Quote removed.");
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to delete quote");
    }
  };

  // Handle Update Quote (PUT /api/quotes/:id)
  const startEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setEditText(quote.text);
    setEditAuthor(quote.author);
    setEditCharacter(quote.character || quote.author);
    setEditAnimeTitle(quote.animeTitle || "");
    setEditCategory(quote.category || "Motivation");
    setEditImageUrl(quote.imageUrl || "");
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const fullAuthor = editAnimeTitle.trim()
        ? `${editCharacter.trim()} (${editAnimeTitle.trim()})`
        : editCharacter.trim() || editAuthor;

      const updated = await api.updateQuote(id, {
        text: editText,
        author: fullAuthor,
        character: editCharacter.trim(),
        animeTitle: editAnimeTitle.trim(),
        category: editCategory,
        imageUrl: editImageUrl.trim(),
      });
      setQuotes(quotes.map((q) => (q.id === id ? updated : q)));
      setEditingId(null);
      setFeedbackMsg("Quote updated successfully! ✏️");
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: any) {
      alert(err.message || "Failed to update quote. Ensure you are signed in.");
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold uppercase tracking-widest text-[#003d80]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Campus Notes · 3,280+ Anime & Campus Wisdom Archive</span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1a2a40] tracking-tight">
          Quotes, Letters & Anime Chronicles
        </h1>
        <p className="font-['Noto_Sans_Kannada'] text-sm sm:text-base text-[#4a5e7a]">
          ಕ್ಯಾಂಪಸ್ ಟಿಪ್ಪಣಿಗಳು, ಅನಿಮೆ ಉಲ್ಲೇಖಗಳು ಮತ್ತು ಎಂದಿಗೂ ಮರೆಯಲಾಗದ ಪತ್ರಗಳು
        </p>
        <p className="text-xs sm:text-sm text-[#7a8fa8] max-w-2xl mx-auto">
          Explore iconic quotes across Motivation, Friends, Psycho, Comedy, Love, Romance, Drama, Care, Cartoons, Fairy, Fantasy, Peace, Adventure, Gaming, Sports, Nature, Birds, Animals and 80+ themes with anime character portraits.
        </p>
      </div>

      {/* Unsent Letters Section with Envelopes */}
      <section className="space-y-6">
        <div className="border-b border-[#1a2a40]/10 pb-3 flex items-center justify-between">
          <div>
            <h2 className="font-['Cormorant_Garamond',serif] text-2xl sm:text-3xl font-semibold text-[#1a2a40]">
              Unsent Letters · ಬರೆಯದೇ ಉಳಿದ ಪತ್ರಗಳು
            </h2>
            <p className="text-xs text-[#7a8fa8]">
              Click on an envelope to open and read what was left unsaid.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Envelope 1: To My Best Friend */}
          <div className="bg-[#f7f4ed] rounded-2xl border border-[#d8cfc0] p-6 shadow-xs transition-all hover:border-[#003d80]/30">
            <button
              onClick={() => setOpenLetter1(!openLetter1)}
              className="w-full flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003d80]/10 text-[#003d80] flex items-center justify-center group-hover:scale-105 transition-transform">
                  {openLetter1 ? (
                    <MailOpen className="w-5 h-5 text-[#003d80]" />
                  ) : (
                    <Mail className="w-5 h-5 text-[#003d80]" />
                  )}
                </div>
                <div>
                  <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                    To My Dearest Batchmate
                  </h3>
                  <span className="text-[11px] text-[#7a8fa8] font-['Noto_Sans_Kannada']">
                    ನನ್ನ ಆತ್ಮೀಯ ಸ್ನೇಹಿತನಿಗೆ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#0056b3] font-medium bg-white px-2.5 py-1 rounded-md border border-[#d8cfc0]">
                {openLetter1 ? "Close Letter" : "Open Letter"}
              </span>
            </button>

            {openLetter1 && (
              <div className="mt-5 pt-5 border-t border-[#d8cfc0]/60 space-y-3 font-['Caveat',cursive] text-lg text-[#2a2a2a] leading-relaxed animate-in fade-in duration-300">
                <p>Dear Friend,</p>
                <p>
                  Remember that rainy July evening during 2nd year? We stayed back in the canteen because none of us had umbrellas, splitting one plate of hot samosas and talking about who we'd become in five years.
                </p>
                <p>
                  We are finally at that future now. We might scatter across different cities, time zones, and jobs, but every single corner of this campus has our laughter stitched into its bricks. Thank you for making these four years feel like home.
                </p>
                <p className="text-right font-['Caveat'] text-xl text-[#003d80]">
                  — Yours always in memory
                </p>
              </div>
            )}
          </div>

          {/* Envelope 2: To Our Professors */}
          <div className="bg-[#f7f4ed] rounded-2xl border border-[#d8cfc0] p-6 shadow-xs transition-all hover:border-[#003d80]/30">
            <button
              onClick={() => setOpenLetter2(!openLetter2)}
              className="w-full flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003d80]/10 text-[#003d80] flex items-center justify-center group-hover:scale-105 transition-transform">
                  {openLetter2 ? (
                    <MailOpen className="w-5 h-5 text-[#003d80]" />
                  ) : (
                    <Mail className="w-5 h-5 text-[#003d80]" />
                  )}
                </div>
                <div>
                  <h3 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                    To The Mentors Who Guided Us
                  </h3>
                  <span className="text-[11px] text-[#7a8fa8] font-['Noto_Sans_Kannada']">
                    ನಮಗೆ ದಾರಿದೀಪವಾದ ಗುರುಗಳಿಗೆ
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#0056b3] font-medium bg-white px-2.5 py-1 rounded-md border border-[#d8cfc0]">
                {openLetter2 ? "Close Letter" : "Open Letter"}
              </span>
            </button>

            {openLetter2 && (
              <div className="mt-5 pt-5 border-t border-[#d8cfc0]/60 space-y-3 font-['Caveat',cursive] text-lg text-[#2a2a2a] leading-relaxed animate-in fade-in duration-300">
                <p>Respected Teachers,</p>
                <p>
                  You saw potential in us when we were just sleep-deprived teenagers struggling with 8:00 AM attendance. You didn't just teach us engineering theorems; you taught us patience, integrity, and resilience when our code repeatedly failed.
                </p>
                <p>
                  As we step into the real world, the foundation you laid will remain the compass for every career and dream we pursue.
                </p>
                <p className="text-right font-['Caveat'] text-xl text-[#003d80]">
                  — With deep gratitude, The Batch
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Spotlight Random Quote Modal */}
      {spotlightQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#fffdfa] rounded-3xl border border-[#e8dfd2] max-w-lg w-full overflow-hidden shadow-2xl space-y-0 relative">
            <button
              onClick={() => setSpotlightQuote(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={
                  spotlightQuote.imageUrl ||
                  ANIME_CATEGORY_META[spotlightQuote.category || "Motivation"]?.image ||
                  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80"
                }
                alt={spotlightQuote.character || spotlightQuote.author}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a40] via-[#1a2a40]/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs inline-block mb-1">
                  {spotlightQuote.category || "Wisdom"}
                </span>
                <h3 className="font-['Cormorant_Garamond',serif] text-3xl font-bold text-white leading-tight">
                  {spotlightQuote.character || spotlightQuote.author}
                </h3>
                {spotlightQuote.animeTitle && (
                  <span className="text-xs text-blue-200 block">
                    {spotlightQuote.animeTitle}
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <QuoteIcon className="w-7 h-7 text-[#003d80]/20" />
              <p className="font-['Cormorant_Garamond',serif] text-2xl italic text-[#1a2a40] leading-snug">
                "{spotlightQuote.text}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#e8dfd2]">
                <button
                  onClick={handleInspireMe}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f0f4f8] text-[#003d80] rounded-xl text-xs font-semibold hover:bg-blue-100 cursor-pointer"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Another Quote
                </button>
                <button
                  onClick={() => handleCopyQuote(spotlightQuote)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003d80] text-white rounded-xl text-xs font-semibold hover:bg-[#0056b3] cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anime & Campus Quotes Wall */}
      <section className="space-y-8">
        <div className="border-b border-[#1a2a40]/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-['Cormorant_Garamond',serif] text-3xl sm:text-4xl font-semibold text-[#1a2a40]">
              Wall of Anime & Campus Wisdom
            </h2>
            <p className="text-xs text-[#7a8fa8]">
              {quotes.length > 0 ? `${quotes.length} total quotes loaded` : "Loading quotes..."} &bull; Filter by 82 anime themes or search characters.
            </p>
          </div>

          {/* Search & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleInspireMe}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-semibold hover:brightness-110 cursor-pointer shadow-xs"
              title="Pick a random quote"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Inspire Me</span>
            </button>

            {/* Category Dropdown Picker */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-3 pr-8 py-2 text-xs bg-white border border-[#1a2a40]/15 rounded-xl font-medium text-[#1a2a40] focus:outline-hidden focus:border-[#003d80] shadow-xs cursor-pointer max-w-[160px] sm:max-w-[200px]"
              >
                <option value="all">All Categories ({quotes.length})</option>
                {ANIME_CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search character, anime, quote..."
                className="pl-8 pr-7 py-2 text-xs bg-white border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80] w-48 sm:w-64 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#003d80] text-white shadow-sm ring-2 ring-[#003d80]/20"
                    : "bg-white text-[#4a5e7a] border border-[#1a2a40]/10 hover:bg-[#f0f4f8] hover:text-[#003d80]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* AI Quote Generator & Custom Creation Accordion Card */}
        <div className="bg-white rounded-2xl border border-[#1a2a40]/12 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1a2a40]/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-500 to-[#003d80] text-white flex items-center justify-center shadow-xs">
                <QuoteIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-[#1a2a40]">
                  Share an Anime Quote or Memory
                </h3>
                <p className="text-xs text-[#7a8fa8]">
                  Add your favorite anime character dialogue, picture, and series name.
                </p>
              </div>
            </div>

            {/* AI Generator Control */}
            <div className="flex items-center gap-2 bg-[#f0f4f8] p-1.5 rounded-xl border border-[#1a2a40]/10">
              <select
                value={aiPromptTopic}
                onChange={(e) => setAiPromptTopic(e.target.value)}
                className="text-xs bg-transparent border-none text-[#1a2a40] font-medium focus:outline-hidden pr-2 cursor-pointer max-w-[140px]"
              >
                {ANIME_CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAIGenerateQuote}
                disabled={aiGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-[#003d80] to-[#4338ca] text-white text-xs font-semibold rounded-lg hover:brightness-110 transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{aiGenerating ? "Drafting..." : "AI Generate"}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateQuote} className="space-y-4">
            {feedbackMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-xs font-medium text-[#003d80] rounded-xl animate-in fade-in">
                {feedbackMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#4a5e7a] uppercase mb-1">
                  Anime Character
                </label>
                <input
                  type="text"
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="e.g. Rock Lee, Luffy, Levi..."
                  className="w-full text-xs p-2.5 bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4a5e7a] uppercase mb-1">
                  Anime Series Title
                </label>
                <input
                  type="text"
                  value={animeTitleInput}
                  onChange={(e) => setAnimeTitleInput(e.target.value)}
                  placeholder="e.g. Naruto, One Piece, AOT..."
                  className="w-full text-xs p-2.5 bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4a5e7a] uppercase mb-1">
                  Category
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl focus:outline-hidden focus:border-[#003d80] cursor-pointer"
                >
                  {ANIME_CATEGORIES_LIST.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#4a5e7a] uppercase mb-1">
                Character Picture / Wallpaper URL (Optional)
              </label>
              <div className="relative">
                <ImageIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa8]" />
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... or character artwork URL"
                  className="w-full pl-8 pr-3 py-2.5 text-xs bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#4a5e7a] uppercase mb-1">
                Quote or Memory Dialogue *
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Write an inspirational, emotional, or philosophical quote..."
                rows={3}
                required
                className="w-full text-xs p-3 bg-[#f0f4f8] border border-[#1a2a40]/10 rounded-xl focus:outline-hidden focus:border-[#003d80]"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003d80] text-white rounded-xl text-xs font-semibold hover:bg-[#0056b3] transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Posting..." : "Pin to Wall of Thoughts"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quotes Grid Section with Pagination */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7a8fa8]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1a2a40]">
                Showing {filteredQuotes.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                {Math.min(currentPage * PAGE_SIZE, filteredQuotes.length)} of {filteredQuotes.length} quotes
              </span>
              {selectedCategory !== "all" && (
                <span className="bg-blue-100 text-[#003d80] px-2 py-0.5 rounded-md font-medium text-[11px]">
                  Category: {selectedCategory}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadQuotes(searchQuery, selectedCategory)}
                className="inline-flex items-center gap-1 text-[#0056b3] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Wall</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-[#7a8fa8] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#003d80]" />
              <p>Loading anime wisdom & campus memories...</p>
            </div>
          ) : filteredQuotes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#1a2a40]/10 text-xs text-[#7a8fa8] space-y-3">
              <p>No quotes found matching "{searchQuery}" in category "{selectedCategory}".</p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-[#003d80] text-white rounded-xl text-xs font-semibold hover:bg-[#0056b3] cursor-pointer"
              >
                View All Quotes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedQuotes.map((quote) => {
                const isCopied = copiedId === quote.id;
                const charName = quote.character || quote.author;
                const animeName = quote.animeTitle;
                const category = quote.category || "Motivation";
                const displayImg =
                  quote.imageUrl ||
                  ANIME_CATEGORY_META[category]?.image ||
                  "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80";

                return (
                  <div
                    key={quote.id}
                    className="bg-[#fffdfa] rounded-2xl border border-[#e8dfd2] overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative"
                  >
                    {/* Top Character Header / Image Backdrop */}
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                      <img
                        src={displayImg}
                        alt={charName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a2a40] via-[#1a2a40]/40 to-transparent" />

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs">
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{category}</span>
                        </span>
                      </div>

                      {/* Action quick buttons */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyQuote(quote)}
                          title="Copy Quote"
                          className="p-1.5 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white hover:text-[#003d80] transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Character & Anime Name overlay */}
                      <div className="absolute bottom-3 left-4 right-4">
                        <h3 className="font-['Cormorant_Garamond',serif] text-2xl font-bold text-white leading-tight drop-shadow-sm">
                          {charName}
                        </h3>
                        {animeName && (
                          <span className="text-xs text-blue-200 font-medium drop-shadow-sm block">
                            {animeName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content / Edit Mode */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      {editingId === quote.id ? (
                        /* Inline Edit Mode (PUT) */
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-[#003d80] rounded-xl focus:outline-hidden"
                            rows={3}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editCharacter}
                              onChange={(e) => setEditCharacter(e.target.value)}
                              className="text-xs p-2 bg-white border border-[#1a2a40]/20 rounded-lg"
                              placeholder="Character"
                            />
                            <input
                              type="text"
                              value={editAnimeTitle}
                              onChange={(e) => setEditAnimeTitle(e.target.value)}
                              className="text-xs p-2 bg-white border border-[#1a2a40]/20 rounded-lg"
                              placeholder="Anime Title"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="text-xs p-2 bg-white border border-[#1a2a40]/20 rounded-lg"
                            >
                              {ANIME_CATEGORIES_LIST.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                            <input
                              type="url"
                              value={editImageUrl}
                              onChange={(e) => setEditImageUrl(e.target.value)}
                              className="text-xs p-2 bg-white border border-[#1a2a40]/20 rounded-lg"
                              placeholder="Photo URL"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs text-[#4a5e7a] hover:bg-gray-100 rounded-lg cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(quote.id)}
                              className="px-3.5 py-1.5 text-xs bg-[#003d80] text-white rounded-lg hover:bg-[#0056b3] cursor-pointer font-medium"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Quote Display */
                        <>
                          <div className="space-y-2">
                            <QuoteIcon className="w-5 h-5 text-[#003d80]/20" />
                            <p className="font-['Cormorant_Garamond',serif] text-xl sm:text-2xl italic text-[#1a2a40] leading-snug">
                              "{quote.text}"
                            </p>
                          </div>

                          <div className="pt-3 border-t border-[#e8dfd2] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-[#7a8fa8]">
                              {new Date(quote.createdAt).toLocaleDateString()}
                            </span>

                            {/* CRUD buttons */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(quote)}
                                title="Edit Quote (PUT)"
                                className="p-1.5 text-[#4a5e7a] hover:text-[#003d80] hover:bg-[#f0f4f8] rounded-lg cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuote(quote.id)}
                                title="Delete Quote (DELETE)"
                                className="p-1.5 text-[#4a5e7a] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredQuotes.length > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#1a2a40]/10 shadow-xs">
              <div className="text-xs text-[#7a8fa8]">
                Page <span className="font-bold text-[#1a2a40]">{currentPage}</span> of{" "}
                <span className="font-bold text-[#1a2a40]">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-[#1a2a40]/10 hover:bg-[#f0f4f8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-[#1a2a40]/10 hover:bg-[#f0f4f8] text-xs font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>

                {/* Quick page numbers */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          currentPage === pageNum
                            ? "bg-[#003d80] text-white"
                            : "hover:bg-[#f0f4f8] text-[#4a5e7a]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-[#1a2a40]/10 hover:bg-[#f0f4f8] text-xs font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-[#1a2a40]/10 hover:bg-[#f0f4f8] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
