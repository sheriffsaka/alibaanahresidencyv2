-- Phase 2: Insert missing physical rooms (so all 10 physical rooms exist) and populate all 14 bed_spaces
DO $$
DECLARE
    prop_id UUID := '92b5b34c-c104-43a9-a959-60227d3d3eab';
    p1_r1 INT; p1_r2 INT; p1_r3 INT;
    p2_r1 INT; p2_r2 INT; p2_r3 INT;
    std_r1 INT; std_r2 INT; std_r3 INT; std_r4 INT;
    total_count INT;
BEGIN
    -- Premium 1: Room 1 (Shared, 2 beds), Room 2 (Private, 1 bed), Room 3 (Private, 1 bed)
    SELECT id INTO p1_r1 FROM rooms WHERE apartment_name = 'Premium 1' AND (room_number = 'Room 1' OR id = 2) LIMIT 1;
    SELECT id INTO p1_r2 FROM rooms WHERE apartment_name = 'Premium 1' AND room_number = 'Room 2' LIMIT 1;
    IF p1_r2 IS NULL THEN
        INSERT INTO rooms (property_id, apartment_name, category, room_number, type, capacity, price_per_month)
        VALUES (prop_id, 'Premium 1', 'Premium 1', 'Room 2', 'Private Room', 1, 350) RETURNING id INTO p1_r2;
    END IF;
    SELECT id INTO p1_r3 FROM rooms WHERE apartment_name = 'Premium 1' AND (room_number = 'Room 3' OR id = 4) LIMIT 1;

    -- Premium 2: Room 1 (Shared, 2 beds), Room 2 (Private, 1 bed), Room 3 (Private, 1 bed)
    SELECT id INTO p2_r1 FROM rooms WHERE (apartment_name = 'Premium 2' OR apartment_name = 'Apartment 3') AND (room_number = 'Room 1' OR id = 5) LIMIT 1;
    SELECT id INTO p2_r2 FROM rooms WHERE (apartment_name = 'Premium 2' OR apartment_name = 'Apartment 3') AND room_number = 'Room 2' LIMIT 1;
    IF p2_r2 IS NULL THEN
        INSERT INTO rooms (property_id, apartment_name, category, room_number, type, capacity, price_per_month)
        VALUES (prop_id, 'Premium 2', 'Premium 2', 'Room 2', 'Private Room', 1, 350) RETURNING id INTO p2_r2;
    END IF;
    SELECT id INTO p2_r3 FROM rooms WHERE (apartment_name = 'Premium 2' OR apartment_name = 'Apartment 3') AND (room_number = 'Room 3' OR id = 6) LIMIT 1;

    -- Standard: Room 1 (Shared, 2 beds), Room 2 (Shared, 2 beds), Room 3 (Private, 1 bed), Room 4 (Private, 1 bed)
    SELECT id INTO std_r1 FROM rooms WHERE apartment_name = 'Standard' AND (room_number = 'Room 1' OR id = 3) LIMIT 1;
    SELECT id INTO std_r2 FROM rooms WHERE apartment_name = 'Standard' AND room_number = 'Room 2' LIMIT 1;
    IF std_r2 IS NULL THEN
        INSERT INTO rooms (property_id, apartment_name, category, room_number, type, capacity, price_per_month)
        VALUES (prop_id, 'Standard', 'Standard', 'Room 2', 'Shared Room', 2, 175) RETURNING id INTO std_r2;
    END IF;
    SELECT id INTO std_r3 FROM rooms WHERE apartment_name = 'Standard' AND (room_number = 'Room 3' OR id = 1) LIMIT 1;
    SELECT id INTO std_r4 FROM rooms WHERE apartment_name = 'Standard' AND room_number = 'Room 4' LIMIT 1;
    IF std_r4 IS NULL THEN
        INSERT INTO rooms (property_id, apartment_name, category, room_number, type, capacity, price_per_month)
        VALUES (prop_id, 'Standard', 'Standard', 'Room 4', 'Private Room', 1, 300) RETURNING id INTO std_r4;
    END IF;

    -- FAIL LOUDLY: check that none of the 10 rooms is NULL
    IF p1_r1 IS NULL OR p1_r2 IS NULL OR p1_r3 IS NULL OR
       p2_r1 IS NULL OR p2_r2 IS NULL OR p2_r3 IS NULL OR
       std_r1 IS NULL OR std_r2 IS NULL OR std_r3 IS NULL OR std_r4 IS NULL THEN
        RAISE EXCEPTION 'Room resolution failed! One or more rooms could not be resolved or created.';
    END IF;

    -- Insert 14 bed spaces
    INSERT INTO bed_spaces (room_id, label) VALUES
        (p1_r1, 'Bed A'), (p1_r1, 'Bed B'),
        (p1_r2, 'Single'),
        (p1_r3, 'Single'),
        (p2_r1, 'Bed A'), (p2_r1, 'Bed B'),
        (p2_r2, 'Single'),
        (p2_r3, 'Single'),
        (std_r1, 'Bed A'), (std_r1, 'Bed B'),
        (std_r2, 'Bed A'), (std_r2, 'Bed B'),
        (std_r3, 'Single'),
        (std_r4, 'Single')
    ON CONFLICT (room_id, label) DO NOTHING;

    -- Validate total rows in bed_spaces
    SELECT COUNT(*) INTO total_count FROM bed_spaces;
    IF total_count < 14 THEN
        RAISE EXCEPTION 'Bed spaces insertion failed! Total bed_spaces count is %, expected 14.', total_count;
    END IF;
END $$;
