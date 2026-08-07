-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "campusId" UUID;

-- CreateTable
CREATE TABLE "staff_campus_access" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_campus_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_campus_access_staffId_campusId_key" ON "staff_campus_access"("staffId", "campusId");

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_campus_access" ADD CONSTRAINT "staff_campus_access_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_campus_access" ADD CONSTRAINT "staff_campus_access_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

