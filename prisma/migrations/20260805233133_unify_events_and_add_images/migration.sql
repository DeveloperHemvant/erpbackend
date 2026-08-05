-- DropForeignKey
ALTER TABLE "school_events" DROP CONSTRAINT "school_events_campusId_fkey";

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "acms_events" ADD COLUMN     "campusId" UUID,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "school_events";

-- AddForeignKey
ALTER TABLE "acms_events" ADD CONSTRAINT "acms_events_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

