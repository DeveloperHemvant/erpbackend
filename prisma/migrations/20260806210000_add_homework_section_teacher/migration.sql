-- AlterTable
ALTER TABLE "lms_assignments" ADD COLUMN     "sectionId" UUID,
ADD COLUMN     "teacherId" UUID;

-- AddForeignKey
ALTER TABLE "lms_assignments" ADD CONSTRAINT "lms_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_assignments" ADD CONSTRAINT "lms_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
