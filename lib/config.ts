export const siteConfig = {
    app: {
      name: process.env.APP_NAME || 'WagerX',
      description: process.env.APP_DESCRIPTION || '',
      title: process.env.APP_TITLE || '',
      ogImage: process.env.APP_OG_IMAGE || '/images/og-image.jpg',
      favicon: process.env.APP_FAVICON || '/favicon.ico',
      primaryColor: process.env.APP_PRIMARY_COLOR || '#6366f1',
      maintenanceMode: process.env.APP_MAINTENANCE === 'TRUE'
    },
    region: {
      country: process.env.APP_COUNTRY || 'Nigeria', 
      countryCode: process.env.APP_COUNTRY_CODE || '234',
      currency: process.env.APP_CURRENCY || 'NGN',
      currencySymbol: process.env.APP_CURRENCY_SYMBOL || '₦',
      timezone: process.env.APP_TIMEZONE || 'Africa/Lagos'
    },
    payments: {
      paystack: {
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        secretKey: process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || '',
        testMode: process.env.NEXT_PUBLIC_PAYSTACK_TEST_MODE === 'TRUE'
      },
      flutterwave: {
        publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || '',
        secretKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_SECRET_KEY || '',
        testMode: process.env.NEXT_PUBLIC_FLUTTERWAVE_TEST_MODE === 'TRUE'
      }
    },
    security: {
      recaptcha: {
        siteKey: process.env.RECAPTCHA_SITE_KEY || '',
        secretKey: process.env.RECAPTCHA_SECRET_KEY || ''
      },
      rateLimit: {
        maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000
      }
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST || '',
        port: Number(process.env.SMTP_PORT) || 465,
        user: process.env.SMTP_USERNAME|| '',
        pass: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.SMTP_FROM_EMAIL || '',
        fromName: process.env.SMTP_FROM_NAME || ''
      }
    },
    features: {
      referrals: {
        enabled: process.env.ENABLE_REFERRALS === 'TRUE',
        bonus: Number(process.env.APP_USER_REF_BONUS) || 100
      },
      bonuses: {
        enabled: process.env.ENABLE_BONUSES === 'TRUE'
      },
      withdrawals: {
        charge: Number(process.env.WITHDRAWAL_CHARGE) || 0.5,
        min: Number(process.env.MIN_WITHDRAWAL_AMOUNT) || 5000,
        max: Number(process.env.MAX_WITHDRAWAL_AMOUNT) || 1000000
      },
      deposits: {
        min: Number(process.env.MIN_DEPOSIT) || 500,
        max: Number(process.env.MAX_DEPOSIT) || 1000000
      },
      takeAmount: Number(process.env.APP_TAKE_AMOUNT) || 15
    }
   } as const;