# Mobile UI Direction — Look & Feel (Driver App)

## Overall feel
A fast, trustworthy **utility app** (banking / ride-hailing vibe): calm, clear, minimal.
Drivers are often stressed (car issue), so the UI should feel **reassuring and straightforward**, not playful.

**Design keywords**
- Clean, modern, high contrast
- Large readable type
- Plenty of whitespace
- Clear status signaling
- Subtle motion (functional, not flashy)

---

## Color system (recommended)

### Base neutrals
- **Background:** near-white (off-white) with subtle gray sections
- **Text:** near-black for primary, medium gray for secondary
- **Borders/dividers:** very light gray

### Primary brand color (choose one direction)
Pick **one** and use it consistently (buttons, highlights, links):
- ~~Blue (trust/technical) — recommended for “marketplace + money”~~
- **Green/Teal** (savings) — chosen: positioning is “cheapest repair” ✓

Avoid using red/orange as primary.

### Semantic (state) colors
Use semantic colors for statuses and actions:
- **Success:** Quote received, Interested → green
- **Warning:** Shop question waiting for driver → amber/yellow
- **Info:** Acknowledged / reviewing → blue or neutral
- **Muted:** Ignored/Dismissed/Declined → gray
- **Error:** validation failures → red (only when needed)

> Accessibility rule: never rely on color alone. Always show explicit text labels (e.g., “Question”, “Quote”).

---

## UI style and components

### Cards (core UI pattern)
Shop responses are shown as **cards**:
- Rounded corners (12–16px)
- Light shadow OR subtle border (avoid heavy shadows)
- Clear hierarchy:
  - Top: Shop name + distance
  - Middle: state + price (if present)
  - Bottom: actions

### Typography
- Prices and Shop names should be the strongest elements.
- Comments/metadata should be smaller and secondary.
- Keep line lengths short; use 2-line truncation with “More”.

### Buttons
- **Primary:** filled in brand color
- **Secondary:** outline / ghost
- **Destructive:** red text only (e.g., Close Request confirmation)

---

## Motion & effects (subtle, functional)
- Card state changes animate with **fade + small slide (4–8px)** when:
  - Quote arrives
  - Shop acknowledges
  - Question arrives
- **Pull-to-refresh** on lists (native feel)
- Use **bottom sheets** for “Answer” and “Close Request”
- Use **skeleton loading** for shop list / quotes (avoid spinners)

---

## Journey feel and screen look

## 1) Create Repair Request (3-step flow)
**Feel:** guided and calm, minimal cognitive load.

**Look**
- Stepper at top: `Car → Issue → Location`
- Each step: clean form, 1–2 sections max
- Optional fields collapsed under “More details”
- Primary CTA anchored at bottom (sticky): **Next / Submit**

**Nice touches**
- VIN field: inline validation (format)
- Attachments: thumbnail grid with “+ Add”
- Radius: slider + numeric input, with map preview

---

## 2) Home + My Requests
**Feel:** quick entry + clear overview.

**Home**
- Large CTA: **Create Repair Request**
- Below: preview of “Active Requests” (2–3 items)

**My Requests**
- Compact cards:
  - Title: car + short issue label
  - Status pill: **Open** (brand/green) or **Closed** (gray)
  - “Last update” timestamp

---

## 3) Repair Request Detail (main screen)
**Feel:** “quotes inbox” — optimized for comparison.

### Layout
- Top: collapsible **Request summary card**
  - Car (make/model/year)
  - Radius
  - Status pill
  - Menu: **Close Request** (and Edit if allowed)
- Below: **Shop cards list** (primary content)

### Shop card hierarchy
**Header**
- Shop Name (bold)
- Distance (right aligned)
- Status pill (colored + labeled)

**States**

#### Delivered (waiting)
- Muted pill: “Waiting”
- Subtext: “No response yet”
- No actions

#### Acknowledged
- Info pill: “Reviewing”
- Subtext: “Shop is preparing a quote”
- Optional subtle “activity” indicator (no percentages)

#### Question Sent
- Warning pill: “Question”
- Highlighted question preview bubble
- Actions:
  - Primary: **Answer**
  - Secondary: **Ignore**
- Visual emphasis: slight tinted background so it stands out

#### Quote Sent
- Success/brand pill: “Quote”
- Price in large type (e.g., **500–700 PLN**)
- Comment snippet (2 lines + “More”)
- Actions:
  - Primary: **Mark Interested**
  - Secondary: **Ignore**

**After Mark Interested**
- Subtle green accent (left border or background tint)
- Badge: “Interested”
- If phone shared: show **Call** button + phone number

#### Declined
- Gray pill: “Declined”
- Card can be collapsed by default (optional)
- No actions

### Sorting & filtering (simple)
- Chips above list:
  - Sort: Cheapest / Closest / Newest
  - Filter: Interested

---

## 4) Shop Q&A Thread
**Feel:** lightweight async chat focused on clarity.

**Look**
- Standard chat layout (no reactions/gifs)
- Shop bubbles: light gray
- Driver bubbles: brand-tinted
- If a shop asked a question: optional pinned “Needs your answer” banner at top
- Input bar:
  - Text field
  - Attachment icon (optional)
  - Send button (enabled only with text/attachment)

---

## Accessibility & polish rules
- Contrast: minimum 4.5:1 for text
- Tap targets: 44px+
- State text labels always visible (“Question”, “Quote”, etc.)
- Prices always readable at a glance
- Use consistent spacing (8pt grid recommended)