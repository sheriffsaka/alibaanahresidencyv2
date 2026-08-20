// supabase/functions/send-resend-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("FROM_EMAIL") || "Al-Ibaanah Student Residency <no-reply@registration.ibaanah.com>"

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
      success: false,
      error: "RESEND_API_KEY environment variable is not defined on the Supabase backend. Please configure it."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  try {
    const { to, subject, text, html } = await req.json()

    if (!to || !subject || (!text && !html)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required email parameters ('to', 'subject', 'text' or 'html')."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    const payload: Record<string, any> = {
      from: RESEND_FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      text: text,
    }

    if (html) {
      payload.html = html
    }

    console.log(`[Resend Email] Attempting to send custom domain email (${RESEND_FROM_EMAIL}) to: ${to}`);
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

    // Capture unverified custom domain errors and automatically fallback to onboarding@resend.dev during onboarding
    if (!res.ok && (
      res.status === 403 || 
      res.status === 400 || 
      (data && (data.name === 'restricted_domain' || data.message?.toLowerCase().includes('onboarding@resend.dev') || data.message?.toLowerCase().includes('domain')))
    )) {
      console.warn("[Resend Email] Custom domain sending unverified. Engaging fallback to onboarding@resend.dev...");
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

    if (!res.ok) {
      const errorMsg = data?.message || data?.error || `Resend API rejected transmission with status ${res.status}`;
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg,
        details: data
      }), {
        status: res.status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      id: data?.id,
      data: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })

  } catch (error: any) {
    console.error(`[Resend Email error] Catch-all exception: ${error.message}`);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error during email dispatch"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})
