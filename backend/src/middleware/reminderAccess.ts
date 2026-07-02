import type { Request, Response, NextFunction } from "express";
import type { Reminder } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      reminder?: Reminder;
    }
  }
}

/** For routes keyed by :id (a reminder id) — allows the owning patient or a caregiver linked to that patient. */
export async function requireAccessToReminder(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const reminder = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  if (req.user.role === "PATIENT") {
    if (reminder.patientId !== req.user.id) {
      res.status(403).json({ error: "Cannot access another patient's reminder" });
      return;
    }
  } else {
    const link = await prisma.caregiverPatientLink.findUnique({
      where: { caregiverId_patientId: { caregiverId: req.user.id, patientId: reminder.patientId } },
    });
    if (!link) {
      res.status(403).json({ error: "Not linked to this patient" });
      return;
    }
  }
  req.reminder = reminder;
  next();
}
