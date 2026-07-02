import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEV_PASSWORD = "password123";

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

async function main() {
  await prisma.aiEvaluation.deleteMany();
  await prisma.message.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.caregiverPatientLink.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const caregiver = await prisma.user.create({
    data: {
      email: "caregiver@example.com",
      passwordHash,
      name: "Alex Caregiver",
      role: "CAREGIVER",
    },
  });

  const caregiver2 = await prisma.user.create({
    data: {
      email: "caregiver2@example.com",
      passwordHash,
      name: "Priya Nair",
      role: "CAREGIVER",
    },
  });

  const caregiver3 = await prisma.user.create({
    data: {
      email: "caregiver3@example.com",
      passwordHash,
      name: "Jordan Blake",
      role: "CAREGIVER",
    },
  });

  const patient1 = await prisma.user.create({
    data: {
      email: "patient1@example.com",
      passwordHash,
      name: "Mara Okafor",
      role: "PATIENT",
    },
  });

  const patient2 = await prisma.user.create({
    data: {
      email: "patient2@example.com",
      passwordHash,
      name: "Sam Reyes",
      role: "PATIENT",
    },
  });

  // A patient who has an account but hasn't been through onboarding yet:
  // one pending invite from Jordan, nothing accepted.
  const patient3 = await prisma.user.create({
    data: {
      email: "patient3@example.com",
      passwordHash,
      name: "Ellis Ward",
      role: "PATIENT",
    },
  });

  await prisma.caregiverPatientLink.createMany({
    data: [
      // Mara has two accepted caregivers (multi-caregiver experience)...
      { caregiverId: caregiver.id, patientId: patient1.id, status: "ACCEPTED", acceptedAt: hoursFromNow(-72) },
      { caregiverId: caregiver2.id, patientId: patient1.id, status: "ACCEPTED", acceptedAt: hoursFromNow(-48) },
      // ...and a pending invite from Jordan she can accept in-app.
      { caregiverId: caregiver3.id, patientId: patient1.id, status: "PENDING" },
      // Sam has one accepted caregiver.
      { caregiverId: caregiver.id, patientId: patient2.id, status: "ACCEPTED", acceptedAt: hoursFromNow(-96) },
      // Ellis has only a pending invite — lands on the onboarding screen.
      { caregiverId: caregiver3.id, patientId: patient3.id, status: "PENDING" },
    ],
  });

  await prisma.reminder.createMany({
    data: [
      {
        patientId: patient1.id,
        createdById: caregiver.id,
        title: "Take morning medication",
        body: "One blue pill and one white pill with breakfast.",
        dueAt: hoursFromNow(-2),
        completed: false,
      },
      {
        patientId: patient1.id,
        createdById: caregiver2.id,
        title: "Drink a glass of water",
        body: "Stay hydrated — a full glass, please.",
        dueAt: hoursFromNow(1),
        recurrenceRule: "daily",
        completed: false,
      },
      {
        patientId: patient1.id,
        createdById: patient1.id,
        title: "Call Grandma Rose",
        body: "She loves hearing from you on Tuesdays.",
        dueAt: hoursFromNow(5),
        completed: false,
      },
      {
        patientId: patient1.id,
        createdById: caregiver2.id,
        title: "Blood pressure check",
        body: "Use the arm cuff, sitting down, before dinner.",
        dueAt: hoursFromNow(9),
        recurrenceRule: "daily",
        completed: false,
      },
      {
        patientId: patient1.id,
        createdById: caregiver.id,
        title: "Afternoon walk",
        body: "A short walk around the garden with your cane.",
        dueAt: hoursFromNow(-26),
        completed: true,
        completedAt: hoursFromNow(-25),
      },
      {
        patientId: patient1.id,
        createdById: caregiver.id,
        title: "Physical therapy appointment",
        body: "Dr. Patel's office, 3rd floor. Bring the referral slip.",
        dueAt: hoursFromNow(30),
        completed: false,
      },
      {
        patientId: patient2.id,
        createdById: caregiver.id,
        title: "Take evening medication",
        body: "One white pill with dinner.",
        dueAt: hoursFromNow(6),
        recurrenceRule: "daily",
        completed: false,
      },
      {
        patientId: patient2.id,
        createdById: caregiver.id,
        title: "Feed the cat",
        dueAt: hoursFromNow(-1),
        completed: false,
      },
      {
        patientId: patient2.id,
        createdById: caregiver.id,
        title: "Weekly grocery delivery",
        body: "Check the fridge before the order arrives.",
        dueAt: hoursFromNow(48),
        recurrenceRule: "weekly",
        completed: false,
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        senderId: caregiver.id,
        patientId: patient1.id,
        body: "Good morning! I'll stop by after lunch today.",
        readAt: hoursFromNow(-20),
      },
      {
        senderId: caregiver2.id,
        patientId: patient1.id,
        body: "Hi Mara, it's Priya — I added a blood pressure check to your reminders.",
        readAt: hoursFromNow(-15),
      },
      {
        senderId: caregiver.id,
        patientId: patient1.id,
        body: "Don't forget your PT appointment tomorrow — I'll drive you.",
      },
      {
        senderId: caregiver2.id,
        patientId: patient1.id,
        body: "Your readings looked great this week. Keep it up!",
      },
      {
        senderId: caregiver.id,
        patientId: patient1.id,
        body: "Love you! Call me if you need anything.",
      },
      {
        senderId: caregiver.id,
        patientId: patient2.id,
        body: "Hi Sam, the grocery order is set for Thursday.",
        readAt: hoursFromNow(-10),
      },
      {
        senderId: caregiver.id,
        patientId: patient2.id,
        body: "Let me know if the cat food is running low.",
      },
    ],
  });

  console.log("Seed complete. Log in with:");
  console.log(`  Caregiver 1: ${caregiver.email} / ${DEV_PASSWORD} (patients: Mara, Sam)`);
  console.log(`  Caregiver 2: ${caregiver2.email} / ${DEV_PASSWORD} (patients: Mara)`);
  console.log(`  Caregiver 3: ${caregiver3.email} / ${DEV_PASSWORD} (pending invites to Mara, Ellis)`);
  console.log(`  Patient 1:   ${patient1.email} / ${DEV_PASSWORD} (two caregivers + one pending invite)`);
  console.log(`  Patient 2:   ${patient2.email} / ${DEV_PASSWORD} (one caregiver)`);
  console.log(`  Patient 3:   ${patient3.email} / ${DEV_PASSWORD} (not onboarded — pending invite only)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
