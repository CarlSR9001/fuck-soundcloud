/**
 * UploadAttestation Component
 *
 * Attestation checkbox and verification fields for track uploads.
 * Users must attest under penalty of perjury that they own all rights.
 * Year 3035 aesthetic.
 */

'use client';

import { useState } from 'react';

export interface AttestationData {
  attestation: boolean;
  copyright_registration?: string;
  isrc_code?: string;
}

interface UploadAttestationProps {
  onChange: (data: AttestationData) => void;
  value: AttestationData;
  disabled?: boolean;
}

export function UploadAttestation({ onChange, value, disabled = false }: UploadAttestationProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleAttestationChange = (checked: boolean) => {
    onChange({ ...value, attestation: checked });
  };

  const handleCopyrightChange = (copyright_registration: string) => {
    onChange({ ...value, copyright_registration });
  };

  const handleISRCChange = (isrc_code: string) => {
    onChange({ ...value, isrc_code });
  };

  return (
    <div className="space-y-lg">
      {/* Required Attestation */}
      <div className="p-lg bg-warning/10 border-2 border-warning/30 rounded-xl">
        <div className="flex items-start gap-md">
          <input
            id="attestation"
            type="checkbox"
            required
            checked={value.attestation}
            onChange={(e) => handleAttestationChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 w-6 h-6 text-accent-600 border-neutral-400 rounded focus:ring-accent-500 focus:ring-offset-0"
          />
          <label htmlFor="attestation" className="flex-1">
            <div className="font-semibold text-neutral-900 mb-1">
              Upload Rights Attestation (Required)
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              I attest under penalty of perjury that:
            </p>
            <ul className="mt-2 text-sm text-neutral-700 space-y-1 list-disc list-inside ml-2">
              <li>I own all rights to this recording, or have explicit permission from all rights holders</li>
              <li>This recording does not infringe on any third-party copyrights, trademarks, or intellectual property</li>
              <li>I have the legal authority to upload and distribute this content</li>
              <li>I understand that false statements may result in legal action and account termination</li>
            </ul>
          </label>
        </div>

        {!value.attestation && (
          <div className="mt-md p-md bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error font-medium">
              You must attest to your ownership rights before uploading content.
            </p>
          </div>
        )}
      </div>

      {/* Optional Verification Fields */}
      <div>
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          disabled={disabled}
          className="flex items-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showOptionalFields ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Add Optional Verification Information
        </button>

        {showOptionalFields && (
          <div className="mt-md space-y-md">
            <div>
              <label htmlFor="copyright_registration" className="block text-sm font-medium text-neutral-700 mb-2">
                Copyright Registration Number
              </label>
              <input
                id="copyright_registration"
                type="text"
                placeholder="e.g., TXu 2-123-456"
                value={value.copyright_registration || ''}
                onChange={(e) => handleCopyrightChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                If you have registered this work with your country's copyright office
              </p>
            </div>

            <div>
              <label htmlFor="isrc_code" className="block text-sm font-medium text-neutral-700 mb-2">
                ISRC Code
              </label>
              <input
                id="isrc_code"
                type="text"
                placeholder="e.g., USRC17607839"
                value={value.isrc_code || ''}
                onChange={(e) => handleISRCChange(e.target.value)}
                disabled={disabled}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500">
                International Standard Recording Code for this specific recording
              </p>
            </div>

            <div className="p-md bg-accent-50 border border-accent-200 rounded-lg">
              <p className="text-sm text-accent-900">
                <strong>Optional but recommended:</strong> Providing verification information helps protect your work and
                strengthens your copyright claim in case of disputes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legal Notice */}
      <div className="p-md bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-xs text-neutral-600 leading-relaxed">
          By uploading content, you agree to our <a href="/terms" className="text-accent-600 hover:underline">Terms of Service</a> and{' '}
          <a href="/dmca" className="text-accent-600 hover:underline">DMCA Policy</a>. Submitting false attestation
          statements is perjury and may result in legal penalties, account termination, and civil liability.
        </p>
      </div>
    </div>
  );
}
