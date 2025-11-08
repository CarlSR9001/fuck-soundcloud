/**
 * Visual Theme Configuration
 *
 * Year 3035 aesthetic: timeless simplicity, subtle sophistication.
 * No sci-fi clichés. Calm confidence. Material honesty.
 */

export const theme = {
  // Color Palette - Sophisticated, earth-inspired
  colors: {
    // Primary - Deep, grounded tones
    primary: {
      50: '#f5f3f0',
      100: '#e8e4de',
      200: '#d1c9bd',
      300: '#b9ae9c',
      400: '#a1937b',
      500: '#89785a', // Main primary
      600: '#6e6048',
      700: '#534836',
      800: '#383024',
      900: '#1d1812',
    },

    // Neutral - Clean, spacious
    neutral: {
      50: '#fafaf9',
      100: '#f5f5f4',
      200: '#e7e5e4',
      300: '#d6d3d1',
      400: '#a8a29e',
      500: '#78716c',
      600: '#57534e',
      700: '#44403c',
      800: '#292524',
      900: '#1c1917',
      950: '#0c0a09',
    },

    // Accent - Subtle highlights
    accent: {
      50: '#f0f9f4',
      100: '#dcf2e4',
      200: '#bae5cd',
      300: '#89d1ac',
      400: '#56b887',
      500: '#349e6a', // Main accent
      600: '#267f55',
      700: '#206646',
      800: '#1d5139',
      900: '#194330',
    },

    // Semantic colors
    success: '#349e6a',
    warning: '#ea9833',
    error: '#dc2626',
    info: '#3b82f6',

    // Surface colors
    background: '#fafaf9',
    surface: '#ffffff',
    surfaceAlt: '#f5f5f4',
    border: '#e7e5e4',
  },

  // Typography - Clean, highly readable
  typography: {
    fonts: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },

    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
      '7xl': '4.5rem',  // 72px
    },

    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
  },

  // Spacing - Generous, intentional negative space
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
    '5xl': '8rem',   // 128px
  },

  // Border Radius - Subtle, refined
  radius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  // Shadows - Subtle depth
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Animation - Smooth, physics-based, purposeful
  animation: {
    durations: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easings: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Layout
  layout: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: '1280px',
  },
} as const;

export type Theme = typeof theme;
