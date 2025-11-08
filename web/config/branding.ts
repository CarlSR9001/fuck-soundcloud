/**
 * Brand Identity Configuration
 *
 * All brand-specific text, metadata, and identity elements.
 * Change these values to rebrand the platform without touching code.
 */

export const branding = {
  // Core Identity
  name: 'Resonance',
  tagline: 'Your music. Your platform. Your rules.',

  // Metadata
  description: 'A self-hosted music platform that puts artists first. Upload, share, and monetize your music on infrastructure you control.',

  // SEO & Social
  keywords: [
    'music platform',
    'self-hosted',
    'artist-first',
    'music streaming',
    'independent artists',
  ],

  // OpenGraph defaults
  og: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Resonance',
  },

  // Twitter Card defaults
  twitter: {
    card: 'summary_large_image',
    site: '@resonance', // Update with actual handle
  },

  // Contact & Legal
  contact: {
    email: 'hello@resonance.audio',
    support: 'support@resonance.audio',
  },

  // Feature toggles for branding
  features: {
    showTaglineInHeader: true,
    showFooterBranding: true,
  },
} as const;

export type Branding = typeof branding;
