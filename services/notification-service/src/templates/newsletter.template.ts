export const newsletterTemplate = (email: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">

      <h2 style="color:#1e90ff; text-align:center;">
        ✈️ You're Subscribed to BookMyTrip!
      </h2>

      <p>Hello ${email},</p>

      <p>
        🎉 You've successfully subscribed to the <strong>BookMyTrip Newsletter</strong>!
      </p>

      <p>
        As a subscriber, you'll be the first to hear about:
      </p>

      <ul>
        <li>🔥 Exclusive travel deals and flash sales</li>
        <li>🎟 Special discount coupons</li>
        <li>✈️ Early access to flight, hotel, and train offers</li>
        <li>🏖 Curated tour packages and travel inspiration</li>
      </ul>

      <p>
        Stay tuned — great deals are on their way to your inbox!
      </p>

      <p style="margin-top:30px;">
        Happy Traveling,<br/>
        <strong>Team BookMyTrip</strong>
      </p>

    </div>
  </body>
  </html>
  `;
};
