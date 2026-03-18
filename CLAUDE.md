# Autoceny UI — Claude Code Instructions

## Project Overview

Car repair quote marketplace SPA with driver, shop, and admin portals.
Stack: React 19 + Vite 7 + TypeScript 5.9, pure CSS, i18next (PL/EN/DE), deployed on Vercel.

## IMPORTANT: Design Guidelines

**Always read `design-guidelines.md` before making any UI or styling changes.**
It defines the complete design system: colors, typography, spacing, components, shadows, radii, motion, dark mode, and accessibility rules. Key rules:

- One accent color only: brand teal `#007C7C` (`--mint-500`)
- Albert Sans for landing page headlines ONLY — never in app UI
- DM Sans for ALL app UI text and landing body/buttons
- No italic anywhere. No uppercase on buttons/headings (only overline labels)
- Cards: no visible borders, separation through shadow only
- Buttons: all pill-shaped (999px radius), one primary per viewport
- Page background: always `--neutral-50`, never pure white
- Shadow tint: `rgba(27,53,51,...)` not pure black
- Respect `prefers-reduced-motion`
- Touch targets: 44x44px minimum
- All inputs must have `<label>`

## Architecture

### Routing & Screens
- Custom router in `src/hooks/useRouting.ts` — maps URL paths to `AppScreen` type
- App.tsx is the root orchestrator: auth state, screen switching, request CRUD
- Screens rendered via conditional returns in App.tsx (not a router library)
- Screen types defined in `src/domain/types.ts`

### Component Patterns
- `AppHeader` — shared header component with `brandMark`, `onBrandClick`, `navSlot` props. Use this instead of writing inline `<header>` blocks
- `ErrorBoundary` — wrap route-level content and third-party integrations
- `BannerStack` — notification toasts, defined in App.tsx
- All route-level components are lazy-loaded via `React.lazy()` + `Suspense`
- Use `React.memo()` for stable leaf components that receive callbacks

### State Management
- Auth state lives in App.tsx (`useState<AuthState>`)
- Domain hooks: `useShopPortal`, `usePlan`, `usePlanCatalog`, `useRouting`
- Notification polling in App.tsx via `useEffect` + `setInterval`
- No global state library — props passed from App.tsx to screens

### File Organization
```
src/
  components/     # UI components (one per file, named export)
  domain/         # Types and constants
  hooks/          # Custom React hooks
  services/       # API clients (mock implementations)
  utils/          # Pure utility functions
  locales/        # i18n JSON files (en.json, pl.json, de.json)
```

## Code Conventions

### TypeScript
- Strict mode enabled, `noUnusedLocals`, `noUnusedParameters`
- Use `type` imports: `import type { Foo } from './types'`
- Only 1 `any` allowed (Leaflet marker workaround in LocationMap.tsx)
- Path alias: `@/` maps to `src/` (configured in tsconfig.app.json + vite.config.ts)

### React
- Named exports for components: `export function MyComponent()` or `export const MyComponent = memo(...)`
- No default exports except App.tsx
- Use `void` prefix for fire-and-forget async calls: `void loadData()`
- Prefer `null` returns over conditional rendering with `&&` (use ternary with `null`)
- `useCallback` for handlers passed as props, `useMemo` for derived data

### CSS
- Pure CSS, no framework. All app styles in `src/App.css` (~3800 lines)
- Landing page styles in `src/components/LandingPage.css` (prefixed with `lp-`)
- Design tokens defined as CSS custom properties in `:root`
- Z-index scale: `--z-banner: 50`, `--z-dropdown: 100`, `--z-overlay: 200`, `--z-modal: 300`, `--z-toast: 400`
- Utility classes available: `u-text-center`, `u-flex`, `u-flex-1`, `u-contents`, `u-w-full`, `u-mt-3`, `u-mt-4`, `u-text-muted`, `u-text-faint`, `u-gap-3`
- **Prefer CSS classes over inline `style={{}}` objects** — inline styles create new references every render
- Dark mode via `[data-theme="dark"]` attribute on `<html>`

### i18n
- All user-facing text must use `t('key')` from `react-i18next`
- Translation files: `src/locales/en.json`, `src/locales/pl.json`, `src/locales/de.json` (single source of truth; served by Vite plugin in dev, emitted to `dist/locales/` on build)
- **When adding or changing i18n keys, always update all three locale files (EN, PL, DE)**
- Landing page keys under `landing.*` namespace
- Never hardcode Polish, English, or German strings in components

### Testing
- Framework: Vitest + React Testing Library
- Test files: co-located as `*.test.ts` / `*.test.tsx` next to source
- Run: `npm test` (single run) or `npm run test:watch`
- Priority test targets: utils (pure functions), form validation, API mappers

### Formatting & Linting
- Prettier: no semicolons, single quotes, trailing commas, 120 char width
- ESLint: recommended + react-hooks + react-refresh rules
- Pre-commit: husky runs lint-staged (ESLint + Prettier on staged files)
- CI: GitHub Actions runs tsc, lint, format:check, test, build on PR

## Build & Deployment

- `npm run dev` — local dev server
- `npm run build` — TypeScript check + Vite production build
- `npm run lint` — ESLint check
- `npm run format` — Prettier format all src/
- `npm test` — run all tests
- Build outputs chunked: main bundle + lazy-loaded route chunks + vendor chunks (leaflet, stripe)
- Deployed on Vercel (environment variables set there, not in `.env`)

## Do NOT

- Commit `.env` files (they're gitignored; use `.env.example` for reference)
- Add inline `style={{}}` objects — use CSS classes or utility classes instead
- Duplicate header markup — use `<AppHeader>` component
- Import `leaflet/dist/leaflet.css` globally — it's co-located with `LocationMap.tsx`
- Use `any` type without explicit justification
- Skip error boundaries around lazy-loaded or third-party components
- Add new fonts or colors outside the design system
- Use borders on cards (use shadows for separation)
- Make full-width buttons on desktop
- Use italic or uppercase on buttons/headings
