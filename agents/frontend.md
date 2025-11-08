# Frontend UX & Component Guidelines

**Purpose:** User experience requirements, component patterns, player specifications, and UI design guidelines.

**Prerequisites:**
- Read `architecture.md` for data models and media flow
- Read `api-specs.md` for endpoint integration
- Read `code-quality.md` for component size and modularity rules

---

## Design Philosophy

### Core Principles

**Year 3035 Aesthetic:**
- Timeless simplicity — future design is MORE minimal, not less
- Organic integration — technology so advanced it's invisible/natural
- Subtle sophistication — refinement over flash
- Material honesty — real textures, real physics, real lighting
- Human-centric — despite advancement, still designed for humans
- Calm confidence — no need to LOOK futuristic when you ARE the future

**What to AVOID:**
- Overused sci-fi clichés: "neural", "quantum", "cyber", "synth"
- Neon grids and wireframes
- Glitch effects and CRT aesthetics
- Matrix-style falling text
- Tron-like geometric patterns

**What to EMBRACE:**
- Clean sans-serifs with excellent readability
- Spacious layouts with intentional negative space
- Subtle animations — purposeful, never gratuitous
- Sophisticated palettes (earth-inspired or biomorphic colors)
- Iconography: clear, simple, timeless shapes
- Motion: smooth, physics-based, predictable
- Depth: subtle layering, translucency used sparingly

### Tone in Copy

- Direct and honest
- No tech buzzwords unless necessary
- Assume intelligence — don't over-explain
- Professional but approachable

---

## Page Structure

### Home Page

**Layout:**
```
┌─────────────────────────────────────┐
│ Header (Logo, Search, User Menu)    │
├─────────────────────────────────────┤
│ Hero (Latest Release)               │
│ [Large artwork + player preview]    │
├─────────────────────────────────────┤
│ Feed Controls (Filters, Sort)       │
├─────────────────────────────────────┤
│ Track Grid / List View              │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Track1│ │Track2│ │Track3│         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ Footer (Terms, Privacy, About)      │
└─────────────────────────────────────┘
```

**Components:**
- Hero section with featured track (auto-rotates or admin-curated)
- Quick filters: tag chips (electronic, ambient, rock, etc.)
- View toggle: grid vs list
- Sort options: recent, trending, most played

**Data loading:**
- Server-side render for SEO (Next.js SSR)
- Infinite scroll for feed (ISR + client-side fetch)
- Skeleton loaders during fetch

---

### Track Page

**Layout:**
```
┌─────────────────────────────────────┐
│ Track Header (Title, Artist)        │
├─────────────────────────────────────┤
│ Player Component                    │
│ ┌─────────────────────────────────┐ │
│ │ Waveform with comments          │ │
│ │ [====█===============]          │ │
│ │ ▶  0:45 / 3:24  [controls]     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Tabs: Details | Liner Notes | Stems│
├─────────────────────────────────────┤
│ Tab Content                         │
│ (Credits, Description, Stems)       │
├─────────────────────────────────────┤
│ Timestamped Comments                │
│ [List of comments with jump links]  │
├─────────────────────────────────────┤
│ Related Tracks                      │
└─────────────────────────────────────┘
```

**Components:**
- Large player (see Player Component section below)
- Version switcher (if multiple versions exist)
- Credits & roles (producer, mixer, etc.)
- Liner notes (Markdown with images)
- Stems panel (locked behind purchase/membership if enabled)
- Timestamped comments with jump-to-timestamp links
- Related tracks (same artist, same tags)

**Interactions:**
- Click waveform → seek to position
- Click comment timestamp → jump to position
- Version toggle → reload player with new version, preserve position
- Download button → request download (if enabled by artist)

---

### Profile Page

**Layout:**
```
┌─────────────────────────────────────┐
│ Banner Image                        │
├─────────────────────────────────────┤
│ Avatar   Artist Name                │
│          @handle                    │
│          [Follow Button]            │
├─────────────────────────────────────┤
│ Bio (Markdown)                      │
├─────────────────────────────────────┤
│ Stats: 42 tracks | 1.3K followers  │
├─────────────────────────────────────┤
│ Spotlight Tracks (up to 5)          │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Pin 1 │ │Pin 2 │ │Pin 3 │         │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ Discography Grid                    │
│ [All tracks, sorted by release]     │
├─────────────────────────────────────┤
│ Playlists                           │
│ [User's public playlists]           │
└─────────────────────────────────────┘
```

**Features:**
- Editable (if own profile): click to edit bio, upload banner/avatar
- Spotlight tracks: artist-curated "best of" (drag to reorder)
- Follow button: toggle follow status
- Discography: filterable by year, genre, visibility
- Social proof: follower count, total plays

---

### Upload Manager

**Layout:**
```
┌─────────────────────────────────────┐
│ Drop Zone (Drag & Drop)             │
│ "Drop audio files here or click"    │
├─────────────────────────────────────┤
│ Upload Queue                        │
│ ┌─────────────────────────────────┐ │
│ │ track.wav   [████████░░] 80%    │ │
│ │ Title: [My Track______]         │ │
│ │ Visibility: [Public  ▼]         │ │
│ │ Release: [Schedule ▼]           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ track2.flac [Pending...]        │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Upload All] [Clear Completed]      │
└─────────────────────────────────────┘
```

**Features:**
- Drag & drop multiple files
- Per-track settings (title, visibility, tags, release date)
- Progress bars with percentage
- Pause/resume uploads
- Error handling (invalid format, too large, rate limit)
- Schedule releases (future date picker)

**Validation:**
- Accepted formats: WAV, FLAC, MP3, AAC, OGG, M4A
- Max file size: 500MB
- Rate limit indicator: "3/10 uploads today (verified)"

---

## Player Component

### Technical Requirements

**Core Functionality:**
- HLS playback via Media Source Extensions (hls.js library)
- Fallback to progressive MP3 if HLS unsupported
- Adaptive bitrate switching (when multiple qualities available)
- Seamless format switching (Opus ↔ AAC ↔ ALAC)

**Waveform Features:**
- Visual waveform from JSON data (audiowaveform format)
- Scrubbing: click/drag to seek
- Zoom in/out (pinch on mobile, scroll on desktop)
- Timestamped markers for comments
- Loop A-B section (click A, click B, loops between)

**Playback Controls:**
- Play/pause (space bar)
- Seek forward/back (arrow keys, J/K/L)
- Speed adjustment (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- Volume control (M to mute, up/down arrows)
- Loudness normalization toggle (EBU R128)

**Advanced Features:**
- Version toggle (v1/v2/v3) with position preservation
- Download button (if enabled)
- Share button (copy link, embed code)
- Like/repost buttons

### Component Structure

```tsx
// components/Player/Player.tsx
export function Player({ track, version, onVersionChange }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // See implementation below
}

// Subcomponents (separate files):
// - PlayerControls.tsx (play, pause, seek, volume)
// - Waveform.tsx (canvas rendering, click handlers)
// - Timeline.tsx (timestamp, duration, progress bar)
// - CommentMarkers.tsx (timestamp markers on waveform)
// - VersionSelector.tsx (dropdown for alternate versions)
```

### Waveform Rendering

**Technology:** HTML5 Canvas

**Data format:**
```json
{
  "version": 2,
  "channels": 2,
  "sample_rate": 48000,
  "samples_per_pixel": 256,
  "bits": 8,
  "length": 240000,
  "data": [0, 45, 78, 120, 98, 67, ...]
}
```

**Rendering algorithm:**
```typescript
function drawWaveform(canvas: HTMLCanvasElement, waveformData: number[]) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const middle = height / 2;
  const barWidth = width / waveformData.length;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#4A90E2'; // Primary color

  waveformData.forEach((value, index) => {
    const barHeight = (value / 255) * middle;
    const x = index * barWidth;

    // Draw top half
    ctx.fillRect(x, middle - barHeight, barWidth - 1, barHeight);

    // Draw bottom half (mirror)
    ctx.fillRect(x, middle, barWidth - 1, barHeight);
  });
}
```

**Interactions:**
- Click waveform → seek to position
- Hover → show timestamp tooltip
- Drag → scrub playback

---

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| J | Seek back 10s |
| K | Play/Pause (alternate) |
| L | Seek forward 10s |
| ← | Seek back 5s |
| → | Seek forward 5s |
| ↑ | Volume up |
| ↓ | Volume down |
| M | Mute/unmute |
| [ | Decrease speed |
| ] | Increase speed |
| 0-9 | Seek to 0%-90% |

**Implementation:**
```typescript
useEffect(() => {
  function handleKeyPress(e: KeyboardEvent) {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'j':
      case 'ArrowLeft':
        seek(currentTime - 5);
        break;
      // ... etc
    }
  }

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentTime]);
```

---

## Embed Player

### Minimal Embed

**URL:** `https://your.site/embed/track/:id?theme=dark&autoplay=1`

**Features:**
- Minimal chrome (play button, waveform, title, artist)
- No social actions (comments/likes disabled)
- No navigation (can't browse to other pages)
- Responsive (works in any iframe size)

**Query parameters:**
- `theme`: dark|light (default: dark)
- `autoplay`: 0|1 (default: 0)
- `color`: hex color for accents (default: platform primary)

**Layout:**
```
┌────────────────────────────┐
│ ▶  Artist Name - Track    │
│ [====█===============]     │
│    1:23 / 3:45             │
└────────────────────────────┘
```

**Embed code (copy to clipboard):**
```html
<iframe
  src="https://your.site/embed/track/abc123"
  width="100%"
  height="166"
  frameborder="0"
  allow="autoplay"
></iframe>
```

**CORS headers:**
```typescript
// In embed route
res.setHeader('X-Frame-Options', 'ALLOWALL'); // Allow embedding
res.setHeader('Access-Control-Allow-Origin', '*'); // CORS-safe
```

---

## Accessibility (A11y)

### ARIA Labels

**Player controls:**
```tsx
<button
  aria-label={isPlaying ? 'Pause' : 'Play'}
  onClick={togglePlay}
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

<input
  type="range"
  aria-label="Volume"
  min="0"
  max="100"
  value={volume}
  onChange={(e) => setVolume(e.target.value)}
/>
```

**Waveform:**
```tsx
<canvas
  role="img"
  aria-label={`Waveform for ${track.title}`}
  onClick={handleWaveformClick}
/>
```

### Keyboard Navigation

- All interactive elements focusable with Tab
- Visual focus indicators (outline or shadow)
- Skip to main content link for screen readers
- Semantic HTML (nav, main, article, aside)

### High Contrast Mode

**CSS:**
```css
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000;
    --text-primary: #fff;
    --border: #fff;
  }
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  /* Stack layout, larger touch targets */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2-column grid */
}

/* Desktop */
@media (min-width: 1025px) {
  /* 3-column grid, sidebar */
}
```

### Mobile Optimizations

**Player:**
- Larger play button (64px min)
- Simplified controls (hide advanced features)
- Swipe gestures: left (prev track), right (next track)
- Fullscreen mode on landscape orientation

**Upload:**
- Native file picker on mobile (drag-drop disabled)
- Camera/microphone input for direct recording (future)

**Navigation:**
- Hamburger menu (collapsible)
- Bottom tab bar on mobile (Home, Search, Upload, Profile)

---

## Component Patterns

### Track Card

**Usage:** Home feed, profile grid, search results

```tsx
// components/TrackCard.tsx
export function TrackCard({ track }) {
  return (
    <div className="track-card">
      <img
        src={track.artwork.thumb_url}
        alt={`${track.title} artwork`}
        className="artwork"
      />
      <div className="info">
        <h3 className="title">{track.title}</h3>
        <p className="artist">{track.owner.display_name}</p>
        <div className="stats">
          <span>▶ {track.stats.plays}</span>
          <span>♥ {track.stats.likes}</span>
        </div>
      </div>
      <button
        className="play-button"
        onClick={() => playTrack(track.id)}
      >
        ▶
      </button>
    </div>
  );
}
```

**Responsive sizes:**
- Mobile: 1 column (full width)
- Tablet: 2 columns
- Desktop: 3-4 columns

---

### Comment Component

**Features:**
- Markdown rendering (safe HTML)
- Reply threading (1 level deep)
- Timestamp link (jumps to position in player)
- Like button
- Edit/delete (if owner)

```tsx
// components/Comment.tsx
export function Comment({ comment, onJumpTo }) {
  return (
    <div className="comment">
      <div className="header">
        <img src={comment.user.avatar_url} className="avatar" />
        <span className="username">{comment.user.handle}</span>
        <a
          href="#"
          className="timestamp"
          onClick={() => onJumpTo(comment.at_ms)}
        >
          {formatTime(comment.at_ms)}
        </a>
      </div>
      <div className="body">
        <Markdown>{comment.body_md}</Markdown>
      </div>
      <div className="actions">
        <button onClick={() => likeComment(comment.id)}>
          ♥ {comment.likes}
        </button>
        <button onClick={() => replyTo(comment.id)}>Reply</button>
      </div>
    </div>
  );
}
```

---

### Modal / Dialog

**Use cases:** Upload settings, delete confirmation, share dialog

```tsx
// components/Modal.tsx
export function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
```

**Accessibility:**
- Trap focus inside modal
- ESC key closes modal
- Return focus to trigger element on close

---

## State Management

### Client-side State

**Library:** React Context or Zustand (lightweight)

**Global state:**
- Current user (authenticated session)
- Current track (player state)
- Playback queue
- UI preferences (theme, volume)

```typescript
// store/player.ts
export const usePlayerStore = create((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  volume: 80,

  playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  seek: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
}));
```

### Server State

**Library:** React Query or SWR

**Pattern:** Fetch on mount, cache, revalidate on focus

```typescript
// hooks/useTrack.ts
export function useTrack(trackId: string) {
  return useQuery(['track', trackId], () =>
    fetch(`/api/v1/tracks/${trackId}`).then((res) => res.json())
  );
}
```

---

## Loading States

### Skeleton Loaders

**Pattern:** Show content shape while loading

```tsx
// components/TrackCardSkeleton.tsx
export function TrackCardSkeleton() {
  return (
    <div className="track-card skeleton">
      <div className="artwork skeleton-box" />
      <div className="info">
        <div className="title skeleton-text" />
        <div className="artist skeleton-text" />
      </div>
    </div>
  );
}
```

**CSS:**
```css
.skeleton-box {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Error States

### Error Boundaries

**Catch React errors:**
```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### API Errors

**Display user-friendly messages:**
```tsx
// components/TrackPage.tsx
const { data, error, isLoading } = useTrack(trackId);

if (isLoading) return <TrackSkeleton />;
if (error) {
  if (error.status === 404) {
    return <NotFound message="Track not found" />;
  }
  if (error.status === 403) {
    return <Forbidden message="This track is private" />;
  }
  return <Error message="Failed to load track" />;
}

return <Track data={data} />;
```

---

## Performance Optimization

### Code Splitting

**Split by route:**
```typescript
// app/layout.tsx
const HomePage = dynamic(() => import('./home/page'));
const TrackPage = dynamic(() => import('./tracks/[id]/page'));
const ProfilePage = dynamic(() => import('./users/[handle]/page'));
```

### Image Optimization

**Next.js Image component:**
```tsx
import Image from 'next/image';

<Image
  src={track.artwork.full_url}
  alt={track.title}
  width={1000}
  height={1000}
  placeholder="blur"
  blurDataURL={track.artwork.blur_url}
/>
```

### Lazy Loading

**Defer below-the-fold content:**
```tsx
const Comments = lazy(() => import('./Comments'));

<Suspense fallback={<CommentsSkeleton />}>
  <Comments trackId={trackId} />
</Suspense>
```

---

## Animation Guidelines

### Subtle Transitions

**Use sparingly:**
```css
.track-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.track-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

### Loading Spinners

**Simple spinner:**
```css
.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

**Avoid:**
- Excessive animations that distract
- Long animation durations (> 500ms)
- Animations that block interaction

---

## Theme System

### CSS Variables

```css
:root {
  --color-primary: #4A90E2;
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F5F5F5;
  --color-text-primary: #222222;
  --color-text-secondary: #666666;
  --border-radius: 8px;
  --spacing-unit: 8px;
}

[data-theme="dark"] {
  --color-bg-primary: #1A1A1A;
  --color-bg-secondary: #2A2A2A;
  --color-text-primary: #EFEFEF;
  --color-text-secondary: #AAAAAA;
}
```

### Theme Toggle

```tsx
// components/ThemeToggle.tsx
export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```
