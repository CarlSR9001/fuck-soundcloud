/**
 * Stripe payment provider implementation
 * Implements the PaymentProvider interface for Stripe
 */

import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider, PaymentIntent } from '../interfaces/payment-provider.interface';

@Injectable()
export class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, any>,
  ): Promise<PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return this.mapStripeIntent(intent);
    } catch (error) {
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  async getPaymentIntent(intentId: string): Promise<PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.retrieve(intentId);
      return this.mapStripeIntent(intent);
    } catch (error) {
      throw new BadRequestException(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  async cancelPaymentIntent(intentId: string): Promise<PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.cancel(intentId);
      return this.mapStripeIntent(intent);
    } catch (error) {
      throw new BadRequestException(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  async confirmPaymentIntent(intentId: string): Promise<PaymentIntent> {
    try {
      const intent = await this.stripe.paymentIntents.confirm(intentId);
      return this.mapStripeIntent(intent);
    } catch (error) {
      throw new BadRequestException(`Failed to confirm payment intent: ${error.message}`);
    }
  }

  async createCustomer(email: string, metadata?: Record<string, any>): Promise<{ id: string }> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: metadata || {},
      });
      return { id: customer.id };
    } catch (error) {
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, any>,
  ): Promise<{ id: string; status: string }> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: metadata || {},
      });
      return { id: subscription.id, status: subscription.status };
    } catch (error) {
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  async refundPayment(
    intentId: string,
    amount?: number,
    reason?: string,
  ): Promise<{ id: string; status: string }> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: intentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });
      return { id: refund.id, status: refund.status };
    } catch (error) {
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }

  private mapStripeIntent(intent: Stripe.PaymentIntent): PaymentIntent {
    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: this.mapStripeStatus(intent.status),
      client_secret: intent.client_secret,
      metadata: intent.metadata,
    };
  }

  private mapStripeStatus(
    status: Stripe.PaymentIntent.Status,
  ): 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
    switch (status) {
      case 'requires_payment_method':
      case 'requires_confirmation':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'succeeded';
      case 'canceled':
        return 'canceled';
      default:
        return 'failed';
    }
  }
}
