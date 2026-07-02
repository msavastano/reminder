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
  const patients = links.map((l) => ({ patientId: l.patientId, name: l.patient.name, email: l.patient.email }));
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
    res.status(404).json({ error: "No patient account found with that email" });
    return;
  }
  const existing = await prisma.caregiverPatientLink.findUnique({
    where: { caregiverId_patientId: { caregiverId: req.user!.id, patientId: patient.id } },
  });
  if (existing) {
    res.status(409).json({ error: "Already linked to this patient" });
    return;
  }
  await prisma.caregiverPatientLink.create({
    data: { caregiverId: req.user!.id, patientId: patient.id },
  });
  res.status(201).json({ patient: { patientId: patient.id, name: patient.name, email: patient.email } });
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
    where: { patientId: req.user!.id },
    include: { caregiver: true },
    orderBy: { createdAt: "asc" },
  });
  const caregivers = links.map((l) => ({ caregiverId: l.caregiverId, name: l.caregiver.name, email: l.caregiver.email }));
  res.json({ caregivers });
});

export default router;
