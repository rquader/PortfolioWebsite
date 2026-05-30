---
title: Arabic Dialect Map
tagline: how Arabic dialects connect, on laptop and mobile
sort_order: 20
status: shipped
wip: true
wip_note: >-
  Arabic Dialect Map was one of my first projects thus the citations in the notes
  probably aren't as great as they would have been had I done the project later on
  and the information, at least for now, is largely taken from AI. In the future, I
  may consider having voice notes for each dialect or dialect group to allow the user
  a deeper understanding of how a dialect sounds from volunteering Arabic speakers. I
  think it'd also be nice to work with Arabic-speaking person(s) or just to pass off
  the project to someone who can update it with accurate, verifiable, and cited
  information upon the UI built here. The UI, as far as I remember, is inspired by a
  diagram Claude made when I asked its chat UI to map out the different Arabic
  dialects or something I don't quite remember which I eventually built upon with
  Claude Code.
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
  - src: ./images/arabic_dialect_map_demo.mp4
    label: demo
---

Arabic has a LOT of dialects. It can be difficult to understand how they vary, the details they incur, how they relate to each other and the likes. Arabic Dialect Map is a clean application that maps how Arabic is connected. It works on both laptop and mobile (utilizing a cards view).
