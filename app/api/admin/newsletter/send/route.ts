import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { firebase_app_admin } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

const db = getFirestore(firebase_app_admin);

async function getEmailSettings() {
  const settingsDoc = await db.collection('settings').doc('general').get();
  if (!settingsDoc.exists) {
    throw new Error('Email settings not found');
  }
  
  const settings = settingsDoc.data();
  return {
    host: settings?.smtp_dt?.server || '',
    port: settings?.smtp_dt?.port || '',
    secure: true,
    auth: {
      user: settings?.smtp_dt?.username || '',
      pass: settings?.smtp_dt?.password || '',
    },
    from: settings?.smtp_dt?.sender || 'noreply@wagerx.com',
  };
}

export async function POST(request: Request) {
  try {
    const { subject, content, recipients } = await request.json();

    if (!subject || !content || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const emailSettings = await getEmailSettings();
    const transporter = nodemailer.createTransport(emailSettings);

    // Send emails in batches of 50 to avoid rate limits
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < recipients.length; i += batchSize) {
      batches.push(recipients.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const emailPromises = batch.map(email => 
        transporter.sendMail({
          from: emailSettings.from,
          to: email,
          subject,
          html: content,
        })
      );

      await Promise.all(emailPromises);
    }

    // Log the newsletter send in Firestore
    await db.collection('newsletter_logs').add({
      subject,
      recipientCount: recipients.length,
      sentAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}
