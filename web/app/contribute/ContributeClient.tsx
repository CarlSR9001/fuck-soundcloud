/**
 * ContributeClient Component
 *
 * Client-side contribution form with Stripe integration.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContributionForm } from '@/components/ContributionForm';
import { createContribution } from '@/lib/api';

export function ContributeClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleContribution = async (data: {
    amount_cents: number;
    artist_percentage: number;
    charity_percentage: number;
    platform_percentage: number;
    charity_id: string;
    recurring: boolean;
    payment_method_id: string;
  }) => {
    setIsLoading(true);

    try {
      // Get JWT token from localStorage/cookies (implementation depends on auth setup)
      const token = localStorage.getItem('auth_token') || '';

      if (!token) {
        throw new Error('Please log in to make a contribution');
      }

      // In a real implementation, this would first create a Stripe payment intent
      // and collect payment method details via Stripe Elements
      await createContribution(data, token);

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-xl">
        <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-md">
          <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-sm">Thank You!</h3>
        <p className="text-neutral-600">
          Your contribution has been processed. Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  return <ContributionForm onSubmit={handleContribution} isLoading={isLoading} />;
}
