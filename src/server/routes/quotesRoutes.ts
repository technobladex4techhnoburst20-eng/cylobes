import { Router, Response } from "express";
import { db, QuoteRecord } from "../db";
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

export const quotesRouter = Router();

// 1. READ ALL (with optional search & category filter)
quotesRouter.get("/", (req, res: Response) => {
  const quotes = db.get("quotes");
  const search = (req.query.search as string || "").toLowerCase().trim();
  const category = (req.query.category as string || "").toLowerCase().trim();

  let filtered = quotes;

  if (category && category !== "all") {
    filtered = filtered.filter(
      (q) => (q.category && q.category.toLowerCase() === category) ||
             (q.category && q.category.toLowerCase().includes(category))
    );
  }

  if (search) {
    filtered = filtered.filter(
      (q) =>
        q.text.toLowerCase().includes(search) ||
        q.author.toLowerCase().includes(search) ||
        (q.character && q.character.toLowerCase().includes(search)) ||
        (q.animeTitle && q.animeTitle.toLowerCase().includes(search)) ||
        (q.category && q.category.toLowerCase().includes(search))
    );
  }

  // Return latest first
  filtered.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ success: true, count: filtered.length, data: filtered });
});

// 2. READ ONE
quotesRouter.get("/:id", (req, res: Response) => {
  const quotes = db.get("quotes");
  const quote = quotes.find((q) => q.id === req.params.id);

  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  res.json({ success: true, data: quote });
});

// 3. CREATE (Authenticated or Guest with Name)
quotesRouter.post("/", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { author, text, category, imageUrl, animeTitle, character } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: "Quote text is required." });
    return;
  }

  const finalAuthor = req.user ? req.user.name : (author?.trim() || "Anonymous Otaku");
  const newQuote: QuoteRecord = {
    id: "q-" + Math.random().toString(36).substring(2, 9),
    author: finalAuthor,
    character: character?.trim() || finalAuthor,
    animeTitle: animeTitle?.trim(),
    category: category?.trim() || "Motivation",
    imageUrl: imageUrl?.trim(),
    text: text.trim(),
    userId: req.user?.uid,
    createdAt: Date.now(),
  };

  const quotes = db.get("quotes");
  quotes.unshift(newQuote);
  db.set("quotes", quotes);

  res.status(201).json({
    success: true,
    message: "Quote shared to Wall of Thoughts",
    data: newQuote,
  });
});

// 4. UPDATE (Requires Authentication or ownership)
quotesRouter.put("/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { text, author, category, imageUrl, animeTitle, character } = req.body;
  const quotes = db.get("quotes");
  const index = quotes.findIndex((q) => q.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  const quote = quotes[index];
  // Verify ownership if quote was linked to a user
  if (quote.userId && quote.userId !== req.user?.uid) {
    res.status(403).json({ error: "Forbidden: You can only edit your own quotes." });
    return;
  }

  if (text !== undefined && text.trim()) {
    quote.text = text.trim();
  }
  if (author !== undefined && author.trim()) {
    quote.author = author.trim();
  }
  if (category !== undefined) {
    quote.category = category.trim();
  }
  if (imageUrl !== undefined) {
    quote.imageUrl = imageUrl.trim();
  }
  if (animeTitle !== undefined) {
    quote.animeTitle = animeTitle.trim();
  }
  if (character !== undefined) {
    quote.character = character.trim();
  }
  quote.updatedAt = Date.now();

  quotes[index] = quote;
  db.set("quotes", quotes);

  res.json({
    success: true,
    message: "Quote updated successfully",
    data: quote,
  });
});

// 5. DELETE (Delete operation)
quotesRouter.delete("/:id", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const quotes = db.get("quotes");
  const index = quotes.findIndex((q) => q.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  const removed = quotes.splice(index, 1)[0];
  db.set("quotes", quotes);

  res.json({
    success: true,
    message: "Quote removed from Wall of Thoughts",
    data: removed,
  });
});
