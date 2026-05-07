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

      <h2 style="color:#1e3a5f; text-align:center;">
        &#128274; Login Alert &mdash; BookMyTrip
      </h2>

      <p>Hello <strong>${email}</strong>,</p>

      <p>
        A new sign-in to your BookMyTrip account was just detected. Here are the details:
      </p>

      <table style="width:100%; background:#f5f8ff; border-radius:8px; padding:16px; border-collapse:collapse;">
        <tr>
          <td style="padding:8px 12px; color:#555; width:40%;"><strong>&#128336; Time</strong></td>
          <td style="padding:8px 12px; color:#1e3a5f;">${loginTime}</td>
        </tr>
        <tr style="background:#eef2ff;">
          <td style="padding:8px 12px; color:#555;"><strong>&#127760; Location</strong></td>
          <td style="padding:8px 12px; color:#1e3a5f;">${ip}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px; color:#555;"><strong>&#128187; Device</strong></td>
          <td style="padding:8px 12px; color:#1e3a5f;">${userAgent}</td>
        </tr>
      </table>

      <p style="margin-top:20px;">
        &#9989; If this was <strong>you</strong>, no action is needed.
      </p>

      <p style="color:#c0392b;">
        &#128680; If this was <strong>not you</strong>, please
        <a href="https://bookmytrip.com/reset-password" style="color:#c0392b; font-weight:bold;">reset your password immediately</a>
        and contact our support team.
      </p>

      <p style="margin-top:30px; color:#888; font-size:13px;">
        Stay secure,<br/>
        <strong>Team BookMyTrip</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};
