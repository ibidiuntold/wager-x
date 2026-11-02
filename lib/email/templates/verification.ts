import { EmailTemplate } from './types';

export const verificationTemplate: EmailTemplate = {
  subject: 'Confirm Your Email for WagerX',
  getHtml: (params: Record<string, string>) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email for WagerX</title>
    <style>
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; }
        .header { padding: 20px; text-align: center; }
        .content { padding: 20px; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 16px; }
        .content a { color: #1a73e8; text-decoration: none; }
        .button-container { text-align: center; margin: 20px 0; }
        .button { display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #ffffff!important; border-radius: 4px; text-decoration: none; font-weight: bold; }
        .footer { padding: 20px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co/DfDPDFH/wager-logo.png" alt="WagerX Logo" width="120">
        </div>
        <div class="content">
            <p>Hello ${params.displayName},</p>
            <p>Thank you for signing up with WagerX! Please confirm your email address to complete your registration and start exploring.</p>
            <div class="button-container">
                <a href="${params.verifyUrl}" class="button">Verify Email</a>
            </div>
            <p>If the button above doesn't work, you can also click the link below:</p>
            <p><a href="${params.verifyUrl}">${params.verifyUrl}</a></p>
            <p>If you didn't request this email, please ignore it.</p>
            <p>Thanks,<br>The WagerX Team</p>
        </div>
        <div class="footer">
            <p>You are receiving this email from wagerx.ng because during email verification you agreed to receive emails from us regarding new features, events, promotions, and special offers.</p>
            <p>© WagerX NG, All Rights Reserved.</p>
        </div>
    </div>
</body>
</html>`
};