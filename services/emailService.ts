import * as emailjs from "@emailjs/nodejs";
import { generateToken } from "@/lib/utils";
import { verificationTemplate, passwordResetTemplate } from "@/lib/email/templates";
import { EmailTemplate } from "@/lib/email/templates/types";
import { getUserByEmail } from "@/services/userService";

const cooldowns = new Map<string, number>();

// A helper function to resolve the email subject
const resolveSubject = (template: EmailTemplate, displayName: string): string => {
  return typeof template.subject === "function"
    ? template.subject(displayName)
    : template.subject;
};

// Core function to send any email using EmailJS
const sendEmail = async (
  to: string,
  params: Record<string, string>
): Promise<boolean> => {
  try {
    await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        email: to,
        ...params, // includes displayName, url, etc.
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY!,
        privateKey: process.env.EMAILJS_PRIVATE_KEY!,
      }
    );

    return true;
  } catch (error: any) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Sends a verification email to a new user.
 * @param email The recipient's email address.
 * @returns A promise that resolves to true if the email was sent successfully.
 */
export const VerifyEmail = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);
  if (!user || !user.nickname || !user.id || !user.email) {
    throw new Error("User not found or nickname is missing");
  }

  const lastSent = cooldowns.get(email);
  if (lastSent && Date.now() - lastSent < 60000) {
    throw new Error("Please wait before requesting another email");
  }

  const token = generateToken(email, user.id);
  const verifyUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

  const result = await sendEmail(email, {
    displayName: user.nickname,
    url: verifyUrl,
  });

  cooldowns.set(email, Date.now());
  return result;
};


/**
 * Sends a password reset email.
 * @param email The recipient's email address.
 * @returns A promise that resolves to true if the email was sent successfully.
 */
export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);

  if (!user || !user.email || !user.id) {
    throw new Error("User not found or nickname is missing");
  }

  const lastSent = cooldowns.get(`reset_${email}`);
  if (lastSent && Date.now() - lastSent < 60000) {
    throw new Error('Please wait before requesting another reset email');
  }

  const token = generateToken(email, user.id);
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  const result = await sendEmail(email, {
    resetUrl,
  });

  cooldowns.set(`reset_${email}`, Date.now());
  return result;
};