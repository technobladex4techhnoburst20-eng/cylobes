export interface HealthStatus {
  status: string;
  timestamp: string;
  hasApiKey: boolean;
  model: string;
  thinkingLevel: string;
}

export interface PresetQuery {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  code: string;
}

export interface GenerationResult {
  id: string;
  prompt: string;
  code?: string;
  text: string;
  thoughts?: string;
  model: string;
  thinkingLevel: string;
  durationMs: number;
  timestamp: number;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export type QueryCategory =
  | "all"
  | "Algorithms & Complexity"
  | "Distributed Systems"
  | "Full-Stack Architecture"
  | "Advanced TypeScript"
  | "Security & Concurrency";

export interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  branch: string;
  location: string;
  dob: string;
  pronouns?: string;
  bio?: string;
  avatar?: string;
  isPrivate: boolean;
  status: "active" | "blocked" | "deactivated";
  createdAt: number;
}

export interface Quote {
  id: string;
  author: string;
  text: string;
  category?: string;
  imageUrl?: string;
  animeTitle?: string;
  character?: string;
  userId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface PublicMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface PrivateMessage {
  id: string;
  sender: string;
  recipient: string;
  conversationKey: string;
  text: string;
  timestamp: number;
}

export interface Confession {
  id: string;
  text: string;
  timestamp: number;
}

export interface Memory {
  id: string;
  src: string;
  caption: string;
  author?: string;
  createdAt: number;
}

export interface SiteProblem {
  id: string;
  reporter: string;
  issue: string;
  timestamp: number;
}

export interface FlaggedReport {
  id: string;
  reporter: string;
  offender: string;
  text: string;
  timestamp: number;
}

export interface MediaComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: number;
}

export interface MediaItem {
  id: string;
  type: "reel" | "video" | "photo";
  src: string;
  thumbnail?: string;
  caption: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  likes: number;
  likedBy?: string[];
  comments: MediaComment[];
  aspectRatio?: "9:16" | "16:9" | "1:1" | "4:3";
  tags?: string[];
  createdAt: number;
}

export interface AdminStats {
  usersCount: number;
  publicMsgsCount: number;
  memoriesCount: number;
  mediaCount: number;
  reportsCount: number;
  quotesCount: number;
  problemsCount: number;
  confessionsCount: number;
}

export type AppSection =
  | "home"
  | "gemini-chat"
  | "notes"
  | "chats"
  | "media"
  | "yearbook"
  | "admin"
  | "api-docs"
  | "standalone";

export interface ChatRequest {
  id: string;
  senderId: string;
  recipientId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
  updatedAt: number;
  sender?: User;
  recipient?: User;
}

