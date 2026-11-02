// hooks/useSiteSettings.ts
'use client';

import { siteConfig } from '@/lib/config';

interface SiteSettings {
 appName: string;
 countryCode: string;  
 currency: string;
 currencySymbol: string;
 depBonus: number;
 homeTake: number;
 maxDeposit: number;
 minDeposit: number;
 minWithBalance: number;
 paystackPublic: string;
 paystackSecret: string;
 paystackTest: boolean;
 primaryColor: string;
 recaptchaId: string;
 registerBonus: number;
 maintenanceMode: boolean;
 seo: {
   description: string;
   favicon: string;
   ogImage: string;
   title: string;
 };
 port: string;
 pref: string;
 sender: string;
 server: string;
 username: string;
 timezone: string;
}

export function useSiteSettings() {
 return {
   settings: {
     appName: siteConfig.app.name,
     countryCode: siteConfig.region.countryCode,
     currency: siteConfig.region.currency, 
     currencySymbol: siteConfig.region.currencySymbol,
     depBonus: siteConfig.features.bonuses.enabled ? 1 : 0,
     homeTake: siteConfig.features.takeAmount,
     maxDeposit: siteConfig.features.deposits.max,
     minDeposit: siteConfig.features.deposits.min,
     minWithBalance: siteConfig.features.withdrawals.min,
     paystackPublic: siteConfig.payments.paystack.publicKey,
     paystackSecret: siteConfig.payments.paystack.secretKey,
     paystackTest: siteConfig.payments.paystack.testMode,
     primaryColor: siteConfig.app.primaryColor,
     recaptchaId: siteConfig.security.recaptcha.siteKey,
     registerBonus: siteConfig.features.referrals.bonus,
     maintenanceMode: siteConfig.app.maintenanceMode,
     seo: {
       description: siteConfig.app.description,
       favicon: siteConfig.app.favicon,
       ogImage: siteConfig.app.ogImage,
       title: siteConfig.app.title
     },
     port: siteConfig.email.smtp.port.toString(),
     pref: '',
     sender: siteConfig.email.smtp.fromEmail,
     server: siteConfig.email.smtp.host, 
     username: siteConfig.email.smtp.user,
     timezone: siteConfig.region.timezone
   } as SiteSettings,
   loading: false
 };
}