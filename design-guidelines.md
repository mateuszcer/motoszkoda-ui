# Autoceny Design System
## Version 4.0 — Updated Landing Page Standards

Complete UI guidelines for all screens, all components, and future development.

---

## 1. Design Philosophy

Car repair is stressful. Our UI counteracts that with calm confidence — geometric precision, cool mint accents, generous space, quiet authority. Scandinavian functionalism: every element is intentional, nothing is decorative.

**Core rules:** One accent color (mint). Remove before adding. Space is free — use lots of it.

---

## 2. Colors

```css
:root {
  /* ── Accent Mint ── */
  --mint-700: #36A07A;
  --mint-600: #4CB890;
  --mint-500: #6ECFAB;          /* Primary accent */
  --mint-400: #8DDBC0;
  --mint-300: #B0E8D4;
  --mint-200: #D4F3E8;
  --mint-100: #EAF9F2;
  --mint-50:  #F3FCF8;

  /* ── Dark Teal ── */
  --teal-900: #0C1B19;
  --teal-800: #122623;
  --teal-700: #1B3533;          /* Primary dark (app UI) */
  --teal-600: #213F3C;
  --teal-500: #2D524E;

  /* ── Warm Neutrals ── */
  --neutral-950: #191C1A;
  --neutral-900: #252825;       /* Headings (app UI) */
  --neutral-800: #363936;
  --neutral-700: #4D504D;       /* Body text */
  --neutral-600: #656965;       /* Secondary text */
  --neutral-500: #868A86;       /* Placeholder */
  --neutral-400: #A5A9A5;       /* Disabled */
  --neutral-300: #C2C5C2;       /* Borders */
  --neutral-200: #DCDEDD;       /* Subtle dividers */
  --neutral-100: #EDEEED;       /* Input bg */
  --neutral-75:  #F2F3F2;       /* Alternate bg */
  --neutral-50:  #F5F5F3;       /* Page bg */
  --white:       #FFFFFF;        /* Cards */

  /* ── Semantic ── */
  --success-600: #2D7A56;  --success-100: #E6F4ED;
  --warning-600: #8B6914;  --warning-100: #FDF6E3;
  --error-600:   #B3261E;  --error-100:   #FDECEA;
}
```

### Landing Page Color Overrides

The landing page uses slightly adjusted values for better contrast on dark backgrounds:

| Token | App Value | Landing Value | Why |
|-------|-----------|---------------|-----|
| Hero background | `--teal-700` (#1B3533) | `#0A4945` | Slightly lighter, more vibrant teal for hero sections |
| Headline color | — | `#8DE8C4` (mint-head) | Brighter mint for headlines on dark bg, distinct from accent mint |
| Body text | `--neutral-900` (#252825) | `#333633` | Slightly lighter for softer feel on light sections |

### Rules

- Page background: always `--neutral-50`. Never pure white.
- Card surfaces: `--white`. Separation through shadow, not borders.
- One accent only. No gold. No blue. No second green. Workshops and drivers share the same color palette.
- Shadow tint: `rgba(27,53,51,...)` not pure black.

---

## 3. Typography

### Fonts

```css
:root {
  --font-display: 'Albert Sans', sans-serif;
  --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

### Where Each Font Lives

**Albert Sans** — Marketing/landing page headlines ONLY. Never in app UI. Replaced Josefin Sans for better character shapes (especially "z") and more confident weight at 700.

**DM Sans** — ALL app UI (nav, titles, forms, body, buttons, badges) + landing page body/nav/buttons.

**JetBrains Mono** — VIN numbers, license plates, technical codes.

### Font Weights — Landing Page

Landing page uses heavier weights than originally planned. The design feels more confident and authoritative with bolder text. All weights were bumped +100 from the original spec:

| Context | Font | Weight | Why |
|---------|------|--------|-----|
| Hero headline | Albert Sans | **700 (Bold)** | Confident, solid stroke — the focal point |
| Section headings (features, why, pricing, FAQ) | Albert Sans | **600 (SemiBold)** | One step lighter for hierarchy |
| Bottom CTA headline | Albert Sans | **700 (Bold)** | Same emphasis as hero |
| Hero subtitle | DM Sans | **500 (Medium)** | Readable but not wispy on dark bg |
| Section body text | DM Sans | **500 (Medium)** | Matches subtitle weight for consistency |
| Overline labels | DM Sans | **600 (SemiBold)** | Stays the same (already bold enough) |
| Buttons | DM Sans | **600 (SemiBold)** | Stays the same |
| FAQ questions | DM Sans | **700 (Bold)** | Stand out as clickable |
| FAQ answers | DM Sans | **500 (Medium)** | Comfortable reading weight |
| Pricing card descriptions | DM Sans | **500 (Medium)** | Matches body weight |
| Pricing feature list items | DM Sans | **500 (Medium)** | Matches body weight |
| Why section item titles | DM Sans | **700 (Bold)** | Clear benefit names |
| Why section item descriptions | DM Sans | **500 (Medium)** | Matches body weight |

### Font Weights — App UI (unchanged)

| Context | DM Sans Weight |
|---------|---------------|
| Page titles (28px) | 700 |
| Card titles (22px) | 600 |
| Section headers (18px) | 600 |
| Field group labels (16px) | 600 |
| Field labels (14px) | 500 |
| Body text (16px) | 400 |
| Buttons | 600 |
| Badges | 600 |
| Overline labels | 600 |

### Type Scale — App UI

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `page-title` | 28px | 700 | 1.25 | "Nowe zlecenie", car names |
| `card-title` | 22px | 600 | 1.3 | Card headers |
| `section-header` | 18px | 600 | 1.4 | Sub-sections |
| `field-group` | 16px | 600 | 1.4 | "Dane pojazdu" |
| `field-label` | 14px | 500 | 1.4 | Form labels |
| `body` | 16px | 400 | 1.6 | Primary body |
| `body-sm` | 15px | 400 | 1.6 | Secondary |
| `body-xs` | 14px | 400 | 1.6 | Metadata |
| `caption` | 13px | 400 | 1.5 | Timestamps |
| `overline` | 12px | 600 | 1.4 | Uppercased labels |
| `badge` | 11px | 600 | 1 | Status badges |
| `price-lg` | 28px | 700 | 1.1 | Main prices |
| `price-sm` | 16px | 600 | 1.3 | Line item prices |
| `mono` | 14px | 400 | 1.4 | VIN/plates |

### Type Scale — Landing Page

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `hero-title` | Albert Sans | clamp(48px, 5.2vw, 72px) | **700** | Hero headline |
| `section-title` | Albert Sans | clamp(28px, 3.2vw, 42px) | **600** | Section headings |
| `cta-title` | Albert Sans | clamp(28px, 3.5vw, 44px) | **700** | Bottom CTA |
| `overline` | DM Sans | 11px | 600 | "DLA KIEROWCÓW" |
| `body-large` | DM Sans | 16px | 500 | Descriptions |
| `body-section` | DM Sans | 15px | 500 | Feature/pricing body |
| `btn-text` | DM Sans | 15px | 600 | Buttons |
| `nav-link` | DM Sans | 14px | 500 | Navigation |
| `trust-value` | DM Sans | 20px | 700 | Trust bar numbers |
| `trust-label` | DM Sans | 11px | 500 | Trust bar labels |

### Typography Rules

- No italic anywhere. Not on landing page, not in app.
- Uppercase for overline labels only.
- Buttons: sentence case always.
- Prices: `font-variant-numeric: tabular-nums`.
- Max body text line: ~60 characters. Enforce with max-width.
- Hero headline: ALL ONE COLOR (`#8DE8C4`). No highlighting words.

---

## 4. Spacing

```css
:root {
  --space-1: 4px;    --space-2: 8px;    --space-3: 12px;
  --space-4: 16px;   --space-5: 20px;   --space-6: 24px;
  --space-8: 32px;   --space-10: 40px;  --space-12: 48px;
  --space-16: 64px;  --space-20: 80px;
}
```

### Layout

```css
:root {
  --page-max: 720px;           /* App content */
  --page-wide: 1040px;         /* Dashboard */
  --landing-max: 1140px;       /* Landing page */
  --nav-height: 64px;
  --section-pad: clamp(80px, 10vw, 140px);
}
```

### App Vertical Rhythm

| Between | Spacing |
|---------|---------|
| Nav → content | 40px |
| Title → card | 24px |
| Between cards | 20px |
| Between form fields | 20px |
| Sections within card | 32px |
| Card padding | 24px |
| Content → page bottom | 64px |

---

## 5. Components

### 5.1 Navigation Bar

**App nav:**
```
Height: 64px, fixed, --teal-800 bg
Shadow: 0 1px 0 rgba(0,0,0,0.06)
```

**Landing nav:**
```
Height: 64px, fixed, white bg
Shadow: 0 1px 0 rgba(0,0,0,0.06), deepens to 0 1px 4px rgba(0,0,0,0.08) on scroll
```

Landing nav uses dark text on white:
- Logo badge: `--teal-700` bg with mint text
- Wordmark: `--teal-900` color, DM Sans 17px/600
- Links: DM Sans 14px/500, `--neutral-500` color, hover `--teal-900`
- Primary CTA: `--teal-700` bg, white text (pill)
- Secondary CTA: outline pill, `--neutral-200` border, `--neutral-500` text

### 5.2 Buttons

**Sizes:**

| Size | Height | Padding X | Font |
|------|--------|-----------|------|
| Large | 52px | 28px | 16px/600 |
| Medium | 44px | 24px | 15px/600 |
| Small | 36px | 16px | 14px/500 |
| Compact | 32px | 12px | 13px/500 |

**Variants:**

| Variant | BG | Text | Border |
|---------|-----|------|--------|
| Primary | `--teal-700` | white | none |
| Secondary | transparent | `--teal-700` | 1.5px `--neutral-300` |
| Ghost | transparent | `--teal-700` | none |
| Danger | transparent | `--error-600` | 1.5px `--error-600` |
| Danger ghost | transparent | `--error-600` | none |

All pills (999px radius). One primary per viewport. Auto-width on desktop.

**States:**
```css
:hover  → translateY(-1px), darken bg
:active → scale(0.98)
:focus  → 0 0 0 3px rgba(110,207,171,0.25)
:disabled → 40% opacity
```

### 5.3 Input Fields

```css
.input {
  height: 48px;
  padding: 0 16px;
  background: var(--neutral-100);
  border: 1.5px solid transparent;
  border-radius: 12px;
  font: 400 16px var(--font-body);
  color: var(--neutral-900);
}
.input:hover { border-color: var(--neutral-300); }
.input:focus {
  background: var(--white);
  border-color: var(--mint-500);
  box-shadow: 0 0 0 3px rgba(110,207,171,0.15);
}
.input--error { border-color: var(--error-600); background: var(--error-100); }
```

Labels: 14px/500 above field, 4px gap.
Helper text: 13px/`--neutral-500`.
Error: 13px/`--error-600` + icon.

### 5.4 Cards

```css
.card {
  background: var(--white);
  border: none;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(27,53,51,0.04), 0 1px 2px rgba(27,53,51,0.02);
}
```

| Type | Extra | Usage |
|------|-------|-------|
| Default | as above | Forms, panels |
| Featured | `--mint-50` bg, `1.5px --mint-200` border | Dashboard hero |
| Interactive | +hover shadow + translateY(-1px) | Clickable items |
| Quote | +3px left `--mint-500` border | Wycena cards |

No visible borders on default cards. No nesting cards.

### 5.5 Badges

```css
.badge { height: 24px; padding: 0 10px; border-radius: 999px; font: 600 11px var(--font-body); }
```

| Status | BG | Text |
|--------|-----|------|
| Open | `--success-100` | `--success-600` |
| Pending | `--warning-100` | `--warning-600` |
| Quote | `--mint-100` | `--mint-700` |
| Interested | `--mint-200` | `--mint-700` |
| Closed | `--neutral-100` | `--neutral-600` |
| Rejected | `--error-100` | `--error-600` |

Max 2 per card row.

### 5.6 Tabs

Underline style, not pill containers:

```css
.tab {
  padding: 12px 20px;
  font: 500 14px var(--font-body);
  color: var(--neutral-600);
  border-bottom: 2px solid transparent;
}
.tab--active {
  color: var(--teal-700);
  border-bottom-color: var(--teal-700);
  font-weight: 600;
}
```

### 5.7 Filter Pills

32px height, 999px radius, 13px/500. Active: `--teal-700` bg white text. Inactive: white bg, `--neutral-200` border.

### 5.8 Progress Stepper

28px circles: active = `--teal-700` fill + white number; completed = checkmark; upcoming = `--neutral-200` fill. 2px connector lines.

### 5.9 Quote Card

3px left border `--mint-500`. Price at 28px/700. Line items: flex space-between, 14px, `tabular-nums`.

### 5.10 Empty States

64px outline icon in `--neutral-300`, 18px/600 heading, 14px/`--neutral-500` description, optional secondary CTA. All centered.

---

## 6. Page Templates

### Login / Register
Card: white, 16px radius, max 420px, 32px padding. 4px `--mint-500` top accent bar. Full-width primary button. No dashed borders.

### Dashboard
Featured card (`--mint-50` bg), overline "PANEL KIEROWCY", title, description, primary CTA. Below: underline tabs → order list.

### Multi-step Form
Centered 720px. Stepper top. Form card with 24px padding. "Dalej" button auto-width, right-aligned. Not full-width on desktop.

### Order Detail
Header card with back + badge + actions. Car name at 28px/700. Underline tabs (Wyceny/Pytania). Filter pills. Quote cards stacked. "Zamknij" = danger ghost.

---

## 7. Shadows

```css
:root {
  --shadow-xs:       0 1px 2px rgba(27,53,51,0.03);
  --shadow-card:     0 1px 3px rgba(27,53,51,0.04), 0 1px 2px rgba(27,53,51,0.02);
  --shadow-hover:    0 2px 8px rgba(27,53,51,0.06);
  --shadow-elevated: 0 4px 12px rgba(27,53,51,0.06), 0 1px 3px rgba(27,53,51,0.04);
  --shadow-modal:    0 16px 48px rgba(27,53,51,0.12), 0 4px 12px rgba(27,53,51,0.06);
}
```

---

## 8. Border Radii

```css
--radius-sm: 8px;       /* Logo, small inner */
--radius-md: 12px;      /* Inputs, thumbnails */
--radius-lg: 16px;      /* Cards */
--radius-xl: 20px;      /* Modals, landing mockups */
--radius-full: 999px;   /* Buttons, badges */
```

No other values.

---

## 9. Icons

Outlined only, 1.5px stroke, sizes 16/20/24px, `currentColor`. Lucide or Phosphor outline. Never filled. Never colored differently from text. Always paired with text label.

---

## 10. Motion

```css
--duration-fast: 150ms;    /* Button hover */
--duration-normal: 200ms;  /* Focus, tabs */
--duration-slow: 300ms;    /* Card hover */
--duration-reveal: 500ms;  /* Page enter */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

No bouncy/elastic animations. Respect `prefers-reduced-motion`.

---

## 11. Dark Mode

| Token | Light | Dark |
|-------|-------|------|
| Page bg | `--neutral-50` | `--neutral-950` |
| Card | `--white` | `--neutral-900` |
| Primary text | `--neutral-900` | `--neutral-75` |
| Input bg | `--neutral-100` | `--neutral-800` |
| Primary btn | `--teal-700` bg | `--mint-500` bg |
| Nav | `--white` (landing) / `--teal-800` (app) | `--neutral-950` |
| Accent | `--mint-500` | `--mint-500` (same) |

Swap via `[data-theme="dark"]` on `:root`.

---

## 12. Accessibility

- `--mint-500` on `--teal-700` = 6.2:1 contrast ✓
- `--neutral-700` on `--neutral-50` = 7.1:1 ✓
- All interactive elements have visible focus rings.
- Touch targets: 44×44px minimum.
- Errors: text + icon, never color alone.
- All inputs have `<label>`.

---

## 13. Do's and Don'ts

### DO
- Albert Sans at **weight 700** for landing hero headlines
- Albert Sans at **weight 600** for landing section headings
- DM Sans at **weight 500** for landing body/subtitle text
- DM Sans at **weight 700** for landing item titles (FAQ questions, benefit names)
- DM Sans for everything in the app UI
- `#6ECFAB` mint as the single accent
- `#8DE8C4` as hero/CTA headline color on dark backgrounds
- `#0A4945` as landing hero background
- White nav on landing page with dark text
- White pill buttons on dark backgrounds
- Generous spacing everywhere
- Teal-tinted subtle shadows

### DON'T
- Don't use Albert Sans at weight 300 or 400 (too thin/wispy)
- Don't use Josefin Sans (replaced by Albert Sans)
- Don't use any serif font anywhere
- Don't highlight individual words in different colors within headlines
- Don't use warm/sage/olive greens
- Don't use gold/tan for workshop elements
- Don't use two equal CTA buttons — one must be clearly primary
- Don't use italic
- Don't add visible borders to cards
- Don't make full-width buttons on desktop
- Don't use uppercase on buttons or headings
- Don't use dark/teal nav on landing page (use white)
- Don't use weight 400 for landing body text (use 500 minimum)

---

## Appendix: Copy-Paste CSS Variables

```css
:root {
  --mint-700:#36A07A; --mint-600:#4CB890; --mint-500:#6ECFAB;
  --mint-400:#8DDBC0; --mint-300:#B0E8D4; --mint-200:#D4F3E8;
  --mint-100:#EAF9F2; --mint-50:#F3FCF8;
  --teal-900:#0C1B19; --teal-800:#122623; --teal-700:#1B3533;
  --teal-600:#213F3C; --teal-500:#2D524E;
  --neutral-950:#191C1A; --neutral-900:#252825; --neutral-800:#363936;
  --neutral-700:#4D504D; --neutral-600:#656965; --neutral-500:#868A86;
  --neutral-400:#A5A9A5; --neutral-300:#C2C5C2; --neutral-200:#DCDEDD;
  --neutral-100:#EDEEED; --neutral-75:#F2F3F2; --neutral-50:#F5F5F3;
  --white:#FFFFFF;
  --success-600:#2D7A56; --success-100:#E6F4ED;
  --warning-600:#8B6914; --warning-100:#FDF6E3;
  --error-600:#B3261E; --error-100:#FDECEA;
  --font-display:'Albert Sans',sans-serif;
  --font-body:'DM Sans','Helvetica Neue',sans-serif;
  --font-mono:'JetBrains Mono','Fira Code',monospace;
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px;
  --space-12:48px; --space-16:64px; --space-20:80px;
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px;
  --radius-xl:20px; --radius-full:999px;
  --shadow-xs:0 1px 2px rgba(27,53,51,.03);
  --shadow-card:0 1px 3px rgba(27,53,51,.04),0 1px 2px rgba(27,53,51,.02);
  --shadow-hover:0 2px 8px rgba(27,53,51,.06);
  --shadow-elevated:0 4px 12px rgba(27,53,51,.06),0 1px 3px rgba(27,53,51,.04);
  --shadow-modal:0 16px 48px rgba(27,53,51,.12),0 4px 12px rgba(27,53,51,.06);
  --duration-fast:150ms; --duration-normal:200ms;
  --duration-slow:300ms; --duration-reveal:500ms;
  --ease-out:cubic-bezier(.16,1,.3,1);
  --ease-in-out:cubic-bezier(.65,0,.35,1);
  --page-max:720px; --page-wide:1040px; --landing-max:1140px;
  --nav-height:64px;
}
```
