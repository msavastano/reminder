import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireSelfOrCaregiverOwnsPatient } from "../middleware/auth.js";
import { requireAccessToReminder } from "../middleware/reminderAccess.js";

const router = Router();

const RECURRENCE_VALUES = ["none", "daily", "weekly"] as const;

router.get("/patients/:patientId/reminders", requireAuth, requireSelfOrCaregiverOwnsPatient, async (req, res) => {
  const { patientId } = req.params;
  const { search, completed } = req.query;

  const where: Record<string, unknown> = { patientId };
  if (completed === "true") where.completed = true;
  if (completed === "false") where.completed = false;
  if (typeof search === "string" && search.trim()) {
    // SQLite's Prisma provider doesn't support `mode: "insensitive"` (Postgres/Mongo only);
    // the frontend does its own case-insensitive client-side filtering, so this is a plain substring match.
    where.OR = [{ title: { contains: search } }, { body: { contains: search } }];
  }

  const reminders = await prisma.reminder.findMany({ where, orderBy: { dueAt: "asc" } });
  res.json({ reminders });
});

router.get(
  "/patients/:patientId/reminders/current",
  requireAuth,
  requireSelfOrCaregiverOwnsPatient,
  async (req, res) => {
    const { patientId } = req.params;
    const now = new Date();

    const overdue = await prisma.reminder.findFirst({
      where: { patientId, completed: false, dueAt: { lte: now } },
      orderBy: { dueAt: "desc" },
    });
    if (overdue) {
      res.json({ reminder: overdue });
      return;
    }

    const upcoming = await prisma.reminder.findFirst({
      where: { patientId, completed: false, dueAt: { gt: now } },
      orderBy: { dueAt: "asc" },
    });
    res.json({ reminder: upcoming ?? null });
  },
);

router.post("/patients/:patientId/reminders", requireAuth, requireSelfOrCaregiverOwnsPatient, async (req, res) => {
  const { patientId } = req.params;
  const { title, body, dueAt, recurrenceRule } = req.body ?? {};

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const parsedDueAt = new Date(dueAt);
  if (!dueAt || Number.isNaN(parsedDueAt.getTime())) {
    res.status(400).json({ error: "A valid dueAt date is required" });
    return;
  }
  if (recurrenceRule && !RECURRENCE_VALUES.includes(recurrenceRule)) {
    res.status(400).json({ error: "Invalid recurrenceRule" });
    return;
  }

  const reminder = await prisma.reminder.create({
    data: {
      patientId,
      createdById: req.user!.id,
      title,
      body: body || null,
      dueAt: parsedDueAt,
      recurrenceRule: recurrenceRule ?? "none",
    },
  });
  res.status(201).json({ reminder });
});

router.patch("/reminders/:id", requireAuth, requireAccessToReminder, async (req, res) => {
  const { title, body, dueAt, recurrenceRule } = req.body ?? {};
  const data: Record<string, unknown> = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title must be a non-empty string" });
      return;
    }
    data.title = title;
  }
  if (body !== undefined) data.body = body || null;
  if (dueAt !== undefined) {
    const parsedDueAt = new Date(dueAt);
    if (Number.isNaN(parsedDueAt.getTime())) {
      res.status(400).json({ error: "A valid dueAt date is required" });
      return;
    }
    data.dueAt = parsedDueAt;
  }
  if (recurrenceRule !== undefined) {
    if (!RECURRENCE_VALUES.includes(recurrenceRule)) {
      res.status(400).json({ error: "Invalid recurrenceRule" });
      return;
    }
    data.recurrenceRule = recurrenceRule;
  }

  const updated = await prisma.reminder.update({ where: { id: req.reminder!.id }, data });
  res.json({ reminder: updated });
});

router.patch("/reminders/:id/complete", requireAuth, requireAccessToReminder, async (req, res) => {
  const { completed } = req.body ?? {};
  if (typeof completed !== "boolean") {
    res.status(400).json({ error: "completed must be a boolean" });
    return;
  }
  const updated = await prisma.reminder.update({
    where: { id: req.reminder!.id },
    data: { completed, completedAt: completed ? new Date() : null },
  });
  res.json({ reminder: updated });
});

router.delete("/reminders/:id", requireAuth, requireAccessToReminder, async (req, res) => {
  await prisma.reminder.delete({ where: { id: req.reminder!.id } });
  res.status(204).end();
});

export default router;
