-- Phase 2: Supabase Row Level Security (RLS) Policies
-- These policies enforce access control at the database level.

--------------------------------------------------------------------------------
-- Helper Functions
-- These functions simplify policy definitions.
--------------------------------------------------------------------------------

-- Get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get the property_id of the currently authenticated user (for staff/proprietor)
CREATE OR REPLACE FUNCTION get_my_property_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT property_id FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--------------------------------------------------------------------------------
-- Enable RLS on all relevant tables
--------------------------------------------------------------------------------
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;


--------------------------------------------------------------------------------
-- Table: properties
--------------------------------------------------------------------------------
-- All users can view property details (for branding).
DROP POLICY IF EXISTS "Allow all users to read properties" ON properties;
CREATE POLICY "Allow all users to read properties"
ON properties FOR SELECT
USING (true);

-- Only proprietors can manage properties.
DROP POLICY IF EXISTS "Allow proprietors to manage properties" ON properties;
CREATE POLICY "Allow proprietors to manage properties"
ON properties FOR ALL
USING (get_my_role() = 'proprietor')
WITH CHECK (get_my_role() = 'proprietor');


--------------------------------------------------------------------------------
-- Table: rooms
--------------------------------------------------------------------------------
-- All users can view room details.
DROP POLICY IF EXISTS "Allow all users to read rooms" ON rooms;
CREATE POLICY "Allow all users to read rooms"
ON rooms FOR SELECT
USING (true);

-- Staff and proprietors can manage rooms for their property.
DROP POLICY IF EXISTS "Allow staff/proprietors to manage rooms" ON rooms;
CREATE POLICY "Allow staff/proprietors to manage rooms"
ON rooms FOR ALL
USING (get_my_role() IN ('staff', 'proprietor') AND property_id = get_my_property_id())
WITH CHECK (get_my_role() IN ('staff', 'proprietor') AND property_id = get_my_property_id());


--------------------------------------------------------------------------------
-- Table: profiles
--------------------------------------------------------------------------------
-- Users can view their own profile.
DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
CREATE POLICY "Allow users to read their own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Staff/Proprietors can view profiles of students who have booked at their property.
DROP POLICY IF EXISTS "Allow staff/proprietors to view student profiles in their property" ON profiles;
CREATE POLICY "Allow staff/proprietors to view student profiles in their property"
ON profiles FOR SELECT
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON b.room_id = r.id
    WHERE b.student_id = profiles.id AND r.property_id = get_my_property_id()
));

-- Users can update their own profile.
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
CREATE POLICY "Allow users to update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- FIX: Add an INSERT policy to allow the user creation trigger to function.
-- A user can insert a profile for themselves upon signup.
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON profiles;
CREATE POLICY "Allow users to insert their own profile"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());


--------------------------------------------------------------------------------
-- Table: academic_terms & booking_packages (Config Tables)
--------------------------------------------------------------------------------
-- All users can read config tables.
DROP POLICY IF EXISTS "Allow all users to read academic terms" ON academic_terms;
CREATE POLICY "Allow all users to read academic terms" ON academic_terms FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all users to read booking packages" ON booking_packages;
CREATE POLICY "Allow all users to read booking packages" ON booking_packages FOR SELECT USING (true);

-- Only proprietors can manage config tables for their property.
DROP POLICY IF EXISTS "Allow proprietors to manage academic terms" ON academic_terms;
CREATE POLICY "Allow proprietors to manage academic terms"
ON academic_terms FOR ALL
USING (get_my_role() = 'proprietor' AND property_id = get_my_property_id())
WITH CHECK (get_my_role() = 'proprietor' AND property_id = get_my_property_id());

DROP POLICY IF EXISTS "Allow proprietors to manage booking packages" ON booking_packages;
CREATE POLICY "Allow proprietors to manage booking packages"
ON booking_packages FOR ALL
USING (get_my_role() = 'proprietor' AND property_id = get_my_property_id())
WITH CHECK (get_my_role() = 'proprietor' AND property_id = get_my_property_id());


--------------------------------------------------------------------------------
-- Table: bookings
--------------------------------------------------------------------------------
-- Students can manage their own bookings.
DROP POLICY IF EXISTS "Allow students to manage their own bookings" ON bookings;
CREATE POLICY "Allow students to manage their own bookings"
ON bookings FOR ALL
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Staff/Proprietors can view all bookings for their property.
DROP POLICY IF EXISTS "Allow staff/proprietors to view property bookings" ON bookings;
CREATE POLICY "Allow staff/proprietors to view property bookings"
ON bookings FOR SELECT
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = bookings.room_id AND r.property_id = get_my_property_id()
));

-- Staff/Proprietors can update bookings in their property (e.g., change status).
DROP POLICY IF EXISTS "Allow staff/proprietors to update property bookings" ON bookings;
CREATE POLICY "Allow staff/proprietors to update property bookings"
ON bookings FOR UPDATE
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.id = bookings.room_id AND r.property_id = get_my_property_id()
))
WITH CHECK (get_my_role() IN ('staff', 'proprietor'));


--------------------------------------------------------------------------------
-- Table: payments & invoices (Financial Records)
--------------------------------------------------------------------------------
-- NOTE: Inserts/Updates to these tables should be handled by trusted Edge Functions.
-- Policies here are primarily for reading data securely.

-- Students can view their own financial records.
DROP POLICY IF EXISTS "Allow students to read their own payments" ON payments;
CREATE POLICY "Allow students to read their own payments"
ON payments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payments.booking_id AND b.student_id = auth.uid()
));
DROP POLICY IF EXISTS "Allow students to read their own invoices" ON invoices;
CREATE POLICY "Allow students to read their own invoices"
ON invoices FOR SELECT
USING (EXISTS (
    SELECT 1 FROM payments p JOIN bookings b ON p.booking_id = b.id
    WHERE p.id = invoices.payment_id AND b.student_id = auth.uid()
));

-- Staff/Proprietors can view all financial records for their property.
DROP POLICY IF EXISTS "Allow staff/proprietors to read property payments" ON payments;
CREATE POLICY "Allow staff/proprietors to read property payments"
ON payments FOR SELECT
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON b.room_id = r.id
    WHERE b.id = payments.booking_id AND r.property_id = get_my_property_id()
));
DROP POLICY IF EXISTS "Allow staff/proprietors to read property invoices" ON invoices;
CREATE POLICY "Allow staff/proprietors to read property invoices"
ON invoices FOR SELECT
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM payments p JOIN bookings b ON p.booking_id = b.id JOIN rooms r ON b.room_id = r.id
    WHERE p.id = invoices.payment_id AND r.property_id = get_my_property_id()
));

-- Allow staff/proprietors to update payment status (e.g., for verification).
DROP POLICY IF EXISTS "Allow staff/proprietors to update payments" ON payments;
CREATE POLICY "Allow staff/proprietors to update payments"
ON payments FOR UPDATE
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM bookings b JOIN rooms r ON b.room_id = r.id
    WHERE b.id = payments.booking_id AND r.property_id = get_my_property_id()
))
WITH CHECK (get_my_role() IN ('staff', 'proprietor'));

-- FIX: Add a secure policy to allow students to update their own payment record
-- only for the purpose of submitting a bank transfer proof.
DROP POLICY IF EXISTS "Allow student to submit payment proof for a pending payment" ON payments;
CREATE POLICY "Allow student to submit payment proof for a pending payment"
ON public.payments FOR UPDATE
USING (
  get_my_role() = 'student' AND
  payments.status = 'Pending' AND -- Only allow updating payments that are currently pending
  (SELECT b.student_id FROM public.bookings b WHERE b.id = payments.booking_id) = auth.uid()
)
WITH CHECK (
  (SELECT b.student_id FROM public.bookings b WHERE b.id = payments.booking_id) = auth.uid() AND
  status = 'Pending Verification' -- Crucially, they can ONLY change the status to 'Pending Verification'.
);

--------------------------------------------------------------------------------
-- Table: admin_audit_log
--------------------------------------------------------------------------------
-- Only staff and proprietors can view the audit log for their property.
DROP POLICY IF EXISTS "Allow staff/proprietors to read audit logs" ON admin_audit_log;
CREATE POLICY "Allow staff/proprietors to read audit logs"
ON admin_audit_log FOR SELECT
USING (get_my_role() IN ('staff', 'proprietor') AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = admin_audit_log.user_id AND p.property_id = get_my_property_id()
));

-- NOTE: The admin_audit_log table should ONLY be written to by Edge Functions using the service_role key,
-- so no INSERT/UPDATE/DELETE policies are granted to users.
--------------------------------------------------------------------------------

-- Grant usage on schema to authenticated users.
-- This allows roles to interact with the database, while RLS policies control WHAT they can see/do.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- RLS enforcement for the anon and authenticated roles is the default, secure
-- behavior in Supabase and is managed in the dashboard settings, not via SQL.
-- The policies above will be enforced for any user accessing via the API.