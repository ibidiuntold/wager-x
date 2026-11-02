import { EmailTemplate } from './templates/types';

export const verificationTemplate: EmailTemplate = {
  subject: (displayName: string) => `Verify your email, ${displayName}!`,
  getHtml: (params: Record<string, string>) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${params.displayName}!</h2>
      <p>Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.verifyUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Verify Email
        </a>
      </div>
      <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
      <p>${params.verifyUrl}</p>
    </div>
  `
};

export const welcomeTemplate: EmailTemplate = {
  subject: 'Welcome to WagerX!',
  getHtml: (params: Record<string, string>) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to WagerX, ${params.displayName}!</h2>
      <p>We're excited to have you join our community! Get ready to experience gaming like never before.</p>
      <p>Start exploring our games and creating wagers now!</p>
    </div>
  `
};

export const passwordResetTemplate: EmailTemplate = {
  subject: 'Reset Your WagerX Password',
  getHtml: (params: Record<string, string>) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello! We received a request to reset your password.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
      </div>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p>${params.resetUrl}</p>
    </div>
  `
};
