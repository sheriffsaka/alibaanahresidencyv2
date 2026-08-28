-- Migration: Create accommodation_categories table for dedicated category management
CREATE TABLE IF NOT EXISTS public.accommodation_categories (
    id TEXT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    address TEXT,
    default_price NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accommodation_categories ENABLE ROW LEVEL SECURITY;

-- Select policy: Viewable by everyone
DROP POLICY IF EXISTS "Accommodation categories are viewable by everyone" ON public.accommodation_categories;
CREATE POLICY "Accommodation categories are viewable by everyone" 
ON public.accommodation_categories FOR SELECT USING (true);

-- Manage policy: Staff and proprietors can manage categories
DROP POLICY IF EXISTS "Accommodation categories are manageable by staff and proprietors" ON public.accommodation_categories;
CREATE POLICY "Accommodation categories are manageable by staff and proprietors" 
ON public.accommodation_categories FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('staff', 'proprietor')
    )
);

-- Seed initial default categories if empty
INSERT INTO public.accommodation_categories (id, name, description, address, default_price, status, display_order)
VALUES 
    ('premium-1', 'Premium 1', 'Luxury student suites with premium furnishings and study areas.', '11, Samir Moursey Street, Nasr City, Cairo.', 350.00, 'Active', 1),
    ('premium-2', 'Premium 2', 'High-end shared and private suites with modern kitchen and resident lounge.', '2 Ezzat Salamat Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.', 350.00, 'Active', 2),
    ('standard', 'Standard', 'Comfortable, budget-friendly student housing near the Arabic center.', '24 Saqaliyyah Street, Off Kaabool, Makram Ebeid, Nasr City, Cairo.', 175.00, 'Active', 3)
ON CONFLICT (id) DO NOTHING;
