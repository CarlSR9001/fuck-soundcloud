/**
 * DMCAFormClient Component
 *
 * Client-side form for submitting DMCA takedown notices.
 */

'use client';

import { useState } from 'react';

export function DMCAFormClient() {
  const [formData, setFormData] = useState({
    claimant_name: '',
    claimant_email: '',
    claimant_address: '',
    track_url: '',
    work_description: '',
    infringement_description: '',
    good_faith_statement: false,
    accuracy_statement: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.good_faith_statement || !formData.accuracy_statement) {
      setError('You must agree to both statements to submit a DMCA notice');
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit DMCA notice. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <h3 className="text-2xl font-bold text-neutral-900 mb-sm">DMCA Notice Submitted</h3>
        <p className="text-neutral-600">
          Your takedown notice has been received and will be reviewed within 24-48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-lg">
      <div className="grid md:grid-cols-2 gap-lg">
        <div>
          <label htmlFor="claimant_name" className="block text-sm font-medium text-neutral-700 mb-2">
            Full Name *
          </label>
          <input
            id="claimant_name"
            type="text"
            required
            value={formData.claimant_name}
            onChange={(e) => setFormData({ ...formData, claimant_name: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="claimant_email" className="block text-sm font-medium text-neutral-700 mb-2">
            Email Address *
          </label>
          <input
            id="claimant_email"
            type="email"
            required
            value={formData.claimant_email}
            onChange={(e) => setFormData({ ...formData, claimant_email: e.target.value })}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="claimant_address" className="block text-sm font-medium text-neutral-700 mb-2">
          Physical Address *
        </label>
        <textarea
          id="claimant_address"
          required
          rows={2}
          value={formData.claimant_address}
          onChange={(e) => setFormData({ ...formData, claimant_address: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="track_url" className="block text-sm font-medium text-neutral-700 mb-2">
          URL of Infringing Content *
        </label>
        <input
          id="track_url"
          type="url"
          required
          placeholder="https://..."
          value={formData.track_url}
          onChange={(e) => setFormData({ ...formData, track_url: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="work_description" className="block text-sm font-medium text-neutral-700 mb-2">
          Description of Copyrighted Work *
        </label>
        <textarea
          id="work_description"
          required
          rows={3}
          placeholder="Describe the original work that you own the copyright to..."
          value={formData.work_description}
          onChange={(e) => setFormData({ ...formData, work_description: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="infringement_description" className="block text-sm font-medium text-neutral-700 mb-2">
          Description of Infringement *
        </label>
        <textarea
          id="infringement_description"
          required
          rows={3}
          placeholder="Explain how the content infringes your copyright..."
          value={formData.infringement_description}
          onChange={(e) => setFormData({ ...formData, infringement_description: e.target.value })}
          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-md">
        <div className="flex items-start gap-3">
          <input
            id="good_faith"
            type="checkbox"
            required
            checked={formData.good_faith_statement}
            onChange={(e) => setFormData({ ...formData, good_faith_statement: e.target.checked })}
            className="mt-1 w-5 h-5 text-accent-600 border-neutral-300 rounded focus:ring-accent-500"
          />
          <label htmlFor="good_faith" className="text-sm text-neutral-700">
            I have a good faith belief that use of the material in the manner complained of is not authorized by the
            copyright owner, its agent, or the law. *
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="accuracy"
            type="checkbox"
            required
            checked={formData.accuracy_statement}
            onChange={(e) => setFormData({ ...formData, accuracy_statement: e.target.checked })}
            className="mt-1 w-5 h-5 text-accent-600 border-neutral-300 rounded focus:ring-accent-500"
          />
          <label htmlFor="accuracy" className="text-sm text-neutral-700">
            I declare, under penalty of perjury, that the information in this notification is accurate and that I am
            the copyright owner or authorized to act on behalf of the owner. *
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-6 bg-error text-white font-medium rounded-lg hover:bg-error/90 focus:ring-4 focus:ring-error/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSubmitting ? 'Submitting...' : 'Submit DMCA Takedown Notice'}
      </button>

      <p className="text-xs text-neutral-600 text-center">
        By submitting this form, you are making legal statements under penalty of perjury. False claims may result in legal liability.
      </p>
    </form>
  );
}
