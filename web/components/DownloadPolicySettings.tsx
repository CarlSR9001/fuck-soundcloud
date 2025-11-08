'use client';

import { useState } from 'react';

interface DownloadPolicySettingsProps {
  trackId: string;
  currentPolicy: 'disabled' | 'lossy' | 'original' | 'stems_included';
  currentPrice?: number | null;
  hasAttestation: boolean;
  onUpdate: () => void;
}

/**
 * Download Policy Settings Component
 * Allows track owners to configure download settings
 */
export function DownloadPolicySettings({
  trackId,
  currentPolicy,
  currentPrice,
  hasAttestation,
  onUpdate,
}: DownloadPolicySettingsProps) {
  const [policy, setPolicy] = useState(currentPolicy);
  const [price, setPrice] = useState(currentPrice || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/tracks/${trackId}/downloads/policy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          download_policy: policy,
          download_price_cents: price > 0 ? price : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update policy');
      onUpdate();
    } catch (error) {
      alert('Failed to update download policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-background-800 border border-accent-500/30 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-accent-400">Download Policy</h3>

      {!hasAttestation && (
        <div className="bg-warning-900/30 border border-warning-500/50 rounded p-3 text-warning-300 text-sm">
          ⚠ Copyright attestation required to enable downloads
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="policy"
            value="disabled"
            checked={policy === 'disabled'}
            onChange={(e) => setPolicy(e.target.value as any)}
            className="mt-1"
          />
          <div>
            <div className="font-semibold text-accent-300">Disabled</div>
            <div className="text-sm text-gray-400">No downloads allowed</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="policy"
            value="lossy"
            checked={policy === 'lossy'}
            onChange={(e) => setPolicy(e.target.value as any)}
            disabled={!hasAttestation}
            className="mt-1"
          />
          <div>
            <div className="font-semibold text-accent-300">Lossy (320kbps MP3)</div>
            <div className="text-sm text-gray-400">High-quality compressed download</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="radio"
            name="policy"
            value="original"
            checked={policy === 'original'}
            onChange={(e) => setPolicy(e.target.value as any)}
            disabled={!hasAttestation}
            className="mt-1"
          />
          <div>
            <div className="font-semibold text-accent-300">Original Quality</div>
            <div className="text-sm text-gray-400">Full lossless download</div>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer opacity-50">
          <input
            type="radio"
            name="policy"
            value="stems_included"
            disabled
            className="mt-1"
          />
          <div>
            <div className="font-semibold text-accent-300">Stems Included</div>
            <div className="text-sm text-gray-400">Coming soon</div>
          </div>
        </label>
      </div>

      {policy !== 'disabled' && (
        <div className="pt-2">
          <label className="block text-sm text-gray-300 mb-2">
            Price (optional, 0 = free)
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={price}
            onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-background-900 border border-accent-500/30 rounded text-white"
            placeholder="0"
          />
          <div className="text-xs text-gray-400 mt-1">Price in cents (100 = $1.00)</div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !hasAttestation}
        className="w-full py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition"
      >
        {saving ? 'Saving...' : 'Save Policy'}
      </button>
    </div>
  );
}
