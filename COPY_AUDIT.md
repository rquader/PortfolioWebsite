# Copy Audit — Portfolio Site vs. PDF Canon
**Audit date:** 2026-05-29  
**PDF:** `/Users/rafanquader/Downloads/portfolio site (1).pdf` (5 pages)  
**Rule:** Visual-treatment markup (bold/`<strong>`, `<em>`, `data-syn-word`) is ignored. Code comments are ignored. Only rendered user-facing text is compared.

---

## Section Index
1. [Hero — Threshold (name + tagline)](#1-hero--threshold)
2. [On Me — bio paragraphs](#2-on-me--bio-paragraphs)
3. [On The Work — DDD narrative](#3-on-the-work--ddd-narrative)
4. [On The Trail — directive note](#4-on-the-trail--directive-note)
5. [Coda — closing](#5-coda--closing)
6. [Projects Page — framing intro prose](#6-projects-page--framing-intro-prose)
7. [Projects Page — footer outro (info mode)](#7-projects-page--footer-outro-info-mode)
8. [Web Crossword Generator — Info](#8-web-crossword-generator--info)
9. [Web Crossword Generator — Story](#9-web-crossword-generator--story)
10. [Web Crossword Generator — tagline, WIP, buttons](#10-web-crossword-generator--tagline-wip-buttons)
11. [Arabic Dialect Map — Info](#11-arabic-dialect-map--info)
12. [Arabic Dialect Map — Story](#12-arabic-dialect-map--story)
13. [Arabic Dialect Map — tagline, WIP, buttons](#13-arabic-dialect-map--tagline-wip-buttons)
14. [Adhkar Counter — Info](#14-adhkar-counter--info)
15. [Adhkar Counter — Story](#15-adhkar-counter--story)
16. [Adhkar Counter — button](#16-adhkar-counter--button)
17. [Legendary UI/UX — Info](#17-legendary-uiux--info)
18. [Legendary UI/UX — Story](#18-legendary-uiux--story)
19. [Legendary UI/UX — buttons](#19-legendary-uiux--buttons)
20. [InstaDM — Info](#20-instadm--info)
21. [InstaDM — Story](#21-instadm--story)
22. [InstaDM — WIP, button](#22-instadm--wip-button)
23. [Manim Wallpapers — Info](#23-manim-wallpapers--info)
24. [Manim Wallpapers — Story](#24-manim-wallpapers--story)
25. [Portfolio Website — Info](#25-portfolio-website--info)
26. [Portfolio Website — Story](#26-portfolio-website--story)
27. [Portfolio Website — WIP, buttons](#27-portfolio-website--wip-buttons)

---

## 1. Hero — Threshold

**PDF (canonical):**
> Rafan Quader (you can use my name, make it just):  
> Computer Science @ SJSU  
> Research (cool dot) Claude Code (cool dot) Education

**Site (current)** (`src/components/Threshold.astro:41-52`):
> rafan  
> quader  
> Computer Science @ SJSU  
> Research · Claude Code · Education

**Differences:**
- [STYLING] PDF specifies "Rafan Quader" (title-case); site renders `rafan quader` (lowercase). PDF note says "(you can use my name, make it just)" — this is an author instruction, not live copy. The lowercase rendering on-site appears to be an intentional styling choice, not copy drift, but is flagged for confirmation.
- [REMOVED] The `(cool dot)` instruction in the PDF is a design note (use a separator dot); the site renders `·` separator spans between focus areas. No body-copy difference — the dot separators are present.

---

## 2. On Me — bio paragraphs

**PDF (canonical):**
> As a student beginning in Computer Science, one thing I can say in high confidence, massive change is not only imminent but in fast motion. In that change, people can, like much other change, push towards a better world or break it down as we know it. For me, that makes my goal discovering the fields I am most interested in and joining initiatives utilizing this program to participate in meaningful endeavors, build things, or simply message Claude Code.

**Site (current)** (`src/components/OnMe.astro:38-49`):
> As a student beginning in Computer Science, one thing I can say in high confidence: massive change is not only imminent but in fast motion. In that change, people can, like much other change, push towards a better world or break it down as we know it. For me, that makes my goal discovering the fields I am most interested in and joining initiatives utilizing this program to participate in meaningful endeavors, build things, or simply message Claude Code.

**Differences:**
- [PUNCTUATION] After "high confidence" — PDF has a comma `,`; site has a colon `:`.

  PDF: `...one thing I can say in high confidence, massive change...`  
  Site: `...one thing I can say in high confidence: massive change...`

---

## 3. On The Work — DDD narrative

**PDF (canonical) — paragraph 1:**
> Over the last year, I've gotten the opportunity to work on DDD. Working with labmates and Dr. Ben Reed to utilize WiFi-Direct and create a system of internet where internet is gone whether due to natural disaster, war, etc. for free utilizing current infrastructure.

**PDF (canonical) — paragraph 2:**
> Think that there is a villager who wants to send a message, when he sends it using WiFi-Direct, that message, encrypted, makes it to, let's say a "bus driver"'s phone who is going to drive to where is internet where the villager's message is amplified.

**Site (current)** (`src/components/OnTheWork.astro:24-35`):

Paragraph 1:
> Over the last year, I've gotten the opportunity to work on DDD. Working with labmates and Dr. Ben Reed, we utilized WiFi-Direct to create a way to communicate for people where there isn't internet — whether due to natural disaster, war, and the like — for free, utilizing current infrastructure.

Paragraph 2:
> Think of, let's say a "villager", who wants to send a message: when they send it using WiFi-Direct, that message, encrypted, makes it to, let's say a "bus driver"'s phone who is driving to where there is internet, where the villager's message is amplified. The same path works in reverse, so the villager can receive messages back too.

**Differences — paragraph 1:**
- [REWORD] "Working with labmates and Dr. Ben Reed to utilize WiFi-Direct and create a system of internet where internet is gone" → "Working with labmates and Dr. Ben Reed, we utilized WiFi-Direct to create a way to communicate for people where there isn't internet"
- [REWORD] "whether due to natural disaster, war, etc." → "whether due to natural disaster, war, and the like"
- [EM-DASH] PDF has no em-dashes; site wraps "whether due to natural disaster, war, and the like" in em-dashes: `— whether due to natural disaster, war, and the like —`
- [REMOVED] "a system of internet where internet is gone" (PDF phrasing) removed; replaced with different construction

**Differences — paragraph 2:**
- [REWORD] "Think that there is a villager" → "Think of, let's say a "villager","
- [REWORD] "when he sends it" → "when they send it"  
  (pronoun change: `he` → `they`)
- [REWORD] "who is going to drive to where is internet" → "who is driving to where there is internet"
- [PUNCTUATION] "makes it to, let's say a "bus driver"'s phone" — PDF does not have the "let's say" framing in the bus driver sentence (it appears only in the PDF villager sentence); site introduces "let's say" for both.
- [ADDED] Entire sentence not in PDF: "The same path works in reverse, so the villager can receive messages back too."

---

## 4. On The Trail — directive note

**PDF (canonical):**
> Simplify the "on-the-trail" thing

This is an author directive, not body copy. The PDF gives no verbatim copy for "on the trail."

**Site (current)** (`src/components/OnTheTrail.astro:43-74`):
> on the trail  
> coursework so far  
> [4 linked course names]  
> tools  
> [Java, Git, Claude Code / Cursor, Obsidian]  
> resume (PDF) [button]

**Differences:**
- The PDF directive says "Simplify the 'on-the-trail' thing" and "put a resumé button with access to my resumé and clean up the UI for the rest." The site has a resume button and a simplified layout. No verbatim copy to compare — flagging as directive-fulfilled.
- [NOTE] PDF says "Maybe delete how I work, the closing statement etc" — there is no "how I work" section on the current site. Appears fulfilled.

---

## 5. Coda — closing

**PDF (canonical):**
> [No explicit verbatim Coda copy. The directive "Maybe delete how I work, the closing statement etc" suggests the old closing statement was to be removed. No replacement copy is specified in the PDF.]

**Site (current)** (`src/components/Coda.astro:16-19`):
> Computer Science @ SJSU  
> Research · Claude Code · Education  
> [github chip] [linkedin chip] [email chip]

**Differences:**
- No canonical PDF copy to compare against for Coda. The social links and repeat tagline appear to be site design, not copy from the PDF. Flagged as no diff from what the PDF directs (delete old closing; the current Coda is a link footer, not a narrative closing statement).

---

## 6. Projects Page — framing intro prose

**PDF (canonical) — replacement block:**
> Working on DDD, learning about Computer Science in school, and scrolling LinkedIn helped me gain a better understanding of the industry today and its often transactional nature. For me, beyond the impact of DDD, each of my projects from an Arabic Dialect Map to a message-only Instagram MacOS app, have been developed for a primary purpose for myself especially. You can select info for information on each project straight and individually. You can select story to go through a story in the code.

**Site (current)** (`src/pages/projects.astro:55-63`):
> Working on DDD, learning about Computer Science in school, and scrolling LinkedIn helped me gain a better understanding of the industry today and its often transactional nature. For me, beyond the impact of DDD, each of my projects — from an Arabic Dialect Map to a message-only Instagram macOS app — have been developed for a primary purpose for myself especially. You can select info for information on each project straight and individually. You can select story to go through a story in the code.

**Differences:**
- [EM-DASH] PDF: "each of my projects from an Arabic Dialect Map to a message-only Instagram MacOS app, have been developed..." — site wraps the "from ... app" phrase in em-dashes: `— from an Arabic Dialect Map to a message-only Instagram macOS app —`
- [REWORD] PDF: "Instagram MacOS app" → site: "Instagram macOS app" (capitalization of "MacOS" → "macOS")

---

## 7. Projects Page — footer outro (info mode)

**PDF (canonical):**
> Traceability, cross-session context sharing, and these ideas have been prevalent on LinkedIn in recent years, for me, I have solved this simply by putting together Obsidian docs for my projects, helping not only make them traceable (access by clicking a Manila Folder corresponding to a project. These notes not only make it clearer to understand the directions the AI was taking, the app itself, and its development process.

**Site (current)** (`src/pages/projects.astro:115-122`):
> Traceability, cross-session context sharing, and these ideas have been prevalent on LinkedIn in recent years. For me, I have solved this simply by putting together Obsidian docs for my projects — helping not only make them traceable, but also making it clearer to understand the directions the AI was taking, the app itself, and its development process. Obsidian notes for most programs below are available via open notes on each project.

**Differences:**
- [PUNCTUATION] PDF: "in recent years, for me, I have solved..." (comma after "years") → site: "in recent years. For me, I have solved..." (period + capitalized "For")
- [EM-DASH] PDF has no em-dash; site inserts `— helping not only make them traceable, but also making it clearer...`
- [REWORD] PDF: "helping not only make them traceable (access by clicking a Manila Folder corresponding to a project." → site: "helping not only make them traceable, but also making it clearer to understand..."  
  (The "(access by clicking a Manila Folder corresponding to a project." parenthetical is entirely absent from the site.)
- [REMOVED] PDF parenthetical "(access by clicking a Manila Folder corresponding to a project." not present on site.
- [REWORD] PDF: "These notes not only make it clearer to understand the directions the AI was taking" → site restructures this into the same em-dash clause above.
- [ADDED] Sentence not in PDF: "Obsidian notes for most programs below are available via open notes on each project."

There is also a second paragraph on the projects page intro (the "notes" addendum):

**Site only** (`src/pages/projects.astro:67-70`):
> For most of these projects, you can also access sanitized versions of my primarily (if not entirely) AI-generated Obsidian notes. I can use these notes to better understand a project's architecture and as context for AI agents!

**Differences:**
- [ADDED] This entire paragraph does not appear anywhere in the PDF.

---

## 8. Web Crossword Generator — Info

**PDF (canonical):**
> Have you ever wanted to put together a crossword or word search about a specific topic, maybe for school children, maybe for studying, maybe just to make life just a little more interesting! This Web Crossword Generator is a collaborative effort primarily between follow SJSU student, Armaan Saini, and I to make that possible and easy, initially forked from Crossword Generator (button with the GitHub link https://github.com/s-armaan/CrosswordGenerator), though being refactored into TypeScript. It has a clean skeleton architecture that allows you to select a grid size, provide words to strictly include, and has a clean UI for entering words to clean it up. Wonderfully, you can print the crossword for students (or play it on the site yourself!)

**Site (current)** (`src/content/projects/web-crossword-generator/_index.md:23-25`):
> Have you ever wanted to put together a crossword or word search about a specific topic — maybe for school children, maybe for studying, maybe just to make life a little more interesting? Web Crossword Generator is a collaborative effort primarily between fellow SJSU student Armaan Saini and me to make that possible and easy.
>
> It was initially forked from Crossword Generator (https://github.com/s-armaan/CrosswordGenerator), though being refactored into TypeScript. It has a clean skeleton architecture that lets you select a grid size, provide words to strictly include, and has a clean UI for entering words to clean it up. Wonderfully, you can print the crossword for students — or play it on the site yourself.

**Differences:**
- [EM-DASH] PDF: "about a specific topic, maybe for school children" → site: "about a specific topic — maybe for school children"
- [REMOVED] PDF: "maybe just to make life just a little more interesting!" → site: "maybe just to make life a little more interesting?" (one "just" removed; exclamation → question mark)
- [PUNCTUATION] End of first sentence: PDF `!` → site `?`
- [REWORD] PDF: "follow SJSU student, Armaan Saini, and I" → site: "fellow SJSU student Armaan Saini and me"  
  (typo fix "follow"→"fellow"; grammar fix "and I"→"and me"; comma pattern changed)
- [REMOVED] PDF: "initially forked from Crossword Generator (button with the GitHub link https://github.com/s-armaan/CrosswordGenerator)" — the "(button with the GitHub link ...)" instruction text was correctly removed from prose, replaced with a plain markdown link. No copy drift here; this was an author instruction.
- [REWORD] PDF: "that allows you to select a grid size" → site: "that lets you select a grid size"
- [EM-DASH] PDF: "(or play it on the site yourself!)" → site: "— or play it on the site yourself" (parentheses replaced by em-dash; exclamation removed; trailing period added)
- [REMOVED] Period at end: PDF ends `yourself!)` → site ends `yourself.` (punctuation style change)

---

## 9. Web Crossword Generator — Story

**PDF (canonical):**
> In my AP CSA class, we had an assignment to put a game together using Java Swing. 6 of us in that team developed Crossword Generator, a preliminary version of our generator with a rough, faulty algorithm. Around a year later in SJSU, I'd had ideas on how to expand the app and make it something greater that was functional and meaningful, Web Crossword Generator, I got in touch with Armaan Saini and we forked CrosswordGenerator and developed a web-app. An web-app meant to be simple, meant to make generating crosswords simple. Over time, this version began to diverge greatly from the original(to be honest, it having been refactored in TypeScript probably means something pretty significant on its own). I worked on implementing a skeleton-based approach where a user could put in strictly-include words and a grid-size and get a nearly completed crossword back with a clean UI to complete the rest. Web Crossword Generator now a web-app meant to be used to generate crosswords or word searches, print them! And deeply importantly, Web Crossword Generator could truly be useful whether to teachers, independent learners, or the likes!

**Site (current)** (`src/content/projects/web-crossword-generator/story.md:1-3`):
> In my AP CSA class, we had an assignment to put a game together using Java Swing. Six of us in that team developed Crossword Generator, a preliminary version of our generator with a rough, faulty algorithm. Around a year later at SJSU, I'd had ideas on how to expand the app and make it something greater that was functional and meaningful — Web Crossword Generator. I got in touch with Armaan Saini and we forked Crossword Generator and developed a web app.
>
> An web app meant to be simple, meant to make generating crosswords simple. Over time, this version began to diverge greatly from the original (to be honest, it having been refactored in TypeScript probably means something pretty significant on its own). I worked on implementing a skeleton-based approach where a user could put in strictly-include words and a grid size and get a nearly completed crossword back with a clean UI to complete the rest. Web Crossword Generator is now a web app meant to be used to generate crosswords or word searches, print them — and deeply importantly, it could truly be useful whether to teachers, independent learners, or the likes.

**Differences:**
- [REWORD] PDF: "6 of us" → site: "Six of us" (numeral → word)
- [REWORD] PDF: "in SJSU" → site: "at SJSU"
- [EM-DASH] PDF: "make it something greater that was functional and meaningful, Web Crossword Generator, I got in touch" → site: "make it something greater that was functional and meaningful — Web Crossword Generator. I got in touch"  
  (comma → em-dash + period; one continuous sentence split into two)
- [REWORD] PDF: "CrosswordGenerator" (one word) → site: "Crossword Generator" (two words)
- [REWORD] PDF: "web-app" → site: "web app" (hyphen removed, twice)
- [REWORD] PDF: "a grid-size" → site: "a grid size" (hyphen removed)
- [REWORD] PDF: "Web Crossword Generator now a web-app meant to be used" → site: "Web Crossword Generator is now a web app meant to be used" (missing "is" added)
- [EM-DASH] PDF: "print them!" → site: "print them —" (exclamation → em-dash, linking next clause)
- [REWORD] PDF: "And deeply importantly, Web Crossword Generator could truly be useful whether to teachers, independent learners, or the likes!" → site: "and deeply importantly, it could truly be useful whether to teachers, independent learners, or the likes."  
  (capitalized "And"→lowercase "and"; "Web Crossword Generator" → "it"; exclamation → period)

---

## 10. Web Crossword Generator — tagline, WIP, buttons

**PDF (canonical):**
> Buttons for:  
> GitHub: https://github.com/rquader/WebCrosswordGenerator  
> WebCrosswordGenerator(or live site, however it seems right to phrase that): https://rquader.github.io/WebCrosswordGenerator/

**Site (current)** (`src/content/projects/web-crossword-generator/_index.md` frontmatter):
```
github_url: https://github.com/rquader/WebCrosswordGenerator
web_url: https://rquader.github.io/WebCrosswordGenerator/
```
WIP note site: "Web Crossword Generator is a work in progress. We may further consider tradeoffs like whether to integrate local LLMs or some sort of AI, and whether it is worth making the app fully local, running in your browser. Obsidian notes for this app are kept private between my collaborators and me."

**PDF WIP (canonical):**
> Web Crossword Generator is a work-in-progress, we may further consider tradeoffs like whether to integrate local LLMs, some sort of AI, and whether it is worth it at all to make it so this app is fully local running on your browser. Also Obsidian Notes are below for the rest of the apps! The Obsidian notes for this app are kept private between my collaborators and I. The Obsidian notes for the rest of the programs should be available below!

**Differences — buttons:**
- ✓ Both GitHub and live-site URLs match exactly.

**Differences — WIP note:**
- [REWORD] PDF: "a work-in-progress" → site: "a work in progress" (hyphen removed)
- [REWORD] PDF: "we may further consider tradeoffs like whether to integrate local LLMs, some sort of AI, and whether it is worth it at all to make it so this app is fully local running on your browser" → site: "We may further consider tradeoffs like whether to integrate local LLMs or some sort of AI, and whether it is worth making the app fully local, running in your browser"  
  ("and" → "or" between LLMs/AI; "it is worth it at all to make it so this app is fully local running" → "it is worth making the app fully local, running")
- [REMOVED] PDF: "Also Obsidian Notes are below for the rest of the apps! The Obsidian notes for the rest of the programs should be available below!" — not present in site WIP note.
- [REWORD] PDF: "between my collaborators and I" → site: "between my collaborators and me" (grammar fix)

---

## 11. Arabic Dialect Map — Info

**PDF (canonical):**
> Arabic has a LOT of dialects. It can be difficult to understand how they vary, the details they incur, how they relate to each other and the likes. Arabic Dialect Map is a clean application that maps how Arabic is connected. It works on both laptop and mobile (utilizing a cards view).

**Site (current)** (`src/content/projects/arabic-dialect-map/_index.md:29`):
> Arabic has a lot of dialects. It can be difficult to understand how they vary, the details they incur, how they relate to each other, and the likes. Arabic Dialect Map is a clean application that maps how Arabic is connected. It works on both laptop and mobile (utilizing a cards view).

**Differences:**
- [REWORD] PDF: "a LOT of dialects" → site: "a lot of dialects" (all-caps "LOT" → lowercase "lot")
- [PUNCTUATION] PDF: "how they relate to each other and the likes" → site: "how they relate to each other, and the likes" (comma added before "and the likes")

---

## 12. Arabic Dialect Map — Story

**PDF (canonical):**
> Having started to use Claude Code in DDD, I had become more comfortable with the tool. Arabic is a language that is greatly fascinating to me especially due to the great population of people who speak it along with another language. As a result, we had developed how the many dialects interact and their cross-intelligibility.

**Site (current)** (`src/content/projects/arabic-dialect-map/story.md:1`):
> Having started to use Claude Code in DDD, I had become more comfortable with the tool. Arabic is a language that is greatly fascinating to me, especially due to the great population of people who speak it along with another language. As a result, we developed how the many dialects interact and their cross-intelligibility.

**Differences:**
- [PUNCTUATION] PDF: "fascinating to me especially due to" → site: "fascinating to me, especially due to" (comma added before "especially")
- [REWORD] PDF: "we had developed how the many dialects interact" → site: "we developed how the many dialects interact" ("had developed" → "developed")

---

## 13. Arabic Dialect Map — tagline, WIP, buttons

**PDF WIP (canonical):**
> "Arabic Dialect Map was one of my first projects therefore the citations probably aren't as great as would be ideal and the data is largely taken from AI. I think in the future, I consider having voice notes for each dialect or dialect group for a deeper understanding of how a dialect sounds and possibly utilize Arab(s) who are willing to volunteer for proper information built upon the UI I made with inspiration from regular Claude's diagram which I eventually integrated into Claude Code.

**Site WIP (current)** (`src/content/projects/arabic-dialect-map/_index.md` frontmatter wip_note):
> Arabic Dialect Map was one of my first projects, so the citations probably aren't as great as would be ideal and the data is largely taken from AI. I think in the future I may add voice notes for each dialect or dialect group for a deeper understanding of how a dialect sounds, and possibly utilize Arabs who are willing to volunteer for proper information built upon the UI I made with inspiration from regular Claude's diagram, which I eventually integrated into Claude Code.

**PDF buttons:**
> GitHub: https://github.com/rquader/ArabicDialectMap  
> WebCrosswordGenerator(or live site): https://rquader.github.io/ArabicDialectMap/

**Site buttons** (`_index.md` frontmatter):
```
github_url: https://github.com/rquader/ArabicDialectMap
web_url: https://rquader.github.io/ArabicDialectMap/
```

**Differences — WIP note:**
- [REWORD] PDF: "was one of my first projects therefore the citations" → site: "was one of my first projects, so the citations" ("therefore" → ", so")
- [REWORD] PDF: "I think in the future, I consider having voice notes" → site: "I think in the future I may add voice notes" ("consider having" → "may add"; comma after "future" removed)
- [PUNCTUATION] PDF: "how a dialect sounds and possibly utilize" → site: "how a dialect sounds, and possibly utilize" (comma added)
- [REWORD] PDF: "utilize Arab(s) who are willing" → site: "utilize Arabs who are willing" ("Arab(s)" → "Arabs")
- [PUNCTUATION] PDF: "regular Claude's diagram which I eventually" → site: "regular Claude's diagram, which I eventually" (comma added before "which")

**Differences — buttons:**
- ✓ Both GitHub and live-site URLs match exactly.

---

## 14. Adhkar Counter — Info

**PDF (canonical):**
> I imagine many Muslims are in this situation, they sit down, want to do adhkar, but have work to do. Adhkar counter solves this by putting it into your screen, by clicking a hotkey you can lower the counter. It also comes with deep customization.

**Site (current)** (`src/content/projects/adhkar-counter/_index.md:16`):
> I imagine many Muslims are in this situation: they sit down, want to do adhkar, but have work to do. Adhkar Counter solves this by putting it on your screen — by clicking a hotkey you can lower the counter. It also comes with deep customization.

**Differences:**
- [PUNCTUATION] PDF: "in this situation, they sit down" → site: "in this situation: they sit down" (comma → colon)
- [REWORD] PDF: "Adhkar counter" → site: "Adhkar Counter" (lowercase "counter" → capitalized "Counter")
- [REWORD] PDF: "putting it into your screen" → site: "putting it on your screen" ("into" → "on")
- [EM-DASH] PDF: "putting it into your screen, by clicking a hotkey" → site: "putting it on your screen — by clicking a hotkey" (comma → em-dash)

---

## 15. Adhkar Counter — Story

**PDF (canonical):**
> For my personal use, I wanted to put together an Adkhar Counter, a little app to see my Adkhar be counted down. After some messing around, it was pretty easy to put together in Swift which made it very lightweight!

**Site (current)** (`src/content/projects/adhkar-counter/story.md:1`):
> For my personal use, I wanted to put together an Adhkar Counter, a little app to see my adhkar be counted down. After some messing around, it was pretty easy to put together in Swift, which made it very lightweight.

**Differences:**
- [REWORD] PDF: "an Adkhar Counter" → site: "an Adhkar Counter" ("Adkhar" → "Adhkar" — spelling correction)
- [REWORD] PDF: "my Adkhar be counted down" → site: "my adhkar be counted down" (capitalized "Adkhar" → lowercase "adhkar"; spelling corrected)
- [PUNCTUATION] PDF: "put together in Swift which made it" → site: "put together in Swift, which made it" (comma added before "which")
- [PUNCTUATION] PDF ends `very lightweight!` → site ends `very lightweight.` (exclamation → period)

---

## 16. Adhkar Counter — button

**PDF (canonical):**
> Button for:  
> GitHub: https://github.com/rquader/ArabicDialectMap

**Site (current)** (`src/content/projects/adhkar-counter/_index.md` frontmatter):
```
github_url: https://github.com/rquader/AdhkarCounter
```

**Differences:**
- [LINK] PDF lists `https://github.com/rquader/ArabicDialectMap` as the GitHub button for Adhkar Counter — this appears to be a copy-paste error in the PDF (same URL as Arabic Dialect Map). Site correctly uses `https://github.com/rquader/AdhkarCounter`. This is a PDF error, not a site drift, but flagged for Rafan's awareness.

---

## 17. Legendary UI/UX — Info

**PDF (canonical):**
> What would AI do if asked to put together an incredible, aesthetically-pleasing site. Albeit with a little bit back and forth from a human. That's basically what this is. The product of Claude, a little bit of Cursor, and back and forth with me, a website that is simply beautiful, clean, and feature-filled.

**Site (current)** (`src/content/projects/legendary-ui-ux/_index.md:13`):
> What if I just instructed Claude to make a site that was super cool and fit in a single HTML file? That's basically what this is — with a little back-and-forth from a human. The product of Claude, a little bit of Cursor, and back-and-forth with me: a website that is simply beautiful, clean, and feature-filled.

**Differences:**
- [REWORD] PDF: "What would AI do if asked to put together an incredible, aesthetically-pleasing site. Albeit with a little bit back and forth from a human." → site: "What if I just instructed Claude to make a site that was super cool and fit in a single HTML file? That's basically what this is — with a little back-and-forth from a human."  
  (Entire opening rewritten. PDF's "What would AI do..." sentence is completely absent. Site introduces "fit in a single HTML file" which is not in PDF.)
- [EM-DASH] Site inserts `— with a little back-and-forth from a human` (em-dash not in PDF)
- [PUNCTUATION] PDF: "back and forth from a human" → site: "back-and-forth from a human" (hyphenated)
- [PUNCTUATION] PDF: "back and forth with me, a website" → site: "back-and-forth with me: a website" (hyphenated; comma → colon)

---

## 18. Legendary UI/UX — Story

**PDF (canonical):**
> Honestly, at this point I'd realized AI programming was really powerful and thus the idea piqued my interest of how cool of a website it could make. So here is the product of me basically giving Claude a vague (relative to the website's complexity) vision and with some back and forth with Claude Code and later Cursor, the product is this wonderful website. Not only is it beautiful in itself (and feature-filled!), it ended up being an inspiration for this portfolio website as well!

**Site (current)** (`src/content/projects/legendary-ui-ux/story.md:1`):
> Honestly, by this point I'd realized AI programming was really powerful, and the idea piqued my interest: how cool of a website could it make? So here is the product of me basically giving Claude a vague vision — relative to the website's complexity — and with some back-and-forth with Claude Code and later Cursor, this wonderful website. Not only is it beautiful in itself (and feature-filled!), it ended up being an inspiration for this portfolio website as well.

**Differences:**
- [REWORD] PDF: "at this point" → site: "by this point"
- [REWORD] PDF: "and thus the idea piqued my interest of how cool of a website it could make." → site: "and the idea piqued my interest: how cool of a website could it make?"  
  ("thus" removed; indirect question → direct question; phrasing restructured)
- [PUNCTUATION] PDF: "really powerful and thus" → site: "really powerful, and" (comma added; "thus" removed)
- [EM-DASH] PDF: "giving Claude a vague (relative to the website's complexity) vision" → site: "giving Claude a vague vision — relative to the website's complexity —"  
  (parentheses → em-dashes, repositioned after "vision")
- [REWORD] PDF: "with some back and forth with Claude Code" → site: "with some back-and-forth with Claude Code" (hyphenated)
- [REWORD] PDF: "the product is this wonderful website" → site: "this wonderful website" ("the product is" removed)
- [PUNCTUATION] PDF ends `as well!` → site ends `as well.` (exclamation → period)

---

## 19. Legendary UI/UX — buttons

**PDF (canonical):**
> Buttons for:  
> GitHub: https://github.com/rquader/Legendary-UI-UX  
> LegendaryUI/UX(or live site, however it seems right to phrase that): https://rquader.github.io/Legendary-UI-UX/

**Site (current)** (`src/content/projects/legendary-ui-ux/_index.md` frontmatter):
```
github_url: https://github.com/rquader/Legendary-UI-UX
web_url: https://rquader.github.io/Legendary-UI-UX/
```

**Differences:**
- ✓ Both GitHub and live-site URLs match exactly.

---

## 20. InstaDM — Info

**PDF (canonical):**
> You ever feel like Instagram is too addicting. Reels, stories, etc. Honestly, I felt the same and my Instagram account for a time was deleted too! I developed InstaDM to solve this, it is a light-weight Swift MacOS application that if you log into will allow you to access your Instagram messages. Say hello to the days of not becoming disconnected to those who message you on Discord while not being locked at it.

**Site (current)** (`src/content/projects/insta-dm/_index.md:16`):
> You ever feel like Instagram is too addicting — reels, stories, and the rest? Honestly, I felt the same, and my Instagram account was deleted for a time too. I developed InstaDM to solve this: it is a lightweight Swift macOS application that, if you log in, lets you access your Instagram messages. Say hello to the days of not becoming disconnected from those who message you while not being locked into the feed.

**Differences:**
- [EM-DASH] PDF: "too addicting. Reels, stories, etc." → site: "too addicting — reels, stories, and the rest?" (period → em-dash; "etc." → "and the rest"; exclamation absent; sentence restructured)
- [REWORD] PDF: "Reels, stories, etc." → site: "reels, stories, and the rest" (lowercase; "etc." → "and the rest")
- [REWORD] PDF: "my Instagram account for a time was deleted too!" → site: "my Instagram account was deleted for a time too." (word order changed; exclamation → period)
- [PUNCTUATION] Site adds comma: "I felt the same, and my Instagram"
- [REWORD] PDF: "a light-weight Swift MacOS application" → site: "a lightweight Swift macOS application" (hyphen removed in "lightweight"; "MacOS" → "macOS")
- [REWORD] PDF: "that if you log into will allow you to access your Instagram messages" → site: "that, if you log in, lets you access your Instagram messages" ("log into" → "log in"; "will allow you to access" → "lets you access"; commas added)
- [REWORD] PDF: "not becoming disconnected to those who message you on Discord" → site: "not becoming disconnected from those who message you"  
  ("to" → "from"; "on Discord" removed entirely)
- [REWORD] PDF: "while not being locked at it" → site: "while not being locked into the feed" ("locked at it" → "locked into the feed")

---

## 21. InstaDM — Story

**PDF (canonical):**
> Back before I developed InstaDM, I wanted to solve a single problem, Instagram, which was addicting: photos, reels, stories and may disconnect from DMs and group chats that are important to you! For this reason, you can vote for someone with a different laptop if you sign in.

**Site (current)** (`src/content/projects/insta-dm/story.md:1`):
> Back before I developed InstaDM, I wanted to solve a single problem: Instagram was addicting — photos, reels, stories — and could disconnect me from DMs and group chats that matter. For this reason, InstaDM focuses on messages only so you can stay reachable without the rest of the app.

**Differences:**
- [PUNCTUATION] PDF: "a single problem, Instagram, which was addicting:" → site: "a single problem: Instagram was addicting —"  
  (comma → colon; structure changed; "which was" removed; em-dash introduced)
- [EM-DASH] Site introduces em-dashes around "photos, reels, stories": `— photos, reels, stories —`
- [REWORD] PDF: "and may disconnect from DMs and group chats that are important to you!" → site: "and could disconnect me from DMs and group chats that matter."  
  ("may" → "could"; "to you!" removed; "me" added; "that are important to you" → "that matter")
- [REWORD] PDF: "For this reason, you can vote for someone with a different laptop if you sign in." → site: "For this reason, InstaDM focuses on messages only so you can stay reachable without the rest of the app."  
  (Entire second sentence completely rewritten. PDF: "you can vote for someone with a different laptop if you sign in" — this text is entirely absent from the site.)

---

## 22. InstaDM — WIP, button

**PDF (canonical):**
> Add WIP sticker: This app is a work in progress, but should be currently functional! (though it may reload a few times on launch)  
> Button for:  
> GitHub: https://github.com/rquader/InstaDM

**Site (current)** (`src/content/projects/insta-dm/_index.md` frontmatter):
```
wip_note: This app is a work in progress, but should be currently functional (though it may reload a few times on launch).
github_url: https://github.com/rquader/InstaDM
```

**Differences — WIP note:**
- [PUNCTUATION] PDF: "currently functional!" → site: "currently functional" (exclamation removed; parenthetical folded inline without exclamation)
- [PUNCTUATION] PDF: "(though it may reload..." → site: "(though it may reload..." — same text, but sentence ends with `.` not `!`

**Differences — button:**
- ✓ GitHub URL matches exactly.

---

## 23. Manim Wallpapers — Info

**PDF (canonical):**
> You ever see the jaw-dropping videos with 3Blue1Brown whether explaining Linear Algebra or Calculus. He uses a Python library he developed called Jupyter Notebook. Manim Wallpapers is basically utilizing the Manim language with Claude Code to see if I could put together high-quality animated outputs which could serve as laptop wallpapers.

**Site (current)** (`src/content/projects/manim-wallpapers/_index.md:32`):
> You ever see the jaw-dropping videos from 3Blue1Brown, whether explaining linear algebra or calculus? He uses a Python library he developed called Manim. Manim Wallpapers is basically utilizing the Manim language with Claude Code to see if I could put together high-quality animated outputs which could serve as laptop wallpapers.

**Differences:**
- [REWORD] PDF: "videos with 3Blue1Brown" → site: "videos from 3Blue1Brown" ("with" → "from")
- [PUNCTUATION] PDF: "whether explaining Linear Algebra or Calculus." → site: "whether explaining linear algebra or calculus?" (capitalization lowered; period → question mark; comma added after "3Blue1Brown")
- [REWORD] PDF: "a Python library he developed called Jupyter Notebook" → site: "a Python library he developed called Manim"  
  (PDF says "Jupyter Notebook" — this appears to be an error in the PDF since the subject is Manim. Site corrects to "Manim". Flagged as a possible PDF error, not necessarily site drift.)

---

## 24. Manim Wallpapers — Story

**PDF (canonical):**
> Having developed so much already, I began to get inspired by 3Blue1Brown's incredible videos and design utilizing his own Python library, Manim. Utilizing Claude Code and going back and forth, I was able to put together a great set of wonderful wallpapers utilizing Manim!

**Site (current)** (`src/content/projects/manim-wallpapers/story.md:1`):
> Having developed so much already, I began to get inspired by 3Blue1Brown's incredible videos and design, utilizing his own Python library, Manim. Utilizing Claude Code and going back and forth, I was able to put together a great set of wonderful wallpapers utilizing Manim.

**Differences:**
- [PUNCTUATION] PDF: "videos and design utilizing his own Python library" → site: "videos and design, utilizing his own Python library" (comma added before "utilizing")
- [PUNCTUATION] PDF ends `utilizing Manim!` → site ends `utilizing Manim.` (exclamation → period)

---

## 25. Portfolio Website — Info

**PDF (canonical):**
> You ever wanted deeply to get an internship sometime soon somehow? Or for a recruiter, or friend, or anyone else to understand who you want to position yourself as? Those ideas integrate deeply into my very own portfolio website! This website itself utilizes much of what I have done so far and amalgamates it into a site that is clean, interesting, and fresh.

**Site (current)** (`src/content/projects/portfolio-website/_index.md:15`):
> You ever wanted deeply to get an internship sometime soon, or for a recruiter, friend, or anyone else to understand who you want to position yourself as? Those ideas integrate deeply into my very own portfolio website. This website utilizes much of what I have done so far and amalgamates it into a site that is clean, interesting, and fresh.

**Differences:**
- [REWORD] PDF: "sometime soon somehow? Or for a recruiter, or friend" → site: "sometime soon, or for a recruiter, friend"  
  (PDF splits into two sentences with "somehow?"; site merges into one sentence, removing "somehow" and the question break)
- [REMOVED] PDF: "somehow" — not present in site
- [PUNCTUATION] PDF: "my very own portfolio website!" → site: "my very own portfolio website." (exclamation → period)
- [REMOVED] PDF: "itself" in "This website itself utilizes" → site: "This website utilizes" ("itself" removed)

---

## 26. Portfolio Website — Story

**PDF (canonical):**
> Congratulations on reading so far! You have reached the amalgamation, the product, the showcase of my work! Portfolio Website is put together in multiple steps, taking from the projects before. This website takes the Recursive Tree 2 from **Manim Wallpapers** and utilizing Manim makes the size of it editable! It takes synthesia and many of the basic ideas from **Legendary UI/UX**, most likely this website took benefit from my eye for design exemplified in **Arabic Dialect Map**. But most of all, simply put, this website is an amalgamation. It showcases the projects before and integrates them altogether.

**Site (current)** (`src/content/projects/portfolio-website/story.md:1`):
> Congratulations on reading so far — you have reached the amalgamation, the product, the showcase of my work. Portfolio Website is put together in multiple steps, taking from the projects before. This website takes the recursive tree from Manim Wallpapers and makes the size of it editable. It takes synesthesia and many of the basic ideas from Legendary UI/UX; most likely this website took benefit from my eye for design exemplified in Arabic Dialect Map. But most of all, simply put, this website is an amalgamation. It showcases the projects before and integrates them altogether.

**Differences:**
- [EM-DASH] PDF: "Congratulations on reading so far! You have reached the amalgamation" → site: "Congratulations on reading so far — you have reached the amalgamation"  
  (exclamation + new sentence → em-dash continuation)
- [PUNCTUATION] PDF: "the showcase of my work!" → site: "the showcase of my work." (exclamation → period)
- [REWORD] PDF: "takes the Recursive Tree 2 from Manim Wallpapers" → site: "takes the recursive tree from Manim Wallpapers"  
  ("Recursive Tree 2" → "recursive tree"; "2" dropped; capitalization changed)
- [REWORD] PDF: "and utilizing Manim makes the size of it editable!" → site: "and makes the size of it editable."  
  ("utilizing Manim" removed; exclamation → period)
- [REWORD] PDF: "It takes synthesia" → site: "It takes synesthesia" (typo fixed: "synthesia" → "synesthesia")
- [PUNCTUATION] PDF: "from Legendary UI/UX, most likely" → site: "from Legendary UI/UX; most likely" (comma → semicolon)

---

## 27. Portfolio Website — WIP, buttons

**PDF (canonical):**
> WIP (Clickable Sticker Like Before): This portfolio is a work-in-progress, I might try to use my what I'm especially skilled at like communication to give this site some more flair by adding a cool introduction video and possibly video demos!  
> Buttons for:  
> GitHub: (we'll add a link for this once it exists)  
> Rafan's Portfolio (the home page of the portfolio website, we'll add a link for this once it exists)

**Site (current)** (`src/content/projects/portfolio-website/_index.md` frontmatter):
```
wip_note: >-
  This portfolio is a work in progress. I might add more flair with an
  introduction video and possibly video demos when the time is right.
```
No `github_url` or `web_url` in frontmatter.

**Differences — WIP note:**
- [REWORD] PDF: "a work-in-progress, I might try to use my what I'm especially skilled at like communication to give this site some more flair by adding a cool introduction video and possibly video demos!" → site: "a work in progress. I might add more flair with an introduction video and possibly video demos when the time is right."  
  (hyphen removed; the "use my what I'm especially skilled at like communication" clause removed entirely; "when the time is right" added, not in PDF)
- [REMOVED] PDF: "I might try to use my what I'm especially skilled at like communication to give this site some more flair by adding" → site omits everything between "might" and "introduction video"
- [ADDED] Site adds: "when the time is right" — not in PDF
- [PUNCTUATION] PDF ends `video demos!` → site ends `video demos when the time is right.` (exclamation → period)

**Differences — buttons:**
- PDF notes both GitHub and home-page links "will be added once they exist." Site has no `github_url` or `web_url`. This matches the PDF's intent (placeholders not yet live).

---

## Summary Table

| Tag | Count |
|---|---|
| EM-DASH (em-dash inserted where PDF has none, or comma/period) | 18 |
| REWORD (word/phrase changed) | 42 |
| PUNCTUATION (comma/colon/period/exclamation swapped, not em-dash) | 20 |
| ADDED (text in site not in PDF) | 5 |
| REMOVED (text in PDF not in site) | 9 |
| LINK (URL mismatch) | 1 (Adhkar Counter GitHub — PDF has wrong URL; site is correct) |

---

## Files Containing Differences

1. `src/components/OnMe.astro` — punctuation (comma → colon after "high confidence")
2. `src/components/OnTheWork.astro` — major rewording of both DDD paragraphs; em-dashes added; pronoun changed (he→they); sentence added
3. `src/pages/projects.astro` — em-dashes added to intro; "MacOS"→"macOS"; footer outro rewritten; extra paragraph added
4. `src/content/projects/web-crossword-generator/_index.md` — em-dash in opening; multiple rewording; WIP note reworded
5. `src/content/projects/web-crossword-generator/story.md` — em-dash inserted; multiple rewording; exclamation→period
6. `src/content/projects/arabic-dialect-map/_index.md` — "LOT"→"lot"; WIP note reworded
7. `src/content/projects/arabic-dialect-map/story.md` — comma added; "had developed"→"developed"
8. `src/content/projects/adhkar-counter/_index.md` — comma→colon; em-dash; "into"→"on"; capitalization
9. `src/content/projects/adhkar-counter/story.md` — spelling corrections; comma added; exclamation→period
10. `src/content/projects/legendary-ui-ux/_index.md` — entire opening sentence rewritten; em-dash added; colon for comma
11. `src/content/projects/legendary-ui-ux/story.md` — "at"→"by"; em-dashes added; exclamation→period; back-and-forth hyphenated
12. `src/content/projects/insta-dm/_index.md` — major rewrite; em-dash; "MacOS"→"macOS"; "on Discord" removed; "at it"→"into the feed"
13. `src/content/projects/insta-dm/story.md` — complete rewrite of second sentence; em-dashes added
14. `src/content/projects/manim-wallpapers/_index.md` — "with"→"from"; period→question mark; "Jupyter Notebook"→"Manim"
15. `src/content/projects/manim-wallpapers/story.md` — comma added; exclamation→period
16. `src/content/projects/portfolio-website/_index.md` — "somehow" removed; sentence merged; exclamation→period; "itself" removed; WIP note rewritten
17. `src/content/projects/portfolio-website/story.md` — em-dash for sentence break; "Recursive Tree 2"→"recursive tree"; "utilizing Manim" removed; exclamation→period; semicolon for comma

---

## 5–10 Most Significant Rewording Differences

1. **OnTheWork DDD paragraph 1** — "Working with labmates and Dr. Ben Reed to utilize WiFi-Direct and create a system of internet where internet is gone whether due to natural disaster, war, etc." became a substantially rephrased sentence with different structure, added "we," changed "system of internet where internet is gone" to "a way to communicate for people where there isn't internet."

2. **OnTheWork DDD paragraph 2 — pronoun change** — PDF: "when he sends it" → site: "when they send it." Pronoun change from `he` to `they`.

3. **InstaDM Story — second sentence entirely replaced** — PDF: "For this reason, you can vote for someone with a different laptop if you sign in." Site: "For this reason, InstaDM focuses on messages only so you can stay reachable without the rest of the app." The PDF sentence is completely absent.

4. **InstaDM Info — "on Discord" removed** — PDF: "not becoming disconnected to those who message you on Discord while not being locked at it." Site removes "on Discord" and changes the ending: "not becoming disconnected from those who message you while not being locked into the feed."

5. **Legendary UI/UX Info — opening sentence replaced** — PDF: "What would AI do if asked to put together an incredible, aesthetically-pleasing site. Albeit with a little bit back and forth from a human." Site: "What if I just instructed Claude to make a site that was super cool and fit in a single HTML file?" — entirely different framing; "fit in a single HTML file" is not in the PDF.

6. **Portfolio Website Story — "Recursive Tree 2" → "recursive tree"** — PDF specifies "Recursive Tree 2"; site drops the "2" and lowercases. The specific wallpaper number is lost.

7. **Portfolio Website Story — "utilizing Manim makes the size of it editable"** — PDF: "and utilizing Manim makes the size of it editable!"; site: "and makes the size of it editable." — "utilizing Manim" is removed.

8. **Web Crossword Generator Story — "6 of us"→"Six of us", "in SJSU"→"at SJSU"** — minor grammar/style corrections but represent copy changes from Rafan's original phrasing.

9. **Projects Page intro — em-dashes wrapping "from an Arabic Dialect Map to a message-only Instagram macOS app"** — PDF has no em-dashes here; site adds them. Also "MacOS" → "macOS".

10. **Portfolio Website WIP — entire explanatory clause removed** — PDF: "I might try to use my what I'm especially skilled at like communication to give this site some more flair by adding..." Site removes everything between "might" and "introduction video." Also adds "when the time is right" which is not in the PDF.
