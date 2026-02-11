// Fix for Deno types error: "Cannot find name 'Deno'"
// This declares the Deno global for environments where the type definitions are not automatically recognized.
// @ts-ignore
declare const Deno: any;

// supabase/functions/create-booking/index.ts
// Handles the creation of a new booking in a secure, transactional manner.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Interface for the expected request body. Dates are handled server-side.
interface BookingRequest {
  roomId: number;
  academicTermId: number;
  bookingPackageId: number;
  paymentMethod: 'Online' | 'Bank Transfer';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 1. Validate Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your function secrets.');
    }

    // 2. Initialize Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 3. Get the authenticated user's ID from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response('Missing Authorization header', {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
    }
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response('Unauthorized: Could not retrieve user from token.', {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 4. Parse the request body
    const {
      roomId,
      academicTermId,
      bookingPackageId,
      paymentMethod,
    }: BookingRequest = await req.json();

    // 5. Fetch room, package, and term details to validate all IDs server-side.
    const [
      { data: room, error: roomError },
      { data: pkg, error: packageError },
      { data: term, error: termError }
    ] = await Promise.all([
      supabaseAdmin.from('rooms').select('price_per_month').eq('id', roomId).single(),
      supabaseAdmin.from('booking_packages').select('duration_months, discount_percentage').eq('id', bookingPackageId).single(),
      supabaseAdmin.from('academic_terms').select('start_date').eq('id', academicTermId).single()
    ]);

    if (roomError || packageError || termError || !room || !pkg || !term) {
      console.error("[create-booking] DB validation error:", { roomError, packageError, termError });
      return new Response('Invalid room, booking package, or academic term provided.', {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    // 6. Calculate total price and dates on the server to prevent client-side manipulation.
    const basePrice = Number(room.price_per_month) * pkg.duration_months;
    const discount = basePrice * (Number(pkg.discount_percentage) / 100);
    const totalPrice = basePrice - discount;

    const serverStartDate = term.start_date;
    const serverEndDate = new Date(serverStartDate);
    serverEndDate.setUTCMonth(serverEndDate.getUTCMonth() + pkg.duration_months);
    const serverEndDateStr = serverEndDate.toISOString().split('T')[0];

    // 7. **DATABASE TRANSACTION LOGIC (RPC call)**
    const { data: bookingResult, error: bookingError } = await supabaseAdmin.rpc('create_booking_and_payment', {
        p_student_id: user.id,
        p_room_id: roomId,
        p_academic_term_id: academicTermId,
        p_booking_package_id: bookingPackageId,
        p_start_date: serverStartDate,
        p_end_date: serverEndDateStr,
        p_total_price: totalPrice,
        p_payment_method: paymentMethod,
    });
    
    if (bookingError) {
        if (bookingError.message.includes('no_double_booking')) {
             return new Response('This room is already booked for the selected dates.', {
                status: 409, // Conflict
                headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
            });
        }
        console.error('[create-booking] Booking RPC error:', bookingError);
        return new Response(`An unexpected database error occurred: ${bookingError.message}`, {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
    }

    // 8. Return the newly created booking ID (and payment ID)
    return new Response(JSON.stringify(bookingResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[create-booking] Function error: ${error.message}`, error);
    return new Response(error.message, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 500,
    });
  }
});