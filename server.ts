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

      // 2. Try Supabase RPC 'create_student_profile'
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
        console.warn("[Server Admin Create Student] RPC call failed or not found, falling back to auth sign-up:", rpcErr);
      }

      // 3. Fallback: Use non-persisting Supabase auth client
      // Generate a strong cryptographic random password (not exposed to Admin)
      const tempPassword = `StudentAct_${crypto.randomUUID().replace(/-/g, "")}!#Aa9`;
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
        return res.status(400).json({
          success: false,
          error: `Unable to register student: ${authError.message}`
        });
      }

      const newUserId = authData.user?.id;
      if (!newUserId) {
        return res.status(500).json({
          success: false,
          error: "Failed to obtain student identifier from authentication service."
        });
      }

      const studentObject = {
        id: newUserId,
        full_name: normalizedFullName,
        email: normalizedEmail,
        phone_number: normalizedPhone,
        gender: normalizedGender,
        nationality: normalizedNationality,
        passport_number: normalizedPassport,
        role: "student",
        is_pending_activation: true,
        updated_at: new Date().toISOString()
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
