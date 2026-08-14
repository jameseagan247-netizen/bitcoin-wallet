-- Remove legacy training wording from existing transaction descriptions.

UPDATE "Transaction"
SET "description" = 'Deposit'
WHERE "description" = 'Training deposit';

UPDATE "Transaction"
SET "description" = 'Withdrawal'
WHERE "description" = 'Training withdrawal';

-- Rename legacy simulated wallet identifiers.
UPDATE "Wallet"
SET "address" = REPLACE("address", 'training_', 'wallet_')
WHERE "address" LIKE 'training_%';
