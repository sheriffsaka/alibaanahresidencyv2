
-- Phase 1: Supabase Database Schema (Idempotent Version)
-- Automated Student Residency Management System for Al-Ibaanah

-- Drop existing objects in reverse order of dependency to avoid errors
DROP TABLE IF EXISTS admin_audit_log CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS booking_packages CASCADE;
DROP TABLE IF EXISTS academic_terms CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS properties CASCADE;

DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS room_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS trigger_set_timestamp() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create custom types (enums) for structured data
CREATE TYPE user_role AS ENUM ('student', 'staff', 'proprietor');
CREATE TYPE room_type AS ENUM ('Single', 'Double', 'Suite');
CREATE TYPE booking_status AS ENUM ('Reserved', 'Pending Payment', 'Confirmed', 'Occupied', 'Completed', 'Cancelled', 'Maintenance');
CREATE TYPE payment_method AS ENUM ('Online', 'Bank Transfer');
CREATE TYPE payment_status AS ENUM ('Pending', 'Succeeded', 'Failed', 'Pending Verification');

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
    type room_type NOT NULL,
    price_per_month NUMERIC(10, 2) NOT NULL,
    amenities TEXT[],
    image_urls TEXT[],
    is_available BOOLEAN DEFAULT true,
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
    academic_term_id INT NOT NULL REFERENCES academic_terms(id),
    booking_package_id INT NOT NULL REFERENCES booking_packages(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status booking_status NOT NULL DEFAULT 'Reserved',
    total_price NUMERIC(10, 2) NOT NULL,
    booked_at TIMESTAMPTZ DEFAULT now(),
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    CONSTRAINT no_double_booking EXCLUDE USING gist (
        room_id WITH =,
        daterange(start_date, end_date) WITH &&
    )
);

-- 7. Payments Table
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id),
    amount NUMERIC(10, 2) NOT NULL,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'Pending',
    provider_transaction_id TEXT,
    payment_proof_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Invoices Table
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT NOT NULL REFERENCES payments(id),
    invoice_pdf_url TEXT NOT NULL,
    invoice_number TEXT NOT NULL UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Admin Audit Log Table
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
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, gender)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'student', NEW.raw_user_meta_data->>'gender');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Database Function for creating bookings transactionally
CREATE OR REPLACE FUNCTION create_booking_and_payment(
    p_student_id UUID,
    p_room_id INT,
    p_academic_term_id INT,
    p_booking_package_id INT,
    p_start_date DATE,
    p_end_date DATE,
    p_total_price NUMERIC,
    p_payment_method payment_method
)
RETURNS JSONB AS $$
DECLARE
    new_booking_id BIGINT;
    new_payment_id BIGINT;
    result JSONB;
BEGIN
    INSERT INTO public.bookings (student_id, room_id, academic_term_id, booking_package_id, start_date, end_date, total_price, status)
    VALUES (p_student_id, p_room_id, p_academic_term_id, p_booking_package_id, p_start_date, p_end_date, p_total_price, 'Pending Payment')
    RETURNING id INTO new_booking_id;

    INSERT INTO public.payments (booking_id, amount, method, status)
    VALUES (new_booking_id, p_total_price, p_payment_method, 'Pending')
    RETURNING id INTO new_payment_id;

    result := jsonb_build_object(
        'booking_id', new_booking_id,
        'payment_id', new_payment_id
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--- SEED DATA ---

-- Seed Properties
INSERT INTO properties (name, logo_url, primary_color) VALUES ('Al-Ibaanah Student Residence', 'https://res.cloudinary.com/di7okmjsx/image/upload/v1769972834/alibaanahlogo_gw0pef.png', '#007BFF');

-- Seed Rooms
INSERT INTO rooms (property_id, room_number, type, price_per_month, amenities, image_urls, gender_restriction)
VALUES
    ((SELECT id FROM properties LIMIT 1), '101A', 'Single', 350.00, '{"Private Bathroom", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770401824/single-room_j0n7nd.jpg"}', 'Male'),
    ((SELECT id FROM properties LIMIT 1), '102A', 'Single', 350.00, '{"Private Bathroom", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770401824/single-room_j0n7nd.jpg"}', 'Female'),
    ((SELECT id FROM properties LIMIT 1), '202B', 'Double', 250.00, '{"Shared Bathroom", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770401822/double-room_r89q0p.jpg"}', 'Male'),
    ((SELECT id FROM properties LIMIT 1), '301C', 'Suite', 500.00, '{"Private Bathroom", "Kitchenette", "Living Area", "Air Conditioning", "High-Speed Wi-Fi"}', '{"https://res.cloudinary.com/di7okmjsx/image/upload/v1770401822/suite-room_qzlhcl.jpg"}', 'Any');

-- Seed Academic Terms
INSERT INTO academic_terms (property_id, term_name, start_date, end_date)
VALUES
    ((SELECT id FROM properties LIMIT 1), 'Fall 2024', '2024-09-01', '2024-12-20'),
    ((SELECT id FROM properties LIMIT 1), 'Spring 2025', '2025-01-15', '2025-05-10');

-- Seed Booking Packages
INSERT INTO booking_packages (property_id, duration_months, discount_percentage, description)
VALUES
    ((SELECT id FROM properties LIMIT 1), 3, 0.00, 'Standard 3-month term stay.'),
    ((SELECT id FROM properties LIMIT 1), 6, 5.00, 'Save 5% with a 6-month booking.'),
    ((SELECT id FROM properties LIMIT 1), 12, 10.00, 'Best value! Save 10% for a full year.');