/**
 * DashboardClient Component
 *
 * Client-side dashboard with contribution stats and history.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchContributionStats, ContributionStats } from '@/lib/api';
import { theme } from '@/config';

export function DashboardClient() {
  const [stats, setStats] = useState<ContributionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('auth_token') || '';
        if (!token) {
          setError('Please log in to view your dashboard');
          setIsLoading(false);
          return;
        }

        const data = await fetchContributionStats(token);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-4xl">
        <div className="animate-pulse space-y-lg">
          <div className="h-32 bg-neutral-200 rounded-xl max-w-md mx-auto"></div>
          <div className="h-64 bg-neutral-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4xl">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-md">
            <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-sm">Unable to Load Dashboard</h2>
          <p className="text-neutral-600 mb-lg">{error}</p>
          <Link
            href="/contribute"
            className="inline-block px-6 py-3 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 transition-colors"
          >
            Make a Contribution
          </Link>
        </div>
      </div>
    );
  }

  if (!stats || stats.contributions.length === 0) {
    return (
      <div className="text-center py-4xl">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-md">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-sm">No Contributions Yet</h2>
          <p className="text-neutral-600 mb-lg">
            Start supporting artists and causes you care about.
          </p>
          <Link
            href="/contribute"
            className="inline-block px-6 py-3 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 transition-colors"
          >
            Make Your First Contribution
          </Link>
        </div>
      </div>
    );
  }

  const totalAmount = (stats.total_contributed_cents / 100).toFixed(2);
  const charityTotal = (stats.charity_total_cents / 100).toFixed(2);
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-sm">Your Impact Dashboard</h1>
        <p className="text-lg text-neutral-600">Track your contributions and see the difference you're making.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-lg">
        <div className="p-lg bg-primary-50 rounded-xl border border-primary-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-primary-700 font-medium mb-1">Total Contributed</p>
              <p className="text-3xl font-bold text-primary-900">${totalAmount}</p>
            </div>
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-lg bg-accent-50 rounded-xl border border-accent-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-accent-700 font-medium mb-1">Artists Supported</p>
              <p className="text-3xl font-bold text-accent-900">{stats.artists_supported}</p>
              <p className="text-xs text-accent-600 mt-1">This month</p>
            </div>
            <div className="w-10 h-10 bg-accent-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-lg bg-neutral-100 rounded-xl border border-neutral-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-700 font-medium mb-1">Charity Contributions</p>
              <p className="text-3xl font-bold text-neutral-900">${charityTotal}</p>
            </div>
            <div className="w-10 h-10 bg-neutral-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Contributions */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-lg">Contribution History</h2>

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Split</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {stats.contributions.map((contribution) => {
                  const amount = (contribution.amount_cents / 100).toFixed(2);
                  const date = new Date(contribution.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr key={contribution.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-neutral-900">{date}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-neutral-900">${amount}</td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        <div className="flex gap-2">
                          <span style={{ color: theme.colors.primary[600] }}>
                            {contribution.artist_percentage}%
                          </span>
                          <span>/</span>
                          <span style={{ color: theme.colors.accent[600] }}>
                            {contribution.charity_percentage}%
                          </span>
                          <span>/</span>
                          <span className="text-neutral-600">
                            {contribution.platform_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contribution.recurring
                            ? 'bg-accent-100 text-accent-800'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}>
                          {contribution.recurring ? 'Monthly' : 'One-time'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          contribution.status === 'completed'
                            ? 'bg-accent-100 text-accent-800'
                            : contribution.status === 'pending'
                            ? 'bg-neutral-100 text-neutral-800'
                            : 'bg-error/10 text-error'
                        }`}>
                          {contribution.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center p-xl bg-gradient-to-br from-accent-50 to-primary-50 rounded-2xl border border-accent-200">
        <h3 className="text-2xl font-bold text-neutral-900 mb-sm">Keep Making an Impact</h3>
        <p className="text-neutral-600 mb-lg max-w-2xl mx-auto">
          Your support helps artists create, charities thrive, and the platform stay independent.
        </p>
        <Link
          href="/contribute"
          className="inline-block px-6 py-3 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 transition-colors"
        >
          Make Another Contribution
        </Link>
      </div>
    </div>
  );
}
