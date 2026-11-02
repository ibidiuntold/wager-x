import nodemailer, { SendMailOptions } from 'nodemailer';
import { generateToken } from '@/lib/utils';
import { verificationTemplate, passwordResetTemplate } from '@/lib/email/templates';
import { EmailTemplate } from '@/lib/email/templates/types';

interface EmailConfig {
  from: string;
  server: string;
  port: number;
  username: string;
  password: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private cooldowns: Map<string, number> = new Map();
  private from: string;
  private username: string;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.server,
      port: config.port,
      secure: config.port === 465, // true for 465, false for 587/others
      auth: {
        user: config.username,
        pass: config.password,
      },
    });

    this.from = config.from;
    this.username = config.username;
  }

  private resolveSubject(template: EmailTemplate, displayName: string): string {
    return typeof template.subject === 'function'
      ? template.subject(displayName)
      : template.subject;
  }

  async sendEmail(
    to: string,
    template: EmailTemplate,
    params: Record<string, string>
  ): Promise<boolean> {
    const mailOptions: SendMailOptions = {
      from: `"${this.from}" <${this.username}>`,
      to,
      subject: this.resolveSubject(template, params.displayName || ''),
      html: template.getHtml(params),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(email: string, displayName: string): Promise<boolean> {
    const lastSent = this.cooldowns.get(email);
    if (lastSent && Date.now() - lastSent < 60000) {
      throw new Error('Please wait before requesting another email');
    }

    const token = generateToken(email);
    const verifyUrl = `https://wagerx.ng/api/verify?token=${token}`;

    const result = await this.sendEmail(email, verificationTemplate, {
      displayName,
      verifyUrl,
    });

    this.cooldowns.set(email, Date.now());
    return result;
  }

  async sendPasswordResetEmail(email: string): Promise<boolean> {
    const lastSent = this.cooldowns.get(`reset_${email}`);
    if (lastSent && Date.now() - lastSent < 60000) {
      throw new Error('Please wait before requesting another reset email');
    }

    const token = generateToken(email);
    const resetUrl = `https://wagerx.ng/reset-password?token=${token}`;

    const result = await this.sendEmail(email, passwordResetTemplate, {
      resetUrl,
    });

    this.cooldowns.set(`reset_${email}`, Date.now());
    return result;
  }
}

export const emailService = new EmailService({
  from: process.env.SMTP_FROM || '',
  server: process.env.SMTP_SERVER || '',
  port: Number(process.env.SMTP_PORT) || 465,
  username: process.env.SMTP_USERNAME || '',
  password: process.env.SMTP_PASSWORD || '',
});
