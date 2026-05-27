# Arabic Dialect Map — Project Notes

> **Repo:** [github.com/rquader/ArabicDialectMap](https://github.com/rquader/ArabicDialectMap)
> **Live:** [rquader.github.io/ArabicDialectMap](https://rquader.github.io/ArabicDialectMap/)
> **Local source:** `~/Developer/arabic_dialect_map_v6.html`
> **Repo copy:** `~/Developer/ArabicDialectMap/index.html`
> **Built with:** Claude Code (Opus 4.6)
> **Date started:** 2026-03-26

---

## What the project is

A single self-contained HTML file — an interactive radial map of Arabic dialects arranged by linguistic distance from Modern Standard Arabic (Fusha) at the center. Each dialect has:
- Difficulty scores across 5 axes (sounds, vocabulary, grammar, vowels, mixing)
- Two scoring reference modes: **vs MSA** (default) and **vs Qur'anic**
- Expandable sub-dialect satellite nodes
- Mutual intelligibility data ("Closest dialects" section)
- Example phrases, body text, learner tips

**Zero external requests.** No Google Fonts, no analytics, no CDN. Fully static.

---

## What we built in this session

### Core features
- **Embed system** — `</>` button generates an `<iframe>` snippet using `window.location.href`. Copy-to-clipboard with fallback. Search bar, feedback button, and embed button auto-hide when loaded inside an iframe
- **Feedback modal** — fixed bottom-right button, opens modal with a short message + a `mailto:` link to the author
- **About section rewrite** — removed assumptions about the user, explains both scoring modes
- **MSA as default reference** — swapped from Qur'anic default
- **Light/dark mode toggle** — moon/sun icon, persists via `localStorage`, defaults to dark

### Data enrichment
- **Enriched body text** for all 13 main dialect nodes — speaker counts, cultural significance, key cities, linguistic distinctiveness
- **Mutual intelligibility data** on every node (32 total) — structured arrays with colored dots per level (very high → very low), rendered as a visual component in the detail card
- **All info is general linguistic knowledge**, not copied from any specific copyrighted source

### Privacy & security
- **Removed Google Fonts** `@import` — replaced with system font stacks (`system-ui` for Latin, `Noto Naskh Arabic` / `Geeza Pro` / `Traditional Arabic` for Arabic)
- **No outbound network requests** whatsoever
- **Proper HTML document structure** — `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`, viewport meta, theme-color meta

### Mobile (iOS + Android)
- **Bottom sheet detail card** — slides up from bottom with drag handle, swipe-down to dismiss, backdrop blur/dim
- **Body scroll lock** — `position:fixed` with saved scroll position (iOS Safari compatible)
- **Android back button** — pushes history state when sheet opens, back closes it
- **Horizontal scrollable filter pills** on small screens
- **Larger touch targets** — 30px buttons, 44px+ tap zones, bigger close button
- **Rotate hint** — portrait-only banner suggesting landscape, auto-dismisses on rotation, stays gone for session
- **Safe area padding** — `env(safe-area-inset-bottom)` for iPhone notch/home bar
- **Landscape optimization** — detail card gets 85vh, SVG capped at 50vh
- **Compact layout** for screens <380px — subtitle hidden, buttons compressed

### Accessibility (40 features)
- `aria-label` on all icon buttons, close buttons, search, embed textarea
- `lang="ar"` / `xml:lang="ar"` on Arabic text in SVG
- `:focus-visible` ring styling (amber, matches theme)
- `--tx3` bumped from `#7a7268` → `#8a8278` for WCAG AA contrast (4.5:1)
- `aria-live="polite"` on detail card
- Focus management — focus moves to detail on open, returns to trigger on close
- `tabindex="0"` + `role="button"` + Enter/Space activation on all SVG nodes
- `MutationObserver` on satellite layer for dynamically created nodes
- `<main>` landmark, `role="search"`, `<nav>` on filter group
- `role="dialog"` + `aria-modal` + focus trap on all 3 modals
- `role="tablist"` + `role="tab"` + `aria-selected` on ref toggle
- `aria-pressed` synced via MutationObserver on toggle buttons
- `aria-hidden` on all decorative SVG (ripples, breathe circles, glow, legend)
- `/` key focuses search, Enter selects first match
- `autocapitalize="none"` + `spellcheck="false"` on search
- No-results text indicator
- `prefers-reduced-motion` kills all animations
- `<meta name="description">` for SEO
- SVG has `role="img"` + descriptive `aria-label`

### Light mode
- Full CSS variable override under `html.light`
- SVG text colors overridden per-node with `!important` (needed to beat inline `fill=` attrs)
- Card backgrounds → white, borders visible, search input restyled
- Legend at full opacity in light mode with saturated dot colors
- Persisted in `localStorage`, defaults to dark

---

## Architecture notes

- **Single HTML file** — all CSS in `<style>`, all JS in `<script>`, all data in a JS object `D`
- **SVG viewBox** `0 0 960 720` — landscape-biased, scales via `width="100%"`
- **Satellite placement algorithm** — `getSatPositions()` uses directional arcs per node (`SAT_DIRS`), collision avoidance against other nodes and the legend, with multi-pass fallback
- **Zoom system** — `lerpVB()` animates the SVG viewBox with easeInOut
- **`showDetail` is monkey-patched 3 times:**
  1. Original function
  2. Bottom sheet wrapper (backdrop, scroll lock, accent color)
  3. Accessibility wrapper (focus management, history state)

  This chain is fragile — if refactoring, consolidate into one function.

---

## Known issues / future work

### Should check
- [ ] **Test on real iOS Safari + Android Chrome** — bottom sheet swipe and `position:fixed` body scroll lock can behave differently on actual devices
- [ ] **Satellite text in light mode** — sub-dialect node text colors come from parent `hex` property (designed for dark). May look washed out in light mode when expanded
- [ ] **SVG light mode text rules are per-node** — if new nodes are added, matching `html.light #n-newnode text` CSS rules are needed

### Future ideas (mentioned in conversation)
- [ ] **Audio voice notes** for each dialect — would need contributors from each dialect region
- [ ] **Portrait-optimized mobile layout** — a vertical tree/list instead of radial map. Major rewrite, not currently worth it
- [ ] **Custom domain** — GitHub Pages supports it, just needs CNAME record. GitHub Student Pack gives free `.me` domain for 1 year via Namecheap
- [ ] **Service worker** for offline — not needed since it's already a static single file, but would enable "Add to Home Screen" as a PWA

### Technical debt
- `showDetail` triple monkey-patch chain — consolidate if refactoring
- SVG text colors hardcoded as inline `fill=` attributes — ideally these would use CSS variables natively, but SVG inline attributes override CSS unless `!important` is used
- Light mode CSS is ~50 lines of `html.light` overrides — could be cleaner with CSS `:has()` or by restructuring the SVG to use CSS classes instead of inline fills

---

## Git notes

The accessibility commit (`350ae97`) has detailed git notes attached with all 30 features and 8 error-averted explanations. View with:

```bash
git log --show-notes
# or
git notes show 350ae97
```

Notes were pushed to remote via:

```bash
git push origin 'refs/notes/*:refs/notes/*'
```

GitHub doesn't display git notes in the web UI — only accessible via API or cloning.

---

## Files

| File | Purpose |
|------|---------|
| `~/Developer/arabic_dialect_map_v6.html` | Source of truth |
| `~/Developer/ArabicDialectMap/index.html` | Repo copy (must `cp` after edits) |

**Always copy after editing:**
```bash
cp ~/Developer/arabic_dialect_map_v6.html ~/Developer/ArabicDialectMap/index.html
```

---

## Hosting

- **GitHub Pages** — deployed from `main` branch, root `/`
- Auto-deploys on push (~30-60 seconds)
- **No personal info** in the code except the SJSU email in the feedback modal (intentional)
- **No API keys, tokens, or secrets**
- The embed button auto-generates the correct URL from `window.location.href` at runtime
