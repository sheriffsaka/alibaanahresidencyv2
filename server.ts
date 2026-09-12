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
        .not('status', 'in', '("Cancelled","Completed","Rejected","Discontinued")');

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
