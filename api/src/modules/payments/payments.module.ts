import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripePaymentProvider } from './providers/stripe.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'PAYMENT_PROVIDER',
      useClass: StripePaymentProvider,
    },
  ],
  exports: ['PAYMENT_PROVIDER'],
})
export class PaymentsModule {}
