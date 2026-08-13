-- CreateTable
CREATE TABLE "ptm_slots" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "parentId" UUID,
    "studentId" UUID,
    "bookedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ptm_slots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ptm_slots" ADD CONSTRAINT "ptm_slots_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

