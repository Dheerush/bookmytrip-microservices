export const otpTemplate = (otp: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>OTP Verification</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding: 20px;">
    
    <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:8px;">
      
      <h2 style="color:#1e90ff; text-align:center;">
        ✈️ BookMyTrip
      </h2>

      <h3 style="text-align:center;">OTP Verification</h3>

      <p>Hello,</p>

      <p>
        Your One-Time Password (OTP) for verifying your account is:
      </p>

      <div style="text-align:center; margin: 30px 0;">
        <span style="
          font-size: 28px;
          letter-spacing: 8px;
          font-weight: bold;
          background: #1e90ff;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
        ">
          ${otp}
        </span>
      </div>

      <p>This OTP is valid for 5 minutes.</p>

      <p style="color: gray; font-size: 12px;">
        If you did not request this, please ignore this email.
      </p>

    </div>

  </body>
  </html>
  `;
};