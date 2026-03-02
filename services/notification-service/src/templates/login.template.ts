export const loginTemplate = (
  email: string,
  loginTime: string,
  ip: string,
  userAgent: string
): string => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">

      <h2 style="color:#1e90ff; text-align:center;">
        🔐 Login Alert - BookMyTrip
      </h2>

      <p>Hello ${email},</p>

      <p>
        We noticed a login to your BookMyTrip account.
      </p>

      <div style="background:#f9f9f9; padding:15px; border-radius:6px;">
        <p><strong>Time:</strong> ${loginTime}</p>
        <p><strong>IP Address:</strong> ${ip}</p>
        <p><strong>Device:</strong> ${userAgent}</p>
      </div>

      <p style="margin-top:20px;">
        If this was you, no action is needed.
      </p>

      <p style="color:red;">
        If this wasn’t you, please reset your password immediately.
      </p>

      <p style="margin-top:30px;">
        Stay secure,<br/>
        <strong>Team BookMyTrip</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};