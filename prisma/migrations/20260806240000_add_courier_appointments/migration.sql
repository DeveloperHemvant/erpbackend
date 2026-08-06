-- CreateTable
CREATE TABLE "courier_logs" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "sender" TEXT,
    "recipient" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Received',
    "loggedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "visitorName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "hostId" UUID,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "courier_logs" ADD CONSTRAINT "courier_logs_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
