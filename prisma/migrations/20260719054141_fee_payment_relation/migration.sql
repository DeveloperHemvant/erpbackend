-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amountPaid" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT,
    "paymentDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
