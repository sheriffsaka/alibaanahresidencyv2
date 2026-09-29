-- Migration: Add allowed_sections to profiles table
-- Purpose: Configurable section-level access control for Limited Admin (staff)
-- Date: 2026-09-29

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS allowed_sections TEXT[] DEFAULT ARRAY['bookings', 'students', 'transactions', 'messages']::TEXT[];

-- Update existing staff profiles to have default allowed_sections if null
UPDATE public.profiles
SET allowed_sections = ARRAY['bookings', 'students', 'transactions', 'messages']::TEXT[]
WHERE role = 'staff' AND allowed_sections IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.allowed_sections IS 'Configurable permitted Admin dashboard sections for limited admin (staff role). Proprietors retain full access.';
