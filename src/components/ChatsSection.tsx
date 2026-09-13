import React, { useState, useEffect } from "react";
import { User, PublicMessage, PrivateMessage, Confession, ChatRequest } from "../types";
import { api } from "../services/api";
import { EmojiToolbar } from "./EmojiToolbar";
import {
  Lock,
  UserPlus,
  LogIn,
  User as UserIcon,
  MessageCircle,
  MessageSquare,
  Users,
  Sparkles,
  Send,
  Eye,
  EyeOff,
  Shield,
  Search,
  CheckCircle2,
  Trash2,
  Flag,
  Music,
  Camera,
  Bot,
  RefreshCw,
  Clock,
  Check,
  X,
  UserCheck,
  Inbox,
  Smile,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../firebase/AuthContext";
import {
  subscribeToPublicMessages,
  sendPublicMessageToFirestore,
  deletePublicMessageFromFirestore,
} from "../firebase/firestoreService";

interface ChatsSectionProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  onOpenProfilePic?: () => void;
}

export const ChatsSection: React.FC<ChatsSectionProps> = ({
  currentUser,
  setCurrentUser,
  onOpenProfilePic,
}) => {
  const { studentUser, signInWithGoogle, logout: googleLogout, signUpWithEmail, signInWithEmail } = useAuth();
  const effectiveUser = studentUser || currentUser;

  // Auth state
  const [authTab, setAuthTab] = useState<"login" | "register" | "profile">("login");
  const [chatTab, setChatTab] = useState<"public" | "private" | "confessions" | "directory">("public");

  // Private messages state
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [privateInput, setPrivateInput] = useState("");
  const [loadingPrivateMsgs, setLoadingPrivateMsgs] = useState(false);
  const [privateError, setPrivateError] = useState<string | null>(null);

  // Chat Requests state (Request / Accept flow)
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [privateSubView, setPrivateSubView] = useState<"chat" | "requests">("chat");
  const [requestFilter, setRequestFilter] = useState<"received" | "sent">("received");

  // Login form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBranch, setRegBranch] = useState("Computer Science & Engineering");
  const [regLocation, setRegLocation] = useState("Bengaluru");
  const [regDob, setRegDob] = useState("");
  const [regPronouns, setRegPronouns] = useState("They/Them");
  const [regBio, setRegBio] = useState("");
  const [regAvatar, setRegAvatar] = useState(
    "https://www.ghibli.jp/gallery/howl005.jpg"
  );
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Profile Edit form
  const [profileBio, setProfileBio] = useState(currentUser?.bio || "");
  const [profilePronouns, setProfilePronouns] = useState(currentUser?.pronouns || "");
  const [profilePrivate, setProfilePrivate] = useState(currentUser?.isPrivate || false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Public messages
  const [publicMessages, setPublicMessages] = useState<PublicMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [msgSenderName, setMsgSenderName] = useState("");

  // Confessions
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [confessionInput, setConfessionInput] = useState("");
  const [confessionFeedback, setConfessionFeedback] = useState<string | null>(null);

  // Directory
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);

  // Load chat data
  const loadPublicMessages = async () => {
    try {
      const data = await api.getPublicMessages();
      setPublicMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadConfessions = async () => {
    try {
      const data = await api.getConfessions();
      setConfessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDirectory = async (q: string = "") => {
    try {
      const users = await api.searchDirectory(q);
      setDirectoryUsers(users);
      if (!selectedRecipient && users.length > 0) {
        const other = users.find((u) => u.id !== currentUser?.id) || users[0];
        setSelectedRecipient(other);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPrivateMessages = async (targetUid: string) => {
    try {
      setLoadingPrivateMsgs(true);
      setPrivateError(null);
      const data = await api.getPrivateMessages(targetUid);
      setPrivateMessages(data);
    } catch (err: any) {
      console.warn("Private messages fetch note:", err);
      setPrivateError(err.message || "Failed to load private messages");
    } finally {
      setLoadingPrivateMsgs(false);
    }
  };

  const handleSendPrivateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateInput.trim() || !selectedRecipient) return;

    if (!currentUser) {
      alert("Please sign in or register with your student account to send private messages.");
      return;
    }

    try {
      const sent = await api.sendPrivateMessage(selectedRecipient.id, privateInput.trim());
      setPrivateMessages((prev) => [...prev, sent]);
      setPrivateInput("");
    } catch (err: any) {
      alert(err.message || "Failed to send private message");
    }
  };

  // Chat Requests API handlers
  const loadChatRequests = async () => {
    if (!currentUser) return;
    try {
      setLoadingRequests(true);
      const reqs = await api.getChatRequests();
      setChatRequests(reqs);
    } catch (err) {
      console.warn("Could not load chat requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSendChatRequest = async (recipientId: string) => {
    if (!currentUser) {
      alert("Please sign in with your student account to send chat requests.");
      return;
    }
    try {
      await api.sendChatRequest(recipientId);
      await loadChatRequests();
      confetti({ particleCount: 30, spread: 50 });
    } catch (err: any) {
      alert(err.message || "Failed to send chat request");
    }
  };

  const handleRespondChatRequest = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      await api.respondChatRequest(requestId, status);
      await loadChatRequests();
      if (status === "accepted") {
        confetti({ particleCount: 45, spread: 60 });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update chat request");
    }
  };

  const handleCancelChatRequest = async (requestId: string) => {
    try {
      await api.cancelChatRequest(requestId);
      await loadChatRequests();
    } catch (err: any) {
      alert(err.message || "Failed to cancel chat request");
    }
  };

  const getRequestWithUser = (targetId: string) => {
    if (!currentUser) return null;
    return chatRequests.find(
      (r) =>
        (r.senderId === currentUser.id && r.recipientId === targetId) ||
        (r.senderId === targetId && r.recipientId === currentUser.id)
    );
  };

  const incomingRequests = chatRequests.filter(
    (r) => r.status === "pending" && r.recipientId === currentUser?.id
  );
  const outgoingRequests = chatRequests.filter(
    (r) => r.status === "pending" && r.senderId === currentUser?.id
  );
  const acceptedRequests = chatRequests.filter((r) => r.status === "accepted");

  // Poll for new private messages when private chat tab is open
  useEffect(() => {
    if (chatTab === "private" && selectedRecipient && currentUser) {
      const rel = getRequestWithUser(selectedRecipient.id);
      if (rel?.status === "accepted") {
        loadPrivateMessages(selectedRecipient.id);
        const interval = setInterval(() => {
          loadPrivateMessages(selectedRecipient.id);
        }, 4000);
        return () => clearInterval(interval);
      }
    }
  }, [chatTab, selectedRecipient?.id, currentUser?.id, chatRequests]);

  // Load chat requests on user change or periodic check
  useEffect(() => {
    if (currentUser) {
      loadChatRequests();
      const interval = setInterval(loadChatRequests, 6000);
      return () => clearInterval(interval);
    } else {
      setChatRequests([]);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadPublicMessages();
    loadConfessions();
    loadDirectory();

    // Subscribe to Firestore for real-time live synchronization
    const unsubscribe = subscribeToPublicMessages((fsMsgs) => {
      if (fsMsgs && fsMsgs.length > 0) {
        setPublicMessages((prev) => {
          const map = new Map<string, PublicMessage>();
          prev.forEach((m) => map.set(m.id, m));
          fsMsgs.forEach((fm) => {
            map.set(fm.id, {
              id: fm.id,
              text: fm.text,
              sender: fm.sender,
              senderName: fm.senderName,
              timestamp: fm.timestamp,
            });
          });
          return Array.from(map.values()).sort(
            (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
          );
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      setProfileBio(currentUser.bio || "");
      setProfilePronouns(currentUser.pronouns || "");
      setProfilePrivate(currentUser.isPrivate);
    }
  }, [currentUser]);

  // Handle Login (POST /api/auth/login + Firebase Auth)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      setLoginLoading(true);

      // Attempt Firebase Authentication
      const email = loginUsername.includes("@")
        ? loginUsername.trim()
        : `${loginUsername.trim().toLowerCase()}@campus.edu`;
      try {
        await signInWithEmail(email, loginPassword);
      } catch (fbErr: any) {
        console.warn("Firebase email login notice:", fbErr.message);
      }

      const res = await api.login({
        username: loginUsername.trim(),
        password: loginPassword,
      });
      setCurrentUser(res.user);
      confetti({ particleCount: 35, spread: 50 });
    } catch (err: any) {
      setLoginError(err.message || "Failed to log in");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register (POST /api/auth/register + Firebase Auth & Firestore)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    try {
      setRegLoading(true);

      // 1. Create User in Firebase Auth & store in Firestore
      const email = regUsername.includes("@")
        ? regUsername.trim()
        : `${regUsername.trim().toLowerCase()}@campus.edu`;

      try {
        await signUpWithEmail({
          email,
          password: regPassword,
          name: regName.trim(),
          branch: regBranch,
          bio: regBio.trim(),
          avatar: regAvatar,
        });
      } catch (fbErr: any) {
        console.warn("Firebase sign up notice:", fbErr.message);
      }

      // 2. Also register in local/Express backend
      const res = await api.register({
        username: regUsername.trim(),
        password: regPassword,
        name: regName.trim(),
        phone: regPhone.trim(),
        branch: regBranch,
        location: regLocation,
        dob: regDob,
        pronouns: regPronouns,
        bio: regBio.trim(),
        avatar: regAvatar,
      });
      setCurrentUser(res.user);
      confetti({ particleCount: 50, spread: 70 });
    } catch (err: any) {
      setRegError(err.message || "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  // Handle Profile Update (PUT /api/auth/profile)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile({
        bio: profileBio,
        pronouns: profilePronouns,
        isPrivate: profilePrivate,
      });
      setCurrentUser(updated);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  // Send Public Message (POST /api/messages/public & Firestore)
  const handleSendPublicMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;

    const senderId = effectiveUser?.id || "guest";
    const senderName = effectiveUser?.name || msgSenderName.trim() || "Batchmate";
    const senderAvatar =
      effectiveUser?.avatar || "https://www.ghibli.jp/gallery/howl005.jpg";

    try {
      // 1. Write to Firestore for cloud live persistence
      try {
        await sendPublicMessageToFirestore(
          msgInput.trim(),
          senderId,
          senderName,
          senderAvatar
        );
      } catch (fsErr) {
        console.warn("Firestore send note:", fsErr);
      }

      // 2. Also write to backend API
      const newMsg = await api.sendPublicMessage(
        msgInput.trim(),
        senderName
      );
      setPublicMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setMsgInput("");
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    }
  };

  // Delete Public Message (DELETE /api/messages/public/:id)
  const handleDeletePublicMessage = async (id: string) => {
    try {
      try {
        await api.deletePublicMessage(id);
      } catch (err) {
        console.warn("Local DB delete failed, trying Firestore...", err);
      }
      try {
        await deletePublicMessageFromFirestore(id);
      } catch (err) {
        console.warn("Firestore delete failed", err);
      }
      setPublicMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert("Failed to delete message");
    }
  };

  // Send Confession (POST /api/messages/confessions)
  const handleSendConfession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confessionInput.trim()) return;

    try {
      const newConf = await api.sendConfession(confessionInput.trim());
      setConfessions([newConf, ...confessions]);
      setConfessionInput("");
      setConfessionFeedback("Your anonymous confession was sealed in the stars ✨");
      setTimeout(() => setConfessionFeedback(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to submit confession");
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#0056b3] font-semibold">
          Archive 02 · ಆರ್ಕೈವ್ ೦೨
        </span>
        <h1 className="font-['Cormorant_Garamond',serif] text-4xl sm:text-5xl font-semibold text-[#1a2a40]">
          Night Chats & The Sky
        </h1>
        <p className="font-['Noto_Sans_Kannada'] text-sm text-[#4a5e7a]">
          ರಾತ್ರಿ ಚಾಟ್ ಮತ್ತು ಆಕಾಶದ ಅಡಿಯಲ್ಲಿ ಮಾತುಕತೆ
        </p>
      </div>

      {/* Grid: Left Column (JWT Auth & Profile) | Right Column (Chat Feeds) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: JWT AUTH & PROFILE MANAGER (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-3">
            <div className="flex items-center gap-2 text-[#003d80]">
              <Shield className="w-4 h-4 text-[#0056b3]" />
              <h2 className="font-['Cormorant_Garamond',serif] text-xl font-semibold text-[#1a2a40]">
                Student Authentication (JWT)
              </h2>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#0056b3]/10 text-[#003d80] font-bold">
              Secure
            </span>
          </div>

          {/* Auth Tabs */}
          <div className="flex rounded-lg bg-[#f0f4f8] p-1 text-xs">
            <button
              onClick={() => setAuthTab("login")}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                authTab === "login"
                  ? "bg-white text-[#003d80] shadow-xs"
                  : "text-[#4a5e7a] hover:text-[#003d80]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthTab("register")}
              className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                authTab === "register"
                  ? "bg-white text-[#003d80] shadow-xs"
                  : "text-[#4a5e7a] hover:text-[#003d80]"
              }`}
            >
              Register
            </button>
            {currentUser && (
              <button
                onClick={() => setAuthTab("profile")}
                className={`flex-1 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                  authTab === "profile"
                    ? "bg-white text-[#003d80] shadow-xs"
                    : "text-[#4a5e7a] hover:text-[#003d80]"
                }`}
              >
                My Profile
              </button>
            )}
          </div>

          {/* AUTH CONTENT BASED ON TAB */}
          {authTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {currentUser ? (
                <div className="bg-[#0056b3]/5 border border-[#0056b3]/20 rounded-xl p-4 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-[#0056b3] mx-auto" />
                  <p className="text-xs font-semibold text-[#1a2a40]">
                    Logged in as {currentUser.name} ({currentUser.username})
                  </p>
                  <p className="text-[11px] font-mono text-[#0056b3]">UID: {currentUser.id}</p>
                  <p className="text-[11px] text-[#4a5e7a]">{currentUser.branch}</p>
                  <button
                    type="button"
                    onClick={() => setAuthTab("profile")}
                    className="text-xs text-[#0056b3] font-medium underline block mx-auto cursor-pointer"
                  >
                    View & Edit Profile
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. rootname (demo: rootname)"
                      className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="•••••••• (demo: localhost)"
                        className="w-full text-xs px-3 py-2 pr-9 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a8fa8] hover:text-[#1a2a40]"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-2 px-4 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loginLoading ? "Authenticating..." : "Sign In with JWT"}
                  </button>

                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#1a2a40]/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-white px-2 text-[#7a8fa8]">Or Sign In With</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                      } catch (err: any) {
                        const isUnauthorized =
                          err?.code === "auth/unauthorized-domain" ||
                          err?.message?.includes("unauthorized-domain");
                        if (isUnauthorized) {
                          const host = window.location.hostname;
                          alert(
                            `Google Sign-In Error (auth/unauthorized-domain):\n\nYour current domain "${host}" is not authorized in Firebase Console.\n\nInstant Fallback: You can sign in immediately using Email & Password or demo credentials (rootname / localhost) without needing domain authorization.`
                          );
                        } else {
                          alert(err?.message || "Google Sign-In failed.");
                        }
                      }
                    }}
                    className="w-full py-2 px-3 bg-white border border-[#1a2a40]/20 hover:bg-[#f0f4f8] text-[#1a2a40] text-xs font-medium rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Google Sign-In (Firebase Auth)</span>
                  </button>

                  <div className="text-[11px] text-center text-[#7a8fa8]">
                    Tip: Demo credentials: <code className="text-[#0056b3]">rootname</code> / <code className="text-[#0056b3]">localhost</code>
                  </div>
                </>
              )}
            </form>
          )}

          {authTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. rohan25"
                    className="w-full text-xs px-2.5 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden focus:border-[#003d80]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full text-xs px-2.5 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden focus:border-[#003d80]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full text-xs px-2.5 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden focus:border-[#003d80]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 9..."
                    className="w-full text-xs px-2.5 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Branch
                  </label>
                  <select
                    value={regBranch}
                    onChange={(e) => setRegBranch(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden"
                  >
                    <option>Computer Science & Engineering</option>
                    <option>Electronics & Communication</option>
                    <option>Mechanical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Information Science</option>
                    <option>Biotechnology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Home City
                  </label>
                  <input
                    type="text"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    placeholder="e.g. Mysuru"
                    className="w-full text-xs px-2.5 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                    Pronouns
                  </label>
                  <select
                    value={regPronouns}
                    onChange={(e) => setRegPronouns(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden"
                  >
                    <option>He/Him</option>
                    <option>She/Her</option>
                    <option>They/Them</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4a5e7a] mb-0.5">
                  Bio / Hostel Memory
                </label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Tell your batchmates who you are..."
                  rows={2}
                  className="w-full text-xs p-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-md focus:outline-hidden"
                />
              </div>

              {regError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md">
                  {regError}
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-2 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {regLoading ? "Registering..." : "Create Student Account"}
              </button>
            </form>
          )}

          {authTab === "profile" && currentUser && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[#f0f4f8] rounded-xl border border-[#1a2a40]/10">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img
                      src={currentUser.avatar || "https://www.ghibli.jp/gallery/howl005.jpg"}
                      alt={currentUser.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-[#003d80] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={onOpenProfilePic}
                      className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Update Profile Picture"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1a2a40]">{currentUser.name}</h3>
                    <p className="text-xs text-[#0056b3] font-mono">{currentUser.id}</p>
                    <p className="text-[11px] text-[#7a8fa8]">{currentUser.branch}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfilePic}
                  className="px-3 py-1.5 bg-white border border-[#003d80]/20 hover:border-[#003d80] text-[#003d80] text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Change Photo</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                  Bio & Hostel Catchphrase
                </label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  className="w-full text-xs p-2.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4a5e7a] mb-1">
                  Pronouns
                </label>
                <input
                  type="text"
                  value={profilePronouns}
                  onChange={(e) => setProfilePronouns(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-check"
                  checked={profilePrivate}
                  onChange={(e) => setProfilePrivate(e.target.checked)}
                  className="w-4 h-4 rounded text-[#003d80]"
                />
                <label htmlFor="private-check" className="text-xs text-[#4a5e7a]">
                  Make contact info private in campus directory
                </label>
              </div>

              {profileSuccess && (
                <div className="text-xs text-[#0056b3] bg-[#0056b3]/10 p-2.5 rounded-lg">
                  {profileSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors cursor-pointer"
              >
                Save Profile Changes (PUT)
              </button>
            </form>
          )}
        </div>

        {/* RIGHT: LIVE NIGHT CHATS & CONFESSIONS (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#1a2a40]/10 p-6 shadow-xs space-y-6">
          {/* Chat Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#1a2a40]/10 pb-3 gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setChatTab("public")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chatTab === "public"
                    ? "bg-[#003d80] text-white shadow-2xs"
                    : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Public Rooftop ({publicMessages.length})</span>
              </button>
              <button
                onClick={() => setChatTab("private")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chatTab === "private"
                    ? "bg-[#003d80] text-white shadow-2xs"
                    : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Private Chat (DMs)</span>
                {incomingRequests.length > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-full animate-pulse shadow-2xs">
                    {incomingRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setChatTab("confessions")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chatTab === "confessions"
                    ? "bg-[#003d80] text-white shadow-2xs"
                    : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Confessions ({confessions.length})</span>
              </button>
              <button
                onClick={() => setChatTab("directory")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  chatTab === "directory"
                    ? "bg-[#003d80] text-white shadow-2xs"
                    : "text-[#4a5e7a] hover:bg-[#f0f4f8]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Directory</span>
              </button>
            </div>
            <button
              onClick={() => {
                loadPublicMessages();
                loadConfessions();
                loadDirectory();
                loadChatRequests();
                if (selectedRecipient) loadPrivateMessages(selectedRecipient.id);
              }}
              className="text-[11px] text-[#0056b3] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>

          {/* TAB 1: PUBLIC ROOFTOP FEED */}
          {chatTab === "public" && (
            <div className="space-y-4">
              {/* Public Chat Header Banner */}
              <div className="bg-[#f0f4f8] border border-[#1a2a40]/10 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#003d80]/10 rounded-lg text-[#003d80]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#1a2a40]">Public Chat · Rooftop Feed (ಬ್ಯಾಚ್ ಚಾಟ್)</h4>
                    <p className="text-[11px] text-[#4a5e7a]">
                      Open wall for the entire graduating batch. Every senior can see and reply here.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-[#003d80] text-white px-2 py-0.5 rounded-full shadow-2xs">
                  Public
                </span>
              </div>

              <div className="h-96 overflow-y-auto space-y-3 p-3 bg-[#f0f4f8] rounded-xl border border-[#1a2a40]/10">
                {publicMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-[#7a8fa8]">
                    No messages yet. Send a whisper to the stars!
                  </div>
                ) : (
                  publicMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white p-3.5 rounded-xl border border-[#1a2a40]/10 shadow-2xs space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#003d80]">
                          {msg.senderName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#7a8fa8]">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <button
                            onClick={() => handleDeletePublicMessage(msg.id)}
                            title="Delete message"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#2a2a2a] leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input Component with Emoji Toolbar */}
              <form onSubmit={handleSendPublicMessage} className="space-y-2">
                {!currentUser && (
                  <input
                    type="text"
                    value={msgSenderName}
                    onChange={(e) => setMsgSenderName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="w-full text-xs px-3 py-1.5 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden"
                  />
                )}

                {/* Night Chat Emoji Options */}
                <EmojiToolbar
                  onSelectEmoji={(emoji) => setMsgInput((prev) => prev + emoji)}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Whisper something to the batch..."
                    className="flex-1 text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-[#003d80] text-white rounded-lg hover:bg-[#0056b3] transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: PRIVATE DIRECT MESSAGES (1-on-1) & REQUESTS */}
          {chatTab === "private" && (
            <div className="space-y-4">
              {/* Private Chat Header Banner */}
              <div className="bg-gradient-to-r from-[#002b5c] to-[#003d80] text-white p-4 rounded-xl shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-white/10 rounded-lg">
                      <Lock className="w-4 h-4 text-[#80bdff]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold">Private Chat · Direct Messages (ಖಾಸಗಿ ಚಾಟ್)</h4>
                      <p className="text-[11px] text-[#cfd8dc]">
                        Safe, request-based 1-on-1 direct conversations between batchmates.
                      </p>
                    </div>
                  </div>

                  {/* Sub-view switcher */}
                  <div className="flex items-center bg-black/20 p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setPrivateSubView("chat")}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                        privateSubView === "chat"
                          ? "bg-white text-[#002b5c] shadow-2xs"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Direct Messages</span>
                    </button>
                    <button
                      onClick={() => setPrivateSubView("requests")}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                        privateSubView === "requests"
                          ? "bg-white text-[#002b5c] shadow-2xs"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Requests</span>
                      {incomingRequests.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full">
                          {incomingRequests.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SUB-VIEW 1: REQUESTS MANAGEMENT */}
              {privateSubView === "requests" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1a2a40]/10 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRequestFilter("received")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          requestFilter === "received"
                            ? "bg-[#003d80] text-white"
                            : "bg-[#f0f4f8] text-[#4a5e7a] hover:bg-[#e2eaf2]"
                        }`}
                      >
                        Received Requests ({incomingRequests.length})
                      </button>
                      <button
                        onClick={() => setRequestFilter("sent")}
                        className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          requestFilter === "sent"
                            ? "bg-[#003d80] text-white"
                            : "bg-[#f0f4f8] text-[#4a5e7a] hover:bg-[#e2eaf2]"
                        }`}
                      >
                        Sent Requests ({outgoingRequests.length})
                      </button>
                    </div>

                    <button
                      onClick={loadChatRequests}
                      className="text-[11px] text-[#0056b3] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingRequests ? "animate-spin" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {requestFilter === "received" ? (
                    <div className="space-y-3 min-h-[220px]">
                      {incomingRequests.length === 0 ? (
                        <div className="p-8 text-center bg-[#f8fafc] border border-dashed border-[#1a2a40]/15 rounded-xl space-y-1 text-[#7a8fa8]">
                          <Inbox className="w-8 h-8 text-[#003d80]/30 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-[#1a2a40]">No pending chat requests</p>
                          <p className="text-[11px]">When classmates send you an invitation to connect, it will appear here.</p>
                        </div>
                      ) : (
                        incomingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white border border-[#1a2a40]/10 p-3.5 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={req.senderAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                                alt={req.senderName}
                                className="w-10 h-10 rounded-full object-cover border border-[#003d80]/20"
                              />
                              <div>
                                <h5 className="text-xs font-bold text-[#1a2a40]">{req.senderName}</h5>
                                <span className="text-[11px] text-[#4a5e7a] block">
                                  {req.senderBranch} · {new Date(req.createdAt).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1 font-medium border border-amber-200">
                                  Wants to connect privately
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleRespondChatRequest(req.id, "accepted")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => handleRespondChatRequest(req.id, "rejected")}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Decline</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 min-h-[220px]">
                      {outgoingRequests.length === 0 ? (
                        <div className="p-8 text-center bg-[#f8fafc] border border-dashed border-[#1a2a40]/15 rounded-xl space-y-1 text-[#7a8fa8]">
                          <Clock className="w-8 h-8 text-[#003d80]/30 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-[#1a2a40]">No outgoing requests</p>
                          <p className="text-[11px]">You have not sent any pending chat requests to batchmates.</p>
                        </div>
                      ) : (
                        outgoingRequests.map((req) => (
                          <div
                            key={req.id}
                            className="bg-white border border-[#1a2a40]/10 p-3.5 rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={req.recipientAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                                alt={req.recipientName}
                                className="w-10 h-10 rounded-full object-cover border border-[#003d80]/20"
                              />
                              <div>
                                <h5 className="text-xs font-bold text-[#1a2a40]">{req.recipientName}</h5>
                                <span className="text-[11px] text-[#4a5e7a] block">
                                  {req.recipientBranch} · Sent {new Date(req.createdAt).toLocaleDateString()}
                                </span>
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-1 font-medium border border-amber-200">
                                  Awaiting approval ⏳
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleCancelChatRequest(req.id)}
                              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                            >
                              Cancel Request
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-VIEW 2: DIRECT MESSAGING */}
              {privateSubView === "chat" && (
                <>
                  {/* Pending Requests Alert Banner */}
                  {incomingRequests.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs text-amber-900">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-amber-700" />
                        <span>
                          <strong>{incomingRequests.length}</strong> new chat request(s) waiting for you.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setPrivateSubView("requests");
                          setRequestFilter("received");
                        }}
                        className="font-semibold text-amber-900 hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <span>Review Requests →</span>
                      </button>
                    </div>
                  )}

                  {/* Classmates Quick Selector Bar */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-[#4a5e7a] font-semibold">
                        <Users className="w-3.5 h-3.5 text-[#003d80]" />
                        <span>Select a classmate:</span>
                      </div>
                      <div className="relative">
                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7a8fa8]" />
                        <input
                          type="text"
                          value={directoryQuery}
                          onChange={(e) => {
                            setDirectoryQuery(e.target.value);
                            loadDirectory(e.target.value);
                          }}
                          placeholder="Find by Unique Code (UID) or Name..."
                          className="w-full sm:w-64 pl-7 pr-3 py-1.5 text-[11px] bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                      {directoryUsers
                        .filter((u) => u.id !== currentUser?.id)
                        .map((u) => {
                          const isSelected = selectedRecipient?.id === u.id;
                          const rel = getRequestWithUser(u.id);
                          const isConnected = rel?.status === "accepted";
                          const isPending = rel?.status === "pending";

                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                setSelectedRecipient(u);
                                if (isConnected) loadPrivateMessages(u.id);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer border ${
                                isSelected
                                  ? "bg-[#003d80] text-white border-[#003d80] shadow-2xs"
                                  : "bg-[#f0f4f8] text-[#1a2a40] border-[#1a2a40]/10 hover:bg-[#e2eaf2]"
                              }`}
                            >
                              <div className="relative">
                                <img
                                  src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                                  alt={u.name}
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                                {isConnected && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
                                )}
                                {isPending && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full border border-white" />
                                )}
                              </div>
                              <span>{u.name.split(" ")[0]}</span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : isConnected
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-[#003d80]/10 text-[#003d80]"
                                }`}
                              >
                                {isConnected ? "Connected" : isPending ? "Pending" : u.branch.split(" ")[0]}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Not Logged In Warning Card */}
                  {!currentUser ? (
                    <div className="bg-[#fffbf0] border border-[#f0e6d2] p-5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                        <Shield className="w-4 h-4 text-amber-700" />
                        <span>Student Sign-In Required for Private DMs</span>
                      </div>
                      <p className="text-xs text-[#4a5e7a] leading-relaxed">
                        Direct messages are secured with authentication between verified batchmates. Please sign in using the student portal on the left, or click a demo account below to log in instantly.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          onClick={async () => {
                            setLoginUsername("arjun");
                            setLoginPassword("password123");
                            const res = await api.login({ username: "arjun", password: "password123" });
                            setCurrentUser(res.user);
                            confetti({ particleCount: 30, spread: 45 });
                          }}
                          className="px-3 py-1.5 bg-[#003d80] text-white hover:bg-[#0056b3] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login as Arjun (Demo)</span>
                        </button>
                        <button
                          onClick={async () => {
                            setLoginUsername("priya");
                            setLoginPassword("password123");
                            const res = await api.login({ username: "priya", password: "password123" });
                            setCurrentUser(res.user);
                            confetti({ particleCount: 30, spread: 45 });
                          }}
                          className="px-3 py-1.5 bg-[#1a2a40] text-white hover:bg-[#2c3e5a] text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Login as Priya (Demo)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedRecipient ? (
                        (() => {
                          const rel = getRequestWithUser(selectedRecipient.id);
                          const isAccepted = rel?.status === "accepted";
                          const isPendingFromMe = rel?.status === "pending" && rel.senderId === currentUser.id;
                          const isPendingToMe = rel?.status === "pending" && rel.recipientId === currentUser.id;

                          if (isAccepted) {
                            return (
                              <div className="space-y-3">
                                {/* Conversation Header */}
                                <div className="flex items-center justify-between bg-[#f0f4f8] p-3 rounded-xl border border-[#1a2a40]/10">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={selectedRecipient.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                                      alt={selectedRecipient.name}
                                      className="w-8 h-8 rounded-full object-cover border border-[#003d80]/30"
                                    />
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-[#1a2a40]">{selectedRecipient.name}</span>
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                                          <Check className="w-2.5 h-2.5" /> Connected
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-[#4a5e7a] block">
                                        {selectedRecipient.branch} · {selectedRecipient.location}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => loadPrivateMessages(selectedRecipient.id)}
                                    title="Refresh messages"
                                    className="p-1.5 text-[#003d80] hover:bg-white rounded-lg transition-colors cursor-pointer"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPrivateMsgs ? "animate-spin" : ""}`} />
                                  </button>
                                </div>

                                {/* Message Thread Box */}
                                <div className="h-80 overflow-y-auto space-y-2.5 p-3 bg-[#f8fafc] rounded-xl border border-[#1a2a40]/10">
                                  {privateMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#7a8fa8] space-y-1">
                                      <MessageCircle className="w-8 h-8 text-[#003d80]/30 mb-1" />
                                      <p className="text-xs font-medium text-[#1a2a40]">No private messages with {selectedRecipient.name} yet</p>
                                      <p className="text-[11px] text-[#7a8fa8]">
                                        Your connection is active! Say hello or share a campus memory.
                                      </p>
                                    </div>
                                  ) : (
                                    privateMessages.map((msg) => {
                                      const isMine = msg.sender === currentUser.id;
                                      return (
                                        <div
                                          key={msg.id}
                                          className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                                        >
                                          <div
                                            className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                              isMine
                                                ? "bg-[#003d80] text-white rounded-br-xs"
                                                : "bg-white text-[#1a2a40] border border-[#1a2a40]/10 rounded-bl-xs"
                                            }`}
                                          >
                                            <p>{msg.text}</p>
                                          </div>
                                          <span className="text-[9px] text-[#7a8fa8] mt-1 px-1">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>

                                {/* Emoji Toolbar for Private Chat */}
                                <EmojiToolbar
                                  onSelectEmoji={(emoji) => setPrivateInput((prev) => prev + emoji)}
                                />

                                {/* Private Message Input */}
                                <form onSubmit={handleSendPrivateMessage} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={privateInput}
                                    onChange={(e) => setPrivateInput(e.target.value)}
                                    placeholder={`Message ${selectedRecipient.name.split(" ")[0]} privately...`}
                                    className="flex-1 text-xs px-3 py-2 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!privateInput.trim()}
                                    className="px-3.5 py-2 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <span>Send</span>
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              </div>
                            );
                          }

                          if (isPendingToMe && rel) {
                            return (
                              <div className="p-6 bg-[#f8fafc] border border-[#1a2a40]/15 rounded-2xl text-center space-y-4 shadow-2xs">
                                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                                  <Inbox className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-[#1a2a40]">
                                    {selectedRecipient.name} wants to chat privately
                                  </h4>
                                  <p className="text-xs text-[#4a5e7a] max-w-sm mx-auto">
                                    Accept their chat request to unlock your 1-on-1 private messaging thread.
                                  </p>
                                </div>
                                <div className="flex items-center justify-center gap-3 pt-1">
                                  <button
                                    onClick={() => handleRespondChatRequest(rel.id, "accepted")}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Accept Chat Request</span>
                                  </button>
                                  <button
                                    onClick={() => handleRespondChatRequest(rel.id, "rejected")}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Decline</span>
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          if (isPendingFromMe && rel) {
                            return (
                              <div className="p-6 bg-[#fffbf0] border border-[#f0e6d2] rounded-2xl text-center space-y-4 shadow-2xs">
                                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                                  <Clock className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-sm font-bold text-[#1a2a40]">
                                    Chat Request Sent to {selectedRecipient.name}
                                  </h4>
                                  <p className="text-xs text-[#4a5e7a] max-w-sm mx-auto">
                                    Waiting for {selectedRecipient.name.split(" ")[0]} to accept your invitation. Once accepted, you can direct message here.
                                  </p>
                                </div>
                                <div className="pt-1">
                                  <button
                                    onClick={() => handleCancelChatRequest(rel.id)}
                                    className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                                  >
                                    Cancel Request
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          // No relationship or not accepted yet
                          return (
                            <div className="p-6 bg-[#f8fafc] border border-[#1a2a40]/15 rounded-2xl text-center space-y-4 shadow-2xs">
                              <div className="w-12 h-12 bg-[#003d80]/10 text-[#003d80] rounded-full flex items-center justify-center mx-auto">
                                <UserCheck className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold text-[#1a2a40]">
                                  Connect with {selectedRecipient.name}
                                </h4>
                                <p className="text-xs text-[#4a5e7a] max-w-md mx-auto">
                                  To ensure privacy and safety in Night Chats, private 1-on-1 messaging requires sending and accepting a chat request first.
                                </p>
                              </div>
                              <div className="pt-1">
                                <button
                                  onClick={() => handleSendChatRequest(selectedRecipient.id)}
                                  className="px-5 py-2.5 bg-[#003d80] hover:bg-[#0056b3] text-white text-xs font-semibold rounded-xl flex items-center gap-2 mx-auto transition-colors cursor-pointer shadow-2xs"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  <span>Send Chat Request 🤝</span>
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-4 bg-[#f0f4f8] rounded-xl text-[#7a8fa8]">
                          <Users className="w-8 h-8 text-[#003d80]/30 mb-2" />
                          <p className="text-xs font-semibold text-[#1a2a40]">No batchmate selected</p>
                          <p className="text-[11px] text-[#7a8fa8]">Select a student from the pills above or from the Directory tab to begin chatting.</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: ANONYMOUS CONFESSIONS */}
          {chatTab === "confessions" && (
            <div className="space-y-4">
              <div className="bg-[#1a2a40] text-white p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#80bdff]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Anonymous Confession Star</span>
                </div>
                <p className="text-[11px] text-[#cfd8dc] leading-relaxed">
                  Confess that secret crush, lab mishap, or silent thank-you. No identity is tracked or stored.
                </p>
              </div>

              <form onSubmit={handleSendConfession} className="space-y-2">
                <EmojiToolbar
                  onSelectEmoji={(emoji) => setConfessionInput((prev) => prev + emoji)}
                />
                <textarea
                  value={confessionInput}
                  onChange={(e) => setConfessionInput(e.target.value)}
                  placeholder="Write your anonymous confession here..."
                  rows={3}
                  className="w-full text-xs p-3 bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-xl focus:outline-hidden focus:border-[#003d80]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#7a8fa8]">100% Anonymous</span>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#003d80] text-white text-xs font-medium rounded-lg hover:bg-[#0056b3] cursor-pointer"
                  >
                    Release Confession ✨
                  </button>
                </div>
              </form>

              {confessionFeedback && (
                <div className="text-xs text-[#0056b3] bg-[#0056b3]/10 p-2 rounded-lg">
                  {confessionFeedback}
                </div>
              )}

              <div className="space-y-3 pt-2">
                {confessions.map((conf) => (
                  <div
                    key={conf.id}
                    className="bg-[#fffbf0] border border-[#f0e6d2] p-4 rounded-xl shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#7a8fa8]">
                      <span>Anonymous Batchmate</span>
                      <span>{new Date(conf.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="font-['Caveat',cursive] text-lg text-[#1a2a40] leading-snug">
                      "{conf.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CAMPUS DIRECTORY */}
          {chatTab === "directory" && (
            <div className="space-y-4">
              {/* Directory Header Banner */}
              <div className="bg-[#f0f4f8] border border-[#1a2a40]/10 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#003d80]/10 rounded-lg text-[#003d80]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#1a2a40]">Student Directory & Profiles</h4>
                    <p className="text-[11px] text-[#4a5e7a]">
                      Verified members of the graduating batch. Click "Chat Privately" to send a direct message.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-[#003d80] text-white px-2 py-0.5 rounded-full shadow-2xs">
                  {directoryUsers.length} Students
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8fa8]" />
                <input
                  type="text"
                  value={directoryQuery}
                  onChange={(e) => {
                    setDirectoryQuery(e.target.value);
                    loadDirectory(e.target.value);
                  }}
                  placeholder="Search by Unique Code (UID)..."
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#f0f4f8] border border-[#1a2a40]/15 rounded-lg focus:outline-hidden focus:border-[#003d80]"
                />
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {directoryUsers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7a8fa8]">
                    No registered batchmates match your query.
                  </div>
                ) : (
                  directoryUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <div
                        key={u.id}
                        className="bg-white border border-[#1a2a40]/10 p-3 rounded-xl flex items-center justify-between shadow-2xs gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#003d80]/20"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#1a2a40]">
                                {u.name}
                              </span>
                              {isSelf ? (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                  You
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#0056b3]">
                                  {u.id}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#4a5e7a] block">
                              {u.branch} · {u.location}
                            </span>
                            {u.bio && (
                              <p className="text-[11px] text-[#7a8fa8] italic mt-0.5 line-clamp-1">
                                "{u.bio}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {!isSelf && (
                            (() => {
                              const rel = getRequestWithUser(u.id);
                              const isConnected = rel?.status === "accepted";
                              const isPendingFromMe = rel?.status === "pending" && rel.senderId === currentUser?.id;
                              const isPendingToMe = rel?.status === "pending" && rel.recipientId === currentUser?.id;

                              if (isConnected) {
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-medium flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" /> Connected
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedRecipient(u);
                                        setPrivateSubView("chat");
                                        setChatTab("private");
                                        loadPrivateMessages(u.id);
                                      }}
                                      className="px-2.5 py-1 bg-[#003d80] text-white hover:bg-[#0056b3] text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>Chat Privately</span>
                                    </button>
                                  </div>
                                );
                              }

                              if (isPendingToMe && rel) {
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleRespondChatRequest(rel.id, "accepted")}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Accept</span>
                                    </button>
                                    <button
                                      onClick={() => handleRespondChatRequest(rel.id, "rejected")}
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                );
                              }

                              if (isPendingFromMe && rel) {
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200 font-medium flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" /> Request Sent
                                    </span>
                                    <button
                                      onClick={() => handleCancelChatRequest(rel.id)}
                                      className="text-[10px] text-red-600 hover:underline cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <button
                                  onClick={() => handleSendChatRequest(u.id)}
                                  className="px-2.5 py-1 bg-[#003d80] text-white hover:bg-[#0056b3] text-[11px] font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Connect & Chat</span>
                                </button>
                              );
                            })()
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
