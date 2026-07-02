-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "CaregiverPatientLink" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "status" "LinkStatus" NOT NULL DEFAULT 'PENDING';
