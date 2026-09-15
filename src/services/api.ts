import {
  User,
  Quote,
  PublicMessage,
  PrivateMessage,
  ChatRequest,
  Confession,
  Memory,
  MediaItem,
  MediaComment,
  AdminStats,
  FlaggedReport,
  SiteProblem,
} from "../types";

const TOKEN_KEY = "cm_auth_token";
const USER_KEY = "cm_auth_user";

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
};

function getHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // ---------------- AUTH ----------------
  async register(data: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    branch?: string;
    location?: string;
    dob?: string;
    pronouns?: string;
    avatar?: string;
    bio?: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || "Registration failed");
    authStorage.setToken(json.token);
    authStorage.setUser(json.user);
    return json;
  },

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<{ user: User; token: string }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || "Login failed");
    authStorage.setToken(json.token);
    authStorage.setUser(json.user);
    return json;
  },

  async getMe(): Promise<User | null> {
    const token = authStorage.getToken();
    if (!token) return null;
    try {
      const res = await fetch("/api/auth/me", {
        headers: getHeaders(),
      });
      if (!res.ok) {
        authStorage.removeToken();
        return null;
      }
      const json = await res.json();
      authStorage.setUser(json.user);
      return json.user;
    } catch {
      return null;
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || json.error || "Update failed");
    authStorage.setUser(json.user);
    return json.user;
  },

  async searchDirectory(q: string = ""): Promise<User[]> {
    const res = await fetch(`/api/auth/directory?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    return json.users || [];
  },

  // ---------------- QUOTES (CRUD) ----------------
  async getQuotes(search?: string, category?: string): Promise<Quote[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "all") params.append("category", category);
    const queryStr = params.toString();
    const url = queryStr ? `/api/quotes?${queryStr}` : "/api/quotes";
    const res = await fetch(url);
    const json = await res.json();
    return json.data || [];
  },

  async createQuote(
    text: string,
    author?: string,
    extra?: { category?: string; imageUrl?: string; animeTitle?: string; character?: string }
  ): Promise<Quote> {
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, author, ...extra }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to create quote");
    return json.data;
  },

  async updateQuote(
    id: string,
    updates: {
      text?: string;
      author?: string;
      category?: string;
      imageUrl?: string;
      animeTitle?: string;
      character?: string;
    }
  ): Promise<Quote> {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to update quote");
    return json.data;
  },

  async deleteQuote(id: string): Promise<void> {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete quote");
  },

  // ---------------- MESSAGES & CONFESSIONS ----------------
  async getPublicMessages(): Promise<PublicMessage[]> {
    const res = await fetch("/api/messages/public");
    const json = await res.json();
    return json.data || [];
  },

  async sendPublicMessage(text: string, senderName?: string): Promise<PublicMessage> {
    const res = await fetch("/api/messages/public", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, senderName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send message");
    return json.data;
  },

  async deletePublicMessage(id: string): Promise<void> {
    await fetch(`/api/messages/public/${id}`, { method: "DELETE" });
  },

  // ---------------- PRIVATE MESSAGES (1-on-1 DMs) ----------------
  async getPrivateMessages(targetUid: string): Promise<PrivateMessage[]> {
    const res = await fetch(`/api/messages/private/${encodeURIComponent(targetUid)}`, {
      headers: getHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async sendPrivateMessage(recipient: string, text: string): Promise<PrivateMessage> {
    const res = await fetch("/api/messages/private", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ recipient, text }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send private message");
    return json.data;
  },

  // ---------------- CHAT REQUESTS (Friend / Connect Flow) ----------------
  async getChatRequests(): Promise<ChatRequest[]> {
    const res = await fetch("/api/messages/requests", {
      headers: getHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async sendChatRequest(recipientId: string): Promise<ChatRequest> {
    const res = await fetch("/api/messages/requests", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ recipientId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to send chat request");
    return json.data;
  },

  async respondChatRequest(requestId: string, status: "accepted" | "rejected"): Promise<ChatRequest> {
    const res = await fetch(`/api/messages/requests/${requestId}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to respond to chat request");
    return json.data;
  },

  async cancelChatRequest(requestId: string): Promise<void> {
    const res = await fetch(`/api/messages/requests/${requestId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to cancel chat request");
  },

  async getConfessions(): Promise<Confession[]> {
    const res = await fetch("/api/messages/confessions");
    const json = await res.json();
    return json.data || [];
  },

  async sendConfession(text: string): Promise<Confession> {
    const res = await fetch("/api/messages/confessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to submit confession");
    return json.data;
  },

  // ---------------- YEARBOOK MEMORIES (CRUD) ----------------
  async getMemories(): Promise<Memory[]> {
    const res = await fetch("/api/memories");
    const json = await res.json();
    return json.data || [];
  },

  async createMemory(src: string, caption?: string, author?: string): Promise<Memory> {
    const res = await fetch("/api/memories", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ src, caption, author }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to upload photo");
    return json.data;
  },

  async updateMemory(id: string, caption: string): Promise<Memory> {
    const res = await fetch(`/api/memories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption }),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteMemory(id: string): Promise<void> {
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
  },

  async resetMemories(): Promise<void> {
    await fetch("/api/memories/reset", { method: "POST" });
  },

  // ---------------- REELS, VIDEOS & PHOTOS (MEDIA HUB) ----------------
  async getMedia(params?: { type?: string; tag?: string; search?: string }): Promise<MediaItem[]> {
    const query = new URLSearchParams();
    if (params?.type && params.type !== "all") query.append("type", params.type);
    if (params?.tag) query.append("tag", params.tag);
    if (params?.search) query.append("search", params.search);

    const qs = query.toString();
    const res = await fetch(qs ? `/api/media?${qs}` : "/api/media");
    const json = await res.json();
    return json.data || [];
  },

  async getMediaItem(id: string): Promise<MediaItem> {
    const res = await fetch(`/api/media/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Media item not found");
    return json.data;
  },

  async createMedia(data: {
    type: "reel" | "video" | "photo";
    src: string;
    thumbnail?: string;
    caption?: string;
    author?: string;
    aspectRatio?: "9:16" | "16:9" | "1:1" | "4:3";
    tags?: string[];
  }): Promise<MediaItem> {
    const res = await fetch("/api/media", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to upload media");
    return json.data;
  },

  async likeMedia(id: string): Promise<{ liked: boolean; likes: number; data: MediaItem }> {
    const res = await fetch(`/api/media/${id}/like`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to like media");
    return json;
  },

  async commentMedia(id: string, text: string, authorName?: string): Promise<MediaComment> {
    const res = await fetch(`/api/media/${id}/comment`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ text, authorName }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to add comment");
    return json.data;
  },

  async deleteMedia(id: string): Promise<void> {
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete media");
  },

  // ---------------- ADMIN ----------------
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch("/api/admin/stats");
    const json = await res.json();
    return json.data;
  },

  async verifyAdminKey(adminKey: string): Promise<boolean> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": cleanKey 
      },
      body: JSON.stringify({ adminKey: cleanKey }),
    });
    return res.ok;
  },

  async getAdminUsers(adminKey: string): Promise<User[]> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/users", {
      headers: { "x-admin-key": cleanKey },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Admin authentication failed");
    return json.data;
  },

  async toggleUserStatus(id: string, adminKey: string, status?: "active" | "blocked" | "deactivated"): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": cleanKey,
      },
      body: JSON.stringify(status ? { status, adminKey: cleanKey } : { adminKey: cleanKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Status update failed");
    }
  },

  async setUserStatus(id: string, status: "active" | "blocked" | "deactivated", adminKey: string): Promise<void> {
    return this.toggleUserStatus(id, adminKey, status);
  },

  async deleteUser(id: string, adminKey: string): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": cleanKey,
      },
      body: JSON.stringify({ adminKey: cleanKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Delete user failed");
    }
  },

  async getReports(adminKey: string): Promise<FlaggedReport[]> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/reports", {
      headers: { "x-admin-key": cleanKey },
    });
    const json = await res.json();
    return json.data || [];
  },

  async reportContent(data: { offender: string; text: string; reporter?: string }): Promise<void> {
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async dismissReport(id: string, adminKey: string): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    await fetch(`/api/admin/reports/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": cleanKey },
    });
  },

  async getSiteProblems(adminKey: string): Promise<SiteProblem[]> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/site-problems", {
      headers: { "x-admin-key": cleanKey },
    });
    const json = await res.json();
    return json.data || [];
  },

  async reportProblem(issue: string, reporter?: string): Promise<void> {
    await fetch("/api/admin/site-problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue, reporter }),
    });
  },

  async dismissProblem(id: string, adminKey: string): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    await fetch(`/api/admin/site-problems/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": cleanKey },
    });
  },

  async wipeDatabase(adminKey: string): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/wipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": cleanKey,
      },
      body: JSON.stringify({ adminKey: cleanKey }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Wipe database failed");
    }
  },

  async seedDatabase(adminKey: string): Promise<void> {
    const cleanKey = (adminKey || "").trim();
    const res = await fetch("/api/admin/seed", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-admin-key": cleanKey 
      },
      body: JSON.stringify({ adminKey: cleanKey }),
    });
    if (!res.ok) throw new Error("Seed failed");
  },
};
