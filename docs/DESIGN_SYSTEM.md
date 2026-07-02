# Design System — Visual Source of Truth

> Read this before writing any UI code. Tokens here are the only source of color,
> type, spacing, radius, and shadow values — never hand-pick a hex or px in a
> component. If a value you need isn't here, add it here first, then use it.

---

## 1. Brand direction

**Working name (platform chrome only): "ديوان" (Diwan).** A *diwan* is the historic
Arabic/Ottoman term for an administrative bureau — a register of people, dues, and
decisions. It signals trust, order, and official record-keeping without borrowing
Western SaaS branding clichés. Diwan appears only on the login screen, the
super-admin panel, and marketing pages. **Inside a school's own workspace, the
school's own name and identity lead** — this is a white-label multi-tenant product;
admins, teachers, and parents should feel they're using *their school's* system, not
a third-party vendor's.

**Personality:** calm, precise, quietly confident. Never playful/toy-like (this
product touches children's records and household money), never cold/clinical
(users are modest-tech-skill parents and teachers, not developers).

**Three rules that keep it calm:**
1. **One accent color** does all the "this is interactive / this is the brand"
   work (see §5). Everything else is neutral ink and semantic color used *only*
   for its meaning (success/warning/danger/info) — never decoration.
2. **Progressive disclosure.** The default view of any screen shows the minimum
   needed to make the next decision (Linear, Stripe). Advanced filters, bulk
   actions, and settings sit one click away, not on the surface.
3. **Numbers are the product.** Attendance %, fee balances, grades — financial and
   academic data reads as a well-organized ledger: tight data rows inside
   generously spaced chrome (Stripe's "controlled density").

---

## 2. Research references

Concrete references consulted, and exactly what this system borrows from each:

| Reference | What we borrow |
|---|---|
| **Linear** (linear.app) | Ultra-minimal issue-list density model → our recent-activity list and student table. Progressive disclosure: default screen shows a clean list with status indicators, no charts unless asked. Muted neutral palette + exactly one accent hue carrying all interactive weight. |
| **Stripe Dashboard** | "Controlled density": generously spaced chrome *around* tightly packed financial tables. Near-monochrome canvas with a single saturated accent reserved for primary actions. Direct model for our fee/payment table and receipt views. |
| **Vercel** | High-contrast dark mode that relies on borders and surface-elevation steps rather than heavy drop shadows; geometric, restrained type scale. Basis for our dark-mode elevation rule (§6). |
| **shadcn/ui + Tailwind v4 theming** | The CSS-variable contract itself — `:root` / `.dark` blocks, `--background`/`--foreground`/`--primary` naming, `@theme inline` token exposure. We ship tokens in this exact shape so `apps/web` can drop them in unmodified. |
| **Arabesq — Free Arabic Design System (Figma)** | Confirms Arabic-first UI needs its own type-scale tuning (taller line-height, different vertical rhythm) rather than reusing a Latin scale unchanged — validated our §3 type-scale decision. |
| **TailAdmin / Muzli 2026 dashboard surveys** | KPI stat-tile anatomy (label → value → delta → sparkline) and 4-up KPI row layout used in §7's component inventory and enforced via the `dataviz` skill (§5.4). |
| **Madrasati (مدرستي, Saudi MOE) & Noon Academy** | Confirms Arabic-first education platforms wireframe in Arabic/RTL first, not translated after the fact, and give parents a dedicated, simplified read-only view — informs our "parent" role screens (out of scope for this mockup, noted for `apps/web`). |
| **Iraq/Gulf numeral-usage research** | Eastern Arabic-Indic digits (٠١٢٣) and Western digits (0123) both circulate in Iraq; apps that hard-code one break compatibility with system dialers/inputs. Resolved as an explicit numeral rule in §3.4. |

---

## 3. Localization & typography

The product ships **three runtime-switchable locales**: `ar` (Arabic, RTL,
default), `ckb` (Central Kurdish/Sorani, RTL, Arabic script), `en` (English, LTR).

### 3.1 Font choice — verified for all three scripts

Sorani uses several Arabic-script letters that most commercial "Arabic" webfonts
quietly omit because they're built for Modern Standard Arabic only: **ە ڕ ڵ ۆ ێ پ
چ گ ڤ**. This was checked, not assumed, before picking a typeface:

- **IBM Plex Sans Arabic** — rejected. It's an excellent MSA UI face, but has an
  open, unresolved upstream bug specifically about Central Kurdish rendering
  (`google/fonts#7089`, `IBM/plex#597`) — falls back to Arial for some Sorani
  letters, requiring ZWNJ workarounds. Not acceptable for a first-class `ckb` locale.
- **Cairo / Tajawal / Almarai** — same category of risk: built for Gulf/MSA
  commercial use, Kurdish is at best undocumented, and Google's own font tracker
  (`google/fonts#734`, "Add Kurdish language support") lists most Arabic web
  families as needing work here.
- **Noto Sans Arabic** — **chosen.** Google's reference-coverage family for the
  Arabic Unicode block (0600–06FF) in full, which is where every Sorani-specific
  letter above already lives (not even an "extended" block) — Noto's whole design
  mandate is "no missing glyph." Variable font, weights 100–900, actively
  maintained. Used for both `ar` and `ckb`.
- **Vazirmatn** — kept as the **fallback**, not primary. Its own changelog (v27+)
  explicitly lists Kurdish as a supported language, so it's a real safety net, not
  a guess. Slightly warmer/more geometric than Noto if a future rebrand wants more
  personality.
- **Inter** — chosen for **Latin/English**. No Arabic coverage (pure Latin/Greek/
  Cyrillic), which is fine — it never has to render Arabic. Matches the
  Linear/Vercel-style neutral grotesque research target, huge x-height (reads well
  small on 3G-loaded weak devices), true variable weights, tabular figures for
  tables.

**Font stacks (CSS):**

```css
--font-arabic: "Noto Sans Arabic", "Vazirmatn", Tahoma, sans-serif;   /* ar, ckb */
--font-latin:  "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif; /* en */
/* default document stack — Arabic-script first since ar is the default locale;
   Latin fallback catches embedded English/brand names inside ar/ckb copy */
--font-sans: "Noto Sans Arabic", "Inter", ui-sans-serif, system-ui, sans-serif;
```

Set `--font-sans` → `--font-latin` at the `html[dir="ltr"][lang="en"]` root so
English pages lead with Inter (better Latin hinting/kerning than Noto's Latin
subset) while still falling back to Noto Sans Arabic for any Arabic-script content
(names, brand strings) that appears inside an English screen.

### 3.2 Type scale — tuned per script, not shared blindly

Arabic script runs visually smaller than Latin at the same `font-size` and needs
more vertical room for diacritics, ligatures, and descenders. Reusing a Latin
line-height for Arabic is the single most common Arabic-UI mistake (confirmed
against the Arabesq reference, §2).

| Token | Size | Latin (`en`) line-height | Arabic/Kurdish (`ar`/`ckb`) line-height | Weight |
|---|---|---|---|---|
| `--text-xs` | 12px | 1.5 | 1.7 | 400 |
| `--text-sm` | 14px | 1.5 | 1.7 | 400 |
| `--text-base` | 16px | 1.55 | 1.75 | 400 |
| `--text-lg` | 18px | 1.5 | 1.7 | 500 |
| `--text-xl` | 20px | 1.4 | 1.6 | 600 |
| `--text-2xl` | 24px | 1.35 | 1.55 | 600 |
| `--text-3xl` | 30px | 1.3 | 1.5 | 700 |
| `--text-4xl` | 36px | 1.2 | 1.4 | 700 |

Rule: `html[lang="ar"], html[lang="ckb"] { --lh-scale: 1; }` /
`html[lang="en"] { --lh-scale: 0.88; }` multiplied against a shared base
line-height table — implemented once in `globals.css`, never per-component.

### 3.3 Numerals

Both Eastern Arabic-Indic digits (٠١٢٣…) and Western digits (0123…) circulate in
Iraq (banknotes and Qurans use Eastern; most software, receipts, and phone dialers
expect Western). **Rule: render all UI numerals as Western digits (0–9) app-wide**
— money, dates, IDs, phone numbers, scores — for table alignment, thousands-comma
grouping, and compatibility with copy-paste into phone dialers and payment apps.
This is a deliberate override of the OS locale's default numbering system:

```css
/* Force Western digits even when the browser's ar/ckb locale would render
   Eastern Arabic-Indic by default */
html[lang="ar"], html[lang="ckb"] { font-variant-numeric: normal; }
```
…and format numbers in JS with `Intl.NumberFormat("en-u-nu-latn", …)` regardless
of the active locale, so `1,284` never silently becomes `١,٢٨٤`.

**Bidi safety:** always wrap a number+currency group in `<bdi dir="ltr">` (or CSS
`unicode-bidi: isolate`) when it's embedded inside Arabic/Kurdish sentence text —
otherwise the Arabic bidi algorithm can visually reorder a value like `IQD 1,500`
into a reversed, unreadable sequence. This is a real, frequently-shipped Arabic RTL
bug, not a hypothetical.

**Figures:** proportional figures for stat-tile values / hero numbers; switch to
`font-variant-numeric: tabular-nums` only inside table columns and axis ticks that
must align vertically (per the `dataviz` skill's mark spec).

---

## 4. LTR mode (`en` locale)

The layout is built with **CSS logical properties exclusively**
(`margin-inline-start/end`, `inset-inline-start/end`, `padding-inline`, `text-align:
start/end` — never `left`/`right`), so flipping `dir="rtl"` → `dir="ltr"` on
`<html>` re-mirrors the whole shell automatically. What changes when a user
switches to English:

- **Sidebar physically moves from the right edge (`ar`/`ckb`) to the left edge
  (`en`)** — for free, with zero extra code: the sidebar is pinned to
  `inset-inline-start`, and logical `inline-start` **is** the right edge under
  `dir="rtl"` and the left edge under `dir="ltr"` by definition. Never hard-code
  which physical side the sidebar sits on.
- **Topbar order mirrors**: logo/brand at inline-start, search + notifications +
  language switcher + avatar at inline-end, in both modes — the *order* never
  changes, only which physical side is "start."
- **Directional icons flip; non-directional icons don't.** Back/forward chevrons,
  the "send message" arrow, expand/collapse carets on nested nav, breadcrumbs
  separators — all mirror. Bell, gear/settings, search magnifier, calendar,
  print, download — stay as-is; they have no inherent direction.
- **Text alignment**: `start` (right in ar/ckb, left in en) for body copy and
  labels; numeric table columns stay aligned to the **end** edge in both modes
  (financial-table convention: magnitude reads by column regardless of script
  direction).
- **Type scale**: swap to the Latin line-height column in §3.2 (tighter — Latin
  needs less vertical room than Arabic script at the same size).
- **Kurdish (`ckb`) behaves exactly like Arabic layout-wise** (RTL, same logical
  properties, same sidebar side) — only the font glyph selection differs, never
  the layout math.
- Numerals, currency formatting, and the `<bdi>` bidi-isolation rule (§3.3) are
  unchanged in `en` — there's no bidi risk in a fully-LTR sentence, but keep the
  wrapper for shared components that render in all three locales.

---

## 5. Color system

Every color below is a hex value verified against **WCAG AA** with the actual
pairing it ships in (surface it renders on, not a generic white/black check).
Contrast figures were computed with the `dataviz` skill's validator, not eyeballed.

### 5.1 Neutrals (warm gray — Tailwind "Stone" scale, contrast-proven)

| Step | Hex | Primary use |
|---|---|---|
| 50 | `#fafaf9` | Light-mode page background |
| 100 | `#f5f5f4` | Light-mode subtle fill (input bg, hover) |
| 200 | `#e7e5e4` | Light-mode border |
| 300 | `#d6d3d1` | Light-mode disabled border / divider (heavier) |
| 400 | `#a8a29e` | Placeholder text (light) / secondary text (dark) |
| 500 | `#78716c` | Muted text **on base bg only** (white/50) — 4.5–4.8:1 |
| 600 | `#57534e` | Muted text **on a tinted/muted fill** (stone-100/800) — required there, 6.99:1; also secondary text default |
| 700 | `#44403c` | Headings, strong secondary text (light) |
| 800 | `#292524` | Dark-mode subtle fill (input bg, hover), dark-mode border |
| 900 | `#1c1917` | Dark-mode card/surface |
| 950 | `#0c0a09` | Dark-mode page background |

**Rule:** stone-500 is AA-safe on the page background (white/stone-50) but drops
to **4.40:1 — below AA** on a stone-100 fill (a card's muted chip, an input's
placeholder-on-gray). On any muted *fill*, step up to stone-600. Never use
stone-500 as "safe everywhere" muted text.

### 5.2 Primary — teal (brand accent, the one saturated color)

Chosen over the more generic SaaS azure/indigo (Stripe, Linear) to read distinct
and calmer — closer to the blue-green of historic Baghdad/Samarra tilework than a
generic "tech blue," without becoming a themed/decorative choice.

| Step | Hex | Use |
|---|---|---|
| 50 | `#EEFAFB` | Soft badge/tint background |
| 100 | `#D3F1F3` | Hover fill on ghost buttons |
| 200 | `#A8E2E6` | Selected-row tint |
| 300 | `#74CCD2` | Chart/illustration accent (light) |
| 400 | `#3FADB6` | — |
| 500 | `#1D8D98` | Icon accent, focus outline core |
| 600 | `#14808F` | **Dark-mode primary button fill** — white text 4.65:1, ≥3:1 vs dark surfaces |
| 700 | `#0D6E7D` | **Light-mode primary button fill** — white text 5.93:1 on white |
| 800 | `#0A5560` | Pressed/active state (light) |
| 900 | `#073E46` | — |

`--primary-foreground` is `#ffffff` in **both** modes (verified above — this is
one of the few tokens that does not flip).

### 5.3 Semantic (success / warning / danger / info)

Each ships a light-mode text color (on base bg), a light-mode soft-tint pairing
(bg + text, both verified together), a dark-mode text color, and a solid-button
pairing. Status color is **never** the only signal — always paired with an icon
and/or label (WCAG 1.4.1, and required by the `dataviz` skill's status rule).

| Role | Light text (on white/50) | Light soft bg | Light text-on-soft | Dark text (on stone-900/950) | Solid-button fill (light) | Solid-button text |
|---|---|---|---|---|---|---|
| Success | `#15803D` (5.02:1) | `#EFFBF3` | `#15803D` (4.72:1) | `#22C55E` (7.7–8.7:1) | `#15803D` | `#ffffff` (5.02:1) |
| Warning | `#A15C00` (5.19:1) | `#FEF6E7` | `#A15C00` (4.83:1) | `#F5A524` (8.6–9.7:1) | `#A15C00` | `#ffffff` (5.19:1) |
| Danger | `#C31E1E` (5.96:1) | `#FEF0EF` | `#C31E1E` (5.37:1) | `#F87171` (6.3–7.1:1) | `#C31E1E` | `#ffffff` (5.96:1) |
| Info | `#1D4ED8` (6.70:1) | `#EBF1FE` | `#1D4ED8` (5.92:1) | `#60A5FA` (6.9–7.8:1) | `#1D4ED8` | `#ffffff` (6.70:1) |

Dark-mode **solid** buttons invert the text color instead of reusing white — the
dark-mode semantic hues are bright/light, so pair them with near-black text
(`#0c0a09`, 7.1–9.7:1 across all four) rather than white, mirroring how the
primary teal is handled in dark mode.

### 5.3.1 Dark-mode soft tints (provisional)

`apps/web`'s dark-mode `-soft` background tokens (status pills/badges, KPI icon
chips, activity-feed dots — `bg-X-soft text-X`, the same pairing pattern as the
light-mode soft tints above) were hand-picked during scaffolding and are **not**
in the table above; §5.3 only documents a light-mode soft-bg column. Documenting
them here now per the design system's own rule ("never hand-pick a hex... add it
here first, then use it") — **provisional, pending designer ratification**, not
yet promoted into §5.3 as a first-class column.

Each pairs the dark soft background with that same role's **dark text** color
from the table above (the bright/light dark-mode semantic hue, e.g. success
`#22C55E`) — not a separate soft-specific text color. Contrast computed with the
same WCAG relative-luminance method as the rest of §5 (foreground vs. the soft
background it actually renders on, not a generic check):

| Role | Dark soft bg | Paired text (role's dark text, from §5.3) | Contrast |
|---|---|---|---|
| Success | `#12241a` | `#22C55E` | 7.13:1 |
| Warning | `#2a2013` | `#F5A524` | 7.83:1 |
| Danger | `#2a1414` | `#F87171` | 6.28:1 |
| Info | `#16233a` | `#60A5FA` | 6.18:1 |

All four clear WCAG AA (4.5:1) with comfortable margin; success and warning also
clear AAA (7:1). No change needed for a11y — this table exists so these values
have a documented source of truth instead of living only as unexplained hexes in
`globals.css`, and so a designer can review/adjust the hue before more surfaces
start depending on them.

### 5.4 Chart / dataviz palette

Built and validated via the `dataviz` skill (see skill's `references/palette.md`
for the full method). **Chart colors are intentionally a separate hue set from the
brand primary** — slot 1 is blue, not teal. This is correct, not an inconsistency:
mixing the brand accent into multi-series charts would make "this is clickable"
and "this is series 3" collide.

Categorical (8 fixed slots, fixed order — never re-cycled), re-validated against
this system's actual card surfaces (white light / `#1c1917` dark):

| Slot | Hue | Light (on `#ffffff`) | Dark (on `#1c1917`) |
|---|---|---|---|
| 1 | blue | `#2a78d6` | `#3987e5` |
| 2 | aqua | `#1baf7a` | `#199e70` |
| 3 | yellow | `#eda100` | `#c98500` |
| 4 | green | `#008300` | `#008300` |
| 5 | violet | `#4a3aa7` | `#9085e9` |
| 6 | red | `#e34948` | `#e66767` |
| 7 | magenta | `#e87ba4` | `#d55181` |
| 8 | orange | `#eb6834` | `#d95926` |

**Both re-runs pass**, with two relief obligations that must ship, not optional
polish:
- **Light mode**: aqua (2.82:1), yellow (2.17:1), and magenta (2.69:1) sit below
  3:1 on a white card. Ship visible direct labels or a table-view toggle for any
  chart using these slots — never color-alone.
- **Dark mode**: worst adjacent CVD pair (green↔yellow) sits at ΔE 10.3 — inside
  the legal 8–12 floor band, not the 12+ target. Any chart with 4+ series in dark
  mode needs direct labels (already required past 3 series per the skill) or
  texture, not color alone.

Status color on charts (e.g., an attendance-rate gauge) uses §5.3's tokens, never
the categorical slots — a status color must never impersonate a series.

Sequential (magnitude, e.g. a heatmap of attendance by section): single hue, blue,
light→dark, steps 100→700 — see skill's `palette.md` for the full ramp; reuse
categorical slot-1 blue as the anchor.

Diverging (e.g., fee-collection surplus/deficit vs. target): blue ↔ red, neutral
gray midpoint (`#f0efec` light / `#383835` dark).

### 5.5 KPI stat tiles — color discipline

Per the `dataviz` skill's stat-tile contract and explicitly re-checked here: **the
four KPI cards are neutral by default.** Color is not decoration — it lives only
on the **delta**, and only when direction has a value judgment:

- الطلبة (student count) — neutral icon, no delta color (a raw headcount has no
  "good/bad" direction by itself).
- الحضور اليوم (today's attendance) — delta green if today's rate ≥ trailing
  average, red if below.
- الأقساط المحصلة (fees collected) — delta green when collected ↑ vs. the
  comparison period.
- الرسائل (messages) — neutral count; an unread-count badge may use info-tint,
  never success/danger (an unread message is not inherently good or bad).

Never assign four different decorative hues to four KPI card icons "for visual
interest" — that is exactly the anti-pattern the skill and this rule exist to
prevent.

---

## 6. Design tokens (spacing, radius, shadow)

**Spacing:** standard 4px base scale (Tailwind's default `0.25rem` steps) — not
reinvented. Semantic aliases for the pieces used repeatedly:

```
--space-page-gutter: 1.5rem;   /* 24px mobile */
--space-page-gutter-lg: 2rem;  /* 32px ≥1024px */
--space-card-padding: 1.25rem; /* 20px */
--space-kpi-gap: 1rem;         /* 16px between KPI cards */
```

**Radius:** one base token, everything else derived — friendlier than a sharp
enterprise 4px, calmer than a playful 20px:

```
--radius: 0.75rem; /* 12px */
```

**Shadows:** subtle in light mode; in dark mode elevation comes from a lighter
surface step + a hairline border, **not** a heavier shadow (Vercel/Linear pattern
— shadows barely read on dark backgrounds and just look muddy).

```
--shadow-sm: 0 1px 2px 0 rgb(28 25 23 / 0.05);
--shadow-md: 0 2px 8px -2px rgb(28 25 23 / 0.08), 0 1px 2px -1px rgb(28 25 23 / 0.06);
--shadow-lg: 0 8px 24px -6px rgb(28 25 23 / 0.12), 0 2px 6px -2px rgb(28 25 23 / 0.06);
/* dark mode: shadows drop to near-zero; border + surface step carries elevation */
--shadow-sm-dark: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md-dark: 0 2px 8px -2px rgb(0 0 0 / 0.35);
--shadow-lg-dark: 0 8px 24px -6px rgb(0 0 0 / 0.45);
```

### 6.1 CSS variables — ready to paste into `apps/web/src/app/globals.css`

Tailwind CSS v4 + shadcn/ui naming, `:root` (light) and `.dark` blocks. Values are
plain hex (not `oklch()`) for exact auditability against the contrast figures
above — functionally equivalent, convert to `oklch()` later if desired, the pairs
won't change.

```css
:root {
  --radius: 0.75rem;

  /* base surfaces */
  --background: #fafaf9;
  --foreground: #1c1917;
  --card: #ffffff;
  --card-foreground: #1c1917;
  --popover: #ffffff;
  --popover-foreground: #1c1917;

  /* brand */
  --primary: #0D6E7D;
  --primary-foreground: #ffffff;
  --secondary: #f5f5f4;
  --secondary-foreground: #292524;

  /* neutrals */
  --muted: #f5f5f4;
  --muted-foreground: #57534e; /* stone-600: safe on --muted; use stone-500 (#78716c) only directly on --background */
  --accent: #EEFAFB;
  --accent-foreground: #0D6E7D;

  /* semantic */
  --destructive: #C31E1E;
  --destructive-foreground: #ffffff;
  --success: #15803D;
  --success-foreground: #ffffff;
  --warning: #A15C00;
  --warning-foreground: #ffffff;
  --info: #1D4ED8;
  --info-foreground: #ffffff;

  /* chrome */
  --border: #e7e5e4;
  --input: #e7e5e4;
  --ring: #1D8D98;

  /* charts */
  --chart-1: #2a78d6;
  --chart-2: #1baf7a;
  --chart-3: #eda100;
  --chart-4: #008300;
  --chart-5: #4a3aa7;
  --chart-6: #e34948;
  --chart-7: #e87ba4;
  --chart-8: #eb6834;

  /* sidebar (right-side in ar/ckb, left in en — positioned via logical properties) */
  --sidebar: #ffffff;
  --sidebar-foreground: #1c1917;
  --sidebar-primary: #0D6E7D;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f5f5f4;
  --sidebar-accent-foreground: #292524;
  --sidebar-border: #e7e5e4;
  --sidebar-ring: #1D8D98;

  /* fonts */
  --font-sans: "Noto Sans Arabic", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-arabic: "Noto Sans Arabic", "Vazirmatn", Tahoma, sans-serif;
  --font-latin: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.dark {
  --background: #0c0a09;
  --foreground: #fafaf9;
  --card: #1c1917;
  --card-foreground: #fafaf9;
  --popover: #1c1917;
  --popover-foreground: #fafaf9;

  --primary: #14808F;
  --primary-foreground: #ffffff;
  --secondary: #292524;
  --secondary-foreground: #f5f5f4;

  --muted: #292524;
  --muted-foreground: #a8a29e;
  --accent: #073E46;
  --accent-foreground: #A8E2E6;

  --destructive: #F87171;
  --destructive-foreground: #0c0a09;
  --success: #22C55E;
  --success-foreground: #0c0a09;
  --warning: #F5A524;
  --warning-foreground: #0c0a09;
  --info: #60A5FA;
  --info-foreground: #0c0a09;

  --border: #292524;
  --input: #292524;
  --ring: #14808F;

  --chart-1: #3987e5;
  --chart-2: #199e70;
  --chart-3: #c98500;
  --chart-4: #008300;
  --chart-5: #9085e9;
  --chart-6: #e66767;
  --chart-7: #d55181;
  --chart-8: #d95926;

  --sidebar: #1c1917;
  --sidebar-foreground: #fafaf9;
  --sidebar-primary: #14808F;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #292524;
  --sidebar-accent-foreground: #f5f5f4;
  --sidebar-border: #292524;
  --sidebar-ring: #14808F;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-chart-6: var(--chart-6);
  --color-chart-7: var(--chart-7);
  --color-chart-8: var(--chart-8);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --font-sans: var(--font-sans);
}
```

---

## 7. RTL layout rules & component inventory

### 7.1 Global rules
- `dir="rtl" lang="ar"` on `<html>` by default (also used for `ckb`); `dir="ltr"
  lang="en"` when the user switches (see §4).
- **CSS logical properties only** — `margin-inline-start/end`,
  `padding-inline`, `inset-inline-start/end`, `text-align: start/end`,
  `border-start-start-radius` etc. Never `left`/`right`, never `ml-`/`mr-`
  Tailwind utilities — use `ms-`/`me-`.
- Icons that encode direction (arrows, chevrons, send) get `transform: scaleX(-1)`
  under `[dir="ltr"]`; icons that don't (bell, gear, search, calendar) never flip.

### 7.2 App shell
- **Sidebar**: fixed, `inset-inline-start: 0` (right edge in ar/ckb, left edge in
  en — see §4) — school logo + name at top, primary nav (لوحة التحكم، الطلبة، الحضور، الدرجات، الرسوم،
  الرسائل، الإعدادات), collapsible to icon-only rail at `<1280px`, off-canvas
  drawer at `<768px` triggered by a topbar hamburger.
- **Topbar**: page title (start) · search (center-flex) · notifications bell,
  **language switcher** (globe icon → العربية / کوردی / English), user avatar
  menu (end).
- **KPI row**: 4-up grid (`grid-template-columns: repeat(4, 1fr)`, collapsing to
  2-up at `<1024px`, 1-up at `<640px`), each tile per §5.5's color discipline.

### 7.3 Tables (students, payments, attendance)
- Header row: `--muted` background, `--muted-foreground` text (stone-600, per the
  §5.1 rule — it's on a fill), sticky on scroll.
- Numeric/money columns align to the **end** edge (§4); text columns align
  **start**.
- Row hover: `--accent` tint, never a border-only hover (too subtle at low
  contrast for modest-tech users).
- Status (فعّال/موقوف, مدفوع/متأخر) renders as a **pill: icon + label**, colored
  per §5.3 — never a bare colored dot.
- Every table ships a **empty state** (see 7.5) and a loading skeleton — never a
  bare blank table on first paint (weak-3G first-load consideration).

### 7.4 Forms
- Label **above** the field (not floating — floating labels move on focus, which
  is disproportionately confusing for modest-tech users and breaks under long
  Arabic labels).
- Required-field marker: red asterisk **and** "مطلوب" in helper text on error —
  never color/asterisk alone.
- Inline validation on blur, not on every keystroke; error text below the field
  in `--destructive`, paired with an icon.
- Primary submit button: solid `--primary`, **start**-anchored in the RTL
  reading direction's natural button position (end of the form, i.e. left in
  ar/ckb — matches how the eye finishes a right-to-left form).

### 7.5 Empty states
- Icon (muted, 48px) + one-line explanation in Arabic + a single primary action
  ("أضف أول طالب" not "لا توجد بيانات") — every empty state proposes the next
  action, never just reports absence.

### 7.6 Mobile behavior (< 768px)
- Sidebar → off-canvas drawer (slides in from the inline-start edge — same
  physical edge it's docked to at desktop width, right in ar/ckb, left in en).
- KPI row → horizontal snap-scroll of 1 card at a time, not a cramped 2-up grid,
  below 400px width.
- Tables → convert to stacked "card per row" below 640px (each row's cells
  become label/value pairs) rather than horizontal-scrolling a dense table —
  weak-network, small-screen parent users are a primary persona, not an edge case.
