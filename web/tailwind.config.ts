import type { Config } from 'tailwindcss';
import { theme } from './config/theme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: theme.colors.primary,
        neutral: theme.colors.neutral,
        accent: theme.colors.accent,
        success: theme.colors.success,
        warning: theme.colors.warning,
        error: theme.colors.error,
        info: theme.colors.info,
        background: theme.colors.background,
        surface: theme.colors.surface,
        surfaceAlt: theme.colors.surfaceAlt,
        border: theme.colors.border,
      },
      fontFamily: {
        sans: theme.typography.fonts.sans.split(', '),
        mono: theme.typography.fonts.mono.split(', '),
      },
      fontSize: theme.typography.sizes,
      fontWeight: theme.typography.weights,
      lineHeight: theme.typography.lineHeights,
      spacing: theme.spacing,
      borderRadius: theme.radius,
      boxShadow: theme.shadows,
      maxWidth: theme.layout.maxWidth,
      transitionDuration: theme.animation.durations,
      transitionTimingFunction: theme.animation.easings,
    },
  },
  plugins: [],
};

export default config;
