-- Migration to add amount detection fields to payments table
-- Run this script to update existing database

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN actual_amount DECIMAL(10,2) NULL COMMENT 'Actual amount paid via M-Pesa',
ADD COLUMN amount_mismatch BOOLEAN DEFAULT FALSE COMMENT 'True if actual amount differs from expected';

-- Update the status enum to include amount_mismatch
ALTER TABLE payments 
MODIFY COLUMN status ENUM('pending', 'paid', 'failed', 'amount_mismatch') DEFAULT 'pending';

-- Add index for amount mismatch queries
ALTER TABLE payments 
ADD INDEX idx_amount_mismatch (amount_mismatch);

-- Update existing records to set actual_amount = amount (assuming they were correct)
UPDATE payments 
SET actual_amount = amount, amount_mismatch = FALSE 
WHERE actual_amount IS NULL;
