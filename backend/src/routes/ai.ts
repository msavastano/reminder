import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireSelfOrCaregiverOwnsPatient } from "../middleware/auth.js";
import { requireAccessToReminder } from "../middleware/reminderAccess.js";
import {
  evaluateReminder,
  summarizeIncompleteReminders,
  GEMINI_MODEL_NAME,
  type AiEvaluationResult,
} from "../services/geminiService.js";

const router = Router();

function serialize(evaluation: { id: string; reminderId: string; requestedById: string; resultJson: string; modelName: string; createdAt: Date }) {
  return {
    id: evaluation.id,
    reminderId: evaluation.reminderId,
    requestedById: evaluation.requestedById,
    result: JSON.parse(evaluation.resultJson) as AiEvaluationResult,
    modelName: evaluation.modelName,
    createdAt: evaluation.createdAt,
  };
}

/** Lets requireAccessToReminder (built for :id-keyed routes) work on a reminderId supplied in the body. */
function reminderIdFromBody(req: Request, res: Response, next: NextFunction) {
  const { reminderId } = req.body ?? {};
  if (!reminderId || typeof reminderId !== "string") {
    res.status(400).json({ error: "reminderId is required" });
    return;
  }
  req.params.id = reminderId;
  next();
}

router.post("/ai/evaluate-reminder", requireAuth, reminderIdFromBody, requireAccessToReminder, async (req, res) => {
  try {
    const result = await evaluateReminder(req.reminder!);
    const evaluation = await prisma.aiEvaluation.create({
      data: {
        reminderId: req.reminder!.id,
        requestedById: req.user!.id,
        resultJson: JSON.stringify(result),
        modelName: GEMINI_MODEL_NAME,
      },
    });
    res.status(201).json({ evaluation: serialize(evaluation) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI evaluation failed";
    res.status(502).json({ error: message });
  }
});

router.get(
  "/ai/evaluations/:reminderId",
  requireAuth,
  (req, _res, next) => {
    req.params.id = req.params.reminderId;
    next();
  },
  requireAccessToReminder,
  async (req, res) => {
    const evaluation = await prisma.aiEvaluation.findFirst({
      where: { reminderId: req.reminder!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ evaluation: evaluation ? serialize(evaluation) : null });
  },
);

router.post(
  "/patients/:patientId/ai/reminders-summary",
  requireAuth,
  requireSelfOrCaregiverOwnsPatient,
  async (req, res) => {
    const { patientId } = req.params;
    const reminders = await prisma.reminder.findMany({
      where: { patientId, completed: false },
      orderBy: { dueAt: "asc" },
    });

    if (reminders.length === 0) {
      res.json({ summary: { summary: "You're all caught up — there's nothing left to do right now.", steps: [] } });
      return;
    }

    try {
      const summary = await summarizeIncompleteReminders(reminders);
      res.json({ summary });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI summary failed";
      res.status(502).json({ error: message });
    }
  },
);

export default router;
