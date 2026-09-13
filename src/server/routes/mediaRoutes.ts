import { Router, Response } from "express";
import { db, MediaRecord, MediaCommentRecord } from "../db";
import { AuthenticatedRequest, optionalAuth } from "../middleware/auth";

export const mediaRouter = Router();

// 1. GET ALL MEDIA (Public for all users to view)
// Supports optional ?type=reel|video|photo and ?tag=tagname
mediaRouter.get("/", (req, res: Response) => {
  const media = db.get("media") || [];
  const { type, tag, search } = req.query;

  let filtered = [...media];

  if (type && typeof type === "string" && type !== "all") {
    filtered = filtered.filter((m) => m.type === type);
  }

  if (tag && typeof tag === "string") {
    filtered = filtered.filter((m) =>
      m.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  if (search && typeof search === "string") {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.caption.toLowerCase().includes(s) ||
        m.author.toLowerCase().includes(s) ||
        m.tags?.some((t) => t.toLowerCase().includes(s))
    );
  }

  // Sort newest first
  filtered.sort((a, b) => b.createdAt - a.createdAt);

  res.json({
    success: true,
    count: filtered.length,
    data: filtered,
  });
});

// 2. GET SINGLE MEDIA ITEM
mediaRouter.get("/:id", (req, res: Response) => {
  const media = db.get("media") || [];
  const item = media.find((m) => m.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Media item not found." });
    return;
  }
  res.json({ success: true, data: item });
});

// 3. POST NEW MEDIA (Reel, Video, or Photo - public for all)
mediaRouter.post("/", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { type, src, thumbnail, caption, author, aspectRatio, tags } = req.body;

  if (!src || !type) {
    res.status(400).json({ error: "Media source (URL or upload) and type are required." });
    return;
  }

  const validTypes = ["reel", "video", "photo"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "Invalid type. Must be 'reel', 'video', or 'photo'." });
    return;
  }

  // Look up user's latest avatar if user is authenticated
  const users = db.get("users") || [];
  const dbUser = req.user?.uid ? users.find((u) => u.id === req.user?.uid) : null;

  const authorName = dbUser?.name || req.user?.name || author || "Anonymous Batchmate";
  const authorAvatar =
    dbUser?.avatar ||
    req.user?.avatar ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

  const newItem: MediaRecord = {
    id: `med-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    src,
    thumbnail: thumbnail || (type === "photo" ? src : undefined),
    caption: (caption || "").trim(),
    author: authorName,
    authorId: req.user?.uid,
    authorAvatar,
    likes: 0,
    likedBy: [],
    comments: [],
    aspectRatio: aspectRatio || (type === "reel" ? "9:16" : type === "video" ? "16:9" : "1:1"),
    tags: Array.isArray(tags) ? tags : [],
    createdAt: Date.now(),
  };

  const media = db.get("media") || [];
  db.set("media", [newItem, ...media]);

  res.status(201).json({
    success: true,
    message: `${type.toUpperCase()} posted successfully to public feed!`,
    data: newItem,
  });
});

// 4. TOGGLE LIKE ON MEDIA
mediaRouter.post("/:id/like", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const media = db.get("media") || [];
  const index = media.findIndex((m) => m.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Media item not found." });
    return;
  }

  const item = { ...media[index] };
  const userId = req.user?.uid || req.body.clientUserId || "anon_visitor";

  item.likedBy = item.likedBy || [];
  const alreadyLiked = item.likedBy.includes(userId);

  if (alreadyLiked) {
    item.likedBy = item.likedBy.filter((uid) => uid !== userId);
    item.likes = Math.max(0, item.likes - 1);
  } else {
    item.likedBy.push(userId);
    item.likes += 1;
  }

  media[index] = item;
  db.set("media", media);

  res.json({
    success: true,
    liked: !alreadyLiked,
    likes: item.likes,
    data: item,
  });
});

// 5. POST COMMENT ON MEDIA
mediaRouter.post("/:id/comment", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { text, authorName } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: "Comment text cannot be empty." });
    return;
  }

  const media = db.get("media") || [];
  const index = media.findIndex((m) => m.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Media item not found." });
    return;
  }

  const users = db.get("users") || [];
  const dbUser = req.user?.uid ? users.find((u) => u.id === req.user?.uid) : null;

  const item = { ...media[index] };
  item.comments = item.comments || [];

  const newComment: MediaCommentRecord = {
    id: `mc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    author: dbUser?.name || req.user?.name || authorName || "Batchmate",
    authorAvatar:
      dbUser?.avatar ||
      req.user?.avatar ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    text: text.trim(),
    createdAt: Date.now(),
  };

  item.comments.push(newComment);
  media[index] = item;
  db.set("media", media);

  res.status(201).json({
    success: true,
    message: "Comment added.",
    data: newComment,
  });
});

// 6. DELETE MEDIA
mediaRouter.delete("/:id", (req, res: Response) => {
  const media = db.get("media") || [];
  const filtered = media.filter((m) => m.id !== req.params.id);

  if (filtered.length === media.length) {
    res.status(404).json({ error: "Media item not found." });
    return;
  }

  db.set("media", filtered);
  res.json({ success: true, message: "Media deleted successfully." });
});
