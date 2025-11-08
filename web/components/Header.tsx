/**
 * Header Component
 *
 * Main site header using modular branding.
 * Year 3035 aesthetic: minimal, spacious, calm.
 */

import Link from 'next/link';
import { branding } from '@/config';

export function Header() {
  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-md hover:opacity-80 transition-opacity">
            <span className="text-2xl font-semibold text-neutral-900">
              {branding.name}
            </span>
            {branding.features.showTaglineInHeader && (
              <span className="hidden sm:inline text-sm text-neutral-500 font-light">
                {branding.tagline}
              </span>
            )}
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-lg">
            <Link
              href="/contribute"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Contribute
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/terms"
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Terms
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
