# PortfolioWebsite

My personal portfolio site, covering my background, research, and projects. It features a live recursive-tree animation in the background, project pages that come with their own working notes attached, and a story mode that helps you understand my experience building each one.

The site is built with a focus on minimalism, raw performance, and rigorous documentation, passing both senior-engineer scrutiny and creative-coding aesthetic discipline.

## Core Features

* **Recursive-Tree Backdrop:** A low-opacity, high-performance TypeScript/Canvas 2D port of the `recursive_tree_v2.py` algorithm from the `Manim_Wallpaper` project. It sways fluidly using custom wind-easing logic across a unified physics frame.
* **Editorial Projects Page (`/projects`):** A custom portfolio browser containing seven real-world chapters. Each project features:
    * **Story/Info Toggle:** A layout switch allowing readers to swap instantly between standard architectural specs ("Info") and a firsthand narrative about the development experience ("Story").
    * **Field Notes Folio:** A custom, in-page slide-out reading drawer that renders hand-sanitized, curated public versions of local Obsidian markdown notes directly inside the viewport.
    * **Project Media Carousels:** Tailored media structures (carousels, responsive stacks, or single assets) including a 10-slide generative browser displaying Manim art scenes.
    * **WIP Caveat Dialogs:** Clear status indicators for active projects.
* **Interactive Primitives:** Custom, lightweight interactive behaviors written from scratch in vanilla TypeScript:
    * *Inertial Headings:* Pointer-driven typographic letter physics.
    * *Cursor Companion:* An ambient background tracker that alters its color palette dynamically to match the current active section.
    * *Scoped Synesthesia:* Controlled, context-specific word coloring triggered on text hover inside the bio block.
    * *Phosphor Trails & Photo Lightbox:* Smooth, non-invasive visual additions.

## Technical Architecture

* **Framework:** Astro 5 (configured for full static site generation).
* **Language:** TypeScript (strict typing rules, zero `any` usages).
* **Styling:** Pure, hand-written CSS utilizing custom token properties (`src/styles/tokens.css`). No UI libraries, preprocessors, utility frameworks, or heavy runtime layout shifts.
* **Single rAF Loop:** To guarantee maximum performance and eliminate jitter, the site registers every script and visual primitive to exactly *one* central `requestAnimationFrame` dispatcher (`src/lib/boot.ts`). Individual modules run their animation logic only when their enclosing HTML section is scrolled into view.
* **Motion Control:** Fully accessible and compliant with the `prefers-reduced-motion` media query. When active, all canvas animations, typography physics, and scale transitions are immediately forced to an elegant, stationary layout.
* **Dependencies:** Zero runtime dependencies beyond Astro itself, maintaining an extremely light bundle budget.

## Repository Directory Layout

```text
├── public/                 # Static assets (Favicons, Resume PDF, raw global images)
└── src/
    ├── components/         # Single-page rooms (Threshold, OnMe, OnTheWork, etc.)
    ├── content/            # Astro Content Collections
    │   └── projects/       # Markdown structures, frontmatter schemas, and public notes per slug
    ├── layouts/            # HTML Base scaffold and scripts bootstrap
    ├── lib/
    │   ├── backdrop/       # Canvas 2D recursive tree mathematical ports and scenes
    │   ├── primitives/     # Vanilla JS/TS interactive physics and handlers
    │   └── boot.ts         # Unified requestAnimationFrame execution engine
    └── styles/             # Modular vanilla styles and root custom property design tokens
