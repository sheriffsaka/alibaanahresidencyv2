-- Migration: Add status column to rooms table
-- Allowed values: 'Active', 'Inactive'
-- Default value: 'Active'

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_status_check') THEN
        ALTER TABLE rooms ADD CONSTRAINT rooms_status_check CHECK (status IN ('Active', 'Inactive'));
    END IF;
END $$;

UPDATE rooms SET status = 'Active' WHERE status IS NULL;

NOTIFY pgrst, 'reload schema';
