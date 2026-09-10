-- Create Room Pricing table to serve as single source of truth for duration tiers
CREATE TABLE IF NOT EXISTS public.room_pricing (
    id VARCHAR(50) PRIMARY KEY,
    duration_min INT NOT NULL,
    duration_max INT NOT NULL,
    label VARCHAR(100) NOT NULL,
    shared_price NUMERIC(10, 2) NOT NULL,
    private_price NUMERIC(10, 2) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_pricing ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on room_pricing"
    ON public.room_pricing FOR SELECT
    TO public
    USING (true);

-- Allow authenticated admins/proprietors to update
CREATE POLICY "Allow authenticated staff to update room_pricing"
    ON public.room_pricing FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed with official room pricing matrix
INSERT INTO public.room_pricing (id, duration_min, duration_max, label, shared_price, private_price)
VALUES
    ('tier_1_2', 2, 2, '2 months', 200, 350),
    ('tier_3_4', 3, 4, '3–4 months', 190, 330),
    ('tier_5_6', 5, 6, '5–6 months', 180, 315),
    ('tier_7_plus', 7, 999, '7+ months', 175, 300)
ON CONFLICT (id) DO UPDATE SET
    duration_min = EXCLUDED.duration_min,
    duration_max = EXCLUDED.duration_max,
    label = EXCLUDED.label,
    shared_price = EXCLUDED.shared_price,
    private_price = EXCLUDED.private_price,
    updated_at = now();
