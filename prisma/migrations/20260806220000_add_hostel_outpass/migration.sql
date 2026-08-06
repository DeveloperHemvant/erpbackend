-- CreateTable
CREATE TABLE "hostel_outpasses" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedById" UUID,
    "exitTime" TIMESTAMP(3),
    "returnTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_outpasses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hostel_outpasses" ADD CONSTRAINT "hostel_outpasses_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_outpasses" ADD CONSTRAINT "hostel_outpasses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
