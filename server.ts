import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Server-side Resend Email dispatch endpoint
  app.post("/api/send-email", async (req, res) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "Al-Ibaanah Student Residency <noreply@sharedhousing.ibaanah.com>";

    if (!resendApiKey) {
      console.error("[Server Email API] RESEND_API_KEY environment variable is not set.");
      return res.status(500).json({
        success: false,
        error: "RESEND_API_KEY environment variable is not configured in the application environment. Please set the RESEND_API_KEY secret in Settings."
      });
    }

    try {
      const { to, subject, text, html, from } = req.body;

      if (!to || !subject || (!text && !html)) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: 'to', 'subject', and either 'text' or 'html' must be provided."
        });
      }

      const recipientList = Array.isArray(to) ? to : [to];
      const payload: Record<string, unknown> = {
        from: from || defaultFromEmail,
        to: recipientList,
        subject: subject,
        text: text
      };

      if (html) {
        payload.html = html;
      }

      console.log(`[Server Email API] Sending email via Resend to: ${recipientList.join(", ")}`);

      let response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify(payload)
      });

      let resData: any = null;
      try {
        resData = await response.json();
      } catch {
        resData = null;
      }

      // Handle unverified custom domain error by attempting fallback to onboarding@resend.dev during testing
      if (!response.ok && (
        response.status === 403 || 
        response.status === 400 || 
        (resData && (resData.name === "restricted_domain" || resData.message?.toLowerCase().includes("onboarding@resend.dev") || resData.message?.toLowerCase().includes("domain")))
      )) {
        console.warn("[Server Email API] Custom sender unverified on Resend. Attempting fallback to onboarding@resend.dev...");
        const fallbackPayload = {
          ...payload,
          from: "Al-Ibaanah Student Residency <onboarding@resend.dev>"
        };

        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify(fallbackPayload)
        });

        try {
          resData = await response.json();
        } catch {
          resData = null;
        }
      }

      if (!response.ok) {
        const errorMsg = resData?.message || resData?.error || `Resend API returned HTTP ${response.status}`;
        console.error(`[Server Email API Error] ${errorMsg}`);
        return res.status(response.status).json({
          success: false,
          error: errorMsg,
          details: resData
        });
      }

      console.log(`[Server Email API] Delivered successfully. Resend ID: ${resData?.id}`);
      return res.json({
        success: true,
        id: resData?.id,
        data: resData
      });
    } catch (err: any) {
      console.error(`[Server Email API Error] Exception: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to transmit email through Resend API."
      });
    }
  });

  // =========================================================================
  // Server-side Admin Email Notifications for Important Booking Activities
  // =========================================================================
  const inFlightAdminNotifications = new Set<string>();

  async function sendAdminEmailNotification({
    eventType,
    bookingId,
    eventKey,
    metadata = {},
    origin
  }: {
    eventType: 'new_booking' | 'payment_submitted' | 'payment_confirmed' | 'booking_cancelled' | 'tenancy_agreement_signed';
    bookingId: number;
    eventKey?: string;
    metadata?: Record<string, any>;
    origin?: string;
  }) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "Al-Ibaanah Student Residency <noreply@sharedhousing.ibaanah.com>";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Database configuration missing on server.");
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 1. Fetch booking directly from Supabase (Source of Truth)
    const { data: booking, error: bErr } = await client
      .from("bookings")
      .select("*, rooms(room_number, apartment_name, category, type), bed_spaces(id, label)")
      .eq("id", bookingId)
      .maybeSingle();

    if (bErr || !booking) {
      throw new Error(`Booking BK${bookingId} was not found in Supabase database. Notification aborted.`);
    }

    // 2. Validate event condition against database state (prevent sending if DB op failed)
    if (eventType === 'payment_confirmed') {
      if (booking.status !== 'Confirmed' && booking.status !== 'Occupied') {
        throw new Error(`Database verification failed: Booking BK${bookingId} status is "${booking.status}", expected "Confirmed" or "Occupied". Notification aborted.`);
      }
    } else if (eventType === 'booking_cancelled') {
      if (booking.status !== 'Cancelled') {
        throw new Error(`Database verification failed: Booking BK${bookingId} status is "${booking.status}", expected "Cancelled". Notification aborted.`);
      }
    } else if (eventType === 'payment_submitted') {
      if (!booking.payment_proof_url && booking.status !== 'Pending Verification' && !metadata.proof_url) {
        throw new Error(`Database verification failed: Booking BK${bookingId} has no payment proof registered. Notification aborted.`);
      }
    } else if (eventType === 'tenancy_agreement_signed') {
      if (!booking.contract_signed_at && !booking.signature_data) {
        throw new Error(`Database verification failed: Booking BK${bookingId} has no contract signature registered. Notification aborted.`);
      }
    }

    // 3. Formulate canonical idempotency key
    let canonicalKey = eventKey;
    if (!canonicalKey) {
      if (eventType === 'new_booking') {
        canonicalKey = `admin_evt_new_booking_${bookingId}`;
      } else if (eventType === 'payment_submitted') {
        const proofStr = String(booking.payment_proof_url || metadata.proof_url || '');
        const proofHash = proofStr ? crypto.createHash('md5').update(proofStr).digest('hex').slice(0, 8) : 'default';
        canonicalKey = `admin_evt_pay_sub_${bookingId}_${proofHash}`;
      } else if (eventType === 'payment_confirmed') {
        canonicalKey = `admin_evt_pay_conf_${bookingId}`;
      } else if (eventType === 'booking_cancelled') {
        canonicalKey = `admin_evt_cancelled_${bookingId}`;
      } else if (eventType === 'tenancy_agreement_signed') {
        canonicalKey = `admin_evt_agreement_${bookingId}`;
      } else {
        canonicalKey = `admin_evt_${eventType}_${bookingId}`;
      }
    }

    // Check in-flight lock to avoid concurrent race conditions
    if (inFlightAdminNotifications.has(canonicalKey)) {
      return { success: true, duplicate: true, message: `Notification ${canonicalKey} is already in-flight.` };
    }
    inFlightAdminNotifications.add(canonicalKey);

    try {
      // 4. Check Supabase admin_audit_log for duplicate prevention
      const { data: existingNotice } = await client
        .from("admin_audit_log")
        .select("id, target_id, details, created_at")
        .eq("action", "admin_email_notification")
        .eq("target_id", canonicalKey)
        .limit(1);

      if (existingNotice && existingNotice.length > 0) {
        return {
          success: true,
          duplicate: true,
          message: `Admin notification for ${eventType} on BK${bookingId} was already sent on ${existingNotice[0].created_at}.`
        };
      }

      // 5. Determine admin recipient email
      let adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail) {
        try {
          const { data: cmsRows } = await client.from("cms_content").select("how_to_videos").limit(1);
          if (cmsRows && cmsRows[0]?.how_to_videos?.landlordDetails?.adminEmail) {
            adminEmail = cmsRows[0].how_to_videos.landlordDetails.adminEmail;
          }
        } catch (cmsErr) {
          console.warn("[Admin Notification] Notice fetching cms admin email:", cmsErr);
        }
      }
      if (!adminEmail) {
        adminEmail = "sheriffdeenalade@gmail.com";
      }

      // 6. Construct email details & link
      const baseUrl = origin ? origin.replace(/\/$/, '') : 'http://localhost:3000';
      let adminSection = 'bookings';
      if (eventType === 'payment_submitted') adminSection = 'transactions';
      else if (eventType === 'tenancy_agreement_signed') adminSection = 'contracts';
      else if (eventType === 'payment_confirmed') adminSection = 'bookings';
      else if (eventType === 'booking_cancelled') adminSection = 'bookings';

      const adminLink = `${baseUrl}/?page=admin&section=${adminSection}&bookingId=${booking.id}`;

      // Format Room / Bed Space info
      const room = booking.rooms || {};
      const bedSpace = booking.bed_spaces || {};
      const roomDisplay = `${room.apartment_name || 'Residency'} ${room.room_number ? `Room ${room.room_number}` : ''}`.trim() || 'Assigned Room';
      const accommodationType = room.type || booking.preferred_accommodation || 'Standard Shared';
      const categoryName = room.category || 'Standard';
      const bedLabel = bedSpace.label ? `Bed ${bedSpace.label}` : (booking.bed_space_id ? `Bed Space #${booking.bed_space_id}` : 'Unassigned');
      const paymentProofUrl = booking.payment_proof_url || metadata.proof_url || '';
      const formattedPrice = booking.total_price !== undefined && booking.total_price !== null ? `$${booking.total_price} USD` : 'N/A';
      const stayDates = `${booking.start_date || booking.expected_arrival_date || 'N/A'} to ${booking.end_date || 'N/A'}`;
      const duration = booking.duration_of_stay || 'Standard Term';

      let subject = '';
      let eventTitle = '';
      let badgeBg = '#1b6441';
      let summaryText = '';
      let specificRows = '';
      let plainSpecificRows = '';

      if (eventType === 'new_booking') {
        subject = `[Residency Admin] New Student Booking Received — BK${booking.id} (${booking.full_name})`;
        eventTitle = 'NEW STUDENT BOOKING SUBMITTED';
        badgeBg = '#1b6441';
        summaryText = `A new accommodation reservation has been submitted by the student and successfully stored in Supabase.`;
      } else if (eventType === 'payment_submitted') {
        subject = `[Residency Admin] Payment Proof Submitted — BK${booking.id} (${booking.full_name})`;
        eventTitle = 'PAYMENT PROOF SUBMITTED';
        badgeBg = '#d97706';
        summaryText = `The student has uploaded proof of payment / remittance. Please verify the receipt and confirm the transaction in the Admin Dashboard.`;
        if (paymentProofUrl) {
          specificRows += `
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Payment Receipt</td>
              <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                <a href="${paymentProofUrl}" target="_blank" style="color: #1b6441; font-weight: bold; text-decoration: underline;">View Uploaded Receipt / Proof Document ↗</a>
              </td>
            </tr>
          `;
          plainSpecificRows += `Payment Receipt URL: ${paymentProofUrl}\n`;
        }
      } else if (eventType === 'payment_confirmed') {
        subject = `[Residency Admin] Payment Confirmed & Booking Approved — BK${booking.id} (${booking.full_name})`;
        eventTitle = 'PAYMENT CONFIRMED & APPROVED';
        badgeBg = '#15803d';
        summaryText = `Payment has been successfully verified and confirmed in the system. The booking status is now official (${booking.status}).`;
      } else if (eventType === 'booking_cancelled') {
        subject = `[Residency Admin] Booking Cancelled — BK${booking.id} (${booking.full_name})`;
        eventTitle = 'BOOKING CANCELLED / DISCONTINUED';
        badgeBg = '#dc2626';
        summaryText = `Booking BK${booking.id} has been marked as Cancelled in Supabase. Associated bed spaces and rooms have been released back to vacant.`;
        if (metadata.reason) {
          specificRows += `
            <tr>
              <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Cancellation Reason</td>
              <td style="padding: 10px 14px; color: #dc2626; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${metadata.reason}</td>
            </tr>
          `;
          plainSpecificRows += `Cancellation Reason: ${metadata.reason}\n`;
        }
      } else if (eventType === 'tenancy_agreement_signed') {
        subject = `[Residency Admin] Tenancy Agreement Signed — BK${booking.id} (${booking.full_name})`;
        eventTitle = 'DIGITAL TENANCY AGREEMENT SIGNED';
        badgeBg = '#7c3aed';
        summaryText = `The student has officially reviewed and digitally signed their residency tenancy agreement.`;
        specificRows += `
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #f1f5f9;">Signed Timestamp</td>
            <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${booking.contract_signed_at || new Date().toISOString()}</td>
          </tr>
        `;
        plainSpecificRows += `Signed Timestamp: ${booking.contract_signed_at || new Date().toISOString()}\n`;
      }

      const htmlContent = `
<div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 20px;">
    <h1 style="color: #1b6441; font-size: 20px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.5px;">Al-Ibaanah Student Residency</h1>
    <p style="color: #64748b; font-size: 13px; margin: 0;">Automated Administrative Notification System</p>
  </div>

  <!-- Event Badge -->
  <div style="text-align: center; margin-bottom: 20px;">
    <span style="display: inline-block; background-color: ${badgeBg}; color: #ffffff; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
      ${eventTitle}
    </span>
  </div>

  <!-- Main Card -->
  <div style="background-color: #ffffff; padding: 24px; border-radius: 10px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0; margin-bottom: 18px;">
      ${summaryText}
    </p>

    <!-- Details Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <tbody>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; width: 35%; border-bottom: 1px solid #e2e8f0;">Booking Reference</td>
          <td style="padding: 10px 14px; font-weight: 800; color: #1b6441; border-bottom: 1px solid #e2e8f0;">BK${booking.id}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Student Name</td>
          <td style="padding: 10px 14px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${booking.full_name}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Student Contact</td>
          <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
            <a href="mailto:${booking.email}" style="color: #1b6441; text-decoration: none;">${booking.email}</a>
            ${booking.phone_number ? `<br/><span style="color: #64748b; font-size: 12px;">Tel: ${booking.phone_number}</span>` : ''}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Nationality & Passport</td>
          <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
            ${booking.nationality || 'N/A'} • Passport: ${booking.passport_number || 'N/A'}
          </td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Room & Category</td>
          <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
            <strong>${roomDisplay}</strong> (${categoryName} - ${accommodationType})
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Bed Space</td>
          <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${bedLabel}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">Stay Timeline</td>
          <td style="padding: 10px 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
            ${stayDates} (${duration})
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #f1f5f9;">Total Price / Amount</td>
          <td style="padding: 10px 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #f1f5f9;">${formattedPrice}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 10px 14px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0;">System Status</td>
          <td style="padding: 10px 14px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${booking.status}</td>
        </tr>
        ${specificRows}
      </tbody>
    </table>

    <!-- Admin Link Button -->
    <div style="text-align: center; margin: 26px 0 16px 0;">
      <a href="${adminLink}" target="_blank" style="background-color: #1b6441; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 14px;">
        Open in Admin Dashboard →
      </a>
    </div>

    <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.5;">
      Direct link: <a href="${adminLink}" style="color: #1b6441; word-break: break-all;">${adminLink}</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8;">
    <p style="margin: 0;">Al-Ibaanah Student Residency Automated Management • Nasr City, Cairo, Egypt</p>
    <p style="margin: 4px 0 0 0;">This administrative alert was triggered automatically by a confirmed database update in Supabase.</p>
  </div>
</div>
      `.trim();

      const plainText = `
AL-IBAANAH STUDENT RESIDENCY - ADMINISTRATIVE ALERT
===================================================
Event: ${eventTitle}

${summaryText}

BOOKING DETAILS:
- Booking Reference: BK${booking.id}
- Student Name: ${booking.full_name}
- Student Email: ${booking.email}
- Student Phone: ${booking.phone_number || 'N/A'}
- Nationality: ${booking.nationality || 'N/A'}
- Passport: ${booking.passport_number || 'N/A'}
- Accommodation: ${roomDisplay} (${categoryName} - ${accommodationType})
- Bed Space: ${bedLabel}
- Stay Dates: ${stayDates} (${duration})
- Total Price: ${formattedPrice}
- Current Status: ${booking.status}
${plainSpecificRows}
ADMIN DASHBOARD ACTION LINK:
${adminLink}

Al-Ibaanah Student Residency • Cairo, Egypt
Automated dispatch following database update.
      `.trim();

      // 7. Dispatch via Resend
      if (!resendApiKey) {
        console.warn("[Admin Notification] RESEND_API_KEY is not set. Simulating admin email dispatch.");
        return {
          success: true,
          simulated: true,
          eventType,
          bookingId,
          recipient: adminEmail
        };
      }

      const payload = {
        from: defaultFromEmail,
        to: [adminEmail],
        subject,
        html: htmlContent,
        text: plainText
      };

      let resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify(payload)
      });

      let resData: any = null;
      try {
        resData = await resendResponse.json();
      } catch {
        resData = null;
      }

      if (!resendResponse.ok && (
        resendResponse.status === 403 ||
        resendResponse.status === 400 ||
        (resData && (resData.name === "restricted_domain" || resData.message?.toLowerCase().includes("onboarding@resend.dev") || resData.message?.toLowerCase().includes("domain")))
      )) {
        console.warn("[Admin Notification] Retrying with onboarding@resend.dev fallback...");
        resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`
          },
          body: JSON.stringify({
            ...payload,
            from: "Al-Ibaanah Student Residency <onboarding@resend.dev>"
          })
        });
        try {
          resData = await resendResponse.json();
        } catch {
          resData = null;
        }
      }

      if (!resendResponse.ok) {
        const errMsg = resData?.message || resData?.error || `Resend HTTP ${resendResponse.status}`;
        throw new Error(`Failed to send admin email via Resend: ${errMsg}`);
      }

      // 8. Record audit log in Supabase admin_audit_log for idempotency and audit tracking
      try {
        const auditUserId = booking.student_id || '88b70525-e64b-4ddb-8479-6361bab953af';
        await client.from("admin_audit_log").insert({
          user_id: auditUserId,
          action: "admin_email_notification",
          target_id: canonicalKey,
          details: {
            event_type: eventType,
            booking_id: bookingId,
            recipient: adminEmail,
            student_name: booking.full_name,
            student_email: booking.email,
            room_display: roomDisplay,
            amount: booking.total_price,
            status: booking.status,
            resend_id: resData?.id,
            sent_at: new Date().toISOString()
          }
        });
      } catch (auditErr) {
        console.warn("[Admin Notification] Failed to write admin_audit_log entry in Supabase:", auditErr);
      }

      console.log(`[Admin Notification Success] Dispatched ${eventType} notification for BK${bookingId} to ${adminEmail}. Resend ID: ${resData?.id}`);

      return {
        success: true,
        eventType,
        bookingId,
        recipient: adminEmail,
        resendId: resData?.id
      };
    } finally {
      inFlightAdminNotifications.delete(canonicalKey);
    }
  }

  // API Route: Dispatch Admin Notification for Booking Activities
  app.post(["/api/notify-admin", "/api/admin/notify-booking-event"], async (req, res) => {
    try {
      const { eventType, bookingId, eventKey, metadata, origin } = req.body;
      if (!eventType || !bookingId) {
        return res.status(400).json({ success: false, error: "eventType and bookingId are required." });
      }

      const validEvents = ['new_booking', 'payment_submitted', 'payment_confirmed', 'booking_cancelled', 'tenancy_agreement_signed'];
      if (!validEvents.includes(eventType)) {
        return res.status(400).json({ success: false, error: `Invalid eventType: ${eventType}. Expected one of ${validEvents.join(', ')}` });
      }

      const clientOrigin = origin || req.headers.origin || (req.headers.host ? `http://${req.headers.host}` : "http://localhost:3000");

      const result = await sendAdminEmailNotification({
        eventType,
        bookingId: Number(bookingId),
        eventKey,
        metadata: metadata || {},
        origin: clientOrigin
      });

      return res.json(result);
    } catch (err: any) {
      console.error(`[Admin Notification API Error] ${err.message}`);
      return res.status(err.message?.includes('not found') ? 404 : 400).json({
        success: false,
        error: err.message
      });
    }
  });

  // Server-side endpoint: Admin Create Student Profile
  app.post("/api/admin/create-student", async (req, res) => {
    try {
      const { full_name, email, phone_number, gender, nationality, passport_number } = req.body;

      if (!full_name || !full_name.trim()) {
        return res.status(400).json({ success: false, error: "Full name is required." });
      }

      if (!email || !email.trim() || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "A valid email address is required." });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedFullName = full_name.trim();
      const normalizedPhone = phone_number ? phone_number.trim() : "";
      const normalizedGender = gender === "Female" ? "Female" : "Male";
      const normalizedNationality = nationality ? nationality.trim() : "";
      const normalizedPassport = passport_number ? passport_number.trim() : "";

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ success: false, error: "Supabase configuration missing on server." });
      }

      // 1. Check for duplicates in Supabase database
      const checkClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // Check bookings with this email
      const { data: existingBookings } = await checkClient
        .from("bookings")
        .select("student_id, full_name, email, phone_number")
        .ilike("email", normalizedEmail)
        .limit(1);

      if (existingBookings && existingBookings.length > 0 && existingBookings[0].student_id) {
        return res.json({
          success: false,
          duplicate: true,
          existingStudent: {
            id: existingBookings[0].student_id,
            full_name: existingBookings[0].full_name,
            email: existingBookings[0].email,
            phone_number: existingBookings[0].phone_number,
            role: "student"
          },
          error: `A student with this email address already exists: ${existingBookings[0].full_name} (${existingBookings[0].email}).`
        });
      }

      // Check existing profile with this email or phone
      if (normalizedPhone) {
        const { data: existingProfiles } = await checkClient
          .from("profiles")
          .select("id, full_name, role, phone_number")
          .eq("phone_number", normalizedPhone)
          .limit(1);

        if (existingProfiles && existingProfiles.length > 0) {
          return res.json({
            success: false,
            duplicate: true,
            existingStudent: {
              id: existingProfiles[0].id,
              full_name: existingProfiles[0].full_name,
              phone_number: existingProfiles[0].phone_number,
              email: normalizedEmail,
              role: "student"
            },
            error: `A student with this phone number already exists: ${existingProfiles[0].full_name}.`
          });
        }
      }

      // 2. If Service Role Key is configured, use admin API (bypasses email rate limits completely)
      if (serviceRoleKey) {
        try {
          const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          });

          const tempPassword = `StudentAct_${crypto.randomUUID().replace(/-/g, "")}!#Aa9`;
          const { data: adminUserData, error: adminUserError } = await adminClient.auth.admin.createUser({
            email: normalizedEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: normalizedFullName,
              gender: normalizedGender,
              phone_number: normalizedPhone,
              nationality: normalizedNationality,
              passport_number: normalizedPassport,
              is_pending_activation: true,
              created_by_admin: true
            }
          });

          if (!adminUserError && adminUserData?.user) {
            const adminCreatedId = adminUserData.user.id;
            await adminClient.from("profiles").upsert({
              id: adminCreatedId,
              full_name: normalizedFullName,
              role: "student",
              gender: normalizedGender,
              phone_number: normalizedPhone,
              nationality: normalizedNationality,
              passport_number: normalizedPassport,
              updated_at: new Date().toISOString()
            });

            return res.json({
              success: true,
              student: {
                id: adminCreatedId,
                full_name: normalizedFullName,
                email: normalizedEmail,
                phone_number: normalizedPhone,
                gender: normalizedGender,
                nationality: normalizedNationality,
                passport_number: normalizedPassport,
                role: "student",
                is_pending_activation: true,
                created_at: new Date().toISOString()
              }
            });
          }
        } catch (serviceErr) {
          console.warn("[Server Admin Create Student] Service role key creation notice:", serviceErr);
        }
      }

      // 3. Try Supabase RPC 'create_student_profile'
      try {
        const { data: rpcData, error: rpcError } = await checkClient.rpc("create_student_profile", {
          p_full_name: normalizedFullName,
          p_email: normalizedEmail,
          p_phone_number: normalizedPhone,
          p_gender: normalizedGender,
          p_nationality: normalizedNationality,
          p_passport_number: normalizedPassport
        });

        if (!rpcError && rpcData) {
          if (rpcData.duplicate) {
            return res.json({
              success: false,
              duplicate: true,
              existingStudent: {
                id: rpcData.existing_student_id,
                full_name: normalizedFullName,
                email: normalizedEmail,
                role: "student"
              },
              error: rpcData.error || "A student with this email already exists."
            });
          }
          if (rpcData.success && rpcData.student) {
            return res.json({
              success: true,
              student: rpcData.student
            });
          }
        }
      } catch (rpcErr) {
        console.warn("[Server Admin Create Student] RPC call failed or not found, trying auth sign-up:", rpcErr);
      }

      // 4. Fallback: Use non-persisting Supabase auth client
      const tempPassword = `StudentAct_${crypto.randomUUID().replace(/-/g, "")}!#Aa9`;
      let authUserId: string | null = null;
      try {
        const { data: authData, error: authError } = await checkClient.auth.signUp({
          email: normalizedEmail,
          password: tempPassword,
          options: {
            data: {
              full_name: normalizedFullName,
              gender: normalizedGender,
              phone_number: normalizedPhone,
              nationality: normalizedNationality,
              passport_number: normalizedPassport,
              is_pending_activation: true,
              created_by_admin: true
            }
          }
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes("already registered") || authError.message?.toLowerCase().includes("already exists")) {
            return res.json({
              success: false,
              duplicate: true,
              error: "A student account with this email address is already registered in the system."
            });
          }
          console.warn("[Server Admin Create Student] Supabase signUp notice:", authError.message);
        } else if (authData?.user?.id) {
          authUserId = authData.user.id;
        }
      } catch (signUpErr: any) {
        console.warn("[Server Admin Create Student] Auth signUp exception:", signUpErr.message);
      }

      // If authUserId was created, ensure profile is upserted
      const finalStudentId = authUserId || crypto.randomUUID();
      if (authUserId) {
        try {
          await checkClient.from("profiles").upsert({
            id: authUserId,
            full_name: normalizedFullName,
            role: "student",
            gender: normalizedGender,
            phone_number: normalizedPhone,
            nationality: normalizedNationality,
            passport_number: normalizedPassport,
            updated_at: new Date().toISOString()
          });
        } catch (profUpsertErr) {
          console.warn("[Server Admin Create Student] Profile upsert notice:", profUpsertErr);
        }
      }

      const studentObject = {
        id: finalStudentId,
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        gender: normalizedGender,
        nationality: normalizedNationality,
        passport_number: normalizedPassport,
        role: "student",
        is_pending_activation: true,
        created_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        student: studentObject
      });
    } catch (err: any) {
      console.error("[Server Admin Create Student Error]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "An unexpected error occurred while creating the student profile."
      });
    }
  });

  // Account Activation Link dispatch endpoint
  app.post("/api/auth/send-activation-email", async (req, res) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://lzibaammjwrmjqkqwdml.supabase.co";
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWJhYW1tandybWpxa3F3ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc3NjAsImV4cCI6MjA4NTk4Mzc2MH0.r9rtTQeGmJH5qZlq8DtAf0zhgnNwPelTnXMMtqY1hyI";

    try {
      const { email, full_name, room_info } = req.body;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({
          success: false,
          error: "A valid student email address is required."
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const checkClient = createClient(supabaseUrl, supabaseAnonKey);

      // Determine application origin for redirection
      const origin = req.body.origin || req.headers.origin || (req.headers.host ? `${req.protocol || "http"}://${req.headers.host}` : "http://localhost:3000");
      const activationRedirectUrl = `${origin}/?page=activate`;

      // 1. Fetch student info from bookings or profiles if not passed
      let studentName = full_name;
      let roomDetails = room_info;

      // Check bookings table first since it reliably contains email, student full name, and room
      try {
        const { data: booking } = await checkClient
          .from("bookings")
          .select("full_name, preferred_accommodation, rooms(room_number, category)")
          .ilike("email", normalizedEmail)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (booking) {
          if (!studentName && booking.full_name) studentName = booking.full_name;
          if (!roomDetails) {
            const rNum = (booking.rooms as any)?.room_number;
            const cat = booking.preferred_accommodation || (booking.rooms as any)?.category;
            if (rNum && cat) roomDetails = `${cat} - Room ${rNum}`;
            else if (rNum) roomDetails = `Room ${rNum}`;
            else if (cat) roomDetails = cat;
          }
        }
      } catch (bookErr) {
        console.warn("[Activation API] Booking lookup notice:", bookErr);
      }

      if (!studentName) {
        try {
          const { data: profile } = await checkClient
            .from("profiles")
            .select("full_name")
            .eq("id", normalizedEmail)
            .maybeSingle();
          if (profile?.full_name) {
            studentName = profile.full_name;
          }
        } catch {
          // Non-blocking lookup
        }
      }

      studentName = studentName || "Student";

      // 2. Trigger Supabase Auth password reset/invite to generate verification session
      let supaResetSucceeded = false;
      try {
        const { error: resetErr } = await checkClient.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: activationRedirectUrl
        });
        if (!resetErr) {
          supaResetSucceeded = true;
          console.log(`[Activation API] Supabase resetPasswordForEmail initiated for ${normalizedEmail}`);
        } else {
          console.warn(`[Activation API] Supabase resetPasswordForEmail notice: ${resetErr.message}`);
        }
      } catch (authErr: any) {
        console.warn(`[Activation API] Supabase resetPasswordForEmail exception:`, authErr?.message);
      }

      // 3. Dispatch branded Al-Ibaanah Student Residency activation email
      const activationUrl = `${origin}/?page=activate&email=${encodeURIComponent(normalizedEmail)}`;
      
      const resendApiKey = process.env.RESEND_API_KEY;
      const defaultFromEmail = process.env.RESEND_FROM_EMAIL || "Al-Ibaanah Student Residency <noreply@sharedhousing.ibaanah.com>";

      let emailSent = false;
      if (resendApiKey) {
        try {
          const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #1b6441; font-size: 22px; font-weight: bold; margin: 0 0 6px 0;">Al-Ibaanah Student Residency</h1>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Automated Student Housing Management System</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <h2 style="color: #0f172a; font-size: 18px; font-weight: bold; margin-top: 0;">Welcome, ${studentName}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Your room reservation${roomDetails ? ` (<strong>${roomDetails}</strong>)` : ""} has been registered by the Al-Ibaanah residency administration.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      To access your student portal, view your room assignment, digitally sign your tenancy agreement, and track payments, please click the button below to set your personal account password:
    </p>
    
    <div style="text-align: center; margin: 28px 0;">
      <a href="${activationUrl}" style="background-color: #1b6441; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; font-size: 15px;">
        Activate Account & Set Password
      </a>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="${activationUrl}" style="color: #1b6441; word-break: break-all;">${activationUrl}</a>
    </p>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      <p style="margin: 0;"><strong>Security Notice:</strong> The administration will never ask for your password. Please keep your login credentials private.</p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">Al-Ibaanah Student Residency • Cairo, Egypt</p>
  </div>
</div>
          `.trim();

          const payload = {
            from: defaultFromEmail,
            to: [normalizedEmail],
            subject: "Welcome to Al-Ibaanah Student Residency — Activate Your Account",
            html: htmlContent,
            text: `Dear ${studentName},\n\nWelcome to Al-Ibaanah Student Residency! Your room reservation${roomDetails ? ` for ${roomDetails}` : "" } has been registered by the administration.\n\nPlease visit the following link to set your password and activate your account:\n${activationUrl}\n\nBest regards,\nAl-Ibaanah Residency Team`
          };

          let resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`
            },
            body: JSON.stringify(payload)
          });

          if (resendRes.ok) {
            emailSent = true;
          } else {
            // Try onboarding fallback
            const fallbackPayload = { ...payload, from: "Al-Ibaanah Student Residency <onboarding@resend.dev>" };
            const fallbackRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
              },
              body: JSON.stringify(fallbackPayload)
            });
            if (fallbackRes.ok) emailSent = true;
          }
        } catch (resendErr) {
          console.warn("[Activation API] Resend email send warning:", resendErr);
        }
      }

      // 4. Log in email_logs table
      try {
        await checkClient.from("email_logs").insert({
          recipient: normalizedEmail,
          subject: "Welcome to Al-Ibaanah Student Residency — Activate Your Account",
          template_name: "account_activation",
          status: (emailSent || supaResetSucceeded) ? "sent" : "simulated",
          delivery_attempts: 1,
          metadata: {
            activation_url: activationUrl,
            student_name: studentName,
            room_info: roomDetails,
            supabase_reset_succeeded: supaResetSucceeded
          },
          created_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn("[Activation API] Failed to write email log:", logErr);
      }

      return res.json({
        success: true,
        message: "Activation instructions dispatched successfully.",
        activationUrl: activationUrl,
        emailSent: emailSent || supaResetSucceeded
      });
    } catch (err: any) {
      console.error("[Activation API Exception]", err);
      return res.status(500).json({
        success: false,
        error: err.message || "An unexpected error occurred while dispatching the activation email."
      });
    }
  });

  // Server-side endpoint: Real-time public occupancy with start_date & end_date awareness
  // Evaluates current occupancy (today) vs future reservations, and auto-activates bookings on start_date
  app.get("/api/public-occupancy", async (req, res) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ success: false, error: "Database configuration missing." });
      }

      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch all active bookings
      const { data: rawBookings, error: fetchErr } = await client
        .from('bookings')
        .select('id, room_id, bed_space_id, start_date, end_date, expected_arrival_date, payment_expiry_date, status, preferred_accommodation, booked_at')
        .not('status', 'in', '("Cancelled","Completed","Maintenance")');

      if (fetchErr) {
        console.error("[Public Occupancy API] Error fetching bookings:", fetchErr.message);
        return res.status(500).json({ success: false, error: fetchErr.message });
      }

      const bookings = rawBookings || [];

      // Auto-transition logic: On the arrival/start date, Confirmed bookings become Occupied
      const toActivate: number[] = [];
      for (const b of bookings) {
        const bStart = (b.start_date || b.expected_arrival_date || (b.booked_at ? b.booked_at.split('T')[0] : '')).split('T')[0];
        const bEnd = (b.end_date || b.payment_expiry_date || '2099-12-31').split('T')[0];
        if (b.status === 'Confirmed' && bStart && bStart <= todayStr && bEnd >= todayStr) {
          toActivate.push(b.id);
          b.status = 'Occupied';
        }
      }

      if (toActivate.length > 0) {
        // Asynchronously update in DB
        client
          .from('bookings')
          .update({ status: 'Occupied' })
          .in('id', toActivate)
          .then(({ error }) => {
            if (error) console.warn("[Public Occupancy API] Notice on auto-activating bookings:", error.message);
            else console.log(`[Public Occupancy API] Auto-activated ${toActivate.length} booking(s) to Occupied.`);
          });
      }

      // Map to safe public occupancy records (no student PII)
      const publicOccupancy = bookings.map(b => ({
        id: b.id,
        room_id: b.room_id,
        bed_space_id: b.bed_space_id,
        start_date: b.start_date || b.expected_arrival_date || null,
        end_date: b.end_date || b.payment_expiry_date || null,
        status: b.status,
        preferred_accommodation: b.preferred_accommodation,
        is_held: true
      }));

      return res.json({
        success: true,
        today: todayStr,
        occupancy: publicOccupancy
      });
    } catch (err: any) {
      console.error("[Public Occupancy API Exception]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Server-side endpoint: Check bed/room availability for specific date range
  app.post("/api/check-booking-availability", async (req, res) => {
    try {
      const { roomId, bedSpaceId, startDate, endDate, excludeBookingId } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: "startDate and endDate are required." });
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ success: false, error: "Database configuration missing." });
      }

      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const normStart = String(startDate).split('T')[0];
      const normEnd = String(endDate).split('T')[0];

      if (normStart >= normEnd) {
        return res.status(400).json({ success: false, error: "Start date must be before end date." });
      }

      let query = client
        .from('bookings')
        .select('id, room_id, bed_space_id, start_date, end_date, expected_arrival_date, payment_expiry_date, status, full_name')
        .not('status', 'in', '("Cancelled","Completed","Rejected","Discontinued")');

      if (bedSpaceId) {
        query = query.eq('bed_space_id', Number(bedSpaceId));
      } else if (roomId) {
        query = query.eq('room_id', Number(roomId));
      }

      if (excludeBookingId) {
        query = query.neq('id', Number(excludeBookingId));
      }

      const { data: existingBookings, error: fetchErr } = await query;

      if (fetchErr) {
        return res.status(500).json({ success: false, error: fetchErr.message });
      }

      const conflicts = (existingBookings || []).filter(b => {
        const bStart = (b.start_date || b.expected_arrival_date || '').split('T')[0];
        const bEnd = (b.end_date || b.payment_expiry_date || '2099-12-31').split('T')[0];
        if (!bStart || !bEnd) return false;
        // Overlap formula: (startA < endB) && (endA > startB)
        return (normStart < bEnd) && (normEnd > bStart);
      });

      if (conflicts.length > 0) {
        const firstConflict = conflicts[0];
        const cStart = firstConflict.start_date || firstConflict.expected_arrival_date;
        const cEnd = firstConflict.end_date || firstConflict.payment_expiry_date;
        return res.json({
          available: false,
          conflict: {
            id: firstConflict.id,
            start_date: cStart,
            end_date: cEnd,
            status: firstConflict.status
          },
          message: `This space is already reserved from ${cStart} to ${cEnd}.`
        });
      }

      return res.json({
        available: true,
        message: "The space is available for the requested stay dates."
      });
    } catch (err: any) {
      console.error("[Check Availability API Exception]", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in development; Static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
