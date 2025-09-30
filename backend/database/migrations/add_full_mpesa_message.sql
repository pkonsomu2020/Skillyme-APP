-- Add full M-Pesa message storage
ALTER TABLE payments 
ADD COLUMN full_mpesa_message TEXT COMMENT 'Complete M-Pesa confirmation message';

-- Add index for better performance
CREATE INDEX idx_full_mpesa_message ON payments(full_mpesa_message(100));
