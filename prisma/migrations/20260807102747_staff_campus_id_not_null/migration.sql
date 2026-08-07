-- DropForeignKey
ALTER TABLE "staff" DROP CONSTRAINT "staff_campusId_fkey";

-- AlterTable
ALTER TABLE "staff" ALTER COLUMN "campusId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

