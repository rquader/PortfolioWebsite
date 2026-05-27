---
title: Web Crossword Generator
tagline: crosswords and word searches from your own word lists
sort_order: 10
status: active
wip: true
wip_note: >-
  Web Crossword Generator is a work in progress. We may further consider tradeoffs
  like whether to integrate local LLMs or some sort of AI, and whether it is worth
  making the app fully local, running in your browser. Obsidian notes for this app
  are kept private between my collaborators and me.
github_url: https://github.com/rquader/WebCrosswordGenerator
web_url: https://rquader.github.io/WebCrosswordGenerator/
media_mode: carousel
media_default: 0
media_items:
  - src: ./images/web_crossword_generator_photo.png
    label: screenshot
  - src: ./images/web_crossword_generator_demo.gif
    label: demo
---

Have you ever wanted to put together a crossword or word search about a specific topic — maybe for school children, maybe for studying, maybe just to make life a little more interesting? **Web Crossword Generator** is a collaborative effort primarily between fellow SJSU student Armaan Saini and me to make that possible and easy.

It was initially forked from [Crossword Generator](https://github.com/s-armaan/CrosswordGenerator), though being refactored into TypeScript. It has a clean skeleton architecture that lets you select a grid size, provide words to strictly include, and has a clean UI for entering words to clean it up. Wonderfully, you can **print** the crossword for students — or play it on the site yourself.
