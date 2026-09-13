import { Router, Response } from "express";
import { db, UserRecord } from "../db";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/auth";

export const authRouter = Router();

function generateUid(): string {
  return "USR-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Register new user
authRouter.post("/register", (req, res: Response) => {
  try {
    const {
      username,
      password,
      name,
      phone,
      branch,
      location,
      dob,
      pronouns,
      avatar,
      bio,
    } = req.body;

    if (!username || !password || !name) {
      res.status(400).json({
        error: "Missing required fields",
        message: "Username, password, and full name are required.",
      });
      return;
    }

    const users = db.get("users");
    const existing = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (existing) {
      res.status(409).json({
        error: "Username taken",
        message: "A student account with this username already exists.",
      });
      return;
    }

    const uid = generateUid();
    const hashedPassword = hashPassword(password);

    const newUser: UserRecord = {
      id: uid,
      username: username.trim(),
      password: hashedPassword,
      name: name.trim(),
      phone: phone?.trim() || "",
      branch: branch?.trim() || "General Engineering",
      location: location?.trim() || "Campus",
      dob: dob || "",
      pronouns: pronouns || "",
      avatar: avatar || "",
      bio: bio?.trim() || "",
      isPrivate: false,
      status: "active",
      createdAt: Date.now(),
    };

    users.push(newUser);
    db.set("users", users);

    const token = signToken({
      uid: newUser.id,
      username: newUser.username,
      name: newUser.name,
      branch: newUser.branch,
    });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: "Student account created successfully",
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Registration failed", message: err.message });
  }
});

// Login
authRouter.post("/login", (req, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: "Missing credentials",
        message: "Username and password are required.",
      });
      return;
    }

    const users = db.get("users");
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!user) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "No user found with the provided username.",
      });
      return;
    }

    if (user.status === "blocked") {
      res.status(403).json({
        error: "Account blocked",
        message: "This account has been blocked by the campus administrator.",
      });
      return;
    }

    if (user.status === "deactivated") {
      res.status(403).json({
        error: "Account deactivated",
        message: "This account has been deactivated by the administrator. Contact support to reactivate.",
      });
      return;
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        error: "Invalid credentials",
        message: "Password does not match.",
      });
      return;
    }

    const token = signToken({
      uid: user.id,
      username: user.username,
      name: user.name,
      branch: user.branch,
    });

    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed", message: err.message });
  }
});

// Get current authenticated user profile (Protected)
authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const users = db.get("users");
  const user = users.find((u) => u.id === req.user?.uid);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

// Update profile (Protected)
authRouter.put("/profile", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.get("users");
    const index = users.findIndex((u) => u.id === req.user?.uid);

    if (index === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, phone, branch, location, bio, pronouns, avatar, isPrivate } = req.body;
    const current = users[index];

    if (name !== undefined) current.name = name;
    if (phone !== undefined) current.phone = phone;
    if (branch !== undefined) current.branch = branch;
    if (location !== undefined) current.location = location;
    if (bio !== undefined) current.bio = bio;
    if (pronouns !== undefined) current.pronouns = pronouns;
    if (avatar !== undefined) current.avatar = avatar;
    if (isPrivate !== undefined) current.isPrivate = Boolean(isPrivate);

    users[index] = current;
    db.set("users", users);

    const { password: _, ...userSafe } = current;
    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userSafe,
    });
  } catch (err: any) {
    res.status(500).json({ error: "Update failed", message: err.message });
  }
});

// Public search/directory of campus members
authRouter.get("/directory", (req, res: Response) => {
  const q = (req.query.q as string || "").toLowerCase();
  const users = db.get("users");

  const results = users
    .filter((u) => u.status === "active")
    .filter(
      (u) =>
        !q ||
        u.id.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.branch.toLowerCase().includes(q)
    )
    .map(({ password: _, ...safe }) => safe);

  res.json({ success: true, users: results });
});
