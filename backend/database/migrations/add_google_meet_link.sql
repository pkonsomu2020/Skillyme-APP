-- Add Google Meet link column to sessions table
ALTER TABLE sessions 
ADD COLUMN google_meet_link VARCHAR(500) NULL COMMENT 'Google Meet invite link for the session';

-- Add index for better performance
CREATE INDEX idx_google_meet_link ON sessions(google_meet_link);

-- Update existing sessions with Google Meet links
UPDATE sessions 
SET google_meet_link = 'https://meet.google.com/skillyme-law-session-2025'
WHERE id = 1 AND title = 'Law Career Session';
