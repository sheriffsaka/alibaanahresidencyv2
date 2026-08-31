-- Migration: Create contract_translations table for legal tenancy agreement translations with approval workflow
-- Created: 2026-08-31

CREATE TABLE IF NOT EXISTS public.contract_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(10) NOT NULL UNIQUE,
    language_name VARCHAR(100) NOT NULL,
    native_name VARCHAR(100) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'ltr',
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved')),
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1,
    content_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on status and language_code
CREATE INDEX IF NOT EXISTS idx_contract_translations_lang ON public.contract_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_contract_translations_status ON public.contract_translations(status);

-- Enable RLS
ALTER TABLE public.contract_translations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (including anonymous students) can read approved translations and English
CREATE POLICY "Allow read approved contract translations"
    ON public.contract_translations
    FOR SELECT
    USING (
        status = 'approved' 
        OR language_code = 'en'
        OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('staff', 'proprietor'))
    );

-- Policy: Only staff and proprietors can insert, update, or delete translations
CREATE POLICY "Staff and proprietors can manage contract translations"
    ON public.contract_translations
    FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('staff', 'proprietor'))
    )
    WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('staff', 'proprietor'))
    );
