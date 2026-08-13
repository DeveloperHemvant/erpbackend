-- AlterTable
ALTER TABLE "report_cards" ADD COLUMN     "parentSigned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentSignedAt" TIMESTAMP(3),
ADD COLUMN     "signatureAttachmentId" TEXT;

