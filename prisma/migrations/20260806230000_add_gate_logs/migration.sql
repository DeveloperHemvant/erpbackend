-- CreateTable
CREATE TABLE "vehicle_gate_logs" (
    "id" UUID NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "driverName" TEXT,
    "purpose" TEXT NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "loggedById" UUID,

    CONSTRAINT "vehicle_gate_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_gate_logs" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedById" UUID,

    CONSTRAINT "student_gate_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehicle_gate_logs" ADD CONSTRAINT "vehicle_gate_logs_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gate_logs" ADD CONSTRAINT "student_gate_logs_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gate_logs" ADD CONSTRAINT "student_gate_logs_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
