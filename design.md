# Fletoret — Design System

Reference for anyone (human or agent) adding UI to this project. It describes what
the design *is* and the conventions that keep new work indistinguishable from
existing work. Source of truth for the tokens is `src/lib/css/app.css`; long-form
reading styles live in `src/lib/css/blog.css`.

---

## 1. What this site is

A digital library of Albanian public-domain literature. The design is **warm paper
and ink**: near-white but never white, near-black but never black, one accent
colour, no chrome. Typography carries the hierarchy — not colour, borders, shadows,
or gradients.

Three principles, in priority order:

1. **Reading comes first.** Body copy is serif, measured to ~660px, and nothing
   competes with it. Chrome recedes.
2. **One accent.** Terracotta (light) / apricot (dark). It marks links, eyebrows,
   and hover. Introducing a second accent hue is a regression.
3. **Warmth over neutrality.** Every grey is warmed. There is no `#000`, no `#fff`,
   and no cool grey anywhere in the palette. If a new colour looks "clean and
   neutral," it's wrong for this site.

Content language is Albanian (`sq_AL`). All UI strings are Albanian; diacritics
(`ë`, `ç`, `â`, `ê`) must survive whatever you do to a font stack or a slug.

---

## 2. Typography

Four faces, and the choice between them is **semantic, not decorative**:

| Token | Face | Use it for |
|---|---|---|
| `--serif-display` | Instrument Serif | Display type: wordmark, page titles, post titles, book titles, card names, chapter headers |
| `--serif` | Source Serif 4 Variable | Prose the reader *reads*: body copy, ledes, section leads, subtitles, blockquotes, blog list titles |
| `--sans-serif` | InterVariable (400–600 only) | UI the reader *operates or scans*: nav, eyebrows, FAQ questions, dates, captions, tables, footnotes, breadcrumbs, buttons |
| `--mono-font` | System mono stack | Code |

`--sans-serif-display` is an alias for InterVariable, not a distinct face. It
appears in the header wordmark and a couple of card wrappers; prefer
`--sans-serif` in new code unless you're matching an adjacent element.

**The heuristic:** serif = content, sans = controls. A date beside a title is
sans even though the title is serif. A figure caption is sans. A pull quote is
serif.

### Scale

```
--text-sm   0.8rem    --text-lg2  1.4rem
--text-md   1rem      --text-xl   1.8rem
--text-lg   1.2rem    --text-2xl  2.4rem
```

Beyond `--text-2xl`, use a fluid `clamp()` rather than adding a token. Existing
clamps to match:

```css
/* Homepage hero */      font-size: clamp(3.75rem, 11vw, 6.25rem);
/* Hero, ≤600px */       font-size: clamp(3.5rem, 22vw, 6.25rem);
/* Article title */      font-size: clamp(2.4rem, 1.8rem + 2.6vw, 3.4rem);
/* Article body */       font-size: clamp(1.0625rem, 1.02rem + 0.25vw, 1.125rem);
```

⚠️ **`--text-xs` does not exist.** `blog.css` and `copeza/+page.svelte` reference
it; those rules silently fall back to inherited size. Don't add new references —
use `--text-sm`, or define the token deliberately if you genuinely need a step
below it.

### Metrics

Display type is tight and slightly negative-tracked; body type is loose and
untracked.

| | line-height | letter-spacing | weight |
|---|---|---|---|
| Display (hero, titles) | 0.92 – 1.12 | −0.035em … −0.01em | 400 (Instrument), 600 where a serif heading needs weight |
| Body / lede | 1.5 – 1.6 | 0 to −0.01em | 400, or 420 for optical balance in Source Serif |
| Eyebrow | 1 | **+0.16em**, uppercase | 600 |
| UI labels | 1.4 | −0.011em | 400–600 |

`420` is not a typo — Source Serif is variable and a few ledes use the
in-between weight. Reuse it rather than rounding to 400.

### Typographic details that are house style

- `text-wrap: balance` on headings, ledes, and section leads.
- `text-wrap: pretty` on longer body-ish copy (page descriptions, subtitles).
- `&nbsp;` before an em dash so it never starts a wrapped line:
  `Katalogu ynë i shkrimtarëve&nbsp;— në rritje e sipër.`
- Measures are capped in `rem`/`ch`, not percentages: `32rem` lede, `34rem`
  section lead, `42ch` page description, `41.25rem` reading column.

### The eyebrow

A recurring element: a small uppercase terracotta label above a section heading.

```css
.eyebrow {
  font-family: var(--sans-serif);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--link-primary);   /* accent, and it clears AA at this size */
  margin: 0 0 var(--spacing-md);
}
```

Paired with a `.section-lead` (serif, `--text-lg`, `--text-secondary`, centred,
max `34rem`) inside a `.block-heading` wrapper. Reuse that trio for any new
section — see `src/routes/+page.svelte`.

---

## 3. Colour

**Never write a raw colour value.** Use the semantic tokens; they're already wired
to all three theme states.

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg-primary` | `#fdfdfb` | `#1a1712` | Page |
| `--bg-primary-glassy` | `#fdfdfbe0` | `#1a1712e0` | Sticky header behind `backdrop-filter` |
| `--bg-secondary` | `#f4f3ee` | `#23201a` | Panels, hover fills, code blocks, chips |
| `--text-primary` | `#22201b` | `#e6dfcf` | Body and headings |
| `--text-secondary` | `#7d766a` | `#978d7b` | Supporting copy, captions, dates, icons at rest |
| `--link-primary` | `#b04a2f` | `#e79a72` | Links, accent, hover |
| `--border-color` | `#ecebe4` | `#2e2a22` | Hairlines, 1px card borders |
| `--bg-selection` | accent @ 15% | accent @ 15% | `::selection` |
| `--shadow` | warm, two-layer | black, two-layer | Elevation — used once, in `/kopertina` |

### Gotchas

- **`--color-blue` is not blue.** It's an alias for the same terracotta/apricot as
  `--link-primary` (kept from an earlier palette). `--color-orange` is a distinct
  amber, effectively unused. Don't reintroduce a real blue; don't rely on the
  names.
- **The theme assignments carry `!important`.** You cannot override
  `--text-primary`, `--bg-primary`, `--border-color`, etc. from a scoped component
  block. If you need a variant colour, introduce a *new* token, or use
  `color-mix()` off an existing one — which is the established escape hatch:
  ```css
  border-left: 2px solid color-mix(in srgb, var(--text-secondary) 60%, transparent);
  text-decoration-color: color-mix(in srgb, var(--text-primary) 32%, transparent);
  ```
- **Scrims are the one literal-colour exception.** Gradients over portraits use
  `rgba(26, 20, 12, …)` — a *warm* near-black. `AuthorCard` still has a legacy
  `#000000c4` at desktop widths; match the warm value in new code, and fix that
  one if you're in the file anyway.
- Elevation is essentially unused. Depth comes from `1px solid var(--border-color)`
  and `--bg-secondary` fills. Don't add `box-shadow` to cards.

### Theming mechanics

Three states, all handled in `app.css`:

1. `html[data-theme='light']`
2. `html[data-theme='dark']`
3. Unset → `@media (prefers-color-scheme: dark)`, else the light defaults on `:root`

`src/lib/theme.ts` exposes `getAndLoadTheme()` and `chooseTheme()`; the toggle
lives in `Header.svelte`. Any top-level page that renders a `Header` calls
`void getAndLoadTheme()` in its `<script>`.

**Because theming is applied client-side, both themes must be legible before JS
runs.** Never encode meaning in a colour that only resolves after hydration.

---

## 4. Space, radius, layout

### Spacing — use the tokens, only the tokens

```
--spacing-sm    4px     --spacing-xxl   24px
--spacing-md    8px     --spacing-2xxl  48px
--spacing-lg   12px     --spacing-3xxl  80px
--spacing-xl   16px
```

The scale jumps 24 → 48. When 24 is tight and 48 is too open, compose rather than
inventing a value — this is the established idiom:

```css
--section-y: calc(var(--spacing-xxl) + var(--spacing-md));  /* 32px */
--gutter: calc(2 * var(--spacing-xxl));                     /* 48px */
```

### Radius

```
--radius-sm     4px    → inline code, small chips
--radius-md     8px    → nav pills, header icon buttons
--radius-lg    12px    → thumbnails, book covers, mobile cards
--radius-xl    16px    → cards, list containers, buttons, badges
--radius-xxl   24px    → the authors panel, mobile
--radius-2xxl  48px    → the authors panel, desktop
--radius-full  100%    → circular icon chips
```

Children inherit with `border-radius: inherit` rather than restating a token —
see the `img` inside `.card`.

### Widths

| Context | Width |
|---|---|
| `.container` | `1000px` (`--w` override-able) |
| `.container-lg` | `1400px` |
| Header inner | `min(90%, 1000px)` |
| Reading column (`.post-container`) | `41.25rem` / 660px |
| Blog index | `660px` |
| FAQ section, footer | `720px` (via `--w: 720px`) |
| Author page | `1000px`, split 30% sidebar / 70% content |
| `--container-width` | `600px` — legacy, used once in `BookProfile` |

Both `.container` and `.container-lg` set width via a local `--w`, so a section
can narrow the same container without a new class:

```css
.faq-section .container { --w: 720px; }
```

### The page-rhythm idiom

Declare vertical rhythm and the side gutter **once per page root**, then let every
section inherit. This is what keeps cadence identical across sections at all
widths. From `src/routes/+page.svelte`:

```css
main, .footer {
  --section-y: var(--spacing-3xxl);
  --gutter: calc(2 * var(--spacing-xxl));
}
section          { padding: var(--section-y) 0; }
.container       { padding: 0 var(--gutter); }

@media (max-width: 600px) {
  main, .footer {
    --section-y: calc(var(--spacing-xxl) + var(--spacing-md));
    --gutter: var(--spacing-xxl);
  }
}
```

Note both roots are listed because the footer sits outside `<main>`.

### Breakpoints

- **600px** — the primary mobile breakpoint. Most responsive work happens here.
- **900px** — sidebar collapse (author/book pages), card size step-down.
- 576px / 320px appear in two older components (`TocItemList`, `BookEntryPoint`).
  Don't add more; use 600 and 900.

`--breakpoint-mobile-ui: 900px` is documentation only — CSS custom properties
can't be used in media queries.

---

## 5. Components and patterns

### Header (`Header.svelte`)

Sticky, `backdrop-filter: blur(5px)`, `--bg-primary-glassy`, `z-index: 2`. Props:
`borderBottom` (default `true`) and `bgSecondary` (default `false`). The homepage
passes both `false` so the hero floats; interior pages take the default hairline.

Nav links are `--text-secondary` at rest → `--text-primary` + `--bg-secondary`
fill on hover, `--radius-md`.

### Portrait cards (`ImageCard`, `AuthorCard`)

Fixed both dimensions (not aspect-driven — some portraits are landscape), `cover`
crop, name in `--serif-display` white over a bottom gradient scrim:

```css
.content {
  position: absolute; bottom: 0; width: 100%; height: 60%;
  padding: var(--spacing-xl);
  background: linear-gradient(to top, rgba(26, 20, 12, 0.82) 18%, rgba(26, 20, 12, 0));
  display: flex; flex-direction: column; justify-content: end;
  color: #fff;
}
```

At ≤600px the scrim goes **shorter and denser** (`height: 50%`, `0.85` at `12%`) —
at 60% it washes out a card less than half the desktop width. Apply that
correction to any new scrimmed card.

Hover: `img { transform: scale(1.1) }` over `0.3s ease`. Unavailable authors get
`opacity: 0.2` desktop / `0.4` mobile (0.2 read as a rendering fault on small
screens) and `cursor: default`; `ImageCardWrapper` drops the `<a>` entirely when
`progressState === 'missing'`.

### `.cover-glow` — the artwork halo

An ambient halo: a scaled, blurred copy of the artwork behind itself. Anchored to
the artwork rather than a fixed band, so it tracks the card's aspect at any
viewport width.

```svelte
<div class="card cover-glow" style="--glow-image: url({thumbnail});">
  <img src={thumbnail} alt="…" />
</div>
```

Knobs, with defaults: `--glow-scale` 1.12, `--glow-offset` −16%,
`--glow-blur` 70px, `--glow-inset-bottom` 38%, `--glow-grayscale` 0, plus
theme-driven `--glow-opacity` / `--glow-saturate`.

Three constraints the implementation comments spell out, worth not relitigating:
the blur must stay large relative to the overstep or the halo reads as an
outline; **no `mask-image`** (it clips to the border box and hard-edges the
falloff); light mode gets less opacity and *more* saturation than dark, because a
blurred dark portrait over near-white paper turns grey. It's hidden under
`prefers-reduced-transparency: reduce`, and hidden above 901px on `AuthorCard`
where the sidebar is too narrow to contain it.

### Bordered list rows (`TocItemList`, `BookEntryPoint`)

The dominant "list of links" pattern:

- Container: `1px solid var(--border-color)`, `--radius-xl`, no padding.
- Rows: `border-top` hairline; `:first-child` and `:last-child` clear theirs.
- Hover: `--bg-secondary` fill, and the first/last row re-round their outer
  corners so the fill doesn't square off the container.
- Leading icon: circular, `--size: 24px`, `--radius-full`, `1px` border,
  `--text-secondary` → `--text-primary` + `--bg-primary` on row hover.

### Accordion (`FAQItem`)

Dividers **between** items only (`:not(:last-child)`) — a rule under the last
item just fences the list off from what follows. Question is sans/600/`--text-md`
even on mobile (heavier or larger made it outweigh the section heading above it).
Chevron rotates 90° → −90°. Body reveals with
`transition:slide={{ duration: 150, easing: cubicInOut }}`.

It's a `div` with `role="button" tabindex="0" aria-expanded`, handling Enter and
Space. **This is the required pattern** for any non-`<button>` interactive
element, along with the focus ring:

```css
.question:focus-visible {
  outline: 2px solid var(--link-primary);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}
```

### Index rows (blog list)

`grid-template-columns: 8.5rem 1fr` — sans date, serif title, baseline-aligned,
`border-top` per row with `border-bottom` on the last. At ≤600px it collapses to
one column and **reorders so the title comes first** (`order: 1` / `order: 2`).

### Buttons

`.btn` and `.btn-sm` are global; `variant="outline"` maps to `.bordered`
(transparent + border, `--bg-secondary` on hover).

⚠️ `app.css` sets `button { all: unset }`. Every button styles itself from
nothing — including `cursor`, `font`, and focus. Don't assume any UA defaults.

### The `.icon` knob

Icons size through a local custom property, so a wrapper can rescale without
touching the SVG:

```css
.icon { --size: 24px; width: var(--size); height: var(--size); }
```

`.icon-bordered` adds the hairline. Header overrides to `--size: 36px`.

### Long-form reading (`blog.css`)

Applies under `.post-container`. Serif body, fluid ~17→18px, `line-height: 1.6`,
660px measure. Highlights:

- Headings serif/600, `scroll-margin-top: 5rem` for anchor links. `h4` is serif
  **italic at 400**; `h6` is small-caps-ish uppercase secondary.
- Vertical rhythm in this file is in `rem`, not spacing tokens (`2.75rem` between
  blocks, `1.3rem` after a paragraph). Match the file's units when editing it.
- Prose links are near-monochrome: `--text-primary` with a 32%-alpha underline,
  going *lighter* on hover. Accent is reserved for chrome links.
- Blog mastheads are centred; **book chapters are left-aligned** (a centred
  masthead looks wrong above verse) and get **no drop cap** (enlarged first
  letters break the line rhythm of poetry and collide with descenders). The
  distinction is drawn with `:has(.breadcrumbs)`.
- Custom elements the markdown pipeline emits and this file styles: `epigraph`,
  `footnote`, `caps`, `.asterism` (a `* * *` section break), `.editor-note-ref`.
- ⚠️ `.editor-note-ref:hover` references undefined `--bg-tertiary`. Fix it to
  `--bg-secondary` or define the token; don't copy the reference.

---

## 6. Motion and interaction

| What | Value |
|---|---|
| Colour / decoration transitions | `0.15s ease` |
| Image transforms in cards | `0.3s ease` |
| Accordion / disclosure | `150ms cubicInOut` (Svelte `slide`) |
| List fades | Svelte `fade`, `out` `150ms` |

Hover states change **colour or background fill**, never size or elevation — the
one exception being the portrait `scale(1.1)`, which is deliberate and scoped to
artwork. There is no page-load animation and no scroll-triggered motion; keep it
that way.

Nothing currently keys off `prefers-reduced-motion` because nothing moves enough
to need it. If you add real motion, gate it. `prefers-reduced-transparency` is
already honoured by `.cover-glow`.

---

## 7. Accessibility baseline

- Both themes must be legible without JS (theming is client-side).
- Interactive non-buttons: `role="button"`, `tabindex="0"`, Enter + Space
  handlers, `aria-expanded` where it discloses. See `FAQItem`.
- Visible focus: `2px solid var(--link-primary)`, `outline-offset: 4px`.
- Mobile tap targets ≥32px, and 44px where a thumb is the primary input. Footer
  links carry an explicit `min-height` for exactly this reason.
- `alt` on every image; `aria-label` on icon-only and wordmark links.
- Decorative overlays get `pointer-events: none`.
- Images: `loading="lazy"` in lists, `fetchpriority="high"` for the one hero
  image on a page.

---

## 8. Writing CSS here

**Scoped styles in the component.** Svelte `<style>` blocks own component styling.
`app.css` holds tokens, resets, and a small set of genuinely global utilities
(`.container`, `.btn`, `.icon`, `.cover-glow`, `.divider`, font/colour helpers).
Add to `app.css` only when a third component needs the same thing.

**SCSS where nesting helps.** Several components use `<style lang="scss">`
(`sass` is a dependency). Fine to use, not required.

**`:global()` sparingly** — only for markdown-rendered HTML (`.answer :global(p)`)
or reaching into a child component's markup, and preferably from the parent that
owns the layout.

**Comment the *why*, including what you rejected.** This is the strongest
convention in the codebase and the easiest to under-deliver on. Existing comments
read like:

> `/* Deliberately no mask here: mask-image clips to the border box, which cuts off the blur's spread and turns the halo into a hard-edged rectangle. */`

> `/* Was 1.2rem/600 — heavier than the section heading above it. Keep the body size; 16px of padding still clears a 44px tap target. */`

> `/* 32px: the scale jumps 24 → 48, and 24 left the sections crowding each other while 48 reopened the gap this pass was closing. */`

A magic number, a media-query override, or an unusual property gets a sentence
explaining the constraint that produced it. A comment restating the code
("/* set the padding */") is worse than none.

---

## 9. Checklist before you call UI work done

- [ ] Zero raw colour values (scrims excepted) — semantic tokens or `color-mix()`.
- [ ] Zero raw spacing/radius values — tokens, or `calc()` composed from tokens.
- [ ] Serif for content, sans for controls; display serif only for display sizes.
- [ ] Verified in **light and dark**, and with no theme set (system).
- [ ] Verified at **≤600px** and, if there's a sidebar, at **≤900px**.
- [ ] Tap targets ≥32px on mobile; keyboard-reachable with a visible focus ring.
- [ ] Headings/ledes have `text-wrap: balance`; measures capped in `rem`/`ch`.
- [ ] Hover changes colour or fill, not size or elevation.
- [ ] Albanian strings, diacritics intact; `&nbsp;` before em dashes.
- [ ] Every magic number carries a comment saying why.
- [ ] Not referencing `--text-xs` or `--bg-tertiary` (neither exists).

---

## 10. Known inconsistencies

Not blockers, but don't propagate them; fix opportunistically when you're already
in the file.

| Where | What |
|---|---|
| `blog.css:490,544`, `copeza/+page.svelte:944` | `--text-xs` is undefined |
| `blog.css:663` | `--bg-tertiary` is undefined |
| `AuthorCard.svelte` | Desktop scrim uses cool `#000000c4`; mobile uses the warm `rgba(26,20,12,…)` |
| `app.css` | `--color-blue` is terracotta, not blue; `--link-visited` is defined but commented out |
| `TocItemList`, `BookEntryPoint` | Use 576px/320px breakpoints instead of 600px |
| `app.css` | `--container-width: 600px` is used exactly once (`BookProfile`) |
| `Header.svelte` | Dead `showTOC` variable and a large commented-out `#toc-header` block |
| `theme.ts` | `window.matchMedia('(prefers-color-scheme: dark)')` is truthy regardless of match — the `.matches` check is missing, so an unset theme resolves to dark |
