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

  await prisma.caregiverPatientLink.createMany({
    data: [
      { caregiverId: caregiver.id, patientId: patient1.id },
      { caregiverId: caregiver.id, patientId: patient2.id },
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
        createdById: caregiver.id,
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
        senderId: caregiver.id,
        patientId: patient1.id,
        body: "Don't forget your PT appointment tomorrow — I'll drive you.",
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
  console.log(`  Caregiver: ${caregiver.email} / ${DEV_PASSWORD}`);
  console.log(`  Patient 1: ${patient1.email} / ${DEV_PASSWORD}`);
  console.log(`  Patient 2: ${patient2.email} / ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
