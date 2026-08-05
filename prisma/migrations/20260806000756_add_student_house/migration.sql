-- AlterTable
ALTER TABLE "acms_events" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "houseId" UUID;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "school_houses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

