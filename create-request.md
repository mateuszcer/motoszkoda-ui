# PLAN: Match Create Request Flow to Mockup

## Context

The create-request flow (`CreateRepairRequestFlow.tsx`) works functionally but its visual design diverges from the mockup in `autoceny_create_request_flow.html`. The mockup defines a precise layout with breadcrumb topbar, subtitle, 2-column grid fields, vehicle summary card between steps, and a summary box on step 3. This plan brings the JSX and CSS in line with the mockup — pixel-for-pixel.

Reference: `autoceny_create_request_flow.html` (3 screens toggled via tabs at top)

---

## Changes

### 1. Topbar breadcrumb for create-request screen

**What the mockup shows (line 68):**
Left: back arrow → "Przegląd" (gray link) → chevron → "Nowe zlecenie" (bold black)
Right: "Anuluj" button (small secondary) + avatar

**Current state:** All driver screens share one `<AppTopbar>` with `searchPlaceholder`. No breadcrumb, no cancel button in topbar.

**Fix — `src/App.tsx`:**
When `screen === 'create-request'`, pass `breadcrumb` prop to `<AppTopbar>` instead of `searchPlaceholder`:
```jsx
<AppTopbar
  breadcrumb={[
    { label: t('sidebar.overview'), onClick: () => navigate('home') },
    { label: t('form.newRequest') },
  ]}
  userInitials={driverInitials}
  onMenuToggle={() => setSidebarOpen((p) => !p)}
  rightSlot={
    <button className="btn btn-secondary btn-compact-sm" onClick={() => navigate('home')}>
      {t('common.cancel')}
    </button>
  }
/>
```

This uses the existing `breadcrumb` prop and `rightSlot` prop already built into `AppTopbar`. No changes needed to AppTopbar itself.

---

### 2. Remove page-header cancel button from flow, add subtitle

**What the mockup shows (lines 71-72):**
- Title: "Nowe zlecenie" (20px, weight 500)
- Subtitle: "Opisz usterkę i otrzymaj wyceny od warsztatów w okolicy" (13px, gray-500)
- NO cancel button in the page-header (it moved to topbar in change 1)

**Current state (line 237-244):** `page-header` has title + cancel button, no subtitle.

**Fix — `src/components/CreateRepairRequestFlow.tsx`:**
Replace the page-header block:
```jsx
<div className="page-header">
  <div>
    <h1 className="page-title">{t('form.newRequest')}</h1>
    <p className="page-subtitle">{t('form.newRequestSubtitle')}</p>
  </div>
</div>
```

Remove the `onCancel` prop from component interface (it's now handled by App.tsx topbar). Remove the cancel button JSX.

**i18n — add `form.newRequestSubtitle` to all 3 locales:**
- PL: `"Opisz usterkę i otrzymaj wyceny od warsztatów w okolicy"`
- EN: `"Describe the issue and get quotes from nearby shops"`
- DE: `"Beschreiben Sie das Problem und erhalten Sie Angebote von Werkstätten"`

---

### 3. Step 1 — 2-column grid layout for car fields

**What the mockup shows (lines 82-107):**
- Card section title: "Dane pojazdu" (14px, weight 500)
- VIN field full-width with monospace font, hint text "(opcjonalny — pomaga w dokładnej wycenie)"
- Make + Model in 2-column grid
- Variant + Year in 2-column grid
- "Więcej szczegółów (silnik, przebieg)" toggle link with plus icon at bottom
- "Dalej" button right-aligned with right arrow, NOT full-width

**Current state:** All fields stacked vertically, full-width. Next button is full-width. No grid. Section title is generic h3.

**Fix — `src/components/CreateRepairRequestFlow.tsx` step 1:**

a) VIN field — add monospace styling via existing `font-mono` class pattern:
```jsx
<input className="form-input" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.5px' }} ... />
```
Update VIN label hint to show `(opcjonalny — pomaga w dokładnej wycenie)` — add i18n key `form.vinHint`.

b) Wrap Make + Model in a 2-col grid div:
```jsx
<div className="form-grid-2">
  <div className="form-group">...</div> {/* Make */}
  <div className="form-group">...</div> {/* Model */}
</div>
```

c) Wrap Variant + Year in a 2-col grid div (same class).

d) The "More details" toggle link — add a plus icon SVG before text.

e) Bottom buttons — right-align "Dalej" with arrow icon, not full-width:
```jsx
<div className="flow-actions">
  <div className="u-flex-1" />
  <button className="btn btn-primary" onClick={handleNext}>
    {t('common.next')}
    <svg ...arrow-right... />
  </button>
</div>
```

**CSS — `src/App.css`:**
```css
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.flow-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--gray-200);
}
```

---

### 4. Step 2 — Vehicle summary card + issue form inside card

**What the mockup shows (lines 139-176):**

**Vehicle summary card** (separate card above the issue card):
- 40x40 rounded icon with car initials
- "Audi A3 Sportback" (14px, weight 500) + "2019 · VIN: WAUZZ...1234" (12px, gray-500)
- "Zmień" link on right (teal, 12px, weight 500, calls setStep(1))

**Issue card:**
- Section title: "Opis usterki" (14px, weight 500)
- Category label: "Kategoria" → cat-pill grid (tags)
- Description label: "Co się dzieje z samochodem?" → textarea
- Photos label with optional hint → upload-zone with icon + instructions

**Current state:** No vehicle summary card. Issue form fields are all there but upload-zone is just text, no icon/instructions.

**Fix — `src/components/CreateRepairRequestFlow.tsx` step 2:**

a) Add vehicle summary card before the issue card:
```jsx
<div className="card flow-summary-card">
  <div className="vehicle-icon-lg">{make.substring(0, 2).toUpperCase()}</div>
  <div className="u-flex-1">
    <div className="vehicle-name" style={{ fontSize: 14 }}>{make} {model} {variant}</div>
    <div className="vehicle-desc">{year}{vin ? ` · VIN: ${vin.substring(0, 5)}...${vin.slice(-4)}` : ''}</div>
  </div>
  <button className="view-link" onClick={() => setStep(1)}>{t('form.change')}</button>
</div>
```

b) Reorder issue fields to match mockup: category tags FIRST, then description textarea, then photos.

c) Upload zone — replace plain text with icon + two lines of text:
```jsx
<label className="upload-zone" htmlFor="issue-file-input">
  <svg ...image-icon... />
  <div className="upload-zone__title">{t('form.uploadTitle')}</div>
  <div className="upload-zone__hint">{t('form.uploadHint')}</div>
</label>
```

d) Bottom buttons — "Wstecz" (secondary with left arrow) left, "Dalej" (primary with right arrow) right:
```jsx
<div className="flow-actions">
  <button className="btn btn-secondary" onClick={() => setStep(1)}>
    <svg ...arrow-left... />
    {t('common.back')}
  </button>
  <div className="u-flex-1" />
  <button className="btn btn-primary" onClick={handleNext}>
    {t('common.next')}
    <svg ...arrow-right... />
  </button>
</div>
```

**CSS — `src/App.css`:**
```css
.flow-summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}

.upload-zone__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-900);
}

.upload-zone__hint {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 4px;
}
```

**i18n — add keys:**
- `form.change` — PL: "Zmień", EN: "Change", DE: "Ändern"
- `form.uploadTitle` — PL: "Przeciągnij zdjęcia lub kliknij aby wybrać", EN: "Drag photos or click to select", DE: "Fotos hierher ziehen oder klicken"
- `form.uploadHint` — PL: "JPG, PNG do 10 MB", EN: "JPG, PNG up to 10 MB", DE: "JPG, PNG bis zu 10 MB"
- `form.vinHint` — PL: "opcjonalny — pomaga w dokładnej wycenie", EN: "optional — helps with accurate quotes", DE: "optional — hilft bei genauen Angeboten"

---

### 5. Step 3 — Vehicle+issue summary card + summary box + submit button

**What the mockup shows (lines 209-246):**

**Combined summary card** (top, separate card):
- Same 40x40 icon + vehicle info
- Second line: "Elektryka · Akumulator się rozładowuje" (category + description truncated)
- Category badge pill on right

**Location card:**
- Section title: "Zasięg i lokalizacja" (14px, weight 500)
- 2-column grid: "Zasięg szukania" (select) + "Twoja lokalizacja" (input + map pin button)
- Map placeholder below

**Summary box** (gray background, not a card):
- Title: "Podsumowanie zlecenia" (overline label)
- Key-value rows: Pojazd, Kategoria, Opis, Zasięg, Zdjęcia
- Separated by 0.5px borders

**Bottom actions:** "Wstecz" left, helper text + "Wyślij zlecenie" (with send icon) right

**Current state:** Step 3 is entirely in `LocationStep.tsx` — no vehicle summary, no summary box, submit button is full-width.

**Fix — `src/components/CreateRepairRequestFlow.tsx` step 3:**

Replace the `<LocationStep>` render with inline content that includes:

a) Vehicle+issue summary card (similar to step 2 but with category badge)

b) Keep the `LocationStep` component BUT refactor its buttons out — pass the location fields inline and handle the submit button externally. Actually, since `LocationStep` is complex (autocomplete, map, radius), keep it but:
- Add a `hideActions` prop to `LocationStep` so the flow can render its own bottom bar
- OR extract just the form fields portion

The simpler approach: wrap `LocationStep` in the card and add the summary card and summary box around it. Modify `LocationStep` to accept a `hideActions?: boolean` prop and conditionally hide its `.sticky-cta` div.

c) Add summary box after the location card:
```jsx
<div className="summary-box">
  <div className="summary-box__title">{t('form.orderSummary')}</div>
  <div className="summary-row">
    <span className="summary-row__label">{t('home.colVehicle')}</span>
    <span className="summary-row__value">{make} {model} {variant} ({year})</span>
  </div>
  ...repeat for category, description, range, photos...
</div>
```

d) Bottom actions with send icon:
```jsx
<div className="flow-actions">
  <button className="btn btn-secondary" onClick={() => setStep(2)}>
    <svg ...arrow-left... />
    {t('common.back')}
  </button>
  <div className="u-flex-1" />
  <span className="u-text-muted" style={{ fontSize: 13 }}>{t('form.submitHint')}</span>
  <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
    <svg ...send-icon... />
    {isSubmitting ? t('form.submitting') : t('form.submitRequest')}
  </button>
</div>
```

**CSS — `src/App.css`:**
```css
.summary-box__title {
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
  margin-bottom: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.summary-row + .summary-row {
  border-top: 1px solid var(--gray-200);
}

.summary-row__label {
  color: var(--gray-500);
}

.summary-row__value {
  font-weight: 500;
  text-align: right;
  max-width: 300px;
}
```

**i18n — add keys:**
- `form.orderSummary` — PL: "Podsumowanie zlecenia", EN: "Request summary", DE: "Zusammenfassung"
- `form.submitHint` — PL: "Zlecenie trafi do warsztatów w okolicy", EN: "The request will reach nearby shops", DE: "Die Anfrage erreicht Werkstätten in der Nähe"
- `form.noPhotos` — PL: "Brak", EN: "None", DE: "Keine"

---

### 6. Card padding consistency

**Mockup:** All step cards use `padding: 20px`.

**Current:** Card uses `style={{ padding: 'var(--space-5)' }}` which is `20px`. This is correct.

No change needed.

---

## Files to modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Pass breadcrumb + cancel rightSlot to AppTopbar when `screen === 'create-request'` |
| `src/components/CreateRepairRequestFlow.tsx` | Remove cancel from page-header, add subtitle, 2-col grids, vehicle summary cards, reorder issue fields, update upload-zone, update button layout with arrows/icons, add summary box on step 3 |
| `src/components/LocationStep.tsx` | Add `hideActions` prop to conditionally hide the built-in button bar |
| `src/App.css` | Add `.form-grid-2`, `.flow-actions`, `.flow-summary-card`, `.upload-zone__title`, `.upload-zone__hint`, `.summary-box__title`, `.summary-row`, `.summary-row__label`, `.summary-row__value` |
| `src/locales/en.json` | Add `form.newRequestSubtitle`, `form.vinHint`, `form.change`, `form.uploadTitle`, `form.uploadHint`, `form.orderSummary`, `form.submitHint`, `form.noPhotos` |
| `src/locales/pl.json` | Same keys as EN with Polish translations |
| `src/locales/de.json` | Same keys as EN with German translations |

## Verification

1. `npm run build` — passes
2. `npm run lint` — 0 errors
3. `npm test` — all pass
4. Visual step 1: breadcrumb topbar ("Przegląd > Nowe zlecenie"), cancel in topbar, subtitle, VIN monospace full-width, Make+Model 2-col, Variant+Year 2-col, right-aligned "Dalej" button with arrow
5. Visual step 2: vehicle summary card with initials+info+"Zmień", category pills first, textarea second, upload-zone with icon+text, "Wstecz"/"Dalej" buttons with arrows
6. Visual step 3: vehicle+issue summary card with badge, location card with 2-col grid, summary box with key-value rows, "Wstecz" + "Wyślij zlecenie" with send icon
7. All 3 locales have new keys
