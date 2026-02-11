// Fix for Deno types error: "Cannot find name 'Deno'"
// This declares the Deno global for environments where the type definitions are not automatically recognized.
// @ts-ignore
declare const Deno: any;

// supabase/functions/verify-bank-transfer/index.ts
// An admin-only function to manually verify a bank transfer and confirm a booking.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface VerificationRequest {
  paymentId: number;
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
    
    // 2. Initialize Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // 3. Check for staff/proprietor role.
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

     const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
     if (!profile || !['staff', 'proprietor'].includes(profile.role)) {
         return new Response('Forbidden: Insufficient permissions.', {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
     }

    // 4. Get paymentId from request body
    const { paymentId }: VerificationRequest = await req.json();

    // 5. **DATABASE TRANSACTION: Update payment and booking status**
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'Succeeded' })
      .eq('id', paymentId)
      .eq('status', 'Pending Verification') // Ensure we only update payments awaiting verification
      .select('booking_id')
      .single();

    if (paymentError || !payment) {
      throw new Error(`Payment verification failed for ID ${paymentId}. It might have already been processed or does not exist.`);
    }

    const { error: bookingError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'Confirmed' })
      .eq('id', payment.booking_id);
    
    if (bookingError) throw new Error(`Failed to confirm booking ${payment.booking_id}.`);

    // 6. **Log the manual verification action**
    await supabaseAdmin.from('admin_audit_log').insert({
        user_id: user.id,
        action: 'Verified Bank Transfer',
        target_id: paymentId.toString(),
        details: { verifiedAt: new Date().toISOString() }
    });

    return new Response(JSON.stringify({ success: true, message: `Booking ${payment.booking_id} confirmed.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error(`[verify-bank-transfer] Function error: ${error.message}`, error);
    return new Response(error.message, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      status: 500,
    });
  }
});