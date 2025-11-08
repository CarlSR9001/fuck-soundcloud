/**
 * Footer Component
 *
 * Site footer with branding and minimal information.
 * Spacious, clean layout.
 */

import { branding } from '@/config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surfaceAlt mt-auto">
      <div className="container-custom py-3xl">
        <div className="flex flex-col gap-xl">
          {/* Brand section */}
          {branding.features.showFooterBranding && (
            <div className="flex flex-col gap-md">
              <h3 className="text-xl font-semibold text-neutral-900">
                {branding.name}
              </h3>
              <p className="text-sm text-neutral-600 max-w-md">
                {branding.description}
              </p>
            </div>
          )}

          {/* Links section */}
          <div className="flex flex-col sm:flex-row gap-lg sm:gap-3xl">
            <div className="flex flex-col gap-sm">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Platform
              </h4>
              <a href="/health" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors">
                Health Check
              </a>
            </div>

            <div className="flex flex-col gap-sm">
              <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Contact
              </h4>
              <a
                href={`mailto:${branding.contact.email}`}
                className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                {branding.contact.email}
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-xl border-t border-border">
            <p className="text-xs text-neutral-500">
              © {currentYear} {branding.name}. Artist-first platform.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
