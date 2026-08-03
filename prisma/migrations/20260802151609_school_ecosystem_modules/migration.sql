-- CreateTable
CREATE TABLE "health_profiles" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "currentMedications" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "familyDoctorName" TEXT,
    "familyDoctorPhone" TEXT,
    "insuranceProvider" TEXT,
    "insurancePolicyNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_visits" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "healthProfileId" UUID,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "symptoms" TEXT,
    "temperature" DOUBLE PRECISION,
    "treatmentGiven" TEXT,
    "actionTaken" TEXT NOT NULL DEFAULT 'Observed and Released',
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "loggedByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "healthProfileId" UUID,
    "vaccineName" TEXT NOT NULL,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "dateAdministered" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "administeredBy" TEXT,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_incidents" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Minor',
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "reportedByStaffId" UUID NOT NULL,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_counseling_notes" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "createdByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_counseling_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_inquiries" (
    "id" UUID NOT NULL,
    "childName" TEXT NOT NULL,
    "gradeInterested" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Walk-in',
    "status" TEXT NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "assignedToStaffId" UUID,
    "convertedStudentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_inquiry_followups" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_inquiry_followups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "health_profiles_studentId_key" ON "health_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "admission_inquiries_convertedStudentId_key" ON "admission_inquiries"("convertedStudentId");

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_healthProfileId_fkey" FOREIGN KEY ("healthProfileId") REFERENCES "health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_loggedByStaffId_fkey" FOREIGN KEY ("loggedByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_healthProfileId_fkey" FOREIGN KEY ("healthProfileId") REFERENCES "health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_incidents" ADD CONSTRAINT "discipline_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_incidents" ADD CONSTRAINT "discipline_incidents_reportedByStaffId_fkey" FOREIGN KEY ("reportedByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_counseling_notes" ADD CONSTRAINT "discipline_counseling_notes_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "discipline_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_counseling_notes" ADD CONSTRAINT "discipline_counseling_notes_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_assignedToStaffId_fkey" FOREIGN KEY ("assignedToStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiry_followups" ADD CONSTRAINT "admission_inquiry_followups_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "admission_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiry_followups" ADD CONSTRAINT "admission_inquiry_followups_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

