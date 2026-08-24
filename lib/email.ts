/**
 * Resend Email Integration & Delivery Logger for Al-Ibaanah Student Residency.
 * 
 * Provides:
 * - Real API integration via Supabase Edge Function with Resend.
 * - False-success protection (returns success: false when running in simulated mode).
 * - Transient failure retry logic (up to 2 retries with exponential backoff).
 * - Persistent audit delivery logging in Supabase `public.email_logs`.
 */

import { supabase } from './supabaseClient';
import { EmailLogEntry } from '../types';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  templateName?: string;
  metadata?: Record<string, any>;
}

export interface EmailSendResult {
  success: boolean;
  error?: string;
  simulated?: boolean;
  id?: string;
  attempts?: number;
  logId?: number;
}

// In-memory fallback logs in case database connection is offline or table is initializing
let inMemoryLogs: EmailLogEntry[] = [];

/**
 * Record an email attempt into the persistent database and memory logs
 */
async function recordEmailLog(entry: {
  recipient: string;
  subject: string;
  template_name?: string;
  status: 'sent' | 'failed' | 'simulated';
  error_message?: string | null;
  delivery_attempts: number;
  metadata?: Record<string, any>;
}): Promise<number | undefined> {
  const timestamp = new Date().toISOString();
  
  // Keep in memory
  const memoryEntry: EmailLogEntry = {
    id: Date.now(),
    recipient: entry.recipient,
    subject: entry.subject,
    template_name: entry.template_name || null,
    status: entry.status,
    error_message: entry.error_message || null,
    delivery_attempts: entry.delivery_attempts,
    metadata: entry.metadata || null,
    created_at: timestamp,
  };
  inMemoryLogs.unshift(memoryEntry);
  if (inMemoryLogs.length > 200) inMemoryLogs.pop();

  try {
    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        recipient: entry.recipient,
        subject: entry.subject,
        template_name: entry.template_name || null,
        status: entry.status,
        error_message: entry.error_message || null,
        delivery_attempts: entry.delivery_attempts,
        metadata: entry.metadata || {},
        created_at: timestamp
      })
      .select('id')
      .single();

    if (!error && data) {
      return data.id;
    }
  } catch (dbErr) {
    console.warn("[Email Log DB] Failed to persist log entry to Supabase database (using memory log):", dbErr);
  }

  return memoryEntry.id;
}

/**
 * Dispatches an email with automatic retries for transient errors and complete delivery tracking.
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailSendResult> => {
  const cleanRecipient = options.to.trim();
  const templateName = options.templateName || 'custom';

  console.log("--- EMAIL DISPATCH ATTEMPT ---");
  console.log(`To: ${cleanRecipient}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Template: ${templateName}`);
  console.log("------------------------------");

  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 
                       (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
                       'https://lzibaammjwrmjqkqwdml.supabase.co';
  
  const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                            (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
                            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWJhYW1tandybWpxa3F3ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc3NjAsImV4cCI6MjA4NTk4Mzc2MH0.r9rtTQeGmJH5qZlq8DtAf0zhgnNwPelTnXMMtqY1hyI';
  
  // Real email service flag
  const useRealEmailService = (import.meta as any).env?.VITE_USE_REAL_EMAIL_SERVICE === 'true' || 
                              (typeof process !== 'undefined' && process.env?.VITE_USE_REAL_EMAIL_SERVICE === 'true') ||
                              true; // Default to calling the Supabase Edge Function to reach Resend API

  // If Supabase credentials are missing or explicit simulated mode is requested
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const errorMsg = "Email service not configured (Missing Supabase Backend URL or Anon Key).";
    console.warn(`[Email Warning] ${errorMsg}`);
    const logId = await recordEmailLog({
      recipient: cleanRecipient,
      subject: options.subject,
      template_name: templateName,
      status: 'simulated',
      error_message: errorMsg,
      delivery_attempts: 1,
      metadata: options.metadata
    });

    return {
      success: false,
      error: errorMsg,
      simulated: true,
      attempts: 1,
      logId
    };
  }

  const maxAttempts = 3; // Initial try + up to 2 retries
  let lastError = '';
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`[Email Dispatch] Transmitting email (Attempt ${attempt}/${maxAttempts}) for ${cleanRecipient}...`);
      
      let resData: any = null;
      let isSuccess = false;

      // 1. Try the local Node/Express backend /api/send-email endpoint first
      try {
        const localServerResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: cleanRecipient,
            subject: options.subject,
            text: options.body,
            html: options.html
          })
        });

        if (localServerResponse.ok) {
          resData = await localServerResponse.json().catch(() => null);
          if (resData && resData.success !== false) {
            isSuccess = true;
          }
        } else {
          const errBody = await localServerResponse.json().catch(() => null);
          if (errBody?.error) {
            lastError = errBody.error;
            // If missing API key error, don't keep retrying
            if (lastError.includes('RESEND_API_KEY')) {
              break;
            }
          }
        }
      } catch (localErr: any) {
        console.warn(`[Email API] Local server endpoint failed (${localErr.message}), trying Supabase Edge Function...`);
      }

      // 2. If local server didn't succeed and didn't fail with fatal config error, try Supabase Edge Function
      if (!isSuccess && !lastError.includes('RESEND_API_KEY')) {
        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-resend-email', {
          body: {
            to: cleanRecipient,
            subject: options.subject,
            text: options.body,
            html: options.html
          }
        });

        if (!invokeError && invokeData && invokeData.success !== false) {
          resData = invokeData;
          isSuccess = true;
        } else if (invokeError) {
          lastError = invokeError.message || (invokeData?.error) || 'Failed to dispatch email';
        } else if (invokeData?.error) {
          lastError = invokeData.error;
        }
      }

      if (isSuccess) {
        console.log(`[Email Success] Successfully dispatched email to ${cleanRecipient}. Resend ID: ${resData?.id || 'ok'}`);
        
        const logId = await recordEmailLog({
          recipient: cleanRecipient,
          subject: options.subject,
          template_name: templateName,
          status: 'sent',
          error_message: null,
          delivery_attempts: attempt,
          metadata: { ...options.metadata, resend_id: resData?.id }
        });

        return {
          success: true,
          id: resData?.id,
          attempts: attempt,
          logId
        };
      }

      // Configuration / validation errors - stop retrying
      if (lastError.includes('RESEND_API_KEY') || lastError.includes('Missing required email')) {
        break;
      }

      // Transient error retry backoff
      if (attempt < maxAttempts) {
        const backoffDelay = attempt * 1200;
        await new Promise(r => setTimeout(r, backoffDelay));
      }

    } catch (fetchErr: any) {
      const rawMsg = fetchErr.message || 'Failed to fetch';
      lastError = rawMsg;
      console.warn(`[Email Network Error] Attempt ${attempt} failed: ${lastError}`);

      if (attempt < maxAttempts) {
        const backoffDelay = attempt * 1200;
        await new Promise(r => setTimeout(r, backoffDelay));
      }
    }
  }

  // All attempts exhausted or fatal error occurred
  const isMissingKey = lastError.toLowerCase().includes('resend_api_key') || lastError.toLowerCase().includes('not configured');
  const finalStatus = isMissingKey ? 'simulated' : 'failed';
  const finalErrorMessage = isMissingKey 
    ? `Email service not configured on backend: ${lastError}` 
    : lastError.includes('not yet deployed')
      ? lastError
      : `Delivery failed after ${attempt} attempt(s): ${lastError}`;

  console.error(`[Email Delivery Failure] ${finalErrorMessage}`);

  const logId = await recordEmailLog({
    recipient: cleanRecipient,
    subject: options.subject,
    template_name: templateName,
    status: finalStatus,
    error_message: finalErrorMessage,
    delivery_attempts: attempt,
    metadata: { ...options.metadata, error: lastError }
  });

  return {
    success: false,
    error: finalErrorMessage,
    simulated: isMissingKey,
    attempts: attempt,
    logId
  };
};

/**
 * Fetch recent email delivery logs from Supabase or fallback memory
 */
export const fetchRecentEmailLogs = async (): Promise<EmailLogEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data as EmailLogEntry[];
    }
  } catch (err) {
    console.warn("[Email Logs] Could not query email_logs table from database, returning memory logs:", err);
  }
  return inMemoryLogs;
};

// ==========================================
// Standardized Email Templates
// ==========================================

export const getApprovalEmailTemplate = (studentName: string, bookingId: number, roomNumber: string) => {
  return {
    templateName: 'booking_approval',
    subject: `Accommodation Approved - Al-Ibaanah Student Residency (BK${bookingId})`,
    body: `
Dear ${studentName},

We are pleased to inform you that your accommodation application for Room ${roomNumber} (Booking BK${bookingId}) has been officially APPROVED!

Your payment and signed tenancy agreement have been verified. You can now view your check-in confirmation and invoice receipt directly on your student dashboard.

We look forward to welcoming you to the residency.

Best regards,
Al-Ibaanah Student Residency Management Team
    `.trim()
  };
};

export const getAgreementSignedTemplate = (studentName: string, bookingId: number) => {
  return {
    templateName: 'agreement_signed',
    subject: `Tenancy Agreement Signed - (BK${bookingId})`,
    body: `
Dear ${studentName},

Thank you for signing your tenancy agreement for Al-Ibaanah Student Residency (Booking BK${bookingId}).

You can now download a copy of your digitally signed agreement and upload your payment proof directly from your student dashboard.

Next Steps:
1. Complete your security deposit payment via Bank Transfer or Remitly.
2. Upload the payment receipt/screenshot onto your student dashboard.
3. Our accounts department will verify your remittance and confirm your check-in date.

Best regards,
Al-Ibaanah Student Residency Team
    `.trim()
  };
};

export const getPaymentProofUploadedAdminTemplate = (studentName: string, bookingId: number, proofUrl: string) => {
  return {
    templateName: 'payment_proof_admin_alert',
    subject: `[Admin Alert] Payment Proof Uploaded for Booking BK${bookingId}`,
    body: `
Dear Administrator,

Student ${studentName} has uploaded a proof of payment for Booking BK${bookingId}.

Please review the upload and verify the transaction in the Admin Dashboard.
Receipt Document: ${proofUrl}

Al-Ibaanah Residency System Automated Dispatch
    `.trim()
  };
};

export const getArrivalReminderTemplate = (studentName: string, arrivalDate: string, phone: string) => {
  return {
    templateName: 'arrival_reminder',
    subject: `⏰ Reminder: Your Arrival at Al-Ibaanah Student Residency is Tomorrow!`,
    body: `
Dear ${studentName},

This is a friendly reminder that your scheduled arrival at Al-Ibaanah Student Residency is tomorrow (${arrivalDate})!

Please make sure you have paid and uploaded the receipt of your security deposit to your student dashboard.

If you have any last-minute questions or need directions upon arriving in Cairo, please reach out to our team at ${phone}.

Safe travels, and we look forward to welcoming you!

Warm regards,
Al-Ibaanah Student Residency Team
    `.trim()
  };
};

export const getRentReminderTemplate = (studentName: string, roomNumber: string, dueDate: string) => {
  return {
    templateName: 'rent_reminder',
    subject: `💰 Rent Reminder: Your Monthly Residency Payment is due in 1 week`,
    body: `
Dear ${studentName},

This is a timely reminder that your next monthly residency stay payment for ${roomNumber} is due in exactly 1 week on ${dueDate}.

Kindly prepare to make this monthly subscription payment via Bank Transfer or Remitly, and upload the proof of remittance onto your dashboard.

Thank you for being a valued resident!

Warm regards,
Al-Ibaanah Student Residency Team
    `.trim()
  };
};

export const getWaitlistOfferTemplate = (studentName: string, category: string, type: string, term: string) => {
  return {
    templateName: 'waitlist_offer',
    subject: `Accommodation Vacancy Update: ${category} (${type})`,
    body: `
Dear ${studentName},

We are pleased to inform you that a residency bed space matching your waitlist preference (${category} - ${type}) is now becoming available for ${term || 'the upcoming academic term'}.

Please reply directly to this notification or log into your residency account within 48 hours to confirm your placement and finalize your booking agreement.

Best regards,
Al-Ibaanah Student Residency Management Team
    `.trim()
  };
};
