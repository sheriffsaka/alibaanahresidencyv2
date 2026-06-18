// supabase/functions/send-resend-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

serve(async (req) => {
  // Handle CORS Preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in Supabase Edge Functions environment settings.");
    return new Response(JSON.stringify({
      error: "RESEND_API_KEY environment variable is not defined on the Supabase backend. Please configure it."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  try {
    const { to, subject, text } = await req.json()

    const payload = {
      from: "Al-Ibaanah Student Residency <no-reply@registration.ibaanah.com>",
      to: [to],
      subject: subject,
      text: text,
    }

    console.log(`[Resend Email] Attempting to send custom domain email to: ${to}`);
    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    let data;
    try {
      data = await res.clone().json();
    } catch {
      data = null;
    }

    // Capture unverified custom domain errors and automatically fallback to onboarding@resend.dev
    if (!res.ok && (
      res.status === 403 || 
      res.status === 400 || 
      (data && (data.name === 'restricted_domain' || data.message?.toLowerCase().includes('onboarding@resend.dev') || data.message?.toLowerCase().includes('domain')))
    )) {
      console.warn("[Resend Email] Custom domain sending failed or is not verified. Engaging fallback to onboarding@resend.dev...");
      const fallbackPayload = {
        ...payload,
        from: "Al-Ibaanah Student Residency <onboarding@resend.dev>",
      }

      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(fallbackPayload),
      })
      data = await res.json()
    } else {
      data = data || await res.json()
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })

  } catch (error) {
    console.error(`[Resend Email error] Catch-all exception: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})