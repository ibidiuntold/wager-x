import { EmailTemplate } from './types';

export const wagerInviteTemplate: EmailTemplate = {
  subject: 'You\'ve Been Invited to a Wager on WagerX!',
  getHtml: (params: Record<string, string>) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join a Wager on WagerX</title>
    <style>
        body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; }
        .header { padding: 20px; text-align: center; background-color: #6c5ce7; color: white; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; font-size: 16px; line-height: 1.6; }
        .content p { margin: 0 0 16px; }
        .content a { color: #6c5ce7; text-decoration: none; }
        .button-container { text-align: center; margin: 24px 0; }
        .button { display: inline-block; padding: 12px 24px; background-color: #6c5ce7; color: #ffffff!important; border-radius: 4px; text-decoration: none; font-weight: bold; }
        .wager-details { background-color: #f5f7fa; padding: 16px; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Wager Invitation</h1>
        </div>
        <div class="content">
            <p>Hello ${params.displayName},</p>
            <p>You've been invited to join a wager on WagerX!</p>
            
            <div class="wager-details">
                <h3>${params.wagerTitle}</h3>
                <p>${params.wagerDescription}</p>
            </div>
            
            <p>Join this wager to predict the outcome and potentially win rewards!</p>
            
            <div class="button-container">
                <a href="${params.inviteUrl}" class="button">Join Wager</a>
            </div>
            
            <p>If the button above doesn't work, you can also click the link below:</p>
            <p><a href="${params.inviteUrl}">${params.inviteUrl}</a></p>
            
            <p>Good luck!</p>
            <p>The WagerX Team</p>
        </div>
        <div class="footer">
            <p>&copy; WagerX NG, All Rights Reserved.</p>
            <p>If you don't want to receive these emails, you can <a href="#">unsubscribe</a>.</p>
        </div>
    </div>
</body>
</html>`
};