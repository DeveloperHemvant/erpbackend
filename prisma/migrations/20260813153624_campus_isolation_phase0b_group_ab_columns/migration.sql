-- DropIndex
DROP INDEX "school_houses_name_key";

-- AlterTable
ALTER TABLE "admission_inquiries" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "ems_exam_sessions" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "fee_structures" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "hostels" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "library_books" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "school_houses" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "transport_routes" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "transport_vehicles" ADD COLUMN     "campusId" UUID;

-- AlterTable
ALTER TABLE "visitor_records" ADD COLUMN     "campusId" UUID;

-- CreateIndex
CREATE INDEX "admission_inquiries_campusId_status_idx" ON "admission_inquiries"("campusId", "status");

-- CreateIndex
CREATE INDEX "announcements_campusId_idx" ON "announcements"("campusId");

-- CreateIndex
CREATE INDEX "ems_exam_sessions_campusId_isActive_idx" ON "ems_exam_sessions"("campusId", "isActive");

-- CreateIndex
CREATE INDEX "fee_structures_campusId_status_idx" ON "fee_structures"("campusId", "status");

-- CreateIndex
CREATE INDEX "hostels_campusId_status_idx" ON "hostels"("campusId", "status");

-- CreateIndex
CREATE INDEX "library_books_campusId_status_idx" ON "library_books"("campusId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "school_houses_name_campusId_key" ON "school_houses"("name", "campusId");

-- CreateIndex
CREATE INDEX "transport_routes_campusId_status_idx" ON "transport_routes"("campusId", "status");

-- CreateIndex
CREATE INDEX "transport_vehicles_campusId_status_idx" ON "transport_vehicles"("campusId", "status");

-- CreateIndex
CREATE INDEX "visitor_records_campusId_status_idx" ON "visitor_records"("campusId", "status");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostels" ADD CONSTRAINT "hostels_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_books" ADD CONSTRAINT "library_books_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_vehicles" ADD CONSTRAINT "transport_vehicles_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_sessions" ADD CONSTRAINT "ems_exam_sessions_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_houses" ADD CONSTRAINT "school_houses_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

