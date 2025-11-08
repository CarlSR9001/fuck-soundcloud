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
    <div className="space-y-4 sm:space-y-6">
      {/* Required Attestation */}
      <div className="p-3 sm:p-4 md:p-6 bg-warning/10 border-2 border-warning/30 rounded-lg sm:rounded-xl">
        <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
          <input
            id="attestation"
            type="checkbox"
            required
            checked={value.attestation}
            onChange={(e) => handleAttestationChange(e.target.checked)}
            disabled={disabled}
            className="mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6 text-accent-600 border-neutral-400 rounded focus:ring-accent-500 focus:ring-offset-0 flex-shrink-0"
          />
          <label htmlFor="attestation" className="flex-1 min-w-0">
            <div className="font-semibold text-neutral-900 mb-1 text-sm sm:text-base">
              Upload Rights Attestation (Required)
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              I attest under penalty of perjury that:
            </p>
            <ul className="mt-2 text-xs sm:text-sm text-neutral-700 space-y-1 list-disc list-inside ml-1 sm:ml-2">
              <li className="break-words">I own all rights to this recording, or have explicit permission from all rights holders</li>
              <li className="break-words">This recording does not infringe on any third-party copyrights, trademarks, or intellectual property</li>
              <li className="break-words">I have the legal authority to upload and distribute this content</li>
              <li className="break-words">I understand that false statements may result in legal action and account termination</li>
            </ul>
          </label>
        </div>

        {!value.attestation && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-xs sm:text-sm text-error font-medium">
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
          className="flex items-center gap-2 text-xs sm:text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showOptionalFields ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="break-words">Add Optional Verification Information</span>
        </button>

        {showOptionalFields && (
          <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="copyright_registration" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1 sm:mb-2">
                Copyright Registration Number
              </label>
              <input
                id="copyright_registration"
                type="text"
                placeholder="e.g., TXu 2-123-456"
                value={value.copyright_registration || ''}
                onChange={(e) => handleCopyrightChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500 break-words">
                If you have registered this work with your country's copyright office
              </p>
            </div>

            <div>
              <label htmlFor="isrc_code" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-1 sm:mb-2">
                ISRC Code
              </label>
              <input
                id="isrc_code"
                type="text"
                placeholder="e.g., USRC17607839"
                value={value.isrc_code || ''}
                onChange={(e) => handleISRCChange(e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:bg-neutral-50 disabled:text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-500 break-words">
                International Standard Recording Code for this specific recording
              </p>
            </div>

            <div className="p-2 sm:p-3 bg-accent-50 border border-accent-200 rounded-lg">
              <p className="text-xs sm:text-sm text-accent-900 break-words">
                <strong>Optional but recommended:</strong> Providing verification information helps protect your work and
                strengthens your copyright claim in case of disputes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legal Notice */}
      <div className="p-2 sm:p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-xs text-neutral-600 leading-relaxed break-words">
          By uploading content, you agree to our <a href="/terms" className="text-accent-600 hover:underline">Terms of Service</a> and{' '}
          <a href="/dmca" className="text-accent-600 hover:underline">DMCA Policy</a>. Submitting false attestation
          statements is perjury and may result in legal penalties, account termination, and civil liability.
        </p>
      </div>
    </div>
  );
}
