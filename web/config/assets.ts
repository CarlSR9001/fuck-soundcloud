/**
 * Brand Assets Configuration
 *
 * Centralized paths for logos, icons, and illustrations.
 * All assets should be placed in /public/brand/ directories.
 */

export const assets = {
  // Logo variants
  logos: {
    main: '/brand/logos/logo.svg',
    wordmark: '/brand/logos/wordmark.svg',
    icon: '/brand/logos/icon.svg',
    light: '/brand/logos/logo-light.svg',
    dark: '/brand/logos/logo-dark.svg',
  },

  // Icons
  icons: {
    favicon: '/brand/icons/favicon.ico',
    appleTouchIcon: '/brand/icons/apple-touch-icon.png',
    icon192: '/brand/icons/icon-192.png',
    icon512: '/brand/icons/icon-512.png',
  },

  // Illustrations
  illustrations: {
    hero: '/brand/illustrations/hero.svg',
    empty: '/brand/illustrations/empty.svg',
    notFound: '/brand/illustrations/404.svg',
  },

  // Open Graph / Social Media
  social: {
    ogImage: '/brand/og-image.png',
    twitterImage: '/brand/twitter-image.png',
  },

  // Placeholder images (for development)
  placeholders: {
    avatar: '/brand/placeholders/avatar.svg',
    cover: '/brand/placeholders/cover.svg',
    waveform: '/brand/placeholders/waveform.svg',
  },
} as const;

export type Assets = typeof assets;
