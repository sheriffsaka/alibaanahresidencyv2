
-- Phase 2: Schema Migration
-- Run this in your Supabase SQL Editor to fix the 'apartment_name' and other missing columns issue.

-- 1. Add missing columns to 'rooms' table with safe defaults where needed
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS apartment_name VARCHAR(50) DEFAULT 'Main Apartment';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Standard';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS video_urls TEXT[] DEFAULT '{}';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS occupied_slots INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS gender_restriction TEXT DEFAULT 'Any';

-- 2. Update Constraints (Categorical checks)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_category_check') THEN
        ALTER TABLE rooms ADD CONSTRAINT rooms_category_check CHECK (category IN ('Standard', 'Premium'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rooms_gender_restriction_check') THEN
        ALTER TABLE rooms ADD CONSTRAINT rooms_gender_restriction_check CHECK (gender_restriction IN ('Male', 'Female', 'Any'));
    END IF;
END $$;

-- 3. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
