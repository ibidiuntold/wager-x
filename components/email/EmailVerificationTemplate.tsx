'use client';

const EmailVerificationTemplate = (username: string, verificationLink: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your WagerX account</title>
        <style>
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
          }
          .header {
            background-color: #324781;
            padding: 20px;
            text-align: center;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 20px;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #324781;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666666;
            font-size: 12px;
          }
        </style>
      </head>
      <body style="background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div class="container">
          <div class="header">
            <img src="https://wagerx.com/logo.png" alt="WagerX Logo" class="logo">
          </div>
          <div class="content">
            <h2>Welcome to WagerX!</h2>
            <p>Hey ${username},</p>
            <p>Thanks for signing up! Please verify your email address to unlock all features of your WagerX account.</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
            <p>This link will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WagerX. All rights reserved.</p>
            <p>You're receiving this email because you signed up for a WagerX account.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export default EmailVerificationTemplate; 