---
tags: [adr, aesthetic, primitives]
---

# ADR-006 — Aesthetic primitives: inherited and cut

**Status:** accepted
**Date:** 2026-05-17

## Context

The user's [[Legendary UI-UX/Legendary UI-UX|Legendary UI/UX]] project ships eight composable primitives across four "rooms":

1. Inertial typography
2. Phosphor touch
3. Mnemonic margin
4. Resonant field (audio drone)
5. Reading tide
6. Cursor companion
7. Word-inertial / synesthesia
8. Aurora visualiser / constellation (room-specific)

The portfolio inherits Legendary's aesthetic as starting point ([[../01 - Philosophy#where the aesthetic comes from]]). It must decide which primitives to bring forward and which to drop.

## Decision

**Inherit:**
- **Inertial typography** — on headings only ([[../Concept - Inertial Headings]]).
- **Synesthesia coloring** — *scoped* to the bio paragraph, not its own room ([[../Concept - Synesthesia Goals]]).
- **Cursor companion** — with per-section accent colors ([[../Concept - Cursor Companion]]).
- **Phosphor touch** — *deferred* but included in this list because it might come back. V1 ships without. See [[../Open Questions#phosphor touch trail]].

**Cut:**
- **Aurora visualiser** — Legendary's audio-reactive room.
- **Constellation** — Legendary's "ignite stars on dwell" room.
- **Mnemonic margin** — the scroll-velocity-encoded thread in the left margin.
- **Resonant field / audio drone** — Web Audio drone with consent toggle.
- **Reading tide** — the breath rhythm CSS variable.

## Reasoning per primitive

### Inertial typography → kept (scoped)

- *Why kept:* the strongest "demonstration is the argument" moment in Legendary, and it scales down naturally. A heading whose letters notice the cursor is a small kindness, not a feature. Costs ~0.3ms/frame for the visible letters. Reviewable code.
- *Scope:* headings only — not body prose. Body inertial reads as a screensaver.

### Synesthesia → kept (drastically scoped)

- *Why kept:* the second-strongest medium-is-the-argument moment, and uniquely well-suited to the bio paragraph (the words *are* values). Legendary's full room with every letter wrapped is overkill for a portfolio; we scope to a handful of user-chosen words inside one paragraph.
- *What we cut from the original:* the per-letter spectrum strip below the passage, the room-wide background tint (we use section-scoped tint), the word-physics inertial system. These argue things specific to Legendary's "on colour" room.

### Cursor companion → kept (per-section accent)

- *Why kept:* atmospheric, low-cost, communicates section identity via color. The companion is the most explicitly Legendary-borrowed primitive — same module, same constants.
- *What we add:* per-section accent via CSS variable. The companion takes the room's color.

### Phosphor touch → deferred

- *Why deferred:* the trail effect is delightful but adds another canvas overlay + per-frame work. V1 ships without to keep the cognitive surface small. Easy to add later if the threshold feels too quiet.
- *Revisit:* after first paint, evaluate atmospheric density. If too sparse, add. If right, skip.

### Aurora visualiser → cut (as primitive)

- *Why cut:* aurora's argument in Legendary is "sound is now visible." We have no audio. Without audio the visualiser is decoration without point. Generative aurora-as-pure-decoration is *possible* but reads as eye candy in a portfolio context.
- *Revisit if:* user later adds audio and wants a "sound room." Unlikely.
- **2026-05-17 update:** the cut here is about aurora as a *foreground room* (Legendary-style). Aurora as a *passive backdrop* is a different question — a top-of-frame, low-amplitude, restricted-color aurora variant works fine as atmosphere behind body text and doesn't require audio. See the [[../Manim_Wallpaper/08_backdrop_concepts#3 — Subtle Aurora Variant|subtle aurora variant]] stub and the per-section backdrop entry in [[../Open Questions]].

### Constellation → cut (as primitive)

- *Why cut:* the "ignite stars by dwelling" interaction is gorgeous but argues a thing (attention is constellation) that doesn't have a job in a portfolio. We'd be importing a primitive for its mood, with no claim it makes.
- *Revisit if:* a section is found whose meaning genuinely is "dots that form a structure when you attend to them" — e.g., a future timeline / chronology section. Then port.
- **2026-05-17 update:** as with aurora, this cut is about the *interactive foreground* version. A *passive* constellation-style backdrop — sparse stars + slow-fading edges, no dwell interaction — is a different artifact. The [[../Manim_Wallpaper/wallpapers/07_network_nodes|network nodes]] backdrop is essentially this pattern, tied to a section's content (DDD network). See the per-section backdrop entry in [[../Open Questions]].

### Mnemonic margin → cut

- *Why cut:* the left-margin scroll-velocity thread is the most visually striking Legendary primitive but it eats real estate. In a portfolio it would compete with content for attention, and its argument ("memory is a kindness") doesn't fit a portfolio's job.
- *Revisit if:* never likely. The margin is too Legendary-specific.

### Resonant field / audio → cut

- *Why cut:* portfolios should never make sound by default. The user did not ask for this. Even with consent-gating, a portfolio with a drone risks reading as performative.
- *Revisit if:* user explicitly requests. Until then, **no audio** is a hard default.

### Reading tide → cut

- *Why cut:* a single CSS variable pulsing at breath-rate is conceptually beautiful but its effect on the page (a barely-perceptible background-color shift) costs more in "is this broken?" confusion than it adds in atmosphere. In Legendary the tide *is* explained as a primitive; in a portfolio its lack of explanation makes it feel buggy.
- *Revisit if:* a primitive we ship turns out to need a slow pulse to feel alive (unlikely with the recursive tree's sway already providing pulse). Probably skip permanently.

## Benefits

- **Cognitive surface stays small.** Three primitives + one backdrop is reviewable. Eight would be Legendary-cosplay.
- **Each kept primitive has a clear portfolio-context job.** Inertial = craft demonstration. Synesthesia = values visualization. Cursor companion = section wayfinding. No primitive is decorative-only.
- **Cuts free implementation time for the things that matter.** The recursive tree backdrop is the signature primitive of this site; spending engineering on aurora + constellation + margin instead would dilute it.

## Harms / Tradeoffs

- **Less visual range than Legendary.** A reader who's seen Legendary might find the portfolio comparatively quiet. Acceptable: it's a portfolio, not a manifesto.
- **Phosphor deferral may be wrong.** If the threshold feels too still, we'll wish we shipped it. Mitigation: revisit after first paint.
- **No backup atmosphere primitive.** If the tree backdrop has perf issues on a target device and we have to lower its presence, the site loses its main visual signature. Mitigation: the tree's perf is well within budget on every target device class; this is unlikely.

## Revisit if

- Specific feedback (user or test reader) suggests a primitive feels missing or extra.
- A future tier-2 enhancement wants atmospheric depth — phosphor returns first.
- Audio becomes a feature in some future iteration — aurora/visualiser argument returns.

## See also

- [[../01 - Philosophy]]
- [[../Concept - Inertial Headings]]
- [[../Concept - Synesthesia Goals]]
- [[../Concept - Cursor Companion]]
- [[Legendary UI-UX/01 - Philosophy]] — the source aesthetic
