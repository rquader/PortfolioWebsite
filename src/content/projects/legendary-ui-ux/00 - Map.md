---
tags: [meta, map]
---

# map

```mermaid
graph LR
  H["legendary (home)"] --> P["01 - Philosophy"]
  H --> A["02 - Architecture"]
  H --> PJ["Process Journal"]
  H --> IL["Iteration Log"]
  H --> S["Sources & Inspirations"]
  H --> O["Open Questions"]
  H --> CC["Cut Concepts"]
  P --> AM["on making (provenance)"]

  subgraph "manifesto tab"
    C1["Inertial Typography"]
    C2["Phosphor Touch"]
    C3["Mnemonic Margin"]
    C4["Resonant Field"]
    C5["Reading Tide"]
    C6["Cursor Companion"]
  end

  subgraph "new rooms"
    C7["Aurora Visualiser"]
    C8["Synesthesia"]
    C9["Constellation of Attention"]
  end

  P --> C1
  P --> C2
  P --> C3
  P --> C4
  P --> C5
  P --> C6
  P --> C7
  P --> C8
  P --> C9
  A --> C1
  A --> C2
  A --> C3
  A --> C4
  A --> C5
  A --> C6
  A --> C7
  A --> C8
  A --> C9

  C1 -.shares pointer.-> C2
  C2 -.shares pointer.-> C6
  C3 -.shares scroll.-> C5
  C4 -.audio analyser.-> C7
  C8 -.word physics from.-> C1
  C9 -.cousin of.-> C3
```

## suggested reading paths

**the impatient critic** — [[01 - Philosophy]] → [[Open Questions]]

**the designer** — [[01 - Philosophy]] → any concept note → [[Cut Concepts]] → [[Sources & Inspirations]]

**the engineer** — [[02 - Architecture]] → each concept note (the *implementation* and *pitfalls* sections) → [[Process Journal]]

**the curator** — [[Sources & Inspirations]] → [[Cut Concepts]] → [[Iteration Log]]

## file inventory

```
Legendary UI-UX/
├── Legendary UI-UX.md                   ← home
├── 00 - Map.md                          ← you are here
├── 01 - Philosophy.md
├── 02 - Architecture.md
├── Concept - Inertial Typography.md
├── Concept - Phosphor Touch.md
├── Concept - Mnemonic Margin.md
├── Concept - Resonant Field.md
├── Concept - Reading Tide.md
├── Concept - Cursor Companion.md
├── Concept - Aurora Visualiser.md
├── Concept - Synesthesia.md
├── Concept - Constellation of Attention.md
├── Cut Concepts.md
├── Sources & Inspirations.md
├── Process Journal.md
├── Open Questions.md
└── Iteration Log.md
```

## the four rooms and what each demonstrates

```
manifesto                                      resonance
─────────────                                  ─────────────
inertial typography (all tabs)                 aurora visualiser
phosphor touch (all tabs)                      + uses the drone's FFT
mnemonic margin
reading tide
cursor companion (all tabs)
resonant field (all tabs, persistent)
on making (provenance · before coda)

synesthesia                                    constellation
─────────────                                  ─────────────
letter→colour palette                          dwell-to-ignite stars
word inertial physics (pretext-inspired)       line-graph of attention
page tint to averaged word colour              persists with scroll
```
