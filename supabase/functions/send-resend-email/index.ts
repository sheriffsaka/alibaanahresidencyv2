// supabase/functions/send-resend-email/index.ts
// Supabase Edge Function for sending transactional emails via Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // 1. Read Resend API key strictly from Supabase Edge Function environment secret
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  // 2. Validate presence of RESEND_API_KEY - never fall back to hardcoded keys
  if (!resendApiKey) {
    console.error("[send-resend-email] RESEND_API_KEY secret is not configured in Supabase Edge Functions.");
    return new Response(
      JSON.stringify({
        success: false,
        error: "RESEND_API_KEY environment variable is not configured. Please set the RESEND_API_KEY secret in your Supabase project settings (Project Settings -> Edge Functions -> Secrets).",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // Sender email can optionally be set via environment variable or default to a standard verified sender/onboarding sender
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || Deno.env.get("FROM_EMAIL") || "Al-Ibaanah Student Residency <onboarding@resend.dev>";

  try {
    const { to, subject, text, html, from } = await req.json();

    // Validate required email fields
    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required email fields. 'to', 'subject', and either 'text' or 'html' must be provided.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const recipientList = Array.isArray(to) ? to : [to];
    const payload: Record<string, unknown> = {
      from: from || fromEmail,
      to: recipientList,
      subject: subject,
      text: text,
    };

    if (html) {
      payload.html = html;
    }

    console.log(`[send-resend-email] Transmitting email to ${recipientList.join(", ")} with subject "${subject}"`);

    // Dispatch request to Resend API using the environment variable key
    let res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    let resData: any = null;
    try {
      resData = await res.json();
    } catch {
      resData = null;
    }

    // Handle domain restriction gracefully during onboarding if custom domain is not yet verified on Resend
    if (!res.ok && (
      res.status === 403 || 
      res.status === 400 || 
      (resData && (resData.name === "restricted_domain" || resData.message?.toLowerCase().includes("onboarding@resend.dev") || resData.message?.toLowerCase().includes("domain")))
    )) {
      console.warn("[send-resend-email] Custom domain not verified on Resend; retrying with onboarding@resend.dev fallback...");
      const fallbackPayload = {
        ...payload,
        from: "Al-Ibaanah Student Residency <onboarding@resend.dev>",
      };

      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify(fallbackPayload),
      });

      try {
        resData = await res.json();
      } catch {
        resData = null;
      }
    }

    if (!res.ok) {
      const errorMessage = resData?.message || resData?.error || `Resend API returned status code ${res.status}`;
      console.error(`[send-resend-email] Failed to send email: ${errorMessage}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          details: resData,
        }),
        {
          status: res.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    console.log(`[send-resend-email] Email delivered successfully. Resend ID: ${resData?.id}`);
    return new Response(
      JSON.stringify({
        success: true,
        id: resData?.id,
        data: resData,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.error(`[send-resend-email] Unhandled error during dispatch: ${err.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "An unexpected error occurred while sending the email.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
