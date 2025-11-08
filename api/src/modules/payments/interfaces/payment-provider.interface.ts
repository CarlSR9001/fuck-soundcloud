/**
 * Payment provider abstraction interface
 * Allows supporting multiple payment providers (Stripe, PayPal, etc.)
 */

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  client_secret?: string;
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  /**
   * Create a payment intent for a one-time contribution
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>,
  ): Promise<PaymentIntent>;

  /**
   * Retrieve a payment intent by ID
   */
  getPaymentIntent(intentId: string): Promise<PaymentIntent>;

  /**
   * Cancel a payment intent
   */
  cancelPaymentIntent(intentId: string): Promise<PaymentIntent>;

  /**
   * Confirm a payment intent (for server-side confirmation)
   */
  confirmPaymentIntent(intentId: string): Promise<PaymentIntent>;

  /**
   * Create a customer for recurring payments
   */
  createCustomer(
    email: string,
    metadata?: Record<string, any>,
  ): Promise<{ id: string }>;

  /**
   * Create a subscription for monthly contributions
   */
  createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, any>,
  ): Promise<{ id: string; status: string }>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Process a refund
   */
  refundPayment(
    intentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ id: string; status: string }>;
}
