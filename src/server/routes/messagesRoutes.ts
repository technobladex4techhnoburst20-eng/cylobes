import { Router, Response } from "express";
import {
  db,
  PublicMessageRecord,
  PrivateMessageRecord,
  ChatRequestRecord,
  ConfessionRecord,
  UserRecord,
} from "../db";
import {
  requireAuth,
  optionalAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

export const messagesRouter = Router();

function sanitizeUser(u?: UserRecord) {
  if (!u) return undefined;
  const { password, ...safe } = u;
  return safe;
}

// ==================== PUBLIC BULLETIN ====================
messagesRouter.get("/public", (req, res: Response) => {
  const msgs = db.get("publicMessages");
  res.json({ success: true, count: msgs.length, data: msgs });
});

messagesRouter.post("/public", optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { text, senderName } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Message text is required." });
    return;
  }

  const senderUid = req.user ? req.user.uid : "USR-GUEST";
  const name = req.user ? req.user.name : (senderName?.trim() || "Anonymous Batchmate");

  const newMsg: PublicMessageRecord = {
    id: "msg-" + Math.random().toString(36).substring(2, 9),
    sender: senderUid,
    senderName: name,
    text: text.trim(),
    timestamp: Date.now(),
  };

  const msgs = db.get("publicMessages");
  msgs.push(newMsg);
  db.set("publicMessages", msgs);

  res.status(201).json({ success: true, data: newMsg });
});

messagesRouter.delete("/public/:id", (req, res: Response) => {
  const msgs = db.get("publicMessages");
  const index = msgs.findIndex((m) => m.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const removed = msgs.splice(index, 1)[0];
  db.set("publicMessages", msgs);
  res.json({ success: true, message: "Message deleted", data: removed });
});

// ==================== CONFESSIONS ====================
messagesRouter.get("/confessions", (req, res: Response) => {
  const confs = db.get("confessions");
  res.json({ success: true, count: confs.length, data: confs });
});

messagesRouter.post("/confessions", (req, res: Response) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Confession text is required." });
    return;
  }

  const newConf: ConfessionRecord = {
    id: "conf-" + Math.random().toString(36).substring(2, 9),
    text: text.trim(),
    timestamp: Date.now(),
  };

  const confs = db.get("confessions");
  confs.push(newConf);
  db.set("confessions", confs);

  res.status(201).json({ success: true, data: newConf });
});

// ==================== CHAT REQUESTS (Friend / Connect Flow) ====================
messagesRouter.get("/requests", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUid = req.user!.uid;
  const requests = db.get("chatRequests") || [];
  const users = db.get("users") || [];

  const myRequests = requests
    .filter((r) => r.senderId === currentUid || r.recipientId === currentUid)
    .map((r) => {
      const senderObj = users.find((u) => u.id === r.senderId);
      const recipientObj = users.find((u) => u.id === r.recipientId);
      return {
        ...r,
        sender: sanitizeUser(senderObj),
        recipient: sanitizeUser(recipientObj),
      };
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  res.json({ success: true, count: myRequests.length, data: myRequests });
});

messagesRouter.post("/requests", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUid = req.user!.uid;
  const { recipientId } = req.body;

  if (!recipientId) {
    res.status(400).json({ error: "Recipient student ID is required." });
    return;
  }

  if (recipientId === currentUid) {
    res.status(400).json({ error: "You cannot send a chat request to yourself." });
    return;
  }

  const users = db.get("users") || [];
  const recipientUser = users.find((u) => u.id === recipientId);
  if (!recipientUser) {
    res.status(404).json({ error: "Target student not found in directory." });
    return;
  }

  const requests = db.get("chatRequests") || [];
  const existing = requests.find(
    (r) =>
      (r.senderId === currentUid && r.recipientId === recipientId) ||
      (r.senderId === recipientId && r.recipientId === currentUid)
  );

  if (existing) {
    if (existing.status === "accepted") {
      res.json({ success: true, message: "Chat request already accepted.", data: existing });
      return;
    }

    if (existing.status === "pending" && existing.senderId === currentUid) {
      res.json({ success: true, message: "Chat request already sent and pending.", data: existing });
      return;
    }

    // If the other user sent a pending request to current user, auto-accept it!
    if (existing.status === "pending" && existing.recipientId === currentUid) {
      existing.status = "accepted";
      existing.updatedAt = Date.now();
      db.set("chatRequests", requests);
      res.json({ success: true, message: "Chat request accepted!", data: existing });
      return;
    }

    // If previously rejected, re-open as pending
    existing.senderId = currentUid;
    existing.recipientId = recipientId;
    existing.status = "pending";
    existing.updatedAt = Date.now();
    db.set("chatRequests", requests);
    res.json({ success: true, message: "Chat request re-sent!", data: existing });
    return;
  }

  const newReq: ChatRequestRecord = {
    id: "req-" + Math.random().toString(36).substring(2, 9),
    senderId: currentUid,
    recipientId,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  requests.push(newReq);
  db.set("chatRequests", requests);

  res.status(201).json({
    success: true,
    message: "Chat request sent successfully.",
    data: {
      ...newReq,
      sender: sanitizeUser(users.find((u) => u.id === currentUid)),
      recipient: sanitizeUser(recipientUser),
    },
  });
});

messagesRouter.put("/requests/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUid = req.user!.uid;
  const requestId = req.params.id;
  const { status } = req.body;

  if (status !== "accepted" && status !== "rejected") {
    res.status(400).json({ error: "Status must be either 'accepted' or 'rejected'." });
    return;
  }

  const requests = db.get("chatRequests") || [];
  const reqItem = requests.find((r) => r.id === requestId);

  if (!reqItem) {
    res.status(404).json({ error: "Chat request not found." });
    return;
  }

  // Only the recipient can accept or reject
  if (reqItem.recipientId !== currentUid) {
    res.status(403).json({ error: "Only the recipient can respond to this chat request." });
    return;
  }

  reqItem.status = status;
  reqItem.updatedAt = Date.now();
  db.set("chatRequests", requests);

  const users = db.get("users") || [];
  res.json({
    success: true,
    message: `Chat request ${status}`,
    data: {
      ...reqItem,
      sender: sanitizeUser(users.find((u) => u.id === reqItem.senderId)),
      recipient: sanitizeUser(users.find((u) => u.id === reqItem.recipientId)),
    },
  });
});

messagesRouter.delete("/requests/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUid = req.user!.uid;
  const requestId = req.params.id;

  const requests = db.get("chatRequests") || [];
  const index = requests.findIndex(
    (r) => r.id === requestId && (r.senderId === currentUid || r.recipientId === currentUid)
  );

  if (index === -1) {
    res.status(404).json({ error: "Chat request not found or unauthorized." });
    return;
  }

  const removed = requests.splice(index, 1)[0];
  db.set("chatRequests", requests);
  res.json({ success: true, message: "Chat request removed", data: removed });
});

// ==================== PRIVATE MESSAGES (JWT Protected) ====================
messagesRouter.get("/private/:targetUid", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const currentUid = req.user!.uid;
  const targetUid = req.params.targetUid;
  const conversationKey = [currentUid, targetUid].sort().join("_");

  const privateMsgs = db.get("privateMessages");
  const thread = privateMsgs.filter((m) => m.conversationKey === conversationKey);

  res.json({ success: true, count: thread.length, data: thread });
});

messagesRouter.post("/private", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { recipient, text } = req.body;
  const currentUid = req.user!.uid;

  if (!recipient || !text || !text.trim()) {
    res.status(400).json({ error: "Recipient UID and message text are required." });
    return;
  }

  // Check chat request status between current user and recipient
  const requests = db.get("chatRequests") || [];
  const isAccepted = requests.some(
    (r) =>
      r.status === "accepted" &&
      ((r.senderId === currentUid && r.recipientId === recipient) ||
        (r.senderId === recipient && r.recipientId === currentUid))
  );

  if (!isAccepted) {
    res.status(403).json({
      error: "You need an accepted chat request to send private messages to this student.",
    });
    return;
  }

  const conversationKey = [currentUid, recipient].sort().join("_");
  const newMsg: PrivateMessageRecord = {
    id: "pm-" + Math.random().toString(36).substring(2, 9),
    sender: currentUid,
    recipient: recipient,
    conversationKey,
    text: text.trim(),
    timestamp: Date.now(),
  };

  const privateMsgs = db.get("privateMessages");
  privateMsgs.push(newMsg);
  db.set("privateMessages", privateMsgs);

  res.status(201).json({ success: true, data: newMsg });
});

