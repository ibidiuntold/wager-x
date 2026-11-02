// app/api/payment/resolve-account/route.ts
import { NextResponse } from 'next/server';

interface ResolveAccountRequest {
  account_number: string;
  bank_code: string;
}

export async function POST(req: Request) {
  try {
    const body: ResolveAccountRequest = await req.json();
    const { account_number, bank_code } = body;

    if (!account_number || !bank_code) {
      return NextResponse.json(
        { status: false, message: 'Account number and bank code are required' },
        { status: 400 }
      );
    }

    if (account_number.length !== 10) {
      return NextResponse.json(
        { status: false, message: 'Account number must be 10 digits' },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { status: false, message: 'Paystack configuration error' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.status && data.data) {
      return NextResponse.json({
        status: true,
        data: {
          account_name: data.data.account_name,
          account_number: data.data.account_number,
        },
      });
    } else {
      return NextResponse.json({
        status: false,
        message: data.message || 'Unable to resolve account details',
      });
    }
  } catch (error) {
    console.error('Account resolution error:', error);
    return NextResponse.json(
      { status: false, message: 'Failed to resolve account details' },
      { status: 500 }
    );
  }
}