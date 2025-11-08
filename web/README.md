# Resonance Web Application

Next.js 15 web application for the self-hosted music platform.

## M0 Bootstrap

This is the initial web application skeleton featuring:

- ✅ Next.js 15 with App Router
- ✅ TypeScript configuration
- ✅ Tailwind CSS with year 3035 aesthetic
- ✅ Modular branding system
- ✅ Basic layout components
- ✅ Home and health check pages

## Branding System

All branding elements are modular and centralized:

### Configuration Files

- **`config/branding.ts`** - Brand name, tagline, metadata
- **`config/theme.ts`** - Colors, typography, spacing (year 3035 aesthetic)
- **`config/assets.ts`** - Logo paths, icons, illustrations

### Asset Structure

```
public/brand/
├── logos/          # Logo variants (SVG preferred)
├── icons/          # Brand-specific icons
├── illustrations/  # Custom artwork
└── fonts/          # Custom typefaces
```

## Year 3035 Aesthetic

**What we embrace:**
- Timeless simplicity
- Spacious layouts with intentional negative space
- Subtle sophistication
- Clean sans-serifs with excellent readability
- Calm confidence
- Material honesty

**What we avoid:**
- Sci-fi clichés (no "neural", "quantum", "cyber")
- Neon grids and wireframes
- Glitch effects
- Over-the-top futurism

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## File Organization

```
web/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── globals.css     # Global styles
│   └── health/         # Health check page
├── components/         # Reusable components
│   ├── Header.tsx      # Site header
│   ├── Footer.tsx      # Site footer
│   └── Container.tsx   # Content container
├── config/             # Branding configuration
│   ├── branding.ts     # Brand identity
│   ├── theme.ts        # Visual theme
│   └── assets.ts       # Asset paths
├── lib/                # Utilities and helpers
└── public/             # Static assets
    └── brand/          # Brand-specific assets
```

## Modularity Guidelines

Following §21 of agents.md:

- **Keep files small** - Components under 200 lines
- **Split functionality** - Separate concerns into different files
- **Use barrel exports** - Clean import paths via index.ts
- **One responsibility** - Each file has a single, clear purpose

## Next Steps (M1)

- Connect to NestJS API
- Implement authentication flow
- Add upload interface
- Create player component
- Add waveform visualization

## Architecture

This web app will communicate with:
- **API** (NestJS) - REST endpoints for all business logic
- **WebSocket** - Real-time updates for transcoding jobs
- **Nginx** - Serves static assets and proxies API requests
