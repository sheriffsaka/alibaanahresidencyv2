import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

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
