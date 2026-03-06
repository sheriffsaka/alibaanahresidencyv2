
-- Phase 1: Supabase Database Schema (Idempotent Version)
-- Automated Student Residency Management System for Al-Ibaanah

-- Drop existing objects in reverse order of dependency
DROP TABLE IF EXISTS cms_content CASCADE;
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS booking_packages CASCADE;
DROP TABLE IF EXISTS academic_terms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS accommodation_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create custom types (enums)
CREATE TYPE user_role AS ENUM ('student', 'staff', 'proprietor');
CREATE TYPE accommodation_type AS ENUM ('Standard Shared', 'Standard Private', 'Premium Shared', 'Premium Private');
CREATE TYPE booking_status AS ENUM ('Reserved', 'Pending Payment', 'Pending Verification', 'Confirmed', 'Occupied', 'Completed', 'Cancelled', 'Maintenance');

-- 1. Properties Table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Rooms Table
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id),
    room_number VARCHAR(10) NOT NULL,
    type accommodation_type NOT NULL,
    price_per_month NUMERIC(10, 2) NOT NULL,
    amenities TEXT[],
    image_urls TEXT[],
    video_urls TEXT[],
    is_available BOOLEAN DEFAULT true,
    capacity INT NOT NULL DEFAULT 1,
    occupied_slots INT NOT NULL DEFAULT 0,
    gender_restriction TEXT NOT NULL DEFAULT 'Any' CHECK (gender_restriction IN ('Male', 'Female', 'Any')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, room_number)
);

-- 3. Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student',
    gender TEXT CHECK (gender IN ('Male', 'Female')),
    property_id UUID REFERENCES properties(id),
    language_preference VARCHAR(5) DEFAULT 'en',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Academic Terms Table
CREATE TABLE academic_terms (
    id SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id),
    term_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 5. Booking Packages Table
CREATE TABLE booking_packages (
    id SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id),
    duration_months INT NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 6. Bookings Table
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id),
    room_id INT NOT NULL REFERENCES rooms(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'Pending Verification',
    booked_at TIMESTAMPTZ DEFAULT now(),
    
    -- New detailed student information
    full_name VARCHAR(255) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    passport_number VARCHAR(50) NOT NULL,
    passport_copy_url TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    expected_arrival_date DATE NOT NULL,
    duration_of_stay VARCHAR(100) NOT NULL,
    preferred_accommodation accommodation_type NOT NULL,
    emergency_contact_details TEXT NOT NULL,
    
    -- Detailed Address in Egypt
    building_no VARCHAR(50),
    flat_no VARCHAR(50),
    street_name VARCHAR(255),
    district_name VARCHAR(255),
    state VARCHAR(100),
    address_in_egypt TEXT, -- Kept for backward compatibility or summary

    -- Contract and Signature
    contract_language VARCHAR(5) DEFAULT 'en',
    contract_signed_at TIMESTAMPTZ,
    signature_data TEXT, -- Base64 or SVG

    total_price NUMERIC(10, 2),
    payment_proof_url TEXT,
    payment_expiry_date DATE,

    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ
);

-- 7. Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Pending Verification, Completed, Failed
    payment_method VARCHAR(50),
    payment_proof_url TEXT,
    transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Unpaid',
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CMS Content Table
CREATE TABLE cms_content (
    id SERIAL PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) UNIQUE,
    logo_url TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image_url TEXT,
    features JSONB,
    faqs JSONB,
    contract_templates JSONB, -- Structure: { "Standard Shared": { "en": "...", "fr": "..." }, ... }
    how_to_videos JSONB, -- Structure: { "en": "...", "fr": "..." }
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Admin Audit Log Table
CREATE TABLE admin_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Real-Time Subscriptions
ALTER TABLE rooms REPLICA IDENTITY FULL;
ALTER TABLE bookings REPLICA IDENTITY FULL;

-- Helper Functions & Triggers
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, gender)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'student', NEW.raw_user_meta_data->>'gender');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but only update their own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms: Anyone can view, only staff/proprietor can manage
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Rooms are manageable by staff and proprietors" ON rooms;
CREATE POLICY "Rooms are manageable by staff and proprietors" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    );

-- Properties: Viewable by everyone, manageable by staff/proprietor
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Properties are manageable by staff and proprietors" ON properties;
CREATE POLICY "Properties are manageable by staff and proprietors" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    );

-- Bookings: Students can view/manage their own, staff can manage all
DROP POLICY IF EXISTS "Students can view their own bookings" ON bookings;
CREATE POLICY "Students can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = student_id);
DROP POLICY IF EXISTS "Students can create their own bookings" ON bookings;
CREATE POLICY "Students can create their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = student_id);
DROP POLICY IF EXISTS "Staff can manage all bookings" ON bookings;
CREATE POLICY "Staff can manage all bookings" ON bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    );

-- CMS Content: Viewable by everyone, manageable by staff/proprietor
DROP POLICY IF EXISTS "CMS content is viewable by everyone" ON cms_content;
CREATE POLICY "CMS content is viewable by everyone" ON cms_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "CMS content is manageable by staff and proprietors" ON cms_content;
CREATE POLICY "CMS content is manageable by staff and proprietors" ON cms_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    );

-- Audit Log: Only staff/proprietor can view and create
DROP POLICY IF EXISTS "Audit logs are manageable by staff and proprietors" ON admin_audit_log;
CREATE POLICY "Audit logs are manageable by staff and proprietors" ON admin_audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    );

-- Storage Policies
-- Rooms bucket: Public read, staff/proprietor can upload/delete
DROP POLICY IF EXISTS "Room images are publicly accessible" ON storage.objects;
CREATE POLICY "Room images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'rooms');
DROP POLICY IF EXISTS "Staff can upload room images" ON storage.objects;
CREATE POLICY "Staff can upload room images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'rooms' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'proprietor')
    )
);
DROP POLICY IF EXISTS "Staff can update/delete room images" ON storage.objects;
CREATE POLICY "Staff can update/delete room images" ON storage.objects FOR ALL USING (
    bucket_id = 'rooms' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'proprietor')
    )
);

-- Passports bucket: Only staff and the owner can view
DROP POLICY IF EXISTS "Users can upload their own passport" ON storage.objects;
CREATE POLICY "Users can upload their own passport" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'passports');
DROP POLICY IF EXISTS "Staff and owners can view passports" ON storage.objects;
CREATE POLICY "Staff and owners can view passports" ON storage.objects FOR SELECT USING (
    bucket_id = 'passports' AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'proprietor')
        )
    )
);

--- SEED DATA ---

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('rooms', 'rooms', true),
    ('passports', 'passports', true),
    ('cms', 'cms', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Properties
INSERT INTO properties (name, logo_url, primary_color) VALUES ('Al-Ibaanah Student Residence', 'https://res.cloudinary.com/di7okmjsx/image/upload/v1740321960/al-ibaanah-logo_new.png', '#286046');

-- Seed Rooms
INSERT INTO rooms (property_id, room_number, type, price_per_month, capacity, amenities, image_urls, video_urls, gender_restriction)
VALUES
    ((SELECT id FROM properties LIMIT 1), '101A', 'Standard Shared', 200.00, 7, '{"Shared Bathroom", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770401824/single-room_j0n7nd.jpg"}', '{"https://example.com/video1.mp4"}', 'Male'),
    ((SELECT id FROM properties LIMIT 1), '102A', 'Standard Private', 325.00, 7, '{"Private Bathroom", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/single_room2_zhd9uo.jpg"}', '{"https://example.com/video2.mp4"}', 'Female'),
    ((SELECT id FROM properties LIMIT 1), '202B', 'Premium Shared', 225.00, 4, '{"Shared Bathroom", "Premium Furnishing", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite2_q62y4w.jpg"}', '{"https://example.com/video3.mp4"}', 'Male'),
    ((SELECT id FROM properties LIMIT 1), '301C', 'Premium Private', 400.00, 4, '{"Private Bathroom", "Kitchenette", "Living Area", "Premium Furnishing", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770388212/Suite1_t4dczv.jpg"}', '{"https://example.com/video4.mp4"}', 'Any');

-- Seed CMS Content
INSERT INTO cms_content (property_id, logo_url, hero_title, hero_subtitle, hero_image_url, features, faqs, contract_templates)
VALUES (
    (SELECT id FROM properties LIMIT 1),
    'https://storage.googleapis.com/user-uploads-ais-prod/petzxt2545463tvkunzpbm/v1/image_98.png',
    'Your Home for Knowledge and Comfort',
    'Secure, comfortable, and studious living, just moments away from the Al-Ibaanah Arabic Center.',
    'https://res.cloudinary.com/di7okmjsx/image/upload/v1770400290/heroalibaanah_ghqtok.jpg',
    '[
        {"id": 1, "title": "Prime Location", "desc": "Located minutes from campus, making your commute to classes quick and easy."},
        {"id": 2, "title": "Fully Furnished", "desc": "Our rooms come equipped with all the essentials for a comfortable and productive stay."},
        {"id": 3, "title": "Safe & Secure", "desc": "24/7 security and a supportive environment, so you can focus on your studies with peace of mind."}
    ]',
    '[
        {"id": 1, "q": "What booking packages are available?", "a": "We offer flexible booking packages for 3, 6 and 12 months."},
        {"id": 2, "q": "Are the rooms furnished?", "a": "Yes, all our rooms are fully furnished."}
    ]',
    '{
        "en": "This is the English contract...",
        "fr": "Ceci est le contrat français...",
        "ru": "Это русский контракт..."
    }'
);
