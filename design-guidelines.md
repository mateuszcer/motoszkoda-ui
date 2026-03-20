# Autoceny Design System v5

## Colors

### Teal (Accent)
| Token | Hex | Usage |
|-------|-----|-------|
| `--teal-900` | `#0a3d2f` | Driver sidebar background |
| `--teal-800` | `#0d4f3c` | Dark accent hover |
| `--teal-700` | `#12664e` | Dark accent text |
| `--teal-600` | `#1a7a5e` | **Primary accent** (buttons, links, active states) |
| `--teal-500` | `#228b6b` | Lighter accent |
| `--teal-400` | `#3da882` | Subtle accent |
| `--teal-100` | `#d4f0e5` | Light tint backgrounds |
| `--teal-50`  | `#ecf8f3` | Lightest tint |

### Gray (Neutrals)
| Token | Hex | Usage |
|-------|-----|-------|
| `--gray-900` | `#1a1d21` | Primary text, shop sidebar bg |
| `--gray-700` | `#3e424a` | Secondary dark text |
| `--gray-600` | `#5a5f6b` | Body text |
| `--gray-500` | `#6e7482` | Muted text, labels |
| `--gray-400` | `#8b919d` | Placeholder text |
| `--gray-300` | `#c1c5cd` | Borders (secondary) |
| `--gray-200` | `#dfe1e6` | Borders (primary), card borders |
| `--gray-100` | `#eef0f3` | Subtle backgrounds, hover states |
| `--gray-50`  | `#f6f7f9` | Page background |

### Status Colors
| Color | Token | Usage |
|-------|-------|-------|
| Green | `--green-600` / `--green-50` | Success, active, open |
| Amber | `--amber-600` / `--amber-50` | Warning, in-progress |
| Red | `--red-600` / `--red-100` / `--red-50` | Error, danger, declined |
| Blue | `--blue-600` / `--blue-50` | Info, neutral highlight |

## Typography

- **DM Sans** for all app UI (body, buttons, headings, inputs)
- **Albert Sans** for landing page display headings ONLY
- **JetBrains Mono** for code/VIN/monospace contexts
- No italic anywhere
- No uppercase on buttons or headings (uppercase only for overline labels like section headers, table headers)

## Spacing

8pt grid: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `48px`, `64px`

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `6px` | Buttons, inputs, badges, small cards |
| `--radius-md` | `8px` | Cards, dropdowns, modals |
| `--radius-lg` | `12px` | Large containers |
| `--radius-full` | `999px` | Pills, avatars, toggle switches |

## Shadows

Minimal use. Cards use borders instead of shadows. Shadows reserved for:
- Elevated elements (dropdowns, modals): `--shadow-elevated`, `--shadow-modal`
- Active segmented control items: `--shadow-xs`
- Shadow tint: `rgba(27, 53, 51, ...)` (teal-tinted, not pure black)

## Layout

### Sidebar (authenticated screens)
- Width: `220px` (`--sidebar-width`)
- Driver: `--teal-900` background
- Shop/Admin: `--gray-900` background
- Nav items: 13px, 16x16 SVG icons, 6px radius hover/active states
- Active state: `rgba(255,255,255,0.12)` background, white text, weight 500
- Badge counts: pill with `rgba(255,255,255,0.15)` background
- Bottom: user avatar (28px circle) + name + email

### Topbar
- Height: `52px` (`--topbar-height`)
- White background, `0.5px` bottom border
- Breadcrumb with chevron separators OR page title
- Right: theme toggle, language picker, user avatar

### Content Area
- `padding: 24px` (16px on mobile)
- `background: --gray-50`
- `overflow-y: auto`

## Components

### Buttons
- Border-radius: `6px` (`--radius-sm`)
- Font: 13px, weight 500
- Min-height: 44px (touch target)
- `.btn-primary`: teal-600 bg, white text
- `.btn-secondary`: white bg, gray-300 border, gray-900 text
- `.btn-danger-outline`: white bg, red-100 border, red-600 text
- `.btn-ghost`: transparent, gray-600 text

### Cards
- `0.5px solid --gray-200` border
- `8px` border-radius (`--radius-md`)
- No shadow
- `.card-header`: 16px/20px padding, bottom border, flex between

### Badges
- Pill shape (10px radius)
- 11px font, weight 500
- Optional dot indicator (6px circle)
- Variants: `-green`, `-amber`, `-red`, `-blue`, `-gray`

### Data Tables
- Uppercase headers (11px, letter-spacing 0.5px)
- 0.5px row borders
- Hover: `--gray-50` background
- Cursor pointer on rows

### Tabs
- 2px bottom border on active
- Active: `--gray-900` text, `--teal-600` border
- Inactive: `--gray-500` text
- Optional count pill

### Toggle Switches
- 44x24px pill
- 20px circular knob
- Active: `--teal-600` background
- Inactive: `--gray-300` background

### Form Inputs
- 0.5px border, 6px radius
- 13px font
- Focus: `--teal-600` border

### Category Pills
- 6px radius
- Selected: teal-50 bg, teal-600 border

### Upload Zone
- 1.5px dashed border
- Hover: teal-600 border, teal-50 bg

## Mobile (< 768px)

- Sidebar: hidden by default, slides in as fixed overlay from left
- Backdrop overlay when sidebar open
- Hamburger button in topbar
- Content padding: 16px
- Tables: horizontal scroll
- Two-column grids: stack to single column
- Messages: list OR chat view (not both), back button to return

## Dark Mode

Via `[data-theme="dark"]` attribute on `<html>`. Gray scale inverts, teal/status tints darken.

## Accessibility

- Touch targets: minimum 44x44px
- All inputs must have `<label>`
- Focus-visible ring: `0 0 0 3px rgba(26, 122, 94, 0.2)`
- Respect `prefers-reduced-motion`
- ARIA labels on interactive icons
