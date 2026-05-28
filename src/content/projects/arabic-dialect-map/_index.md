---
title: Arabic Dialect Map
tagline: how Arabic dialects connect, on laptop and mobile
sort_order: 20
status: shipped
wip: true
wip_note: >-
  Arabic Dialect Map was one of my first projects, so the citations probably
  aren't as great as would be ideal and the data is largely taken from AI. I
  think in the future I may add voice notes for each dialect or dialect group
  for a deeper understanding of how a dialect sounds, and possibly utilize
  Arabs who are willing to volunteer for proper information built upon the UI I
  made with inspiration from regular Claude's diagram, which I eventually
  integrated into Claude Code.
github_url: https://github.com/rquader/ArabicDialectMap
web_url: https://rquader.github.io/ArabicDialectMap/
media_mode: stack
# ADR-021 — on phone widths the stack pairs poorly (the demo GIF is a
# tall portrait, the diagram is landscape, so stacking dwarfs the
# diagram). Carousel keeps each at its native aspect ratio.
media_mode_mobile: carousel
media_items:
  - src: ./images/arabic_dialect_map_photo.png
    label: screenshot
  - src: ./images/arabic_dialect_map_demo.gif
    label: demo
---

Arabic has a **lot** of dialects. It can be difficult to understand how they vary, the details they incur, how they relate to each other, and the likes. **Arabic Dialect Map** is a clean application that maps how Arabic is connected. It works on both laptop and mobile (utilizing a cards view).
