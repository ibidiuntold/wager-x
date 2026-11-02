// services/paystackService.ts
interface PaystackResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
}

class PaystackService {
  private readonly baseUrl = "https://api.paystack.co";
  private readonly secretKey: string;

  constructor() {
    // Use server-side key for API routes
    this.secretKey =
      process.env.PAYSTACK_SECRET_KEY || process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || "";
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    data?: any
  ): Promise<PaystackResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }

  async createTransferRecipient(params: {
    name: string;
    account_number: string;
    bank_code: string;
    currency: string;
  }) {
    return this.makeRequest("/transferrecipient", "POST", params);
  }

  async initiateTransfer(params: {
    source: string;
    amount: number;
    recipient: string;
    reference: string;
    reason?: string;
  }) {
    return this.makeRequest("/transfer", "POST", params);
  }

  async verifyTransfer(transferCode: string) {
    return this.makeRequest(`/transfer/verify/${transferCode}`);
  }
}

export const paystackService = new PaystackService();
