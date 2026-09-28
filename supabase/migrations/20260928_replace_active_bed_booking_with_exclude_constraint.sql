-- ==============================================================================
-- Migration: Replace idx_unique_active_bed_booking with Temporal EXCLUDE Constraint
-- Purpose: Allow non-overlapping future bed reservations and back-to-back bookings
-- Date: 2026-09-28
-- ==============================================================================

BEGIN;

-- 1. Ensure the btree_gist extension is enabled for scalar equality on bed_space_id
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Drop the existing partial unique index that restricts beds to one confirmed/occupied booking
DROP INDEX IF EXISTS public.idx_unique_active_bed_booking;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS idx_unique_active_bed_booking;

-- 3. Drop existing constraint if already present (idempotent migration)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS no_overlapping_bed_bookings;

-- 4. Add the PostgreSQL EXCLUDE constraint preventing overlapping temporal ranges for the same bed_space_id
-- Uses [start_date, end_date) half-open date ranges so back-to-back bookings (e.g., student A departs Dec 2,
-- student B arrives Dec 2) do not conflict and are safely permitted.
-- Excludes non-occupying/terminal statuses: Cancelled, Completed, Maintenance.
-- Note: 'booking_status' enum does not contain 'Rejected'; rejected bookings are recorded as 'Cancelled'.
ALTER TABLE public.bookings
ADD CONSTRAINT no_overlapping_bed_bookings
EXCLUDE USING gist (
    bed_space_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
)
WHERE (
    bed_space_id IS NOT NULL 
    AND status NOT IN ('Cancelled', 'Completed', 'Maintenance')
);

-- 5. Add helpful documentation comment on the constraint
COMMENT ON CONSTRAINT no_overlapping_bed_bookings ON public.bookings IS 
'Enforces that active bed reservations (Confirmed, Occupied, Reserved, Pending Verification, Pending Payment, Pending Contract) cannot have overlapping date ranges [start_date, end_date) on the same bed_space_id, while allowing back-to-back reservations.';

-- 6. Signal PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
