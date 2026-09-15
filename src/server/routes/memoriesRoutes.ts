import { Router, Response } from "express";
import { db, MemoryRecord } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

export const memoriesRouter = Router();

// 1. READ ALL
memoriesRouter.get("/", (req, res: Response) => {
  const memories = db.get("memories");
  res.json({ success: true, count: memories.length, data: memories });
});

// 2. READ ONE
memoriesRouter.get("/:id", (req, res: Response) => {
  const memories = db.get("memories");
  const memory = memories.find((m) => m.id === req.params.id);

  if (!memory) {
    res.status(404).json({ error: "Memory photo not found" });
    return;
  }

  res.json({ success: true, data: memory });
});

// 3. CREATE (Requires Authentication)
memoriesRouter.post("/", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { src, caption, author } = req.body;

  if (!src) {
    res.status(400).json({ error: "Image data or URL is required." });
    return;
  }

  const newMem: MemoryRecord = {
    id: "mem-" + Math.random().toString(36).substring(2, 9),
    src,
    caption: caption || "",
    author: req.user ? req.user.name : (author || "Batchmate"),
    createdAt: Date.now(),
  };

  const memories = db.get("memories");
  memories.unshift(newMem);
  db.set("memories", memories);

  res.status(201).json({ success: true, message: "Memory added to Yearbook", data: newMem });
});

// 4. UPDATE CAPTION (Requires Authentication)
memoriesRouter.put("/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { caption } = req.body;
  const memories = db.get("memories");
  const index = memories.findIndex((m) => m.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Memory photo not found" });
    return;
  }

  memories[index].caption = caption || "";
  db.set("memories", memories);

  res.json({ success: true, message: "Caption updated", data: memories[index] });
});

// 5. DELETE (Requires Authentication)
memoriesRouter.delete("/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const memories = db.get("memories");
  const index = memories.findIndex((m) => m.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Memory photo not found" });
    return;
  }

  const removed = memories.splice(index, 1)[0];
  db.set("memories", memories);

  res.json({ success: true, message: "Memory removed from Yearbook", data: removed });
});

// 6. RESET
memoriesRouter.post("/reset", (req, res: Response) => {
  db.set("memories", []);
  res.json({ success: true, message: "Yearbook gallery reset successfully." });
});
