-- CreateTable
CREATE TABLE "fee_refunds" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "refundMode" TEXT,
    "referenceNo" TEXT,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "remarks" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "fee_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fee_refunds_paymentId_idx" ON "fee_refunds"("paymentId");

-- AddForeignKey
ALTER TABLE "fee_refunds" ADD CONSTRAINT "fee_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fee_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

