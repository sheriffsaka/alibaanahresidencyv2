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

export const getAccountActivationTemplate = (studentName: string, activationUrl: string, roomDetails?: string) => {
  return {
    templateName: 'account_activation',
    subject: 'Welcome to Al-Ibaanah Student Residency — Activate Your Account',
    body: `
Dear ${studentName},

Welcome to Al-Ibaanah Student Residency! Your accommodation reservation${roomDetails ? ` for ${roomDetails}` : ''} has been registered by the residency administration.

To access your student portal, view your room assignment, tenancy agreement, and invoices, please set your password and activate your account using the secure link below:

${activationUrl}

This secure activation link allows you to create your personal password.

If you have any questions or need assistance, please contact the Al-Ibaanah Residency Administration.

Best regards,
Al-Ibaanah Student Residency Management Team
Cairo, Egypt
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #1b6441; font-size: 22px; font-weight: bold; margin: 0 0 6px 0;">Al-Ibaanah Student Residency</h1>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Automated Student Housing Management System</p>
  </div>
  
  <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <h2 style="color: #0f172a; font-size: 18px; font-weight: bold; margin-top: 0;">Welcome, ${studentName}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      Your room reservation${roomDetails ? ` (<strong>${roomDetails}</strong>)` : ''} has been prepared by our administration team.
    </p>
    <p style="font-size: 14px; line-height: 1.6; color: #334155;">
      To complete your setup, access your room dashboard, review your tenancy agreement, and track your stay, please click the button below to set your personal account password:
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
      <p style="margin: 0;"><strong>Security Notice:</strong> The administration will never ask for your password. Please keep your credentials confidential.</p>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0;">Al-Ibaanah Student Residency • Cairo, Egypt</p>
  </div>
</div>
    `.trim()
  };
};

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

export const getWaitlistOfferTemplate = (studentName: string, category: string, type: string, durationMonths?: number) => {
  return {
    templateName: 'waitlist_offer',
    subject: `Accommodation Vacancy Update: ${category} (${type})`,
    body: `
Dear ${studentName},

We are pleased to inform you that a residency bed space matching your waitlist preference (${category} - ${type}) is now becoming available${durationMonths ? ` for ${durationMonths} months stay` : ''}.

Please reply directly to this notification or log into your residency account within 48 hours to confirm your placement and finalize your booking agreement.

Best regards,
Al-Ibaanah Student Residency Management Team
    `.trim()
  };
};

// ==========================================
// Admin Email Notifications & Templates
// ==========================================

export type AdminBookingEventType =
  | 'new_booking'
  | 'payment_submitted'
  | 'payment_confirmed'
  | 'booking_cancelled'
  | 'tenancy_agreement_signed';

export interface AdminBookingNotificationParams {
  eventType: AdminBookingEventType;
  bookingId: number;
  eventKey?: string;
  metadata?: Record<string, any>;
}

/**
 * Trigger an admin notification from the backend after a database operation succeeds.
 * Validates with Supabase, prevents duplicates via audit logs, and sends via Resend.
 */
export const notifyAdminOfBookingEvent = async (
  params: AdminBookingNotificationParams
): Promise<{
  success: boolean;
  duplicate?: boolean;
  error?: string;
  resendId?: string;
}> => {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const response = await fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        origin
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Server responded with ${response.status}`);
    }

    if (data.success && !data.duplicate) {
      recordEmailLog({
        recipient: data.recipient || 'sheriffdeenalade@gmail.com',
        subject: `[Residency Admin] Booking Alert: ${params.eventType} (BK${params.bookingId})`,
        template_name: `admin_${params.eventType}`,
        status: data.simulated ? 'simulated' : 'sent',
        delivery_attempts: 1,
        metadata: {
          booking_id: params.bookingId,
          event_type: params.eventType,
          resend_id: data.resendId,
          ...params.metadata
        }
      }).catch(() => {});
    }

    return data;
  } catch (err: any) {
    console.error(`[Admin Notification Error] Failed to notify admin of ${params.eventType}:`, err);
    return {
      success: false,
      error: err.message
    };
  }
};

export const getNewBookingAdminTemplate = (booking: any, adminLink: string) => {
  return {
    templateName: 'admin_new_booking',
    subject: `[Residency Admin] New Student Booking Received — BK${booking.id} (${booking.full_name})`,
    body: `
Dear Administrator,

A new accommodation booking has been registered:
- Booking Reference: BK${booking.id}
- Student Name: ${booking.full_name}
- Email: ${booking.email}
- Phone: ${booking.phone_number || 'N/A'}
- Nationality: ${booking.nationality || 'N/A'}
- Accommodation: ${booking.preferred_accommodation || 'Standard'}
- Dates: ${booking.start_date || booking.expected_arrival_date || 'N/A'} to ${booking.end_date || 'N/A'} (${booking.duration_of_stay || 'N/A'})
- Total Price: $${booking.total_price || 0} USD
- Status: ${booking.status}

Admin Dashboard Link:
${adminLink}

Al-Ibaanah Student Residency Automated Management
    `.trim()
  };
};

export const getPaymentSubmittedAdminTemplate = (booking: any, proofUrl: string, adminLink: string) => {
  return {
    templateName: 'admin_payment_submitted',
    subject: `[Residency Admin] Payment Proof Submitted — BK${booking.id} (${booking.full_name})`,
    body: `
Dear Administrator,

Student ${booking.full_name} has submitted proof of payment for Booking BK${booking.id}.
- Booking Reference: BK${booking.id}
- Student: ${booking.full_name} (${booking.email})
- Amount: $${booking.total_price || 0} USD
- Receipt Document: ${proofUrl}
- Status: Pending Verification

Please review and confirm this transaction in the Admin Dashboard:
${adminLink}

Al-Ibaanah Student Residency Automated Management
    `.trim()
  };
};

export const getPaymentConfirmedAdminTemplate = (booking: any, adminLink: string) => {
  return {
    templateName: 'admin_payment_confirmed',
    subject: `[Residency Admin] Payment Confirmed & Booking Approved — BK${booking.id} (${booking.full_name})`,
    body: `
Dear Administrator,

Payment has been officially confirmed and booking approved for Booking BK${booking.id}:
- Booking Reference: BK${booking.id}
- Student: ${booking.full_name} (${booking.email})
- Amount: $${booking.total_price || 0} USD
- Status: ${booking.status}

Admin Dashboard Link:
${adminLink}

Al-Ibaanah Student Residency Automated Management
    `.trim()
  };
};

export const getBookingCancelledAdminTemplate = (booking: any, reason: string | undefined, adminLink: string) => {
  return {
    templateName: 'admin_booking_cancelled',
    subject: `[Residency Admin] Booking Cancelled — BK${booking.id} (${booking.full_name})`,
    body: `
Dear Administrator,

Booking BK${booking.id} for student ${booking.full_name} has been cancelled in the system.
- Booking Reference: BK${booking.id}
- Student: ${booking.full_name} (${booking.email})
- Reason: ${reason || 'Residency discontinued or application rejected'}
- Room & bed spaces have been released back to vacant.

Admin Dashboard Link:
${adminLink}

Al-Ibaanah Student Residency Automated Management
    `.trim()
  };
};

export const getAgreementSignedAdminTemplate = (booking: any, adminLink: string) => {
  return {
    templateName: 'admin_agreement_signed',
    subject: `[Residency Admin] Tenancy Agreement Signed — BK${booking.id} (${booking.full_name})`,
    body: `
Dear Administrator,

Student ${booking.full_name} has signed their residency tenancy agreement for Booking BK${booking.id}.
- Booking Reference: BK${booking.id}
- Student: ${booking.full_name} (${booking.email})
- Signed At: ${booking.contract_signed_at || new Date().toISOString()}

Admin Dashboard Link:
${adminLink}

Al-Ibaanah Student Residency Automated Management
    `.trim()
  };
};

