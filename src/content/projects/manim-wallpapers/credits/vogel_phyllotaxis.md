---
title: Vogel's Phyllotaxis Model
tags: [credit, math, paper]
---

# Vogel's Phyllotaxis Model

The closed-form mathematical model used by [[../wallpapers/03_phyllotaxis]].

## What it is

In 1979, Helmut Vogel published a parametric model for the spiral
arrangement of seeds in a sunflower seed head:

> Vogel, H. (1979). *A better way to construct the sunflower head.*
> Mathematical Biosciences, 44(3-4), 179–189.
> https://doi.org/10.1016/0025-5564(79)90080-4

The model:

    theta_n = n × GOLDEN_ANGLE         where GOLDEN_ANGLE = 360° × (1 - 1/φ)
    r_n     = c × √n

…where:

- `n` is the seed index (1, 2, 3, …)
- `φ` is the golden ratio (≈ 1.6180339887…)
- `GOLDEN_ANGLE` ≈ 137.5077640500378°
- `c` is a scaling constant choosing how big the head is

## Why the golden angle

The golden angle is the *most-irrational* angle, in the sense that its
continued-fraction representation `[1; 1, 1, 1, …]` converges most
slowly. Concretely: there is no small integer ratio that approximates
it well. Any small-integer angle (90°, 120°, 137°, 138°) would cause
seeds to line up into radial rows after a few revolutions; the golden
angle never does, no matter how many seeds you add.

Plants don't "know" the golden angle. They reach it because cells
inhibit each other's growth via auxin diffusion, and the
energy-minimum solution for "where to put the next cell" turns out to
be the golden angle. The math falls out of the biology, not the other
way around. See Douady & Couder 1992 for the simulation that
demonstrates this.

## How this project uses it

Directly, with `N_SEEDS = 1500` and `c = 0.092`. The Vogel formula
produces seed `(x, y)` positions; each becomes a `Dot` mobject with
size, opacity, and color interpolated by `n / N_SEEDS`.

No fudging of the formula. The Fibonacci-related spiral arms that
appear in the rendered image emerge automatically as the natural
visual structure of the dense packing.

## Other relevant work

- Douady, S., & Couder, Y. (1992). *Phyllotaxis as a physical
  self-organized growth process.* Physical Review Letters, 68(13),
  2098–2101. — the energy-minimization simulation that explains why
  plants reach the golden angle.
- Vi Hart's video "Doodling in Math: Spirals, Fibonacci, and Being
  a Plant" — the popular-math explanation that's worth watching once
  if you haven't:
  https://www.youtube.com/watch?v=ahXIMUkSXX0

(Not used as a reference for the implementation, but mentioned for
readers who want to learn more about the topic.)

## Attribution

Helmut Vogel for the formula. The mathematical content (golden angle,
Fibonacci-related spiral arms, dense disk packing) is public
mathematical knowledge.
