import { Router, Response, Request } from "express";
import { db } from "../db";

export const adminRouter = Router();

// Simple admin middleware check (password can be passed via header x-admin-key or body)
function requireAdminKey(req: Request, res: Response, next: Function) {
  const key = req.headers["x-admin-key"] || req.body?.adminKey;
  const adminSecret = process.env.ADMIN_PASSKEY || "admin2025";
  if (key && key === adminSecret) {
    next();
  } else {
    res.status(403).json({ error: "Access Denied: Invalid Security Passkey." });
  }
}

// 1. STATS (Publicly observable metrics or moderation overview)
adminRouter.get("/stats", (req, res: Response) => {
  const users = db.get("users");
  const publicMsgs = db.get("publicMessages");
  const memories = db.get("memories");
  const media = db.get("media") || [];
  const reports = db.get("reports");
  const quotes = db.get("quotes");
  const siteProblems = db.get("siteProblems");
  const confessions = db.get("confessions");

  res.json({
    success: true,
    data: {
      usersCount: users.length,
      publicMsgsCount: publicMsgs.length,
      memoriesCount: memories.length,
      mediaCount: media.length,
      reportsCount: reports.length,
      quotesCount: quotes.length,
      problemsCount: siteProblems.length,
      confessionsCount: confessions.length,
    },
  });
});

// 2. USERS MANAGEMENT
adminRouter.get("/users", requireAdminKey, (req, res: Response) => {
  const users = db.get("users").map(({ password: _, ...u }) => u);
  res.json({ success: true, data: users });
});

adminRouter.patch("/users/:id/status", requireAdminKey, (req, res: Response) => {
  const users = db.get("users");
  const targetId = req.params.id;
  const { status } = req.body || {};
  const index = users.findIndex(
    (u) => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase()
  );

  if (index === -1) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (status && ["active", "blocked", "deactivated", "inactive"].includes(status)) {
    users[index].status = status === "inactive" ? "deactivated" : (status as any);
  } else {
    const currentStatus = users[index].status;
    users[index].status = currentStatus === "blocked" ? "active" : "blocked";
  }

  db.set("users", users);

  res.json({
    success: true,
    message: `User status changed to ${users[index].status}`,
    data: users[index],
  });
});

adminRouter.delete("/users/:id", requireAdminKey, (req, res: Response) => {
  const users = db.get("users");
  const targetId = req.params.id;
  const index = users.findIndex(
    (u) => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase()
  );

  if (index === -1) {
    res.status(404).json({ error: "User not found with specified UID or username." });
    return;
  }

  const removed = users.splice(index, 1)[0];
  db.set("users", users);

  // Clean up all references to this user in the local database
  
  // 1. Chat requests
  const chatRequests = db.get("chatRequests").filter(
    (cr) => cr.senderId !== removed.id && cr.recipientId !== removed.id
  );
  db.set("chatRequests", chatRequests);

  // 2. Public Messages
  const publicMessages = db.get("publicMessages").filter((m) => m.sender !== removed.id);
  db.set("publicMessages", publicMessages);

  // 3. Quotes (assuming author matching by username or ID)
  const quotes = db.get("quotes").filter(
    (q) => q.author !== removed.username && q.author !== `@${removed.username}`
  );
  db.set("quotes", quotes);

  // 4. Yearbook Memories
  const memories = db.get("memories").filter((m) => m.author !== removed.id);
  db.set("memories", memories);

  // 5. Reels/Media
  const reels = db.get("media").filter((m) => m.authorId !== removed.id && m.author !== removed.id);
  db.set("media", reels);

  res.json({ success: true, message: `User @${removed.username} (${removed.id}) deleted permanently.`, data: removed.id });
});

// 3. FLAGGED REPORTS
adminRouter.get("/reports", requireAdminKey, (req, res: Response) => {
  const reports = db.get("reports");
  res.json({ success: true, data: reports });
});

adminRouter.post("/reports", (req, res: Response) => {
  const { reporter, offender, text } = req.body;
  if (!offender || !text) {
    res.status(400).json({ error: "Offender and message excerpt are required." });
    return;
  }

  const newReport = {
    id: "rep-" + Math.random().toString(36).substring(2, 9),
    reporter: reporter || "USR-ANON",
    offender,
    text,
    timestamp: Date.now(),
  };

  const reports = db.get("reports");
  reports.push(newReport);
  db.set("reports", reports);

  res.status(201).json({ success: true, message: "Report submitted to admin", data: newReport });
});

adminRouter.delete("/reports/:id", requireAdminKey, (req, res: Response) => {
  const reports = db.get("reports");
  const index = reports.findIndex((r) => r.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  reports.splice(index, 1);
  db.set("reports", reports);
  res.json({ success: true, message: "Report dismissed" });
});

// 4. SITE PROBLEMS
adminRouter.get("/site-problems", requireAdminKey, (req, res: Response) => {
  const problems = db.get("siteProblems");
  res.json({ success: true, data: problems });
});

adminRouter.post("/site-problems", (req, res: Response) => {
  const { reporter, issue } = req.body;
  if (!issue || !issue.trim()) {
    res.status(400).json({ error: "Issue description is required." });
    return;
  }

  const newProblem = {
    id: "prob-" + Math.random().toString(36).substring(2, 9),
    reporter: reporter || "Anonymous",
    issue: issue.trim(),
    timestamp: Date.now(),
  };

  const problems = db.get("siteProblems");
  problems.push(newProblem);
  db.set("siteProblems", problems);

  res.status(201).json({ success: true, message: "Problem reported to administration", data: newProblem });
});

adminRouter.delete("/site-problems/:id", requireAdminKey, (req, res: Response) => {
  const problems = db.get("siteProblems");
  const index = problems.findIndex((p) => p.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Problem not found" });
    return;
  }

  problems.splice(index, 1);
  db.set("siteProblems", problems);
  res.json({ success: true, message: "Problem resolved / dismissed" });
});

// 5. WIPE & SEED DATABASE
adminRouter.post("/wipe", requireAdminKey, (req, res: Response) => {
  db.wipe();
  res.json({ success: true, message: "Database wiped clean successfully." });
});

adminRouter.post("/seed", requireAdminKey, (req, res: Response) => {
  db.seed();
  res.json({ success: true, message: "Database re-seeded with demo records." });
});
