// app/api/payment/initialize.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/mysql';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // ✅ Parse request body
    const { userId, processorId } = req.body as { userId: string; processorId: string };

    if (!userId || !processorId) {
      return res.status(400).json({ error: 'Missing userId or processorId' });
    }

    // ✅ Fetch user
    const [userRows] = await pool.execute<any[]>(
      'SELECT email, firstName, lastName FROM users WHERE id = ?',
      [userId]
    );
    const userData = (userRows as any[])[0] || null; // Ensure valid row

    // ✅ Fetch settings
    const [settingsRows] = await pool.execute<any[]>(
      'SELECT currency, appName, favicon FROM settings WHERE id = ?',
      ['general']
    );
    const settings = (settingsRows as any[])[0] || null;

    // ✅ Check if records exist
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    // ✅ Return initialized payment data
    return res.status(200).json({
      success: true,
      userData,
      settings,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || null,
    });

  } catch (error: any) {
    console.error('Payment initialization error:', error.message || error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
