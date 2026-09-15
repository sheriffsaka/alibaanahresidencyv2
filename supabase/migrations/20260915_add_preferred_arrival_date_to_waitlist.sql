-- Migration: Add preferred_arrival_date to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS preferred_arrival_date DATE NULL;

-- Comment for clarity
COMMENT ON COLUMN public.waitlist.preferred_arrival_date IS 'Student preferred or expected arrival date for residency';
