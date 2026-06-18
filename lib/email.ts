
/**
 * Mock email service for Al-Ibaanah Student Residency.
 * In a production environment, this would integrate with a service like SendGrid, Resend, or AWS SES.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
  console.log("--- EMAIL DISPATCH ---");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body: \n${options.body}`);
  console.log("----------------------");
  
  // Detection for production endpoints (e.g. Supabase Edge Function or a backend proxy)
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 
                       (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                       'https://lzibaammjwrmjqkqwdml.supabase.co';
  
  const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                            (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWJhYW1tandybWpxa3F3ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc3NjAsImV4cCI6MjA4NTk4Mzc2MH0.r9rtTQeGmJH5qZlq8DtAf0zhgnNwPelTnXMMtqY1hyI';
  
  const useRealEmailService = (import.meta as any).env?.VITE_USE_REAL_EMAIL_SERVICE === 'true' || 
                              (typeof process !== 'undefined' && process.env?.VITE_USE_REAL_EMAIL_SERVICE === 'true');

  if (useRealEmailService && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      console.log(`[Email Dispatch] Contacting Supabase Edge Function configured at: ${SUPABASE_URL}`);
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          text: options.body
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed with status ${response.status}`);
      }

      const resData = await response.json();
      console.log("[Email Dispatch] Successful transmission response:", resData);
      return { success: true, ...resData };
    } catch (err: any) {
      console.error("[Email Error] Failed to transmit real Resend email:", err);
      return { success: false, error: err.message };
    }
  }

  // Simulate network latency for simulation
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true };
};

export const getApprovalEmailTemplate = (studentName: string, bookingId: number, roomNumber: string) => {
  return {
    subject: `Accommodation Approved - Al-Ibaanah Student Residency (BK${bookingId})`,
    body: `
Dear ${studentName},

We are pleased to inform you that your accommodation application for Room ${roomNumber} has been approved!

Your payment has been verified, and your booking is now confirmed. You can now view your receipt and check-in details on your dashboard.

We look forward to welcoming you to the residency.

Best regards,
Al-Ibaanah Student Residency Team
    `.trim()
  };
};

export const getAgreementSignedTemplate = (studentName: string, bookingId: number) => {
  return {
    subject: `Tenancy Agreement Signed - (BK${bookingId})`,
    body: `
Dear ${studentName},

Thank you for signing your tenancy agreement for Al-Ibaanah Student Residency.

You can now download a PDF copy of your signed agreement from your dashboard.

Next Steps:
- Our team will verify your agreement details.
- You will receive payment instructions for the security deposit on WhatsApp within 24 hours.

Best regards,
Al-Ibaanah Student Residency Team
    `.trim()
  };
};
