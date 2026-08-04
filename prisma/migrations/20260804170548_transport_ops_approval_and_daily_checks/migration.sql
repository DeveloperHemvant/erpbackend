-- AlterTable
ALTER TABLE "transport_accidents" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT;

-- AlterTable
ALTER TABLE "transport_breakdowns" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "acknowledgedBy" TEXT;

-- AlterTable
ALTER TABLE "transport_expenses" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "transport_fuel_logs" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- CreateTable
CREATE TABLE "transport_daily_checks" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "driverId" UUID,
    "tripId" UUID,
    "date" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "brakesOk" BOOLEAN NOT NULL DEFAULT true,
    "tyresOk" BOOLEAN NOT NULL DEFAULT true,
    "lightsIndicatorsOk" BOOLEAN NOT NULL DEFAULT true,
    "hornOk" BOOLEAN NOT NULL DEFAULT true,
    "firstAidKitOk" BOOLEAN NOT NULL DEFAULT true,
    "fireExtinguisherOk" BOOLEAN NOT NULL DEFAULT true,
    "fuelLevelOk" BOOLEAN NOT NULL DEFAULT true,
    "odometerReading" DOUBLE PRECISION,
    "overallStatus" TEXT NOT NULL DEFAULT 'Fit',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_daily_checks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

