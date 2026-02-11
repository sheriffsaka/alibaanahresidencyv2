// Fix for Deno types error: "Cannot find name 'Deno'"
// This declares the Deno global for environments where the type definitions are not automatically recognized.
// @ts-ignore
declare const Deno: any;

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    // 3. Secure the endpoint by checking user's role
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

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();

    if (profileError) {
      // Gracefully handle the case where .single() finds no rows (PGRST116), which is common if a profile isn't created yet.
      if (profileError.code === 'PGRST116') {
        return new Response('Forbidden: User profile not found.', {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }
      // For any other unexpected database error, let it be caught by the main handler.
      throw profileError;
    }

    if (!profile || !['staff', 'proprietor'].includes(profile.role)) {
      return new Response('Forbidden: Insufficient permissions.', {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const next7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // --- Database Queries ---
    const { data: rooms, error: roomsError } = await supabaseAdmin.from('rooms').select('id');
    if (roomsError) throw roomsError;
    const totalRooms = rooms?.length || 0;

    const { data: confirmedBookings, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select('total_price, start_date, end_date')
        .in('status', ['Confirmed', 'Occupied']);
    if (bookingsError) throw bookingsError;

    const { data: currentBookings, error: currentError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .in('status', ['Confirmed', 'Occupied'])
        .lte('start_date', today)
        .gte('end_date', today);
    if(currentError) throw currentError;

    // --- Calculations ---
    const totalRevenue = confirmedBookings?.reduce((acc, b) => acc + Number(b.total_price), 0) || 0;
    const currentlyOccupiedRooms = currentBookings?.length || 0;
    const occupancyRate = totalRooms > 0 ? (currentlyOccupiedRooms / totalRooms) * 100 : 0;
    
    const upcomingCheckIns = confirmedBookings?.filter(b => b.start_date > today && b.start_date <= next7Days).length || 0;
    const upcomingCheckOuts = confirmedBookings?.filter(b => b.end_date >= today && b.end_date <= next7Days).length || 0;

    const analyticsData = {
      totalRevenue,
      occupancyRate,
      currentlyOccupiedRooms,
      totalRooms,
      upcomingCheckIns,
      upcomingCheckOuts,
    };

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[admin-analytics] Function error: ${error.message}`, error);
    return new Response(error.message, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 500,
    });
  }
});