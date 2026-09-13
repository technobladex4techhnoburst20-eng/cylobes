import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

export interface FirestoreQuote {
  id: string;
  text: string;
  author: string;
  authorId?: string;
  createdAt: number;
}

export interface FirestorePublicMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  senderAvatar: string;
  timestamp: number;
}

export interface FirestoreAIChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  thoughts?: string;
  model?: string;
  grounding?: any;
  timestamp: number;
}

export interface FirestoreAIChatThread {
  id: string;
  userId?: string;
  title: string;
  role: string;
  model: string;
  messages: FirestoreAIChatMessage[];
  updatedAt: number;
}

export async function deletePublicMessageFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "publicMessages", id));
}

export async function deleteQuoteFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "quotes", id));
}

export async function deleteAIChatThreadFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "aiChats", id));
}

export async function deleteMemoryFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "memories", id));
}

export async function deleteMediaFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "reels_and_videos", id));
}

// Alias for backwards compatibility or manual imports
export async function deleteMediaReelFromFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, "reels_and_videos", id));
}

export function subscribeToQuotes(
  callback: (quotes: FirestoreQuote[]) => void
) {
  const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreQuote[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          text: data.text || "",
          author: data.author || "Anonymous Senior",
          authorId: data.authorId,
          createdAt: data.createdAt || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.warn("Firestore quotes subscription note:", err.message);
    }
  );
}

// Add quote to Firestore
export async function addQuoteToFirestore(
  text: string,
  author: string,
  authorId?: string
): Promise<FirestoreQuote> {
  const colRef = collection(db, "quotes");
  const docRef = await addDoc(colRef, {
    text,
    author,
    authorId: authorId || "guest",
    createdAt: Date.now(),
    serverCreatedAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    text,
    author,
    authorId,
    createdAt: Date.now(),
  };
}

// Subscribe to real-time public messages from Firestore
export function subscribeToPublicMessages(
  callback: (messages: FirestorePublicMessage[]) => void
) {
  const q = query(
    collection(db, "publicMessages"),
    orderBy("timestamp", "asc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestorePublicMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          text: data.text || "",
          sender: data.sender || "anonymous",
          senderName: data.senderName || "Batchmate",
          senderAvatar:
            data.senderAvatar ||
            "https://www.ghibli.jp/gallery/howl005.jpg",
          timestamp: data.timestamp || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.warn("Firestore public messages subscription note:", err.message);
    }
  );
}

// Send public message to Firestore
export async function sendPublicMessageToFirestore(
  text: string,
  sender: string,
  senderName: string,
  senderAvatar: string
): Promise<FirestorePublicMessage> {
  const colRef = collection(db, "publicMessages");
  const docRef = await addDoc(colRef, {
    text,
    sender,
    senderName,
    senderAvatar,
    timestamp: Date.now(),
    serverTimestamp: serverTimestamp(),
  });
  return {
    id: docRef.id,
    text,
    sender,
    senderName,
    senderAvatar,
    timestamp: Date.now(),
  };
}

// Save AI Chat Thread to Firestore
export async function saveAIChatToFirestore(
  threadId: string,
  data: Partial<FirestoreAIChatThread>
) {
  const docRef = doc(db, "aiChats", threadId);
  await setDoc(
    docRef,
    {
      ...data,
      updatedAt: Date.now(),
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Load AI Chat Threads from Firestore
export async function loadAIChatsFromFirestore(
  userId?: string
): Promise<FirestoreAIChatThread[]> {
  try {
    const q = query(collection(db, "aiChats"), orderBy("updatedAt", "desc"), limit(20));
    const snapshot = await getDocs(q);
    const threads: FirestoreAIChatThread[] = [];
    snapshot.forEach((doc) => {
      threads.push({ id: doc.id, ...(doc.data() as any) });
    });
    return threads;
  } catch (err) {
    console.warn("Error loading AI chats from Firestore:", err);
    return [];
  }
}

// -------------------------------------------------------------------
// REELS & VIDEOS (Firestore Cloud Storage & Real-Time Sync)
// -------------------------------------------------------------------
export interface FirestoreMediaItem {
  id: string;
  type: "reel" | "video" | "photo";
  src: string;
  caption: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  likes: number;
  likedBy?: string[];
  tags: string[];
  comments?: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: number;
    avatar?: string;
  }>;
  createdAt: number;
}

// Subscribe to Reels & Videos from Firestore
export function subscribeToReelsAndVideos(
  callback: (items: FirestoreMediaItem[]) => void
) {
  const colRef = collection(db, "reels_and_videos");
  const q = query(colRef, orderBy("createdAt", "desc"), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreMediaItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          type: data.type || "reel",
          src: data.src || "",
          caption: data.caption || "",
          author: data.author || "Batchmate",
          authorId: data.authorId || "",
          authorAvatar: data.authorAvatar || "https://www.ghibli.jp/gallery/howl005.jpg",
          likes: typeof data.likes === "number" ? data.likes : 0,
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          tags: Array.isArray(data.tags) ? data.tags : ["#CampusMemories"],
          comments: Array.isArray(data.comments) ? data.comments : [],
          createdAt: data.createdAt || Date.now(),
        });
      });
      callback(items);
    },
    (err) => {
      console.warn("Firestore reels_and_videos subscription note:", err.message);
    }
  );
}

// Add a new Reel / Video to Firestore
export async function addMediaToFirestore(
  media: Omit<FirestoreMediaItem, "id" | "createdAt">
): Promise<FirestoreMediaItem> {
  const colRef = collection(db, "reels_and_videos");
  const timestamp = Date.now();
  const docRef = await addDoc(colRef, {
    ...media,
    createdAt: timestamp,
    serverCreatedAt: serverTimestamp(),
  });
  return {
    id: docRef.id,
    ...media,
    createdAt: timestamp,
  };
}

// Toggle Like on Reel/Video in Firestore
export async function toggleMediaLikeInFirestore(
  mediaId: string,
  userId: string
): Promise<{ likes: number; isLiked: boolean }> {
  const docRef = doc(db, "reels_and_videos", mediaId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return { likes: 0, isLiked: false };

  const data = snap.data();
  const likedBy: string[] = Array.isArray(data.likedBy) ? data.likedBy : [];
  const hasLiked = likedBy.includes(userId);

  const updatedLikedBy = hasLiked
    ? likedBy.filter((id) => id !== userId)
    : [...likedBy, userId];

  const newLikes = updatedLikedBy.length;

  await updateDoc(docRef, {
    likes: newLikes,
    likedBy: updatedLikedBy,
  });

  return { likes: newLikes, isLiked: !hasLiked };
}

// Add comment to Reel/Video in Firestore
export async function addMediaCommentToFirestore(
  mediaId: string,
  comment: {
    author: string;
    text: string;
    avatar?: string;
  }
) {
  const docRef = doc(db, "reels_and_videos", mediaId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const newComment = {
    id: "c_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    ...comment,
    timestamp: Date.now(),
  };

  await updateDoc(docRef, {
    comments: [...comments, newComment],
  });

  return newComment;
}

