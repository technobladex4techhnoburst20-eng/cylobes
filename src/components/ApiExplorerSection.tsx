import React, { useState } from "react";
import { authStorage } from "../services/api";
import {
  Code2,
  Terminal,
  Send,
  CheckCircle,
  Copy,
  Lock,
  Globe,
  Database,
  Layers,
} from "lucide-react";

interface EndpointDef {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  category: "Authentication (JWT)" | "Quotes (CRUD)" | "Yearbook Photos (CRUD)" | "Reels & Media (Public Feed)" | "Messages & Confessions" | "Admin";
  description: string;
  isProtected?: boolean;
  sampleBody?: any;
}

const ENDPOINTS: EndpointDef[] = [
  // Auth
  {
    method: "POST",
    path: "/api/auth/register",
    category: "Authentication (JWT)",
    description: "Register a new student account, hash password with bcryptjs, issue JWT token",
    sampleBody: {
      username: "neha25",
      password: "localhost",
      name: "Neha Kulkarni",
      branch: "Computer Science",
      location: "Bengaluru",
    },
  },
  {
    method: "POST",
    path: "/api/auth/login",
    category: "Authentication (JWT)",
    description: "Authenticate student credentials with bcryptjs and return JWT signed session",
    sampleBody: {
      username: "rootname",
      password: "localhost",
    },
  },
  {
    method: "GET",
    path: "/api/auth/me",
    category: "Authentication (JWT)",
    description: "Retrieve authenticated student profile using Bearer JWT header",
    isProtected: true,
  },
  {
    method: "PUT",
    path: "/api/auth/profile",
    category: "Authentication (JWT)",
    description: "Update student bio, pronouns, or privacy settings",
    isProtected: true,
    sampleBody: {
      bio: "Updated campus bio via REST API test",
      pronouns: "She/Her",
      isPrivate: false,
    },
  },
  // Quotes CRUD
  {
    method: "GET",
    path: "/api/quotes",
    category: "Quotes (CRUD)",
    description: "Read all student quotes from the persistent database (supports ?search= query)",
  },
  {
    method: "POST",
    path: "/api/quotes",
    category: "Quotes (CRUD)",
    description: "Create a new quote on the Wall of Thoughts",
    sampleBody: {
      author: "REST Tester",
      text: "Testing our full-stack CRUD engine live on Express!",
    },
  },
  {
    method: "PUT",
    path: "/api/quotes/q-1",
    category: "Quotes (CRUD)",
    description: "Update existing quote content or author (CRUD Update)",
    sampleBody: {
      text: "The highest calculation in life is knowing which bridges to cross and which friends to keep forever (Updated).",
    },
  },
  {
    method: "DELETE",
    path: "/api/quotes/q-3",
    category: "Quotes (CRUD)",
    description: "Delete quote by ID (CRUD Delete)",
  },
  // Memories CRUD
  {
    method: "GET",
    path: "/api/memories",
    category: "Yearbook Photos (CRUD)",
    description: "Read all polaroid memories saved in database",
  },
  {
    method: "POST",
    path: "/api/memories",
    category: "Yearbook Photos (CRUD)",
    description: "Upload a new photo memory to the yearbook",
    sampleBody: {
      src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
      caption: "Hostel terrace stargazing night",
      author: "Batch of 2025",
    },
  },
  // Messages & Confessions
  {
    method: "GET",
    path: "/api/messages/public",
    category: "Messages & Confessions",
    description: "Fetch live rooftop chatter and public messages",
  },
  {
    method: "POST",
    path: "/api/messages/public",
    category: "Messages & Confessions",
    description: "Post public message to all batchmates",
    sampleBody: {
      text: "Don't forget to sign each other's shirts tomorrow! 🎓",
      senderName: "MrRobot",
    },
  },
  {
    method: "GET",
    path: "/api/messages/confessions",
    category: "Messages & Confessions",
    description: "Fetch anonymous confessions",
  },
  {
    method: "POST",
    path: "/api/messages/confessions",
    category: "Messages & Confessions",
    description: "Post anonymous confession without identity tracking",
    sampleBody: {
      text: "I took the last cup of filter coffee from the staff room in 3rd semester.",
    },
  },
  // Reels & Media Public Feed
  {
    method: "GET",
    path: "/api/media",
    category: "Reels & Media (Public Feed)",
    description: "Publicly retrieve all reels, videos, and photos (supports ?type=reel|video|photo)",
  },
  {
    method: "POST",
    path: "/api/media",
    category: "Reels & Media (Public Feed)",
    description: "Upload and publish a reel, video, or photo to the public feed",
    sampleBody: {
      type: "reel",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      caption: "Canteen celebration flash mob! 🚀",
      author: "Priya Hegde",
      tags: ["#FlashMob", "#CampusReels"],
    },
  },
  {
    method: "POST",
    path: "/api/media/med-1/like",
    category: "Reels & Media (Public Feed)",
    description: "Like or unlike a reel or video",
  },
  {
    method: "POST",
    path: "/api/media/med-1/comment",
    category: "Reels & Media (Public Feed)",
    description: "Add a comment to any public media item",
    sampleBody: {
      text: "Best memories ever with this squad!",
      authorName: "MrRobot",
    },
  },
  // Admin
  {
    method: "GET",
    path: "/api/admin/stats",
    category: "Admin",
    description: "Get real-time database collection statistics",
  },
];

export const ApiExplorerSection: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef>(ENDPOINTS[4]); // GET /api/quotes
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(ENDPOINTS[4].sampleBody || {}, null, 2)
  );
  const [executing, setExecuting] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseData, setResponseData] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);

  const token = authStorage.getToken();

  const handleSelectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : "");
    setResponseData(null);
    setResponseStatus(null);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResponseData(null);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };

      if (
        (selectedEndpoint.method === "POST" ||
          selectedEndpoint.method === "PUT" ||
          selectedEndpoint.method === "PATCH") &&
        requestBody.trim()
      ) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      const duration = Math.round(performance.now() - start);
      setLatency(duration);
      setResponseStatus(res.status);

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });
      setResponseHeaders(respHeaders);

      try {
        const json = await res.json();
        setResponseData(json);
      } catch {
        const text = await res.text();
        setResponseData(text);
      }
    } catch (err: any) {
      setResponseData({ error: err.message });
      setResponseStatus(500);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
          Architecture & Verification · ಪೂರ್ಣ ಸ್ಟ್ಯಾಕ್ API
        </span>
        <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#1a2a40]">
          RESTful API & JWT Documentation
        </h1>
        <p className="text-xs text-[#4a5e7a]">
          Live interactive tester for the Node.js Express RESTful backend with JWT authentication and CRUD operations.
        </p>
      </div>

      {/* Grid: Left List of Endpoints | Right Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Endpoints List (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#1a2a40]/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0056b3]" />
              <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                API Routes Registry
              </h2>
            </div>
            <span className="text-[10px] font-mono text-[#7a8fa8]">
              {ENDPOINTS.length} Routes
            </span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {ENDPOINTS.map((ep, idx) => {
              const isSelected =
                selectedEndpoint.path === ep.path &&
                selectedEndpoint.method === ep.method;

              const methodColors: Record<string, string> = {
                GET: "bg-blue-50 text-blue-700 border-blue-200",
                POST: "bg-green-50 text-green-700 border-green-200",
                PUT: "bg-amber-50 text-amber-700 border-amber-200",
                DELETE: "bg-red-50 text-red-700 border-red-200",
                PATCH: "bg-purple-50 text-purple-700 border-purple-200",
              };

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#f0f4f8] border-[#003d80] shadow-xs"
                      : "bg-white border-[#1a2a40]/10 hover:border-[#1a2a40]/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        methodColors[ep.method] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {ep.isProtected && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
                          <Lock className="w-2.5 h-2.5" /> JWT
                        </span>
                      )}
                      <span className="text-[10px] text-[#7a8fa8]">
                        {ep.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#1a2a40] block mt-1.5">
                    {ep.path}
                  </span>
                  <p className="text-[11px] text-[#7a8fa8] mt-0.5 line-clamp-1">
                    {ep.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Live Request & Response Inspector (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#0056b3]" />
              <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                Live Request Console
              </h2>
            </div>
            {token ? (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Token Active
              </span>
            ) : (
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Guest Mode
              </span>
            )}
          </div>

          {/* Active Route Bar */}
          <div className="flex items-center gap-2 bg-[#f0f4f8] p-2.5 rounded-xl border border-[#1a2a40]/10">
            <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#003d80] text-white">
              {selectedEndpoint.method}
            </span>
            <span className="text-xs font-mono text-[#1a2a40] flex-1">
              {selectedEndpoint.path}
            </span>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-3 h-3" />
              <span>{executing ? "Sending..." : "Execute Live"}</span>
            </button>
          </div>

          <p className="text-xs text-[#4a5e7a]">
            {selectedEndpoint.description}
          </p>

          {/* Request Payload Editor (if not GET/DELETE) */}
          {(selectedEndpoint.method === "POST" ||
            selectedEndpoint.method === "PUT" ||
            selectedEndpoint.method === "PATCH") && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#4a5e7a]">
                Request JSON Payload (Body)
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                rows={5}
                className="w-full font-mono text-xs p-3 bg-[#1a2a40] text-[#e0e8f0] rounded-xl focus:outline-hidden"
              />
            </div>
          )}

          {/* Response Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1a2a40]">
                Server Response
              </span>
              {responseStatus !== null && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      responseStatus < 300
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    HTTP {responseStatus}
                  </span>
                  {latency !== null && (
                    <span className="text-[#7a8fa8]">{latency}ms</span>
                  )}
                </div>
              )}
            </div>

            <pre className="p-4 rounded-xl bg-[#1a2a40] text-emerald-400 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-[#1a2a40]/20">
              {responseData !== null
                ? JSON.stringify(responseData, null, 2)
                : '// Click "Execute Live" to test this REST route in real time'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
