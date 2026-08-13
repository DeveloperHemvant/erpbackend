-- AlterTable
ALTER TABLE "hostel_outpasses" ADD COLUMN     "parentConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentConsentAt" TIMESTAMP(3),
ADD COLUMN     "parentConsentAttachmentId" TEXT;

-- CreateTable
CREATE TABLE "consent_requests" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetSectionId" UUID,
    "dueDate" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_responses" (
    "id" UUID NOT NULL,
    "consentRequestId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "respondedAt" TIMESTAMP(3),
    "respondedById" UUID,
    "signatureAttachmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consent_responses_consentRequestId_studentId_key" ON "consent_responses"("consentRequestId", "studentId");

-- AddForeignKey
ALTER TABLE "consent_requests" ADD CONSTRAINT "consent_requests_targetSectionId_fkey" FOREIGN KEY ("targetSectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_requests" ADD CONSTRAINT "consent_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_responses" ADD CONSTRAINT "consent_responses_consentRequestId_fkey" FOREIGN KEY ("consentRequestId") REFERENCES "consent_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_responses" ADD CONSTRAINT "consent_responses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_responses" ADD CONSTRAINT "consent_responses_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

