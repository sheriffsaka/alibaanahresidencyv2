
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
  console.log("--- SENDING EMAIL ---");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body: \n${options.body}`);
  console.log("----------------------");
  
  // Simulate network delay
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
