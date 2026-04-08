export const adminComplaintTemplate = (params: {
  ticketId: string;
  subject: string;
  raisedBy: string;
  userEmail: string;
  description?: string;
}): string => {
  const { ticketId, subject, raisedBy, userEmail, description } = params;
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">

      <h2 style="color:#dc2626; text-align:center;">
        🚨 New Support Ticket Raised
      </h2>

      <p>A new support ticket has been submitted and requires your attention.</p>

      <table style="width:100%; border-collapse:collapse; margin:20px 0;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0; font-weight:bold; color:#374151; width:40%;">Ticket #</td>
          <td style="padding:10px 0; color:#1f2937;">${ticketId}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0; font-weight:bold; color:#374151;">Subject</td>
          <td style="padding:10px 0; color:#1f2937;">${subject}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0; font-weight:bold; color:#374151;">Raised By</td>
          <td style="padding:10px 0; color:#1f2937;">${raisedBy || 'Unknown User'}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:10px 0; font-weight:bold; color:#374151;">User Email</td>
          <td style="padding:10px 0; color:#1f2937;">${userEmail}</td>
        </tr>
        ${description ? `
        <tr>
          <td style="padding:10px 0; font-weight:bold; color:#374151; vertical-align:top;">Description</td>
          <td style="padding:10px 0; color:#1f2937;">${description}</td>
        </tr>
        ` : ''}
      </table>

      <p>Please log in to the admin dashboard to review and respond to this ticket.</p>

      <p style="margin-top:30px;">
        <strong>Team BookMyTrip</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};
