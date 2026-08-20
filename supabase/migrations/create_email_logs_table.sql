-- Migration: Create email_logs table for residency communications delivery tracking
CREATE TABLE IF NOT EXISTS public.email_logs (
    id BIGSERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'simulated')),
    error_message TEXT,
    delivery_attempts INT DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 1. Staff and Proprietors can view all email logs
CREATE POLICY "Staff and proprietors can view all email logs"
    ON public.email_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
        )
    );

-- 2. Allow inserting email logs from applications and Edge functions
CREATE POLICY "Allow inserting email logs"
    ON public.email_logs
    FOR INSERT
    WITH CHECK (true);

-- 3. Staff and Proprietors can update email logs (e.g. status updates after retry)
CREATE POLICY "Staff and proprietors can update email logs"
    ON public.email_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
        )
    );

-- Enable real-time replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
