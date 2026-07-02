import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { AUTH_COOKIE_NAME, signAuthToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: import("express").Response, token: string) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

function publicUser(user: { id: string; email: string; name: string; role: string }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

router.post("/register", async (req, res) => {
  const { email, password, name, role } = req.body ?? {};
  if (!email || !password || !name || (role !== "PATIENT" && role !== "CAREGIVER")) {
    res.status(400).json({ error: "email, password, name, and a valid role are required" });
    return;
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  });
  const token = signAuthToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const token = signAuthToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);
  res.json({ user: publicUser(user) });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: publicUser(user) });
});

export default router;
