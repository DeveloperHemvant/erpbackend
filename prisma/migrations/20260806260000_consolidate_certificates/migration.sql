-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "templateId" UUID,
    "studentId" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: copy every ems_certificates row into certificates before
-- dropping the old table (mirrors the one-off script actually run this
-- session; captured here so a fresh `migrate deploy` replay is equivalent).
INSERT INTO "certificates" ("id", "studentId", "type", "title", "fileUrl", "issueDate", "status", "createdAt")
SELECT gen_random_uuid(), "studentId", "type", "title", "fileUrl", "issueDate", 'Active', CURRENT_TIMESTAMP
FROM "ems_certificates";

-- DropTable (0 rows -- LMSCertificate had no data, no migration needed)
DROP TABLE "lms_certificates";

-- DropTable (115 rows migrated above before this drop)
DROP TABLE "ems_certificates";
