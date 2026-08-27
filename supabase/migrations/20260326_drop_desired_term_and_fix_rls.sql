-- Migration: Drop desired_term column and ensure comprehensive RLS on public.waitlist

-- 1. Drop desired_term column if it exists
ALTER TABLE public.waitlist DROP COLUMN IF EXISTS desired_term;

-- 2. Ensure RLS policies are up-to-date
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow students to view their own waitlist entries" ON public.waitlist;
CREATE POLICY "Allow students to view their own waitlist entries"
ON public.waitlist FOR SELECT
USING (
    student_id = auth.uid()
);

DROP POLICY IF EXISTS "Allow students to insert their own waitlist entries" ON public.waitlist;
DROP POLICY IF EXISTS "Allow anyone or student to insert waitlist entry" ON public.waitlist;
CREATE POLICY "Allow anyone or student to insert waitlist entry"
ON public.waitlist FOR INSERT
WITH CHECK (
    student_id = auth.uid() OR student_id IS NULL
);

DROP POLICY IF EXISTS "Allow students to update their own waitlist entries" ON public.waitlist;
CREATE POLICY "Allow students to update their own waitlist entries"
ON public.waitlist FOR UPDATE
USING (
    student_id = auth.uid()
)
WITH CHECK (
    student_id = auth.uid() AND status IN ('Waiting', 'Cancelled')
);

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

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
