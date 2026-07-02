import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireCaregiverOwnsPatient, requireRole, requireSelfOrCaregiverOwnsPatient } from "../middleware/auth.js";

const router = Router();

router.get("/patients/:patientId/messages", requireAuth, requireSelfOrCaregiverOwnsPatient, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { patientId: req.params.patientId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  res.json({ messages });
});

router.post(
  "/patients/:patientId/messages",
  requireAuth,
  requireRole("CAREGIVER"),
  requireCaregiverOwnsPatient,
  async (req, res) => {
    const { body } = req.body ?? {};
    if (!body || typeof body !== "string" || !body.trim()) {
      res.status(400).json({ error: "body is required" });
      return;
    }
    const message = await prisma.message.create({
      data: { senderId: req.user!.id, patientId: req.params.patientId, body: body.trim() },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json({ message });
  },
);

router.patch("/messages/:id/read", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  if (message.patientId !== req.user!.id) {
    res.status(403).json({ error: "Cannot access another patient's message" });
    return;
  }
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { readAt: message.readAt ?? new Date() },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });
  res.json({ message: updated });
});

export default router;
