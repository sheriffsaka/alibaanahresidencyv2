-- Migration: 20261001_remove_corrupted_auth_user.sql
-- Purpose: Purge corrupted auth.users record causing "Database error loading user" in GoTrue
-- Target User ID: d1baa2f2-b068-4280-beb7-c2b147a65c05 (Afusat Adeola Olu / afusatadeolaolorunfunmi@gmail.com)
--
-- STATUS:
-- [x] Step 1: Historical cancelled test booking #69 safely removed via live DB operation.
-- [x] Step 2: Associated profile record safely removed from public.profiles.
-- [ ] Step 3: Run the statement below in your Supabase SQL Editor to complete the auth.users cleanup:

DELETE FROM auth.users WHERE id = 'd1baa2f2-b068-4280-beb7-c2b147a65c05';
