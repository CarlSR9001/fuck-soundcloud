/**
 * ContributionForm Component
 *
 * Humble Bundle-style contribution slider with artist/charity/platform split.
 * Year 3035 aesthetic: clean, minimal, earth-inspired colors.
 */

'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/config';

interface ContributionFormProps {
  onSubmit: (data: {
    amount_cents: number;
    artist_percentage: number;
    charity_percentage: number;
    platform_percentage: number;
    charity_id: string;
    recurring: boolean;
    payment_method_id: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CHARITIES = [
  { id: 'eff', name: 'Electronic Frontier Foundation', mission: 'Digital rights and privacy' },
  { id: 'creativecommons', name: 'Creative Commons', mission: 'Open culture and free content' },
  { id: 'internetarchive', name: 'Internet Archive', mission: 'Digital library preservation' },
  { id: 'wikimedia', name: 'Wikimedia Foundation', mission: 'Free knowledge for everyone' },
];

export function ContributionForm({ onSubmit, isLoading = false }: ContributionFormProps) {
  const [amount, setAmount] = useState(5);
  const [artistPercent, setArtistPercent] = useState(80);
  const [charityPercent, setCharityPercent] = useState(10);
  const [platformPercent, setPlatformPercent] = useState(10);
  const [charityId, setCharityId] = useState(CHARITIES[0].id);
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState('');

  // Ensure percentages sum to 100
  const total = artistPercent + charityPercent + platformPercent;
  const isValid = total === 100 && amount >= 1 && amount <= 1000;

  // Auto-adjust platform percentage when artist or charity changes
  useEffect(() => {
    const newTotal = artistPercent + charityPercent;
    if (newTotal <= 100) {
      setPlatformPercent(100 - newTotal);
    }
  }, [artistPercent, charityPercent]);

  const handleSliderChange = (slider: 'artist' | 'charity' | 'platform', value: number) => {
    setError('');

    if (slider === 'artist') {
      setArtistPercent(value);
      const remaining = 100 - value;
      const charityShare = Math.min(charityPercent, remaining);
      setCharityPercent(charityShare);
      setPlatformPercent(remaining - charityShare);
    } else if (slider === 'charity') {
      setCharityPercent(value);
      const remaining = 100 - value;
      const artistShare = Math.min(artistPercent, remaining);
      setArtistPercent(artistShare);
      setPlatformPercent(remaining - artistShare);
    } else {
      setPlatformPercent(value);
      const remaining = 100 - value;
      const artistShare = Math.min(artistPercent, remaining);
      setArtistPercent(artistShare);
      setCharityPercent(remaining - artistShare);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError('Percentages must sum to 100% and amount must be between $1 and $1000');
      return;
    }

    try {
      // In a real implementation, this would integrate with Stripe
      await onSubmit({
        amount_cents: amount * 100,
        artist_percentage: artistPercent,
        charity_percentage: charityPercent,
        platform_percentage: platformPercent,
        charity_id: charityId,
        recurring,
        payment_method_id: 'placeholder', // Stripe payment method ID
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process contribution');
    }
  };

  const artistAmount = (amount * artistPercent / 100).toFixed(2);
  const charityAmount = (amount * charityPercent / 100).toFixed(2);
  const platformAmount = (amount * platformPercent / 100).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="space-y-xl">
      {/* Amount Input */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-neutral-700 mb-2">
          Contribution Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">$</span>
          <input
            id="amount"
            type="number"
            min="1"
            max="1000"
            step="1"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="mt-1 text-xs text-neutral-500">Between $1 and $1,000</p>
      </div>

      {/* Artist Slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-medium text-neutral-700">Artists</label>
          <span className="text-lg font-semibold" style={{ color: theme.colors.primary[600] }}>
            {artistPercent}% (${artistAmount})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={artistPercent}
          onChange={(e) => handleSliderChange('artist', Number(e.target.value))}
          className="slider slider-artist w-full"
        />
      </div>

      {/* Charity Selector */}
      <div>
        <label htmlFor="charity" className="block text-sm font-medium text-neutral-700 mb-2">
          Charity
        </label>
        <select
          id="charity"
          value={charityId}
          onChange={(e) => setCharityId(e.target.value)}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
        >
          {CHARITIES.map((charity) => (
            <option key={charity.id} value={charity.id}>
              {charity.name} – {charity.mission}
            </option>
          ))}
        </select>
      </div>

      {/* Charity Slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-medium text-neutral-700">Charity</label>
          <span className="text-lg font-semibold" style={{ color: theme.colors.accent[600] }}>
            {charityPercent}% (${charityAmount})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={charityPercent}
          onChange={(e) => handleSliderChange('charity', Number(e.target.value))}
          className="slider slider-charity w-full"
        />
      </div>

      {/* Platform Slider */}
      <div>
        <div className="flex justify-between items-baseline mb-2">
          <label className="text-sm font-medium text-neutral-700">Platform</label>
          <span className="text-lg font-semibold text-neutral-600">
            {platformPercent}% (${platformAmount})
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={platformPercent}
          onChange={(e) => handleSliderChange('platform', Number(e.target.value))}
          className="slider slider-platform w-full"
        />
      </div>

      {/* Validation Indicator */}
      <div className={`p-4 rounded-lg ${isValid ? 'bg-accent-50 border border-accent-200' : 'bg-neutral-100 border border-neutral-300'}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-neutral-700">Total</span>
          <span className={`text-lg font-bold ${isValid ? 'text-accent-600' : 'text-error'}`}>
            {total}%
          </span>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="text-sm text-neutral-700">
          Your <span className="font-semibold">${amount.toFixed(2)}</span> contribution will be split:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-neutral-600">
          <li><span className="font-medium" style={{ color: theme.colors.primary[600] }}>${artistAmount}</span> to artists</li>
          <li><span className="font-medium" style={{ color: theme.colors.accent[600] }}>${charityAmount}</span> to {CHARITIES.find(c => c.id === charityId)?.name}</li>
          <li><span className="font-medium text-neutral-700">${platformAmount}</span> to platform</li>
        </ul>
      </div>

      {/* Recurring Toggle */}
      <div className="flex items-center gap-3">
        <input
          id="recurring"
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="w-5 h-5 text-accent-600 border-neutral-300 rounded focus:ring-accent-500"
        />
        <label htmlFor="recurring" className="text-sm text-neutral-700">
          Make this a monthly contribution
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full py-3 px-6 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 focus:ring-4 focus:ring-accent-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? 'Processing...' : recurring ? 'Start Monthly Contribution' : 'Contribute Now'}
      </button>

      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: ${theme.colors.neutral[200]};
          outline: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: all 150ms ease;
        }

        .slider-artist::-webkit-slider-thumb {
          background: ${theme.colors.primary[600]};
        }
        .slider-artist::-moz-range-thumb {
          background: ${theme.colors.primary[600]};
        }

        .slider-charity::-webkit-slider-thumb {
          background: ${theme.colors.accent[600]};
        }
        .slider-charity::-moz-range-thumb {
          background: ${theme.colors.accent[600]};
        }

        .slider-platform::-webkit-slider-thumb {
          background: ${theme.colors.neutral[600]};
        }
        .slider-platform::-moz-range-thumb {
          background: ${theme.colors.neutral[600]};
        }

        .slider:hover::-webkit-slider-thumb {
          transform: scale(1.2);
        }
        .slider:hover::-moz-range-thumb {
          transform: scale(1.2);
        }
      `}</style>
    </form>
  );
}
