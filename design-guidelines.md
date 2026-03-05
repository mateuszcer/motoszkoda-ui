# Autoceny Design System
## Complete UI Guidelines for Application Rebuild

**Version:** 1.0  
**Target aesthetic:** Qapital-inspired — calm, premium, trustworthy  
**Applies to:** All screens — landing page, auth, dashboard, forms, detail views, workshop panel

---

## Table of Contents

1. Design Philosophy
2. Color System
3. Typography System
4. Spacing & Layout Grid
5. Component Library
   - 5.1 Navigation Bar
   - 5.2 Buttons
   - 5.3 Input Fields & Forms
   - 5.4 Cards
   - 5.5 Badges & Status Tags
   - 5.6 Tabs
   - 5.7 Filter Pills
   - 5.8 Progress Stepper
   - 5.9 Data Rows / List Items
   - 5.10 Modals & Dialogs
   - 5.11 Empty States
   - 5.12 Image Thumbnails
6. Page Templates
   - 6.1 Authentication (Login / Register)
   - 6.2 Dashboard (Driver Panel)
   - 6.3 New Order Flow (Multi-step Form)
   - 6.4 Order Detail View
   - 6.5 Quote Card (Wycena)
7. Iconography
8. Shadows & Elevation
9. Border Radii
10. Motion & Transitions
11. Dark Mode Considerations
12. Accessibility
13. Do's and Don'ts

---

## 1. Design Philosophy

Every design decision at Autoceny should answer: **"Does this make the user feel safe and in control?"**

Car repair is stressful. People dealing with broken vehicles are anxious about costs, timelines, and being taken advantage of. Our UI must counteract that anxiety with calm confidence. The visual language should say: "We've handled this. You're in good hands."

**Core principles:**

- **Restraint over decoration.** Remove anything that doesn't serve comprehension or trust. When in doubt, leave it out.
- **Quiet confidence.** Large type, generous space, muted colors. Never shout. Let the information do the work.
- **Consistency is professionalism.** Every card, every button, every label should feel like it belongs to the same family. No one-off styling.
- **Warmth over coldness.** Warm off-whites, earthy greens, soft shadows. Avoid blue-gray sterility.

---

## 2. Color System

### 2.1 Core Palette

```css
:root {
  /* ── Primary ── */
  --color-primary-900: #0F1F18;    /* Deepest green — footer, overlays */
  --color-primary-800: #162B23;    /* Dark green — nav bar, hero backgrounds */
  --color-primary-700: #1E3A2F;    /* Dark green — button primary bg */
  --color-primary-600: #2A5244;    /* Medium dark — hover states on primary buttons */
  --color-primary-500: #3D7A66;    /* Mid green — active/focus rings */
  --color-primary-400: #5BBAA0;    /* Sage/mint — accent text, links on dark bg */
  --color-primary-300: #8DD4BF;    /* Light mint — subtle highlights */
  --color-primary-200: #C2E8DA;    /* Very light mint — success backgrounds */
  --color-primary-100: #E8F5EF;    /* Barely-there green — hover on cards */
  --color-primary-50:  #F2FAF6;    /* Whisper green — subtle section tinting */

  /* ── Neutrals (warm-tinted, NOT blue-gray) ── */
  --color-neutral-950: #1A1D1B;    /* Near-black text */
  --color-neutral-900: #2D302E;    /* Primary text */
  --color-neutral-800: #3D413F;    /* Secondary headings */
  --color-neutral-700: #525754;    /* Body text */
  --color-neutral-600: #6B706D;    /* Muted text */
  --color-neutral-500: #8A8E8B;    /* Placeholder text */
  --color-neutral-400: #A8ABA9;    /* Disabled text */
  --color-neutral-300: #C5C8C6;    /* Borders */
  --color-neutral-200: #DFE1DF;    /* Subtle borders, dividers */
  --color-neutral-100: #EEEFEE;    /* Input backgrounds */
  --color-neutral-75:  #F3F4F3;    /* Page background (light sections) */
  --color-neutral-50:  #F7F8F7;    /* App background */
  --color-white:       #FFFFFF;    /* Card surfaces */

  /* ── Semantic ── */
  --color-success-600: #2D7A56;    /* Success text */
  --color-success-100: #E6F4ED;    /* Success background */
  --color-warning-600: #8B6914;    /* Warning/pending text */
  --color-warning-100: #FDF6E3;    /* Warning background */
  --color-error-600:   #B3261E;    /* Error text */
  --color-error-100:   #FDECEA;    /* Error background */
  --color-info-600:    #2563EB;    /* Info text (use sparingly) */
  --color-info-100:    #EFF6FF;    /* Info background */
}
```

### 2.2 Color Usage Rules

**Page backgrounds:** Always `--color-neutral-50` (warm off-white). Never pure `#FFFFFF` for full-page backgrounds.

**Card surfaces:** `--color-white` (#FFFFFF). The contrast between the off-white page and the white card is the primary means of visual separation — not borders.

**Text:** Use `--color-neutral-900` for headings, `--color-neutral-700` for body text, `--color-neutral-500` for placeholders and helper text. Never use pure black (#000000).

**Primary actions:** `--color-primary-700` background with white text. Hover: `--color-primary-600`.

**Links:** `--color-primary-700` in light contexts, `--color-primary-400` on dark backgrounds.

**Accent uses:** The gold/amber accent currently used for "PANEL KIEROWCY" label should be replaced with `--color-primary-400` (sage mint) to reduce palette fragmentation. One accent color, used consistently, builds stronger brand recognition than multiple accent colors.

### 2.3 What to Change from Current Autoceny

| Current | New | Why |
|---------|-----|-----|
| Blue-black nav (#0F1A2E range) | Warm forest green `--color-primary-800` | Warmer, more distinctive, matches Qapital |
| Blue-tinted gray backgrounds | Warm neutral `--color-neutral-50` | Removes clinical feel |
| Vivid green buttons (#3D8B6E) | Deeper `--color-primary-700` | More premium, less startup-y |
| Gold accent for labels | Sage mint `--color-primary-400` | Palette unity — one accent, not two |
| Green tinted card backgrounds (in quotes) | White cards on off-white bg | Cleaner hierarchy |
| Blue-gray borders on inputs | Warm neutral `--color-neutral-200` | Cohesion with warm palette |

---

## 3. Typography System

### 3.1 Font Selection

```css
:root {
  --font-display: 'DM Serif Display', 'Georgia', serif;
  --font-body: 'DM Sans', 'Helvetica Neue', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* VIN numbers, codes */
}
```

**Why DM Serif Display + DM Sans:** They're from the same superfamily (designed to pair together), freely available on Google Fonts, and have excellent Polish character support (ą, ć, ę, ł, ń, ó, ś, ź, ż). The serif is warm and editorial; the sans is geometric and clean.

**Fallback:** If you prefer a different pairing, the rules below still apply. Good alternatives: Source Serif 4 + Source Sans 3, or Lora + Plus Jakarta Sans.

### 3.2 Type Scale

All sizes defined as rem (base 16px). Use these exact values — no in-between sizes.

```css
:root {
  /* ── Display / Hero (landing page only) ── */
  --text-display-lg: 3.75rem;     /* 60px — hero headline */
  --text-display-sm: 2.75rem;     /* 44px — section headlines */

  /* ── Application headings ── */
  --text-heading-xl: 1.75rem;     /* 28px — page titles ("Nowe zlecenie", car name) */
  --text-heading-lg: 1.375rem;    /* 22px — card titles, section headers */
  --text-heading-md: 1.125rem;    /* 18px — sub-section headers */
  --text-heading-sm: 1rem;        /* 16px — field group labels ("Dane pojazdu") */

  /* ── Body ── */
  --text-body-lg: 1rem;           /* 16px — primary body text */
  --text-body-md: 0.9375rem;      /* 15px — secondary body text */
  --text-body-sm: 0.875rem;       /* 14px — descriptions, metadata */

  /* ── Utility ── */
  --text-caption: 0.8125rem;      /* 13px — timestamps, helper text */
  --text-overline: 0.75rem;       /* 12px — overline labels, tab counts */
  --text-micro: 0.6875rem;        /* 11px — badges only */
}
```

### 3.3 Type Styles (how to combine size + weight + spacing)

| Style Name | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|------------|------|------|--------|-------------|----------------|-------|
| `display-hero` | DM Serif Display | 60px | 400 (Regular) | 1.1 | -0.02em | Landing hero only |
| `display-section` | DM Serif Display | 44px | 400 | 1.15 | -0.01em | Landing section headings |
| `page-title` | DM Sans | 28px | 700 | 1.25 | -0.01em | App page titles |
| `card-title` | DM Sans | 22px | 600 | 1.3 | -0.005em | Card headers, order names |
| `section-header` | DM Sans | 18px | 600 | 1.4 | 0 | Sub-sections within pages |
| `field-label` | DM Sans | 14px | 500 | 1.4 | 0 | Form field labels |
| `body` | DM Sans | 16px | 400 | 1.6 | 0 | Main body text |
| `body-secondary` | DM Sans | 15px | 400 | 1.6 | 0 | Descriptions, secondary info |
| `caption` | DM Sans | 13px | 400 | 1.5 | 0.01em | Timestamps, metadata |
| `overline` | DM Sans | 12px | 500 | 1.4 | 0.08em | Section labels (uppercased) |
| `badge` | DM Sans | 11px | 600 | 1 | 0.02em | Status badges |
| `mono-data` | JetBrains Mono | 14px | 400 | 1.4 | 0 | VIN, license plates |

### 3.4 Typography Rules

- **Headings in the app (not landing page) use DM Sans**, not the serif. The serif is reserved for marketing pages to maintain the editorial/premium feel. The app itself should feel clean and functional.
- **Never use font-weight 800 or 900.** Maximum is 700 (Bold) for page titles. Most headings use 600 (SemiBold).
- **Never italicize headings** in the app. The current hero uses bold italic — this is the single biggest contributor to the "playful" feel.
- **Uppercase is reserved exclusively for overline labels** (like "PANEL KIEROWCY", "POZYCJE"). Body text, buttons, headings — never uppercase.
- **Numbers in prices should use tabular figures** (`font-variant-numeric: tabular-nums`) so that amounts align vertically in lists.

### 3.5 What to Change from Current Autoceny

| Current | New | Why |
|---------|-----|-----|
| Bold italic display font in hero | DM Serif Display, regular weight | Calmer, more premium |
| System/default sans for app UI | DM Sans consistently | Brand coherence |
| Mixed font weights throughout | Strict weight ladder (400/500/600/700 only) | Visual consistency |
| Uppercase in various places (buttons, labels) | Uppercase only for overline labels | Reduces visual noise |
| No monospaced font for VIN/plates | JetBrains Mono for technical data | Improves readability of codes |

---

## 4. Spacing & Layout Grid

### 4.1 Spacing Scale

Use an 8px base grid. All spacing should be multiples of 4 or 8.

```css
:root {
  --space-1:  4px;     /* Micro — between icon and label inline */
  --space-2:  8px;     /* Tight — between related items */
  --space-3:  12px;    /* Compact — inside small components */
  --space-4:  16px;    /* Default — standard element gap */
  --space-5:  20px;    /* Comfortable — between form fields */
  --space-6:  24px;    /* Relaxed — card internal padding */
  --space-8:  32px;    /* Airy — between sections within a card */
  --space-10: 40px;    /* Spacious — between card groups */
  --space-12: 48px;    /* Generous — between major sections */
  --space-16: 64px;    /* Large — page top/bottom padding */
  --space-20: 80px;    /* XL — landing page section inner padding */
  --space-24: 96px;    /* XXL */
  --space-32: 128px;   /* Hero — landing page section vertical padding */
}
```

### 4.2 Page Layout

```css
:root {
  --page-max-width: 720px;        /* App content (forms, lists, details) */
  --page-wide-max-width: 1040px;  /* Dashboard with side panels */
  --landing-max-width: 1180px;    /* Landing page content */
  --page-padding-x: 24px;         /* Horizontal gutter on mobile */
  --page-padding-x-desktop: 40px; /* Horizontal gutter on desktop */
}
```

**Key principle: The app is narrow.** Autoceny's current layout already uses a narrow centered column (~1000px), which is good. Tighten it to 720px for single-column views (forms, order details, lists). This creates more whitespace on desktop and makes the content feel intentional rather than lost in space.

### 4.3 Layout Template

```
┌──────────────────────────────────────────────────────────┐
│  Nav Bar (full width, 64px height)                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│         ┌──────────────────────────────┐                 │
│         │                              │                 │
│         │   Page Header Area           │  ← 720px max   │
│         │   (title, breadcrumbs)       │     centered    │
│         │                              │                 │
│         ├──────────────────────────────┤                 │
│         │                              │                 │
│         │   Primary Content Card       │                 │
│         │                              │                 │
│         ├──────────────────────────────┤                 │
│         │                              │                 │
│         │   Secondary Content          │                 │
│         │   (tabs, list items)         │                 │
│         │                              │                 │
│         └──────────────────────────────┘                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.4 Vertical Rhythm within Pages

- Nav → first content: `--space-10` (40px)
- Page title → first card: `--space-6` (24px)
- Between cards on the same page: `--space-6` (24px)
- Between form fields: `--space-5` (20px)
- Between sections within a card: `--space-8` (32px)
- Card internal padding: `--space-6` (24px) on all sides
- Last card → page bottom: `--space-16` (64px)

---

## 5. Component Library

### 5.1 Navigation Bar

**Current issue:** The dark nav works but has inconsistent item styling and the logo + wordmark feel disconnected from the app content.

**New spec:**

```
Height:        64px
Background:    --color-primary-800 (#162B23)
Position:      Sticky, top: 0, z-index: 100
Shadow:        none (clean edge against content)
Padding:       0 --space-6 (0 24px)
```

| Element | Style |
|---------|-------|
| Logo | "AC" circle badge (keep current) + "Autoceny" wordmark in DM Sans, 18px, weight 600, white |
| Nav links | DM Sans, 14px, weight 500, white at 70% opacity. Hover: white at 100%. No underlines. |
| Active nav link | White at 100% + 2px bottom bar in `--color-primary-400` |
| Primary CTA | Pill button, `--color-primary-400` background, `--color-primary-900` text, 36px height |
| Secondary CTA | Pill button, transparent bg, 1px white/40% border, white text, 36px height |
| Dark/light toggle | Keep, but restyle as a simple icon (moon/sun), white at 70% opacity |
| Language toggle | Keep "EN/PL", DM Sans 13px, weight 500, white at 60% |

**Scrolled state:** Add `box-shadow: 0 1px 0 rgba(0,0,0,0.08)` when page is scrolled > 0. Subtle separator.

### 5.2 Buttons

**Current issue:** Buttons are too tall, use varied border-radii, and the green shade feels saturated.

**Sizes:**

| Size | Height | Padding X | Font Size | Radius | Usage |
|------|--------|-----------|-----------|--------|-------|
| Large | 52px | 28px | 16px / 500wt | 999px (full pill) | Primary page actions, CTAs |
| Medium | 44px | 24px | 15px / 500wt | 999px | In-card actions, form submits |
| Small | 36px | 16px | 14px / 500wt | 999px | Inline actions, nav CTAs |
| Compact | 32px | 12px | 13px / 500wt | 999px | Filter pills, table actions |

**Variants:**

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| **Primary** | `--color-primary-700` | white | none | Main action per page (1 per view) |
| **Secondary** | transparent | `--color-primary-700` | 1.5px `--color-neutral-300` | Companion actions |
| **Ghost** | transparent | `--color-primary-700` | none | Tertiary, inline actions ("Mniej", "Ukryj") |
| **Danger** | transparent | `--color-error-600` | 1.5px `--color-error-600` | Destructive ("Zamknij", "Usuń") |
| **Danger ghost** | transparent | `--color-error-600` | none | Soft destructive ("Zamknij" text link) |

**States:**

| State | Change |
|-------|--------|
| Hover | Background darkens 8% (primary), background fills at 4% opacity (secondary/ghost) |
| Active/pressed | Background darkens 12%, scale(0.98) |
| Focus | 2px ring in `--color-primary-400` with 2px offset |
| Disabled | 40% opacity, cursor: not-allowed |
| Loading | Text hidden, centered spinner (16px, 2px stroke, white or primary) |

**Rules:**
- Only ONE primary button per visible viewport. Everything else is secondary or ghost.
- Button text is sentence case, never uppercase. "Zaloguj się" not "ZALOGUJ SIĘ".
- Full-width buttons only inside narrow containers (< 400px) like mobile or modals. On desktop forms, buttons should be auto-width.
- The current "Dalej" button is full-width on a desktop form — change to auto-width, right-aligned.

### 5.3 Input Fields & Forms

**Current issue:** Inputs have a slightly blue-gray tinted background and rounded corners that are a bit too round for the app context. The overall feel is soft but not refined.

**Input anatomy:**

```
┌─ Label (14px, DM Sans, weight 500, --color-neutral-900) ──────────┐
│  ← 4px gap                                                        │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  Input field                                                  │  │
│ │  16px text / 500 placeholder / 48px height                    │  │
│ └──────────────────────────────────────────────────────────────┘  │
│  ← 4px gap                                                        │
│  Helper text (13px, --color-neutral-500) or error (--error-600)   │
└───────────────────────────────────────────────────────────────────┘
```

**Input field spec:**

```css
.input {
  height: 48px;
  padding: 0 16px;
  background: var(--color-neutral-100);     /* Very light warm gray */
  border: 1.5px solid transparent;           /* No visible border by default */
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 16px;                           /* Prevents iOS zoom */
  font-weight: 400;
  color: var(--color-neutral-900);
  transition: border-color 200ms ease, background 200ms ease;
}

.input:hover {
  border-color: var(--color-neutral-300);
}

.input:focus {
  background: var(--color-white);
  border-color: var(--color-primary-500);
  outline: none;
  box-shadow: 0 0 0 3px rgba(93, 186, 160, 0.15);
}

.input--error {
  border-color: var(--color-error-600);
  background: var(--color-error-100);
}

.input::placeholder {
  color: var(--color-neutral-500);
  font-weight: 400;
}
```

**Form layout:**
- Fields stack vertically with `--space-5` (20px) between each label-input pair.
- Group related fields under a section header (18px, weight 600) with `--space-8` (32px) above the header.
- Two short fields on the same row (e.g., Marka + Model) use a 2-column grid with `--space-4` (16px) gap.
- The form container card has `--space-6` (24px) internal padding.

**Textarea:**
- Same styling as input but min-height: 120px, padding-top: 12px, resize: vertical.

**Select / dropdown:**
- Same styling as input. Custom chevron icon (12px, `--color-neutral-500`) positioned right 16px.
- Dropdown menu: white background, `--shadow-elevated`, border-radius 12px, max-height 280px with scroll.

**What to change from current Autoceny:**
- Remove the visible rounded border on default (unfocused) state — rely on background fill instead
- Warm up the background tint from blue-gray to warm gray
- Ensure 48px consistent height (current varies)
- Labels above fields, never floating/inside

### 5.4 Cards

**Current issue:** Cards use a thin border with light rounded corners. The Qapital approach uses no visible border — just white-on-off-white contrast.

**Card spec:**

```css
.card {
  background: var(--color-white);
  border: none;                              /* NO visible border */
  border-radius: 16px;
  padding: var(--space-6);                   /* 24px all sides */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04),
              0 1px 2px rgba(0, 0, 0, 0.02); /* Barely visible */
}
```

**Card variants:**

| Variant | Spec | Usage |
|---------|------|-------|
| **Default** | White bg, subtle shadow | Order cards, form containers, panels |
| **Elevated** | White bg, `--shadow-elevated` | Popover content, dropdown menus |
| **Featured** | `--color-primary-50` bg, no shadow, 1.5px `--color-primary-200` border | Hero dashboard card ("Panel Kierowcy") |
| **Interactive** | Default + hover: shadow increases + translateY(-1px) | Clickable list items (order list, quote list) |
| **Quote** | White bg, 3px left border in `--color-primary-400` | Individual quote/wycena cards |

**Internal anatomy for list-item cards (orders, quotes):**

```
┌────────────────────────────────────────────────────────────┐
│  24px padding                                              │
│                                                            │
│  Title (18px, DM Sans 600)              Status Badge ───►  │
│  Description (14px, --neutral-600)       Action Links      │
│  Metadata line (13px, --neutral-500)                       │
│                                                            │
│  24px padding                                              │
└────────────────────────────────────────────────────────────┘
```

**Rules:**
- Cards sit on `--color-neutral-50` page background. The white-on-off-white provides sufficient separation.
- Never nest cards inside cards. If you need sub-sections, use a subtle divider line (`1px --color-neutral-100`) inside the card.
- Card border-radius is always 16px. No exceptions.
- Remove the light green/teal background tint currently used on quote cards — use the left-border variant instead for differentiation.

### 5.5 Badges & Status Tags

**Current issue:** Status badges ("Otwarte", "Oczekuje", "Zamknięte") use various colored backgrounds with rounded pills. The colors are reasonable but inconsistent in visual weight.

**Badge spec:**

```css
.badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;                     /* Full pill */
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
```

| Status | Background | Text Color | Polish Label |
|--------|-----------|------------|--------------|
| **Open / Active** | `--color-success-100` | `--color-success-600` | Otwarte |
| **Pending / Waiting** | `--color-warning-100` | `--color-warning-600` | Oczekuje |
| **Quote received** | `--color-primary-100` | `--color-primary-700` | Wycena |
| **Interested** | `--color-primary-200` | `--color-primary-700` | Zainteresowane |
| **Closed** | `--color-neutral-100` | `--color-neutral-600` | Zamknięte |
| **Rejected** | `--color-error-100` | `--color-error-600` | Odrzucone |

**Rules:**
- Maximum 2 badges visible per card row. If more statuses exist, show only the most important one.
- Badge text is always a single word or very short phrase. Never a sentence.
- Badges do not have borders. Background color alone provides containment.

### 5.6 Tabs

**Current issue:** Tabs ("Otwarte (1)", "Zamknięte (3)", "Wszystkie (4)") have a rounded border container and work well functionally. Visual refinement needed.

**Tab spec:**

```css
.tab-group {
  display: inline-flex;
  gap: 0;
  border-bottom: 1.5px solid var(--color-neutral-200);
}

.tab {
  padding: 12px 20px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-600);
  border-bottom: 2px solid transparent;
  margin-bottom: -1.5px;                    /* Overlap the group border */
  transition: color 200ms, border-color 200ms;
  cursor: pointer;
}

.tab:hover {
  color: var(--color-neutral-900);
}

.tab--active {
  color: var(--color-primary-700);
  border-bottom-color: var(--color-primary-700);
  font-weight: 600;
}

.tab__count {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-neutral-500);
  margin-left: 4px;
}
```

**Style change:** Move from the current "rounded pill container" tab style to a clean underline tab style. This is more standard for app navigation and matches Qapital's minimal approach. The rounded pill container adds visual weight that competes with the content.

### 5.7 Filter Pills

For the sorting options ("Najnowsze", "Najtańsze", "Najbliższe", "Zainteresowane"):

```css
.filter-pill {
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid var(--color-neutral-200);
  background: var(--color-white);
  color: var(--color-neutral-700);
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-pill:hover {
  border-color: var(--color-neutral-300);
  background: var(--color-neutral-75);
}

.filter-pill--active {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
  color: var(--color-white);
}
```

**Gap between pills:** `--space-2` (8px).

### 5.8 Progress Stepper

For the multi-step form flow ("1 Auto → 2 Usterka → 3 Lokalizacja"):

**Current issue:** The stepper uses green circles with dashes between them. Functional but the dashes feel fragile.

**New spec:**

```
Step indicator:       28px circle
Active step:          --color-primary-700 fill, white number (14px, 600wt)
Completed step:       --color-primary-700 fill, white checkmark icon
Upcoming step:        --color-neutral-200 fill, --color-neutral-500 number
Connector line:       2px solid, completed = --color-primary-700, upcoming = --color-neutral-200
Step label:           14px, 500wt, color matches circle state
Gap step↔label:       8px
Gap label↔connector:  16px
```

**Layout:** Horizontal, centered above the form, with equal spacing. On mobile (< 600px), show only the current step label with "Step X of Y".

### 5.9 Data Rows / List Items

For workshop lists, quote lists, and order lists:

```css
.list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);    /* 20px 24px */
  background: var(--color-white);
  border-radius: 16px;
  margin-bottom: var(--space-3);             /* 12px gap between items */
  transition: box-shadow 200ms, transform 200ms;
  cursor: pointer;
}

.list-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}
```

**Internal structure:**

```
┌──────────────────────────────────────────────────────────┐
│  Left column (flex-grow)          Right column (flex-end) │
│                                                          │
│  Workshop name / Car name          Badge(s)              │
│  (18px, DM Sans, 600wt)           Action text links      │
│                                                          │
│  Distance: "1.6 km"                                      │
│  (14px, --neutral-500)                                   │
│                                                          │
│  Timestamp: "Otrzymano 06 mar 2026, 00:11"               │
│  (13px, --neutral-500)                                   │
└──────────────────────────────────────────────────────────┘
```

### 5.10 Modals & Dialogs

```css
.modal-overlay {
  background: rgba(15, 31, 24, 0.4);        /* Dark green tinted */
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--color-white);
  border-radius: 20px;
  padding: var(--space-8);                   /* 32px */
  max-width: 480px;
  width: calc(100% - 48px);
  box-shadow: var(--shadow-modal);
}
```

### 5.11 Empty States

When a list has no items (e.g., no quotes received yet):

```
┌────────────────────────────────────────────┐
│                                            │
│         [Subtle illustration/icon]         │
│         64px, --color-neutral-300          │
│                                            │
│     Heading (18px, 600wt, --neutral-800)   │
│     "Brak wycen"                           │
│                                            │
│     Description (14px, --neutral-500)      │
│     "Warsztaty analizują Twoje zlecenie.   │
│      Powiadomimy Cię gdy pojawią się       │
│      wyceny."                              │
│                                            │
│           [ Optional CTA button ]          │
│                                            │
└────────────────────────────────────────────┘
```

### 5.12 Image Thumbnails

For car photos in order details:

```css
.thumbnail {
  width: 100%;
  max-width: 280px;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 12px;
  background: var(--color-neutral-100);     /* Placeholder color while loading */
}
```

**Rules:**
- Always use `object-fit: cover` to prevent distortion.
- Show a subtle loading skeleton (pulsing `--color-neutral-100` → `--color-neutral-75`) while image loads.
- Clicking a thumbnail should open a lightbox overlay, not navigate away.

---

## 6. Page Templates

### 6.1 Authentication (Login / Register)

**Current:** Centered card with dashed green border animation at top. Clean but the dashed border feels playful/quirky.

**New spec:**

```
Background:          --color-neutral-50 (full page)
Card:                white, 16px radius, --shadow-card, max-width 420px, centered
Card padding:        32px top, 32px sides, 32px bottom
Logo:                AC badge + "Autoceny" — centered at top, outside card OR at top of card
Heading:             "Witaj ponownie" — 22px, DM Sans, 600wt, centered
Subheading:          "Zaloguj się, aby zarządzać zleceniami" — 14px, --neutral-500, centered
Fields:              Full-width within card, 20px gap between
Submit button:       Full-width, Large size, Primary variant
Footer link:         "Nie masz konta? Utwórz je" — 14px, centered, link in --primary-700
```

**Remove:** The animated dashed border around the card. Replace with nothing — the card's shadow on the off-white background is sufficient.

**Add:** A subtle decorative element — either a thin `--color-primary-400` line at the top of the card (4px height, full width, border-radius clips with card) or the page background could be a very subtle gradient from `--color-primary-50` at top to `--color-neutral-50` at bottom.

### 6.2 Dashboard (Driver Panel)

**Current:** "Panel Kierowcy" header card with gold label, then tab-filtered order list below.

**New spec:**

The dashboard header should be a featured card variant:

```
┌─────────────────────────────────────────────────────────────┐
│  --color-primary-50 background, 1.5px --primary-200 border  │
│                                                             │
│  PANEL KIEROWCY (12px, overline, --primary-700)             │
│                                                             │
│  Znajdź najlepszą wycenę naprawy                            │
│  (22px, DM Sans 600, --neutral-900)                         │
│                                                             │
│  Opisz usterkę raz, otrzymaj wyceny z okolicznych           │
│  warsztatów i wybierz najlepszą ofertę.                     │
│  (15px, --neutral-600)                                      │
│                                                             │
│  [Nowe zlecenie]primary   Moje zlecenia →ghost              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

     Tabs: Otwarte (1)  ·  Zamknięte (3)  ·  Wszystkie (4)

     ┌─ Order card ──────────────────────────────────────┐
     │  Audi A3                           [Otwarte]      │
     │  Hamulce piszczą przy hamowaniu                    │
     │  Zaktualizowano 05 mar 2026, 23:26                 │
     └───────────────────────────────────────────────────┘
```

### 6.3 New Order Flow (Multi-step Form)

**Current:** Stepper at top, form card below, full-width "Dalej" button at bottom. Structurally solid.

**Changes:**
- Stepper: Use the refined spec from 5.8
- "Wstecz" link: Ghost button style, left-aligned
- "Nowe zlecenie" title: Centered, `page-title` style (28px, 700wt)
- "1/3" indicator: Replace with the stepper itself — the count is redundant
- Form card: 720px max-width, 24px padding, 16px radius
- "Dalej" button: Medium size, auto-width, right-aligned at bottom of card. Not full-width.
- Field spacing: 20px between fields

### 6.4 Order Detail View

**Current:** Back arrow + status badge at top, car name, description, metadata. Then tabs for Wyceny/Pytania, then filter pills, then list of workshop responses. Good hierarchy.

**Refined structure:**

```
┌─ Header card ──────────────────────────────────────────────┐
│  ← Wróć              [Otwarte]            Ukryj · Zamknij  │
│                                                             │
│  Audi A3 Sportback 2019                                     │
│  (page-title: 28px, 700wt)                                 │
│                                                             │
│  Hamulce piszczą przy hamowaniu                             │
│  (body-secondary: 15px, --neutral-700)                      │
│                                                             │
│  [Car photo thumbnail if uploaded]                          │
│                                                             │
│  Zasięg 32 km · Zaktualizowano 05 mar 2026, 23:26          │
│  (caption: 13px, --neutral-500)                             │
└─────────────────────────────────────────────────────────────┘

     Tabs: Wyceny (3)  ·  Pytania (1)

     Filters: [Najnowsze] [Najtańsze] [Najbliższe] [Zainteresowane]

     ┌─ Quote card (left-border variant) ─────────────────────┐
     │  │  Auto Serwis Kowalski          [Wycena] [Zainteres.]│
     │  │  1.6 km · Otrzymano 06 mar 2026, 00:11              │
     │  │                                                      │
     │  │  ─── Wycena dostępna ───                             │
     │  │                                                      │
     │  │  700 zł                                              │
     │  │  Komentarz warsztatu...                              │
     │  │  5 dni                                               │
     │  │                                                      │
     │  │  POZYCJE                                             │
     │  │  Klocki                           200 zł             │
     │  │  Silnik                           500 zł             │
     │  │                                                      │
     │  │  [Skontaktuj się]primary                             │
     └─────────────────────────────────────────────────────────┘
```

**Key changes:**
- "Zamknij" should be a danger-ghost button (red text, no border), not an equal-weight action alongside "Ukryj"
- "Więcej" / "Mniej" toggle should be a ghost button, not a distinct element
- Price display (700 zł) should be prominent: 28px, DM Sans, 700wt, `--color-neutral-900`
- Pozycje (line items) should use a clean two-column layout with right-aligned amounts and `tabular-nums`

### 6.5 Quote Card (Wycena) — Detailed Spec

The quote card is the most important component in the app — it's where the driver makes their decision. It needs to feel trustworthy and easy to scan.

```css
.quote-card {
  background: var(--color-white);
  border-radius: 16px;
  border-left: 3px solid var(--color-primary-400);
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.quote-card__price {
  font-family: var(--font-body);
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-neutral-900);
}

.quote-card__line-items {
  border-top: 1px solid var(--color-neutral-100);
  margin-top: 16px;
  padding-top: 16px;
}

.quote-card__line-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.quote-card__line-item-name {
  color: var(--color-neutral-700);
}

.quote-card__line-item-price {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-neutral-900);
}
```

---

## 7. Iconography

```
Style:          Outlined (not filled), 1.5px stroke
Size system:    16px (inline), 20px (in buttons/inputs), 24px (standalone)
Color:          Inherits text color (currentColor)
Source:         Lucide, Phosphor, or Heroicons (outline variant)
Corner radius:  Match icon library defaults (slightly rounded)
```

**Rules:**
- Never use filled/solid icons alongside outlined icons. Pick one style and use it everywhere.
- Icons should never be the primary communicator — always pair with a text label.
- Icon color should match the text it accompanies. Never use a different color for decoration.
- Remove any emoji from the UI. The current app is clean in this regard — maintain that.

---

## 8. Shadows & Elevation

```css
:root {
  --shadow-card:     0 1px 3px rgba(0, 0, 0, 0.04),
                     0 1px 2px rgba(0, 0, 0, 0.02);

  --shadow-elevated: 0 4px 12px rgba(0, 0, 0, 0.06),
                     0 1px 3px rgba(0, 0, 0, 0.04);

  --shadow-modal:    0 16px 48px rgba(0, 0, 0, 0.12),
                     0 4px 12px rgba(0, 0, 0, 0.06);

  --shadow-hover:    0 2px 8px rgba(0, 0, 0, 0.06),
                     0 1px 2px rgba(0, 0, 0, 0.04);
}
```

**Three-level elevation system:**
1. **Ground** (cards on page): `--shadow-card` — barely perceptible
2. **Raised** (dropdowns, popovers, hover state): `--shadow-elevated`
3. **Floating** (modals, dialogs): `--shadow-modal`

**Rule:** Shadows use warm-tinted rgba (green-black tinting would be ideal: `rgba(15, 31, 24, 0.08)`) rather than pure black rgba. This prevents the cold, detached look.

---

## 9. Border Radii

```css
:root {
  --radius-sm:   8px;     /* Small inputs, inline badges */
  --radius-md:   12px;    /* Input fields, thumbnails, inner elements */
  --radius-lg:   16px;    /* Cards, containers, all major surfaces */
  --radius-xl:   20px;    /* Modals, featured cards */
  --radius-full: 999px;   /* Buttons, badges, pills, avatar circles */
}
```

**Rule:** Only 5 radius values in the entire app. Never use a custom value. The most common is `--radius-lg` (16px) for all cards and containers.

---

## 10. Motion & Transitions

```css
:root {
  /* Durations */
  --duration-instant: 100ms;     /* Checkboxes, toggles */
  --duration-fast:    150ms;     /* Button hover, focus rings */
  --duration-normal:  200ms;     /* Most transitions */
  --duration-slow:    300ms;     /* Card hover, panel expand/collapse */
  --duration-reveal:  500ms;     /* Page enter, section reveal */

  /* Easings */
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);    /* Decelerate — entering */
  --ease-in-out:     cubic-bezier(0.65, 0, 0.35, 1);   /* Smooth — state changes */
}
```

**Page transitions:**
- On route change: new page content fades in (opacity 0→1, translateY 8px→0) over 300ms with `--ease-out`
- Cards within a page: stagger by 50ms each (first card at 0ms, second at 50ms, third at 100ms)

**Component transitions:**
- Button hover: `--duration-fast` `--ease-in-out`
- Card hover: `--duration-slow` `--ease-out` (shadow + translateY)
- Tab switch content: cross-fade 200ms
- Modal enter: overlay fades in 200ms, card scales from 0.96→1 + fades in over 300ms
- Dropdown open: opacity + translateY(-4px→0) over 150ms

**Rule:** Everything should feel deliberate and slightly slow. Never use springy, bouncy, or elastic easings. The aesthetic is "controlled calm", not "fun interaction".

---

## 11. Dark Mode Considerations

The current app has a dark mode toggle. Here's how to map the token system:

| Token | Light | Dark |
|-------|-------|------|
| Page background | `--neutral-50` (#F7F8F7) | `--neutral-950` (#1A1D1B) |
| Card surface | `--white` (#FFFFFF) | `--neutral-900` (#2D302E) |
| Primary text | `--neutral-900` (#2D302E) | `--neutral-75` (#F3F4F3) |
| Secondary text | `--neutral-600` (#6B706D) | `--neutral-400` (#A8ABA9) |
| Input background | `--neutral-100` (#EEEFEE) | `--neutral-800` (#3D413F) |
| Borders | `--neutral-200` (#DFE1DF) | `--neutral-700` (#52575A) |
| Primary button bg | `--primary-700` (#1E3A2F) | `--primary-400` (#5BBAA0) |
| Primary button text | white | `--primary-900` (#0F1F18) |
| Nav background | `--primary-800` (#162B23) | `--neutral-950` (#1A1D1B) |
| Accent color | `--primary-400` (#5BBAA0) | `--primary-400` (#5BBAA0) — same |

**Rule:** Use CSS custom properties for all colors and swap them at the `:root` level via a `[data-theme="dark"]` selector. Never hardcode hex values in components.

---

## 12. Accessibility

- **Color contrast:** All text must meet WCAG AA (4.5:1 for body, 3:1 for large text). The proposed palette has been calibrated for this.
- **Focus indicators:** Every interactive element must have a visible focus ring (2px `--primary-400` with 2px offset). Never use `outline: none` without a replacement.
- **Touch targets:** Minimum 44×44px on mobile for all tappable elements.
- **Form errors:** Never communicate errors through color alone. Always include text and an icon.
- **Labels:** Every input must have an associated `<label>` element. No placeholder-only fields.
- **Motion:** Respect `prefers-reduced-motion`. Disable all animations and transitions for users who request it.

---

## 13. Do's and Don'ts

### DO

- Use generous whitespace between every element. When in doubt, add more space.
- Maintain the warm neutral palette consistently — every gray should have a slight green/warm undertone.
- Use the serif font (DM Serif Display) exclusively on marketing pages. App UI stays in DM Sans.
- Let content breathe. Narrow content columns (720px) with empty space on the sides feel intentional.
- Show one primary action per screen. Guide the user toward the single most important thing.
- Use real, polished app screenshots in marketing materials — they're your best trust signal.
- Animate with restraint: slow, soft, deliberate.

### DON'T

- Don't use bold italic headlines. This is the fastest way to make the UI feel playful/startup-y.
- Don't add decorative borders (like the dashed login card border). Let shadows and background contrast do the separation.
- Don't mix warm and cool grays. Stick to the warm neutral scale.
- Don't use more than 2 badges per list item. Information overload kills scannability.
- Don't make full-width buttons on desktop. Auto-width, right-aligned or centered.
- Don't use uppercase on buttons. Sentence case only.
- Don't use shadows heavier than `--shadow-elevated` on any in-page element. Heavy shadows feel dated.
- Don't introduce new colors without adding them to the design token system first.
- Don't use different border-radius values for similar components. Cards = 16px. Inputs = 12px. Buttons = 999px. No exceptions.

---

## Appendix: CSS Variable Sheet (Copy-Paste Ready)

```css
:root {
  /* Colors - Primary */
  --color-primary-900: #0F1F18;
  --color-primary-800: #162B23;
  --color-primary-700: #1E3A2F;
  --color-primary-600: #2A5244;
  --color-primary-500: #3D7A66;
  --color-primary-400: #5BBAA0;
  --color-primary-300: #8DD4BF;
  --color-primary-200: #C2E8DA;
  --color-primary-100: #E8F5EF;
  --color-primary-50:  #F2FAF6;

  /* Colors - Neutrals */
  --color-neutral-950: #1A1D1B;
  --color-neutral-900: #2D302E;
  --color-neutral-800: #3D413F;
  --color-neutral-700: #52575A;
  --color-neutral-600: #6B706D;
  --color-neutral-500: #8A8E8B;
  --color-neutral-400: #A8ABA9;
  --color-neutral-300: #C5C8C6;
  --color-neutral-200: #DFE1DF;
  --color-neutral-100: #EEEFEE;
  --color-neutral-75:  #F3F4F3;
  --color-neutral-50:  #F7F8F7;
  --color-white:       #FFFFFF;

  /* Colors - Semantic */
  --color-success-600: #2D7A56;
  --color-success-100: #E6F4ED;
  --color-warning-600: #8B6914;
  --color-warning-100: #FDF6E3;
  --color-error-600:   #B3261E;
  --color-error-100:   #FDECEA;

  /* Typography */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body:    'DM Sans', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radii */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-card:     0 1px 3px rgba(15,31,24,0.04), 0 1px 2px rgba(15,31,24,0.02);
  --shadow-elevated: 0 4px 12px rgba(15,31,24,0.06), 0 1px 3px rgba(15,31,24,0.04);
  --shadow-hover:    0 2px 8px rgba(15,31,24,0.06), 0 1px 2px rgba(15,31,24,0.04);
  --shadow-modal:    0 16px 48px rgba(15,31,24,0.12), 0 4px 12px rgba(15,31,24,0.06);

  /* Motion */
  --duration-instant: 100ms;
  --duration-fast:    150ms;
  --duration-normal:  200ms;
  --duration-slow:    300ms;
  --duration-reveal:  500ms;
  --ease-out:     cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:  cubic-bezier(0.65, 0, 0.35, 1);

  /* Layout */
  --page-max-width:      720px;
  --page-wide-max-width: 1040px;
  --landing-max-width:   1180px;
}
```