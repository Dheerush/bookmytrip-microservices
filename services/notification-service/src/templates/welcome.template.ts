export const welcomeTemplate = (email: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">

      <h2 style="color:#1e90ff; text-align:center;">
        ✈️ Welcome to BookMyTrip
      </h2>

      <p>Hello ${email},</p>

      <p>
        🎉 Your account has been successfully verified!
      </p>

      <p>
        Thank you for choosing <strong>BookMyTrip</strong>.
        We’re excited to help you discover amazing destinations.
      </p>

      <p>
        Keep visiting for:
      </p>

      <ul>
        <li>🔥 Exclusive travel deals</li>
        <li>🎟 Special coupons</li>
        <li>✈️ Early access flight discounts</li>
      </ul>

      <p style="margin-top:30px;">
        Happy Traveling,<br/>
        <strong>Team BookMyTrip</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};