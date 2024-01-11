-- DropIndex
DROP INDEX "account_balance_date_idx";

-- DropIndex
DROP INDEX "security_pricing_date_idx";

-- CreateIndex
CREATE INDEX "account_balance_date_idx" ON "account_balance"("date");

-- CreateIndex
CREATE INDEX "security_pricing_date_idx" ON "security_pricing"("date");
