-- Migration: Create public.waitlist table with profile linking & bed_spaces FK
CREATE TABLE IF NOT EXISTS public.waitlist (
    id BIGSERIAL PRIMARY KEY,
    
    -- Student link: Live single source of truth from profiles when authenticated
    student_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Manual contact fields (only populated when student_id IS NULL)
    full_name TEXT NULL,
    email TEXT NULL,
    phone_number TEXT NULL,
    
    -- Target preferences (Category & Type-first)
    category VARCHAR(50) NOT NULL,             -- 'Standard', 'Premium 1', 'Premium 2'
    accommodation_type VARCHAR(50) NOT NULL,  -- 'Shared' or 'Private'
    
    -- Optional specific space overrides (with explicit foreign keys)
    room_id INT NULL REFERENCES public.rooms(id) ON DELETE SET NULL,
    bed_space_id INT NULL REFERENCES public.bed_spaces(id) ON DELETE SET NULL,
    
    -- Term & Duration details
    duration_months INT NULL DEFAULT 6,
    
    -- Status lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'Waiting' 
        CHECK (status IN ('Waiting', 'Offered', 'Fulfilled', 'Cancelled')),
    
    notes TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Ensure either a valid registered student or manual guest contact info is present
    CONSTRAINT check_waitlist_contact_info CHECK (
        student_id IS NOT NULL OR (full_name IS NOT NULL AND email IS NOT NULL)
    )
);

-- Enable Real-Time replication on the waitlist table
ALTER TABLE public.waitlist REPLICA IDENTITY FULL;

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Students can view only their own waitlist entries
DROP POLICY IF EXISTS "Allow students to view their own waitlist entries" ON public.waitlist;
CREATE POLICY "Allow students to view their own waitlist entries"
ON public.waitlist FOR SELECT
USING (
    student_id = auth.uid()
);

-- 2. INSERT: Students can add themselves to the waitlist
DROP POLICY IF EXISTS "Allow students to insert their own waitlist entries" ON public.waitlist;
CREATE POLICY "Allow students to insert their own waitlist entries"
ON public.waitlist FOR INSERT
WITH CHECK (
    student_id = auth.uid() OR student_id IS NULL
);

-- 3. UPDATE: Students can edit their own entry or cancel it (cannot mark Offered/Fulfilled)
DROP POLICY IF EXISTS "Allow students to update their own waitlist entries" ON public.waitlist;
CREATE POLICY "Allow students to update their own waitlist entries"
ON public.waitlist FOR UPDATE
USING (
    student_id = auth.uid()
)
WITH CHECK (
    student_id = auth.uid() AND status IN ('Waiting', 'Cancelled')
);

-- 4. ALL: Staff & Proprietors can view, update, offer, and manage all waitlist entries
DROP POLICY IF EXISTS "Allow staff/proprietors to manage waitlist" ON public.waitlist;
CREATE POLICY "Allow staff/proprietors to manage waitlist"
ON public.waitlist FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('staff', 'proprietor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('staff', 'proprietor')
    )
);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
