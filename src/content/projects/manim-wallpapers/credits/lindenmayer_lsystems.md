---
title: Lindenmayer Systems (L-systems)
tags: [credit, math, paper]
---

# Lindenmayer Systems (L-systems)

Conceptual inspiration for [[../wallpapers/01_recursive_tree]]. The
implementation does **not** use a formal L-system grammar — it's a
straight recursive function — but the conceptual heritage is from
L-systems.

## What L-systems are

In 1968, biologist Aristid Lindenmayer published a formal
string-rewriting system for modeling plant growth:

> Lindenmayer, A. (1968). *Mathematical models for cellular
> interactions in development.* Journal of Theoretical Biology, 18(3),
> 280–315.

An L-system has:

- An **alphabet** of symbols (e.g. `F`, `+`, `-`, `[`, `]`)
- An **axiom** — the starting string (e.g. `F`)
- One or more **production rules** that rewrite each symbol
  (e.g. `F → F[+F]F[-F]F`)

Iterating the rules N times produces a long string. Interpreting the
final string as turtle-graphics commands (`F` = forward, `+/-` =
turn, `[/]` = push/pop position-and-heading) draws a fractal that
visually resembles plants, ferns, trees, etc.

This is the standard recipe behind every "procedural tree" in computer
graphics. Prusinkiewicz & Lindenmayer's 1990 book *The Algorithmic
Beauty of Plants* (free PDF at http://algorithmicbotany.org/papers/abop/abop.pdf)
is the canonical reference.

## How this project uses the idea, not the formalism

`scenes/recursive_tree.py` implements the **conceptually-equivalent
recursive function**: a single Python function that branches into two
shorter, angled sub-trees at each call. This produces the same kind
of structure as a binary L-system like `F → F[+F][-F]` would, but
without the string-rewriting / turtle-graphics indirection.

Why not a real L-system implementation:

- An L-system would require a parser for the production rules, a
  string-rewriting loop, and a turtle-graphics interpreter. All for
  the same output a 10-line recursive function produces.
- The structural diversity that makes L-systems valuable in research
  (context-sensitive rules, stochastic rules, parametric L-systems)
  isn't needed for "a tree that sways."

But if you want a fifth wallpaper that *does* use L-systems properly —
e.g. a stochastic L-system that grows a slightly different fern every
loop within a constrained seed — that's a real upgrade path. The
project's existing structure could host it cleanly: one new file in
`scenes/`, the same `lib/` helpers.

## Attribution

Aristid Lindenmayer for the formalism. Prusinkiewicz, Hanan, and the
rest of the *Algorithmic Beauty of Plants* group for popularizing the
techniques in graphics.
