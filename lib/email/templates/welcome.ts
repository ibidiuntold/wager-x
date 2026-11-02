// @lib/email/templates/welcome.ts
import { EmailTemplate } from './types';

export const welcomeTemplate: EmailTemplate = {
  subject: (nickname: string) => `🎲 Welcome to the Game, ${nickname}! Ready to Win Big? 🎯`,
  getHtml: (params: Record<string, string>) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to WagerX</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #0f1420; }
        .container { max-width: 600px; margin: 20px auto; background: linear-gradient(145deg, #1a1f2e, #0f1420); border-radius: 16px; overflow: hidden; }
        .header { padding: 30px; text-align: center; background: rgba(255,255,255,0.05); }
        .header img { max-width: 150px; }
        .hero-image { width: 100%; max-height: 250px; object-fit: cover; }
        .content { padding: 30px; color: #ffffff; }
        .welcome-text { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ff3e8f; }
        .bonus-box { background: linear-gradient(145deg, #ff3e8f, #8f1fff); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
        .bonus-text { font-size: 28px; font-weight: bold; color: white; margin: 0; }
        .cta-button { display: inline-block; background: #ff3e8f; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
        .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .feature { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co/DfDPDFH/wager-logo.png" alt="WagerX Logo">
        </div>
        <img src="https://i.ibb.co/2vp5Zr0/casino-purple.png" alt="Welcome to WagerX" class="hero-image">
        <div class="content">
            <div class="welcome-text">🎉 Welcome to WagerX, ${params.nickname}!</div>
            <p>You're about to experience prediction gaming like never before! 🚀</p>
            
            <div class="bonus-box">
                <p style="margin: 0;">Welcome Bonus</p>
                <div class="bonus-text">₦500 FREE</div>
                <p style="margin: 5px 0 0;">On Your First Deposit</p>
            </div>

            <div class="features">
                <div class="feature">
                    🎯 Smart Predictions
                </div>
                <div class="feature">
                    💰 Instant Payouts
                </div>
                <div class="feature">
                    🤝 Community Betting
                </div>
                <div class="feature">
                    🔒 Secure Platform
                </div>
            </div>

            <center>
                <a href="https://wagerx.ng/wagers" class="cta-button">
                    START WINNING NOW
                </a>
            </center>

            <p style="font-size: 14px; color: #888;">
                Get ready to join thousands of players making smart predictions and winning big!
            </p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} WagerX NG. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
};