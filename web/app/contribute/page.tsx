/**
 * Contribute Page
 *
 * Allows users to contribute to artists, charities, and platform.
 * Humble Bundle-style contribution sliders with Stripe payment integration.
 * Year 3035 aesthetic.
 */

import { Metadata } from 'next';
import { branding } from '@/config';
import { Container } from '@/components';
import { ContributeClient } from './ContributeClient';

export const metadata: Metadata = {
  title: `Contribute – ${branding.name}`,
  description: 'Support artists, charities, and the platform with flexible contribution options.',
};

export default async function ContributePage() {
  return (
    <Container size="md">
      <div className="py-xl space-y-xl">
        {/* Header */}
        <div className="text-center space-y-md">
          <h1 className="text-4xl font-bold text-neutral-900">
            Support the Music Ecosystem
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Your contribution directly supports artists, funds important causes, and helps keep the platform running.
            Choose how to split your contribution.
          </p>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-lg">
          <div className="p-lg bg-primary-50 rounded-xl border border-primary-200">
            <div className="w-12 h-12 bg-primary-600 rounded-lg mb-md flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-sm">Support Artists</h3>
            <p className="text-sm text-neutral-600">
              Your contribution goes directly to the artists you listen to, helping them create more music.
            </p>
          </div>

          <div className="p-lg bg-accent-50 rounded-xl border border-accent-200">
            <div className="w-12 h-12 bg-accent-600 rounded-lg mb-md flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-sm">Fund Causes</h3>
            <p className="text-sm text-neutral-600">
              Choose from vetted charities working on digital rights, open culture, and knowledge preservation.
            </p>
          </div>

          <div className="p-lg bg-neutral-100 rounded-xl border border-neutral-300">
            <div className="w-12 h-12 bg-neutral-600 rounded-lg mb-md flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-sm">Sustain Platform</h3>
            <p className="text-sm text-neutral-600">
              Help cover server costs, development, and infrastructure to keep this platform independent and ad-free.
            </p>
          </div>
        </div>

        {/* Contribution Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-lg p-xl">
            <ContributeClient />
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto space-y-lg pt-xl">
          <h2 className="text-2xl font-bold text-neutral-900">Frequently Asked Questions</h2>

          <div className="space-y-md">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-sm">
                How are contributions distributed?
              </h3>
              <p className="text-neutral-600">
                Your contribution is split according to the percentages you set. Artists receive their share based on
                your listening history. Charity contributions go directly to the selected organization.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-sm">
                Can I change my contribution split?
              </h3>
              <p className="text-neutral-600">
                Yes! Adjust the sliders however you like. You control exactly where your money goes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-sm">
                Is my payment secure?
              </h3>
              <p className="text-neutral-600">
                All payments are processed securely through Stripe. We never store your credit card information.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-sm">
                Can I cancel my monthly contribution?
              </h3>
              <p className="text-neutral-600">
                Absolutely. You can cancel anytime from your dashboard with no questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
