// Fix for Deno types error: "Cannot find name 'Deno'"
// This declares the Deno global for environments where the type definitions are not automatically recognized.
// @ts-ignore
declare const Deno: any;

// supabase/functions/payment-webhook/index.ts
// Handles incoming webhooks from payment providers (e.g., Stripe) to confirm successful payments.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Stripe is used as an example here.
// import Stripe from 'https://esm.sh/stripe@12.3.0';
// const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY') as string);
// const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET') as string;

Deno.serve(async (req) => {
  // Handle CORS preflight requests. While webhooks are typically server-to-server,
  // this ensures the function is robust for any invocation method.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
  const signature = req.headers.get('Stripe-Signature');
  const body = await req.text();

  try {
    // 1. TODO: Verify the webhook signature to ensure it's from Stripe
    // const event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);

    // For now, we'll mock the event object.
    const event = JSON.parse(body); // In a real scenario, you'd get this from the verified Stripe event.

    if (event.type === 'charge.succeeded') {
      const charge = event.data.object;
      const bookingId = charge.metadata.booking_id; // Assume we passed this when creating the charge

      if (!bookingId) {
        throw new Error('Booking ID missing in webhook metadata');
      }

      // 2. Validate and Initialize Supabase Admin Client
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your function secrets.');
      }
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);


      // 3. **DATABASE TRANSACTION: Update payment and booking status**
      // Find the corresponding payment record
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({
          status: 'Succeeded',
          provider_transaction_id: charge.id,
        })
        .eq('booking_id', bookingId)
        .eq('status', 'Pending')
        .select()
        .single();
      
      if (paymentError || !payment) throw new Error(`Failed to update payment for booking ${bookingId}. ${paymentError?.message}`);
      
      // Update the booking status to 'Confirmed'
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ status: 'Confirmed' })
        .eq('id', bookingId);
      
      if (bookingError) throw new Error(`Failed to confirm booking ${bookingId}.`);

      // 4. **TODO: Trigger Invoice Generation**
      // e.g., await supabaseAdmin.functions.invoke('generate-invoice', { body: { payment_id: payment.id } });

      // 5. **Log this action in the admin_audit_log**
      await supabaseAdmin.from('admin_audit_log').insert({
          action: 'Payment Succeeded via Webhook',
          target_id: payment.id.toString(),
          details: { provider: 'Stripe', chargeId: charge.id }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error(`[payment-webhook] Webhook Error: ${err.message}`, err);
    return new Response(err.message, { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }
});