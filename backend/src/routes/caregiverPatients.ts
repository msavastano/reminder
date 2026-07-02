import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/caregiver/patients", requireAuth, requireRole("CAREGIVER"), async (req, res) => {
  const links = await prisma.caregiverPatientLink.findMany({
    where: { caregiverId: req.user!.id },
    include: { patient: true },
    orderBy: { createdAt: "asc" },
  });
  const patients = links.map((l) => ({
    patientId: l.patientId,
    name: l.patient.name,
    email: l.patient.email,
    status: l.status,
  }));
  res.json({ patients });
});

router.post("/caregiver/patients/link", requireAuth, requireRole("CAREGIVER"), async (req, res) => {
  const { patientEmail } = req.body ?? {};
  if (!patientEmail || typeof patientEmail !== "string") {
    res.status(400).json({ error: "patientEmail is required" });
    return;
  }
  const patient = await prisma.user.findUnique({ where: { email: patientEmail } });
  if (!patient || patient.role !== "PATIENT") {
    res.status(404).json({ error: "That email doesn't have a patient account on the app yet. Ask them to create one first." });
    return;
  }
  const existing = await prisma.caregiverPatientLink.findUnique({
    where: { caregiverId_patientId: { caregiverId: req.user!.id, patientId: patient.id } },
  });
  if (existing) {
    res.status(409).json({
      error:
        existing.status === "ACCEPTED"
          ? "You're already connected to this patient"
          : "You've already invited this patient — waiting for them to accept",
    });
    return;
  }
  const link = await prisma.caregiverPatientLink.create({
    data: { caregiverId: req.user!.id, patientId: patient.id },
  });
  res.status(201).json({
    patient: { patientId: patient.id, name: patient.name, email: patient.email, status: link.status },
  });
});

router.delete("/caregiver/patients/:patientId/link", requireAuth, requireRole("CAREGIVER"), async (req, res) => {
  const { patientId } = req.params;
  await prisma.caregiverPatientLink.deleteMany({
    where: { caregiverId: req.user!.id, patientId },
  });
  res.status(204).end();
});

router.get("/patient/caregivers", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const links = await prisma.caregiverPatientLink.findMany({
    where: { patientId: req.user!.id, status: "ACCEPTED" },
    include: { caregiver: true },
    orderBy: { createdAt: "asc" },
  });
  const caregivers = links.map((l) => ({ caregiverId: l.caregiverId, name: l.caregiver.name, email: l.caregiver.email }));
  res.json({ caregivers });
});

router.get("/patient/invites", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const links = await prisma.caregiverPatientLink.findMany({
    where: { patientId: req.user!.id, status: "PENDING" },
    include: { caregiver: true },
    orderBy: { createdAt: "asc" },
  });
  const invites = links.map((l) => ({
    inviteId: l.id,
    caregiverId: l.caregiverId,
    caregiverName: l.caregiver.name,
    caregiverEmail: l.caregiver.email,
    invitedAt: l.createdAt,
  }));
  res.json({ invites });
});

router.post("/patient/invites/:inviteId/accept", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const link = await prisma.caregiverPatientLink.findUnique({
    where: { id: req.params.inviteId },
    include: { caregiver: true },
  });
  if (!link || link.patientId !== req.user!.id) {
    res.status(404).json({ error: "Invite not found" });
    return;
  }
  if (link.status === "ACCEPTED") {
    res.status(409).json({ error: "Invite already accepted" });
    return;
  }
  const updated = await prisma.caregiverPatientLink.update({
    where: { id: link.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  res.json({
    caregiver: { caregiverId: link.caregiverId, name: link.caregiver.name, email: link.caregiver.email },
    acceptedAt: updated.acceptedAt,
  });
});

router.post("/patient/invites/:inviteId/decline", requireAuth, requireRole("PATIENT"), async (req, res) => {
  const link = await prisma.caregiverPatientLink.findUnique({ where: { id: req.params.inviteId } });
  if (!link || link.patientId !== req.user!.id || link.status !== "PENDING") {
    res.status(404).json({ error: "Invite not found" });
    return;
  }
  await prisma.caregiverPatientLink.delete({ where: { id: link.id } });
  res.status(204).end();
});

export default router;
