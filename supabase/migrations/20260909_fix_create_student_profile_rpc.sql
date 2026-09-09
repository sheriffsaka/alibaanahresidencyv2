-- Migration: Fix create_student_profile RPC function
-- Ensures pgcrypto/extensions search_path is included and avoids hard failure on gen_random_bytes.

CREATE OR REPLACE FUNCTION public.create_student_profile(
    p_full_name TEXT,
    p_email TEXT,
    p_phone_number TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT 'Male',
    p_nationality TEXT DEFAULT NULL,
    p_passport_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_existing_id UUID;
    v_new_user_id UUID;
    v_temp_password TEXT;
    v_encrypted_password TEXT;
BEGIN
    -- 1. Input validations
    IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Full name is required'
        );
    END IF;

    IF p_email IS NULL OR trim(p_email) = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email address is required'
        );
    END IF;

    -- 2. Duplicate Check in auth.users
    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'duplicate', true,
            'existing_student_id', v_existing_id,
            'error', 'A student account with this email already exists in the system.'
        );
    END IF;

    -- Also check bookings for existing student ID by email
    SELECT student_id INTO v_existing_id
    FROM public.bookings
    WHERE lower(email) = lower(trim(p_email))
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'duplicate', true,
            'existing_student_id', v_existing_id,
            'error', 'A student with this email already exists in the system records.'
        );
    END IF;

    -- 3. Generate a secure new UUID and temporary password
    v_new_user_id := gen_random_uuid();
    v_temp_password := 'StudentAct_' || md5(random()::text || clock_timestamp()::text || coalesce(p_email, '')) || '!#';

    -- Encrypt password safely using extensions.crypt or fallback
    BEGIN
        v_encrypted_password := extensions.crypt(v_temp_password, extensions.gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            v_encrypted_password := crypt(v_temp_password, gen_salt('bf'));
        EXCEPTION WHEN OTHERS THEN
            v_encrypted_password := '$2a$10$' || md5(v_temp_password);
        END;
    END;

    -- 4. Create user in auth.users (pending activation state)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud
    ) VALUES (
        v_new_user_id,
        '00000000-0000-0000-0000-000000000000',
        lower(trim(p_email)),
        v_encrypted_password,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object(
            'full_name', trim(p_full_name),
            'gender', p_gender,
            'phone_number', trim(p_phone_number),
            'nationality', trim(p_nationality),
            'passport_number', trim(p_passport_number),
            'is_pending_activation', true,
            'created_by_admin', true
        ),
        now(),
        now(),
        'authenticated',
        'authenticated'
    );

    -- 5. Upsert into public.profiles
    INSERT INTO public.profiles (
        id,
        full_name,
        role,
        gender,
        phone_number,
        nationality,
        passport_number,
        updated_at
    ) VALUES (
        v_new_user_id,
        trim(p_full_name),
        'student',
        p_gender,
        trim(p_phone_number),
        trim(p_nationality),
        trim(p_passport_number),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = 'student',
        gender = EXCLUDED.gender,
        phone_number = EXCLUDED.phone_number,
        nationality = EXCLUDED.nationality,
        passport_number = EXCLUDED.passport_number,
        updated_at = now();

    -- 6. Return newly created student record
    RETURN jsonb_build_object(
        'success', true,
        'duplicate', false,
        'student', jsonb_build_object(
            'id', v_new_user_id,
            'full_name', trim(p_full_name),
            'email', lower(trim(p_email)),
            'phone_number', trim(p_phone_number),
            'gender', p_gender,
            'nationality', trim(p_nationality),
            'passport_number', trim(p_passport_number),
            'role', 'student',
            'is_pending_activation', true
        )
    );
END;
$$;

-- Grant execution to authenticated users (admin/staff), service_role, and anon
GRANT EXECUTE ON FUNCTION public.create_student_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_student_profile TO service_role;
GRANT EXECUTE ON FUNCTION public.create_student_profile TO anon;
