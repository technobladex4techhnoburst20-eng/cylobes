import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

export interface UserRecord {
  id: string;
  username: string;
  password: string; // hashed
  name: string;
  email?: string;
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

export interface QuoteRecord {
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

export interface PublicMessageRecord {
  id: string;
  sender: string; // UID
  senderName: string;
  text: string;
  timestamp: number;
}

export interface PrivateMessageRecord {
  id: string;
  sender: string;
  recipient: string;
  conversationKey: string;
  text: string;
  timestamp: number;
}

export interface ChatRequestRecord {
  id: string;
  senderId: string;
  recipientId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: number;
  updatedAt: number;
}

export interface ConfessionRecord {
  id: string;
  text: string;
  timestamp: number;
}

export interface MemoryRecord {
  id: string;
  src: string;
  caption: string;
  author?: string;
  createdAt: number;
}

export interface MediaCommentRecord {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: number;
}

export interface MediaRecord {
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
  comments: MediaCommentRecord[];
  aspectRatio?: "9:16" | "16:9" | "1:1" | "4:3";
  tags?: string[];
  createdAt: number;
}

export interface ReportRecord {
  id: string;
  reporter: string;
  offender: string;
  text: string;
  timestamp: number;
}

export interface SiteProblemRecord {
  id: string;
  reporter: string;
  issue: string;
  timestamp: number;
}

export interface DatabaseSchema {
  users: UserRecord[];
  quotes: QuoteRecord[];
  publicMessages: PublicMessageRecord[];
  privateMessages: PrivateMessageRecord[];
  chatRequests: ChatRequestRecord[];
  confessions: ConfessionRecord[];
  memories: MemoryRecord[];
  media: MediaRecord[];
  reports: ReportRecord[];
  siteProblems: SiteProblemRecord[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

function getDefaultQuotes(): QuoteRecord[] {
  return [];
}

function getDefaultData(): DatabaseSchema {
  const hash = "$2b$10$a/VQiR9GgehiwKe.ZegKz.OKgDgT2xXUoKBnh.mO2mipKvoHCihEi"; // hash of "localhost"
  return {
    users: [
      {
        id: "USR-ROOT1",
        username: "rootname",
        password: hash,
        name: "MrRobot",
        phone: "+91 98450 12345",
        branch: "Computer Science & Engineering",
        location: "Bengaluru",
        dob: "2003-05-14",
        pronouns: "He/Him",
        avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
        bio: "Coding late at night in the CSE lab, 8th semester survivor.",
        isPrivate: false,
        status: "active",
        createdAt: Date.now() - 86400000 * 30,
      },
      {
        id: "USR-PRY2",
        username: "priya",
        password: hash,
        name: "Priya Sharma",
        phone: "+91 98765 43210",
        branch: "Electronics & Communication",
        location: "Mysuru",
        dob: "2003-08-22",
        pronouns: "She/Her",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        bio: "Robotics club lead & canteen chai enthusiast.",
        isPrivate: false,
        status: "active",
        createdAt: Date.now() - 86400000 * 25,
      },
      {
        id: "USR-ROH3",
        username: "rohan",
        password: hash,
        name: "Rohan Varma",
        phone: "+91 91234 56789",
        branch: "Mechanical Engineering",
        location: "Mangaluru",
        dob: "2003-02-18",
        pronouns: "He/Him",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        bio: "Workshop backbencher, fest organizer, cricket captain.",
        isPrivate: false,
        status: "active",
        createdAt: Date.now() - 86400000 * 20,
      },
      {
        id: "USR-ANA4",
        username: "ananya",
        password: hash,
        name: "Ananya Kulkarni",
        phone: "+91 97654 32109",
        branch: "Information Science",
        location: "Hubballi",
        dob: "2003-11-05",
        pronouns: "She/Her",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        bio: "Hostel 3 gossip archive keeper and exam notes savior.",
        isPrivate: false,
        status: "active",
        createdAt: Date.now() - 86400000 * 15,
      },
    ],
    quotes: getDefaultQuotes(),
    publicMessages: [],
    privateMessages: [],
    confessions: [
      {
        id: "conf-1",
        text: "I was the one who accidentally triggered the chemistry lab smoke alarm in 3rd semester and blamed the faulty bunsen burner.",
        timestamp: Date.now() - 86400000 * 7,
      },
      {
        id: "conf-2",
        text: "To the person who returned my lost laptop bag in the library during finals week without leaving their name: you saved my degree.",
        timestamp: Date.now() - 86400000 * 3,
      }
    ],
    memories: [
      {
        id: "mem-1",
        src: "https://www.ghibli.jp/gallery/mimi014.jpg",
        caption: "Library all-nighters before internal exams ♡ (Whisper of the Heart)",
        author: "Batch Archive",
        createdAt: Date.now() - 86400000 * 15,
      },
      {
        id: "mem-2",
        src: "https://www.ghibli.jp/gallery/kokurikozaka022.jpg",
        caption: "Campus annual fest victory celebration 🏆 (From Up on Poppy Hill)",
        author: "Batch Archive",
        createdAt: Date.now() - 86400000 * 12,
      },
      {
        id: "mem-3",
        src: "https://www.ghibli.jp/gallery/kokurikozaka001.jpg",
        caption: "Last day of semester lectures at the Latin Quarter hall ☀️",
        author: "Batch Archive",
        createdAt: Date.now() - 86400000 * 8,
      }
    ],
    media: [
      {
        id: "med-1",
        type: "reel",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail: "https://www.ghibli.jp/gallery/howl015.jpg",
        caption: "Campus quad festival dances! ✨ Never forget these memories!",
        author: "Campus Reels",
        authorAvatar: "https://www.ghibli.jp/gallery/howl005.jpg",
        likes: 12,
        likedBy: [],
        comments: [],
        aspectRatio: "9:16",
        tags: ["#CampusReels", "#GhibliMemories", "#Batch2025"],
        createdAt: Date.now() - 86400000 * 3,
      },
      {
        id: "med-2",
        type: "video",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumbnail: "https://www.ghibli.jp/gallery/chihiro043.jpg",
        caption: "Sunset Train Journey - Farewell Walkthrough across the golden hour 🎓",
        author: "Campus Media",
        authorAvatar: "https://www.ghibli.jp/gallery/chihiro001.jpg",
        likes: 28,
        likedBy: [],
        comments: [],
        aspectRatio: "16:9",
        tags: ["#Farewell", "#GoldenHour", "#Batch2025"],
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        id: "med-3",
        type: "photo",
        src: "https://www.ghibli.jp/gallery/mimi045.jpg",
        caption: "Golden hour batch gathering overlooking the twilight campus. Always together! 🌄",
        author: "Batch Archive",
        authorAvatar: "https://www.ghibli.jp/gallery/mimi025.jpg",
        likes: 34,
        likedBy: [],
        comments: [],
        aspectRatio: "16:9",
        tags: ["#SunsetMemories", "#WhisperOfTheHeart", "#Friendship"],
        createdAt: Date.now() - 86400000 * 1,
      }
    ],
    chatRequests: [
      {
        id: "req-1",
        senderId: "USR-ROOT1",
        recipientId: "USR-PRY2",
        status: "accepted",
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 5,
      },
      {
        id: "req-2",
        senderId: "USR-ROH3",
        recipientId: "USR-ROOT1",
        status: "pending",
        createdAt: Date.now() - 3600000 * 3,
        updatedAt: Date.now() - 3600000 * 3,
      },
    ],
    reports: [],
    siteProblems: [
      {
        id: "prob-1",
        reporter: "USR-A101",
        issue: "Add dark mode toggle for mobile devices during late night hostel usage.",
        timestamp: Date.now() - 86400000 * 2,
      }
    ]
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(content);
        if (!parsed.media) parsed.media = getDefaultData().media;
        if (!parsed.users) parsed.users = [];
        if (!parsed.quotes) parsed.quotes = [];
        if (!parsed.publicMessages) parsed.publicMessages = [];
        if (!parsed.privateMessages) parsed.privateMessages = [];
        if (!parsed.chatRequests) parsed.chatRequests = getDefaultData().chatRequests;
        if (!parsed.confessions) parsed.confessions = [];
        if (!parsed.memories) parsed.memories = [];
        if (!parsed.reports) parsed.reports = [];
        if (!parsed.siteProblems) parsed.siteProblems = [];
        return parsed;
      }
    } catch (err) {
      console.warn("Could not read database file, seeding defaults:", err);
    }
    const defaultData = getDefaultData();
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write to database file:", err);
    }
  }

  public get<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    return this.data[collection];
  }

  public set<K extends keyof DatabaseSchema>(collection: K, items: DatabaseSchema[K]) {
    this.data[collection] = items;
    this.saveData(this.data);
  }

  public wipe() {
    this.data = {
      users: [],
      quotes: [],
      publicMessages: [],
      privateMessages: [],
      chatRequests: [],
      confessions: [],
      memories: [],
      media: [],
      reports: [],
      siteProblems: [],
    };
    this.saveData(this.data);
  }

  public seed() {
    this.data = getDefaultData();
    this.saveData(this.data);
  }
}

export const db = new Database();
