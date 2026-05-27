# Arabic Dialect Map — Full Project Reference

> A complete reference document for the Arabic Dialect Map project, covering everything from concept to current state.

---

## Project overview

An interactive, self-contained HTML web application that visualizes the relationships between Arabic dialects. Dialects are arranged radially around Modern Standard Arabic (Fusha) at the center — the further from center, the more linguistically divergent.

**Goal:** Help people understand how the many Arabic dialects relate to Qur'anic Arabic and Modern Standard Arabic, especially for those who start with formal Arabic and want to communicate more broadly across the Arabic-speaking world.

---

## Dialect data — complete inventory

### Main nodes (13)

| Node | Group | Color | Speakers | Key feature |
|------|-------|-------|----------|-------------|
| **Fusha (MSA)** | Classical | Purple | 270M+ understand | Universal formal Arabic — Al Jazeera, UN, all media |
| **Qur'anic** | Classical | Purple | 1.8B+ recite | Frozen 7th-century form, richer grammar than MSA |
| **Egyptian** | Eastern | Green | 110M+ | Most widely understood dialect (cinema/TV/music) |
| **Levantine** | Eastern | Green | ~30M | Palestine, Lebanon, Syria, Jordan — nearly identical within family |
| **Iraqi** | Eastern | Blue | ~40M | Own branch — Turkish/Kurdish loanwords, "shaku maku?" |
| **Gulf** | Peninsula | Amber | ~35M | Conservative phonology across 7 GCC countries |
| **Yemeni** | Peninsula | Amber | ~30M | "Living fossil" — closest to Classical pronunciation |
| **Sudanese** | Eastern | Rose | ~40M | Heavy Nubian substrate, own distinct branch |
| **Libyan** | Maghreb | Coral | ~7M | Bridge between Eastern and Western Arabic |
| **Tunisian** | Maghreb | Coral | ~12M | Notorious speed, 40%+ French vocabulary |
| **Algerian** | Maghreb | Coral | ~45M | Most extreme Arabic-French-Berber code-switching |
| **Moroccan** | Maghreb | Coral | ~35M | Most divergent Arabic dialect overall |
| **Hassaniya** | Maghreb | Coral | ~4M | Saharan outlier — Wolof/Pulaar instead of French |

### Satellite sub-dialects (19)

| Parent | Satellite | Key distinction |
|--------|-----------|-----------------|
| Egyptian | **Cairo / Delta** | Prestige variety, what "Egyptian Arabic" means in media |
| Egyptian | **Sa'idi** | Upper Egypt, preserves hard qaf, sometimes stigmatized |
| Levantine | **Palestinian** | Retains qaf, essentially identical to Jordanian |
| Levantine | **Lebanese** | French loanwords, distinctive musical rhythm |
| Levantine | **Syrian (Damascene)** | Most "neutral" Levantine, TV drama industry |
| Levantine | **Jordanian** | Shaped by Palestinian/Iraqi/Syrian immigration waves |
| Iraqi | **Baghdadi** | Prestige Iraqi, media standard |
| Iraqi | **Basrawi** | Southern, Gulf-influenced — bridge to Khaleeji |
| Gulf | **Najdi** | Bedouin-influenced, Saudi media prestige |
| Gulf | **Hejazi** | Cosmopolitan from centuries of hajj pilgrim contact |
| Gulf | **Kuwaiti** | Persian/Indian trade loanwords |
| Gulf | **Bahraini** | Pre-Islamic Baharna substrate |
| Gulf | **Qatari** | Standard Gulf, interchangeable with neighbors |
| Gulf | **Emirati** | Heavy English code-switching in Dubai |
| Gulf | **Omani** | South Arabian substrate, Swahili/Bantu loanwords |
| Yemeni | **Sana'ani** | Highland, most phonologically conservative living dialect |
| Yemeni | **Adeni** | Coastal, more Gulf flavor from trade |
| Sudanese | **Khartoum** | Prestige Sudanese |
| Sudanese | **Juba** | Creole/pidgin — arguably not "Arabic" at all |

---

## Scoring system

### Five axes (each rated 1–5)
1. **Sounds** — phonological distance from reference
2. **Vocabulary** — lexical overlap
3. **Grammar** — structural shifts
4. **Vowels** — vowel system changes
5. **Mixing** — foreign language code-switching

### Two reference modes
- **vs MSA** (default) — distance from Modern Standard Arabic
- **vs Qur'anic** — distance from Classical Arabic

Each dialect has a complete set of scores for both modes. Scores are LLM-generated estimates based on general linguistic knowledge — *not* empirically measured. Reasonable approximations, not peer-reviewed data.

### Mutual intelligibility

Every node has structured intelligibility data with levels:
- **Very high** (green dot) — essentially the same, no adjustment needed
- **High** (yellow-green) — easy comprehension, minor differences
- **Moderate-high** (olive) — understandable with some effort
- **Moderate** (amber) — need adjustment time
- **Low-moderate** (orange) — significant comprehension gap
- **Low** (coral) — very difficult mutual comprehension
- **Very low** (dim) — effectively different languages

---

## Technical architecture

### Single-file structure
```
arabic_dialect_map_v6.html
├── <head> — meta tags, viewport, theme-color
├── <style> — all CSS (~350 lines)
│   ├── CSS variables (:root for dark, html.light for light)
│   ├── Component styles
│   ├── Focus/accessibility styles
│   ├── Mobile media queries (@media max-width:640px)
│   ├── Compact layout (@media max-width:380px)
│   └── Light mode overrides (html.light selectors)
├── <body>
│   ├── <main id="wrap"> — primary content
│   │   ├── Top-right button bar (theme, embed, expand, zoom, info)
│   │   ├── Info modal (About this map)
│   │   ├── Controls (search + filter pills)
│   │   ├── SVG map (viewBox 0 0 960 720)
│   │   │   ├── Radial glow gradient
│   │   │   ├── 12 connection lines (bezier paths)
│   │   │   ├── Satellite layer (dynamically populated)
│   │   │   ├── 13 dialect node groups
│   │   │   └── Color legend
│   │   ├── Rotate hint (mobile portrait only)
│   │   ├── Hint text
│   │   ├── Sheet backdrop (mobile only)
│   │   └── Detail card
│   ├── Feedback button (fixed, bottom-right)
│   ├── Feedback modal
│   ├── Embed modal
│   └── <script> — all JS (~800 lines)
│       ├── Data object D (all dialect data)
│       ├── MSA_DIFFS (alternate scoring)
│       ├── Satellite placement algorithm
│       ├── Detail card rendering
│       ├── Search & filter logic
│       ├── Zoom system (viewBox animation)
│       ├── Expand all/collapse
│       ├── Theme toggle
│       ├── Iframe detection
│       ├── Modal handlers
│       ├── Accessibility enhancements
│       ├── Rotate hint
│       └── Bottom sheet (mobile)
```

### Key algorithms

**Satellite placement** (`getSatPositions`):
- Each expandable node has a preferred expansion direction (`SAT_DIRS`)
- Places satellites along an arc, checking for collisions with other nodes, existing satellites, and the legend
- Three-pass strategy: preferred arc → full 360° sweep → clamped fallback
- When "Expand All" is used, all groups are placed in one global pass with shared collision tracking

**Zoom** (`lerpVB`):
- Animates SVG `viewBox` attribute with `requestAnimationFrame`
- EaseInOut cubic bezier timing
- On node click: zooms to bounding box of node + its satellites
- On empty click/Escape: resets to full view

**Bottom sheet** (mobile):
- CSS `transform:translateY(100%)` → `translateY(0)` transition
- Touch event handling: tracks `touchstart` Y, `touchmove` delta, dismisses on >100px swipe down
- Only activates drag when sheet is scrolled to top (so internal scrolling still works)
- Body scroll lock via `position:fixed` with saved/restored `scrollY`

### showDetail patch chain
```
Original showDetail(d, hex)
  → Bottom sheet wrapper: backdrop, scroll lock, accent color, scrollTop reset
    → Accessibility wrapper: save lastFocused, focus detail card, push history state
```
**Warning:** This is fragile. If refactoring, consolidate into one function.

---

## Color system

### Dark mode (default) — `:root`
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#1c1a17` | Page background |
| `--bg2` | `#242220` | SVG wrap background |
| `--bg3` | `#2e2b28` | Input/button backgrounds |
| `--card` | `#282522` | Card backgrounds |
| `--card-b` | `#3a3632` | Card borders |
| `--tx` | `#e8e0d4` | Primary text |
| `--tx2` | `#b0a898` | Secondary text |
| `--tx3` | `#8a8278` | Muted text (WCAG AA compliant) |

Accent colors: `--purple`, `--green`, `--amber`, `--coral`, `--blue`, `--rose` — each with a `-d` (dark/muted) variant used for node backgrounds.

### Light mode — `html.light`
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg` | `#f4f1ec` | Page background |
| `--bg2` | `#eae5dd` | SVG wrap background |
| `--bg3` | `#ddd7cd` | Input/button backgrounds |
| `--card` | `#ffffff` | Card backgrounds |
| `--card-b` | `#c8c0b4` | Card borders |
| `--tx` | `#1a1814` | Primary text |
| `--tx2` | `#48423a` | Secondary text |
| `--tx3` | `#6a6258` | Muted text |

Light mode accents are darker/saturated versions. SVG text colors require `!important` overrides because they're hardcoded as inline `fill=` attributes in the HTML.

---

## Git history

```
838ee1c light mode
350ae97 accessibility features          ← has git notes attached
6191d3d portrait rotate hint
839fd26 spaced out icons for mobile
0b18cb4 mobile device update (bottom sheet, touch targets, etc.)
4a59424 visual cleanup for intel/detail sections
973c9f2 about section + mutual intelligibility data
8deebf4 Arabic Dialect Map (first real version)
62b10c2 Initial commit
```

### Git notes
Detailed notes on commit `350ae97` with all 30 accessibility features and 8 errors averted. View with:
```bash
git notes show 350ae97
```
Pushed to remote via:
```bash
git push origin 'refs/notes/*:refs/notes/*'
```

---

## Hosting

- **Platform:** GitHub Pages
- **URL:** `https://rquader.github.io/ArabicDialectMap/`
- **Source:** `main` branch, root `/`
- **Auto-deploys** on push (~30-60 seconds)
- **Custom domain:** Can add anytime via Settings → Pages → Custom domain + DNS CNAME to `rquader.github.io`

---

## Privacy & security

- **Zero outbound network requests** — no fonts, analytics, CDN, or third-party scripts
- **No tracking** — no cookies, no localStorage (except theme preference), no fingerprinting
- **No backend** — pure static HTML, nothing to hack
- **Only personal info:** a single contact email exposed in the feedback modal (intentional)
- **Embed-safe:** search, feedback, and embed buttons auto-hide in iframes. No data leaks to embedding pages

---

## Workflow

### Editing
1. Edit `~/Developer/arabic_dialect_map_v6.html`
2. Copy to repo: `cp ~/Developer/arabic_dialect_map_v6.html ~/Developer/ArabicDialectMap/index.html`
3. Commit and push from `~/Developer/ArabicDialectMap/`

### Validating JS after edits
```bash
node -e "const fs=require('fs');const h=fs.readFileSync('arabic_dialect_map_v6.html','utf8');const m=h.match(/<script>([\s\S]*?)<\/script>/);if(m){try{new Function(m[1]);console.log('JS OK')}catch(e){console.log('JS error:',e.message)}}"
```

---

## Future roadmap

### Short-term
- [ ] Test on real iOS Safari + Android Chrome devices
- [ ] Check satellite text colors in light mode when expanded
- [ ] Verify bottom sheet swipe behavior on different phone models

### Medium-term
- [ ] Audio voice notes for dialects (needs contributors from each region)
- [ ] Custom domain setup
- [ ] Consider PWA (Add to Home Screen) if usage grows

### Long-term
- [ ] Portrait-optimized mobile layout (vertical tree instead of radial map — major rewrite)
- [ ] Refactor `showDetail` patch chain into single consolidated function
- [ ] Move SVG text colors from inline `fill=` to CSS classes for cleaner light mode support
- [ ] Peer review of linguistic data by actual Arabic linguists

---

## Content & copyright

All linguistic information is synthesized general knowledge — speaker counts, mutual intelligibility ratings, dialect descriptions, and difficulty scores are original estimates, not copied from any specific copyrighted source. The difficulty scores are approximations across 5 axes, not empirical measurements. Free to use, embed, and share.
