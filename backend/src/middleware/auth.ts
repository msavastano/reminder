import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: `Requires ${role} role` });
      return;
    }
    next();
  };
}

/** For caregiver-side routes with a :patientId param — verifies a link exists. */
export async function requireCaregiverOwnsPatient(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const patientId = req.params.patientId;
  if (!patientId) {
    res.status(400).json({ error: "Missing patientId" });
    return;
  }
  const link = await prisma.caregiverPatientLink.findUnique({
    where: { caregiverId_patientId: { caregiverId: req.user.id, patientId } },
  });
  if (!link) {
    res.status(403).json({ error: "Not linked to this patient" });
    return;
  }
  next();
}

/** For patient-side routes with a :patientId param — patient may only act on themselves. */
export function requireSelfIsPatient(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  if (req.params.patientId !== req.user.id) {
    res.status(403).json({ error: "Cannot access another patient's data" });
    return;
  }
  next();
}

/** Allows either the owning patient (self) or a caregiver linked to that patient. */
export async function requireSelfOrCaregiverOwnsPatient(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const patientId = req.params.patientId;
  if (req.user.role === "PATIENT") {
    if (patientId !== req.user.id) {
      res.status(403).json({ error: "Cannot access another patient's data" });
      return;
    }
    next();
    return;
  }
  const link = await prisma.caregiverPatientLink.findUnique({
    where: { caregiverId_patientId: { caregiverId: req.user.id, patientId } },
  });
  if (!link) {
    res.status(403).json({ error: "Not linked to this patient" });
    return;
  }
  next();
}
