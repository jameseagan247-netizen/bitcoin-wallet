CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" DECIMAL(20,8),
    "previousBalance" DECIMAL(20,8),
    "newBalance" DECIMAL(20,8),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

CREATE INDEX "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId");

CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");