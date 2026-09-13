import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Search,
  MapPin,
  Compass,
  GraduationCap,
  Briefcase,
  PenTool,
  RotateCcw,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Navigation,
  Brain,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "../firebase/AuthContext";
import {
  saveAIChatToFirestore,
  loadAIChatsFromFirestore,
} from "../firebase/firestoreService";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  thoughts?: string;
  model?: string;
  grounding?: {
    usedSearch?: boolean;
    usedMaps?: boolean;
    searchQueries?: string[];
    groundingChunks?: any[];
    searchEntryPoint?: string | null;
  };
  timestamp: number;
}

type ChatRole = "senior" | "reunion" | "career" | "poet";
type ModelChoice = "gemini-3.1-pro-preview" | "gemini-3.5-flash" | "gemini-3.1-flash-lite";

const ROLES: {
  id: ChatRole;
  label: string;
  icon: React.ElementType;
  description: string;
  defaultModel: ModelChoice;
  defaultSearch: boolean;
  defaultMaps: boolean;
  starters: string[];
}[] = [
  {
    id: "senior",
    label: "Senior Mentor",
    icon: GraduationCap,
    description: "Nostalgic guide for college life, transitions, and preserving friendships.",
    defaultModel: "gemini-3.1-pro-preview",
    defaultSearch: false,
    defaultMaps: false,
    starters: [
      "How do we keep our hostel group chat alive after everyone moves away?",
      "What are the best traditions to start during the last semester on campus?",
      "Give me advice on dealing with post-college blues and graduation anxiety.",
    ],
  },
  {
    id: "reunion",
    label: "Reunion & Places",
    icon: Compass,
    description: "Finds reunion cafes, farewell dinner spots & scenic locations using Google Maps.",
    defaultModel: "gemini-3.5-flash",
    defaultSearch: false,
    defaultMaps: true,
    starters: [
      "Find the best cozy cafes with outdoor seating for our 8-person batch reunion.",
      "Suggest scenic sunset viewpoints and farewell dinner spots near Bengaluru or Hubballi.",
      "Plan a relaxing weekend post-convocation road trip with memorable stops.",
    ],
  },
  {
    id: "career",
    label: "Career & Trends",
    icon: Briefcase,
    description: "Real-time 2026 tech trends, hiring insights, and interview prep with Google Search.",
    defaultModel: "gemini-3.5-flash",
    defaultSearch: true,
    defaultMaps: false,
    starters: [
      "What are the most demanded AI and full-stack skills for fresh graduates in late 2026?",
      "How can I prepare for junior software engineering system design interviews?",
      "What are the latest developments in open-source AI frameworks?",
    ],
  },
  {
    id: "poet",
    label: "Yearbook Poet",
    icon: PenTool,
    description: "Crafts poignant farewell speeches, yearbook roasts, and Studio Ghibli verses.",
    defaultModel: "gemini-3.1-flash-lite",
    defaultSearch: false,
    defaultMaps: false,
    starters: [
      "Write a heartfelt 4-line yearbook quote about 2 AM library tea breaks.",
      "Compose an emotional farewell speech for our cultural club graduation night.",
      "Write a warm Studio Ghibli style poem about train journeys and departing college gates.",
    ],
  },
];

export const GeminiChatbot: React.FC = () => {
  const { studentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<ChatRole>("senior");
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("gemini-3.5-flash");
  const [useSearch, setUseSearch] = useState<boolean>(false);
  const [useMaps, setUseMaps] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "model",
      text: `Hello ${
        studentUser?.name ? studentUser.name.split(" ")[0] : "Batchmate"
      }! 🌸 I am your Gemini Campus AI Assistant. Whether you want to reflect on golden memories, find scenic reunion meetup spots with Google Maps, scout current 2026 career trends with Google Search, or pen nostalgic yearbook verses, I'm here for you.`,
      model: "gemini-3.5-flash",
      timestamp: Date.now(),
    },
  ]);

  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadIdRef = useRef<string>(`thread_${Date.now()}`);

  // Auto-scroll to bottom of thread on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Sync role defaults when changing role
  const handleSelectRole = (roleId: ChatRole) => {
    setSelectedRole(roleId);
    const roleDef = ROLES.find((r) => r.id === roleId);
    if (roleDef) {
      setSelectedModel(roleDef.defaultModel);
      setUseSearch(roleDef.defaultSearch);
      setUseMaps(roleDef.defaultMaps);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage("");

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Build conversation history (excluding initial welcome message for brevity)
      const historyPayload = newMessages
        .slice(1, -1)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          role: selectedRole,
          model: selectedModel,
          useSearch,
          useMaps,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to get response from Gemini");
      }

      const modelMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: "model",
        text: data.text,
        thoughts: data.thoughts || undefined,
        model: data.model,
        grounding: data.grounding,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, modelMessage];
      setMessages(finalMessages);

      // Auto-open thoughts for 3.1 Pro Preview if available
      if (data.thoughts) {
        setExpandedThoughts((prev) => ({ ...prev, [modelMessage.id]: true }));
      }

      // Persist conversation to Firestore
      try {
        await saveAIChatToFirestore(threadIdRef.current, {
          title: text.slice(0, 40) + "...",
          role: selectedRole,
          model: data.model,
          userId: studentUser?.id || "anonymous",
          messages: finalMessages,
        });
      } catch (saveErr) {
        console.warn("Firestore save chat note:", saveErr);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMessage: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "model",
        text: `⚠️ **Could not connect to Gemini:** ${
          err.message || "Please check network and API credentials."
        }`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetThread = () => {
    threadIdRef.current = `thread_${Date.now()}`;
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: "model",
        text: `Thread reset. How can I assist you with your campus journey, reunion plans, or career goals today?`,
        model: selectedModel,
        timestamp: Date.now(),
      },
    ]);
  };

  const currentRoleDef = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] bg-[#fdfbf7] rounded-2xl border border-[#1a2a40]/15 shadow-xl overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white/90 backdrop-blur-md px-5 py-3.5 border-b border-[#1a2a40]/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#003d80] text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-[#1a2a40]">
                Gemini Campus Companion
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#003d80]/10 text-[#003d80]">
                Multi-Turn
              </span>
            </div>
            <p className="text-xs text-[#7a8fa8]">
              Powered by Google DeepMind Gemini models & Real-Time Grounding
            </p>
          </div>
        </div>

        {/* Reset & Settings Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetThread}
            title="Start fresh conversation"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#4a5e7a] hover:text-[#1a2a40] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Thread</span>
          </button>
        </div>
      </div>

      {/* Role & Tool Configuration Shelf */}
      <div className="bg-[#f0f4f8]/80 border-b border-[#1a2a40]/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7a8fa8] mr-1 hidden md:inline">
            Role:
          </span>
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#003d80] text-white shadow-2xs font-semibold"
                    : "bg-white text-[#4a5e7a] hover:bg-white/80 border border-[#1a2a40]/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{role.label}</span>
              </button>
            );
          })}
        </div>

        {/* Model & Grounding Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelChoice)}
            className="bg-white border border-[#1a2a40]/20 rounded-lg px-2.5 py-1 text-xs font-medium text-[#1a2a40] focus:outline-hidden focus:ring-1 focus:ring-[#003d80] cursor-pointer"
          >
            <option value="gemini-3.1-pro-preview">
              gemini-3.1-pro-preview (Deep Thinking)
            </option>
            <option value="gemini-3.5-flash">
              gemini-3.5-flash (General & Grounded)
            </option>
            <option value="gemini-3.1-flash-lite">
              gemini-3.1-flash-lite (Ultra Fast)
            </option>
          </select>

          {/* Search Grounding Toggle */}
          <button
            onClick={() => setUseSearch(!useSearch)}
            title="Google Search Grounding (gemini-3.5-flash)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              useSearch
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                : "bg-white text-[#4a5e7a] border-[#1a2a40]/15 hover:bg-black/5"
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Search</span>
            {useSearch && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {/* Maps Grounding Toggle */}
          <button
            onClick={() => setUseMaps(!useMaps)}
            title="Google Maps Grounding (gemini-3.5-flash)"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              useMaps
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                : "bg-white text-[#4a5e7a] border-[#1a2a40]/15 hover:bg-black/5"
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Maps</span>
            {useMaps && <CheckCircle2 className="w-3 h-3 text-white ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Role Prompt Banner */}
      <div className="bg-[#fff9f0] border-b border-[#e8dfd2] px-5 py-2 text-xs flex items-center justify-between text-[#8c6b3e]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
          <span>{currentRoleDef.description}</span>
        </div>
        {(useSearch || useMaps) && (
          <span className="text-[11px] font-semibold text-[#0056b3] flex items-center gap-1">
            {useSearch && "🔍 Real-time Search Grounded"}
            {useSearch && useMaps && " • "}
            {useMaps && "📍 Live Google Maps Places"}
          </span>
        )}
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-[#003d80] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? "bg-[#003d80] text-white rounded-tr-xs"
                    : "bg-white text-[#1a2a40] border border-[#1a2a40]/10 rounded-tl-xs"
                }`}
              >
                {/* Reasoning Thoughts Box (Gemini 3.1 Pro Thinking Mode) */}
                {!isUser && msg.thoughts && (
                  <div className="mb-3 bg-[#f8fafc] border border-blue-100 rounded-xl p-3 text-xs">
                    <button
                      onClick={() =>
                        setExpandedThoughts((prev) => ({
                          ...prev,
                          [msg.id]: !prev[msg.id],
                        }))
                      }
                      className="flex items-center justify-between w-full font-semibold text-blue-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-blue-600" />
                        <span>High Thinking Reasoning Process</span>
                      </div>
                      {expandedThoughts[msg.id] ? (
                        <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                    {expandedThoughts[msg.id] && (
                      <div className="mt-2 pt-2 border-t border-blue-100/60 text-slate-600 whitespace-pre-wrap font-mono text-[11px] max-h-48 overflow-y-auto leading-normal">
                        {msg.thoughts}
                      </div>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Grounding Citations & Sources (Google Search) */}
                {!isUser &&
                  msg.grounding?.usedSearch &&
                  msg.grounding.searchQueries &&
                  msg.grounding.searchQueries.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#1a2a40]/10 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0056b3]">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Google Search Grounding Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.grounding.searchQueries.map((q, idx) => (
                          <span
                            key={idx}
                            className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-mono"
                          >
                            "{q}"
                          </span>
                        ))}
                      </div>

                      {/* Chunks / Web Links if available */}
                      {msg.grounding.groundingChunks &&
                        msg.grounding.groundingChunks.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.grounding.groundingChunks
                              .filter((c: any) => c?.web?.uri)
                              .map((c: any, cIdx: number) => (
                                <a
                                  key={cIdx}
                                  href={c.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-[#0056b3] hover:underline bg-white border border-blue-200 px-2 py-0.5 rounded-full"
                                >
                                  <span>{c.web.title || "Search Result"}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              ))}
                          </div>
                        )}
                    </div>
                  )}

                {/* Grounding Places & Maps (Google Maps) */}
                {!isUser &&
                  msg.grounding?.usedMaps &&
                  msg.grounding.groundingChunks &&
                  msg.grounding.groundingChunks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-100 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Google Maps Place Details:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.grounding.groundingChunks
                          .filter((c: any) => c?.maps?.uri || c?.maps?.title)
                          .map((c: any, mIdx: number) => (
                            <a
                              key={mIdx}
                              href={
                                c.maps?.uri ||
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  c.maps?.title || "place"
                                )}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-lg p-2 text-xs transition-colors flex items-start justify-between gap-2 group"
                            >
                              <div>
                                <div className="font-semibold text-emerald-900 group-hover:text-emerald-700">
                                  {c.maps?.title || "Recommended Place"}
                                </div>
                                <div className="text-[10px] text-emerald-700 flex items-center gap-1 mt-0.5">
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>Open in Google Maps</span>
                                </div>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-70 group-hover:opacity-100 shrink-0 mt-0.5" />
                            </a>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Footer action icons */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-[#1a2a40]/5 flex items-center justify-between text-[10px] text-[#7a8fa8]">
                    <div className="flex items-center gap-2">
                      {msg.model && (
                        <span className="font-mono bg-[#1a2a40]/5 px-1.5 py-0.5 rounded">
                          {msg.model}
                        </span>
                      )}
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="hover:text-[#1a2a40] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-green-600" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-[#e8dfd2] text-[#1a2a40] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden shadow-xs">
                  {studentUser?.avatar ? (
                    <img
                      src={studentUser.avatar}
                      alt={studentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-bold text-xs">
                      {studentUser?.name ? studentUser.name[0] : "U"}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-[#003d80] text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#1a2a40]/10 rounded-2xl rounded-tl-xs p-4 shadow-xs flex items-center gap-2 text-xs text-[#4a5e7a]">
              <Sparkles className="w-4 h-4 text-[#003d80] animate-spin" />
              <span>
                {selectedModel === "gemini-3.1-pro-preview"
                  ? "Thinking deeply with Gemini 3.1 Pro..."
                  : useSearch
                  ? "Searching live web citations with Gemini 3.5 Flash..."
                  : useMaps
                  ? "Consulting Google Maps places..."
                  : "Drafting response with Gemini..."}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Prompts */}
      {messages.length <= 3 && (
        <div className="px-4 py-2 bg-white/60 border-t border-[#1a2a40]/10 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-[#7a8fa8] shrink-0 mr-1">
            Suggested:
          </span>
          {currentRoleDef.starters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(starter)}
              className="text-xs bg-white hover:bg-[#003d80] hover:text-white text-[#4a5e7a] border border-[#1a2a40]/15 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {starter}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-white border-t border-[#1a2a40]/10 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${currentRoleDef.label} with ${selectedModel}...`}
            disabled={isLoading}
            className="w-full bg-[#f8fafc] border border-[#1a2a40]/15 rounded-xl px-4 py-2.5 text-sm text-[#1a2a40] placeholder-[#7a8fa8] focus:outline-hidden focus:ring-2 focus:ring-[#003d80] disabled:opacity-60 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 sm:px-4 sm:py-2.5 bg-[#003d80] hover:bg-[#002d60] disabled:bg-[#7a8fa8]/40 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
