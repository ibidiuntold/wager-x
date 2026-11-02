// /types/settings.ts

export interface SystemSettings {
  id?: string;
  appName: string;
  country: string;
  countryCode: string;
  currency: string;
  maxDeposit: number;
  minDeposit: number;
  minWithdrawalBalance: number;
  primaryColor: string;
  onMaintenance: boolean;
  withdrawalFee: number;
  enabled: boolean;
}

export interface PaymentGateway {
  id?: number;
  enabled: boolean;
  test: boolean;
  live_secret_key: string;
  live_public_key: string;
  test_secret_key: string;
  test_public_key: string;
  provider: string;
}

export interface SEOSettings {
  id?: string;
  title: string;
  description: string;
  logoImage: string; // base64 blob
  favicon: string; // base64 blob
  catchPhrase: string;
}

export interface SMTPSettings {
  id?: number;
  host: string;
  port: number;
  username: string;
  password: string;
  senderEmail: string;
  timeZone?: string | null;
  enabled: boolean;
}

export interface SocialLink {
  id?: string;
  icon: string;
  link: string;
  name: string;
  enabled: boolean;
}

export type SettingsTypes =
  | SystemSettings
  | PaymentGateway
  | SEOSettings
  | SMTPSettings
  | SocialLink;

export type SettingsField =
  | keyof SystemSettings
  | keyof PaymentGateway
  | keyof SEOSettings
  | keyof SMTPSettings
  | keyof SocialLink;

export const settingsFieldMap: Record<string, SettingsField[]> = {
  "system": [
    "appName",
    "country",
    "countryCode",
    "currency",
    "maxDeposit",
    "minDeposit",
    "minWithdrawalBalance",
    "primaryColor",
    "onMaintenance",
    "withdrawalFee",
    "enabled",
  ],
  "payment-gateways": [
    "enabled",
    "test",
    "live_secret_key",
    "live_public_key",
    "test_secret_key",
    "test_public_key",
    "provider",
  ],
  "seo": ["title", "description", "logoImage", "favicon", "catchPhrase"],
  "smtp": ["host", "port", "username", "password", "senderEmail", "timeZone", "enabled"],
  "social-links": ["icon", "link", "name", "enabled"],
};

// Field type metadata
export type FieldType = "string" | "number" | "boolean" | "file";

export const fieldTypeMap: Record<string, Record<string, FieldType>> = {
  "system": {
    appName: "string",
    country: "string",
    countryCode: "string",
    currency: "string",
    maxDeposit: "number",
    minDeposit: "number",
    minWithdrawalBalance: "number",
    primaryColor: "string",
    onMaintenance: "boolean",
    withdrawalFee: "number",
    enabled: "boolean",
  },
  "payment-gateways": {
    enabled: "boolean",
    test: "boolean",
    live_secret_key: "string",
    live_public_key: "string",
    test_secret_key: "string",
    test_public_key: "string",
    provider: "string",
  },
  "seo": {
    title: "string",
    description: "string",
    logoImage: "file",
    favicon: "file",
    catchPhrase: "string",
  },
  "smtp": {
    host: "string",
    port: "number",
    username: "string",
    password: "string",
    senderEmail: "string",
    timeZone: "string",
    enabled: "boolean",
  },
  "social-links": {
    icon: "string",
    link: "string",
    name: "string",
    enabled: "boolean",
  },
};