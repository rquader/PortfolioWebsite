---
tags: [adr, hosting]
---

# ADR-002 — Hosting: Cloudflare Pages (with GitHub Pages as documented fallback)

**Status:** accepted
**Date:** 2026-05-17

## Context

We need free hosting for a static site (`dist/` output from Astro). The site is a portfolio — moderate traffic, no auth, no server-side logic. Custom domain is desired (TBD; possibly `rafanquader.dev`, possibly stay on platform-assigned subdomain).

## Decision

**Primary:** Cloudflare Pages free tier. Auto-deploy from GitHub on push to `main`. Custom domain configured via Cloudflare DNS in the dashboard.

**Documented fallback:** GitHub Pages, with a `.github/workflows/deploy.yml` workflow file present in the repo but disabled by default (commented or behind a manual trigger). Documented so a future agent can switch in ~15 minutes.

## Alternatives considered

### GitHub Pages

Free, fully integrated with the repo, simple.

- *Why-not as primary:* CDN is slower in some regions; cold-cache time is noticeable. Custom domain setup requires DNS records pointing at GitHub's IP set. Pull-request preview deployments require manual setup. Mostly fine, but CF Pages is strictly better on each dimension.

### Vercel (free / hobby tier)

Excellent DX, great preview deploys, fast CDN.

- *Why-not:* free tier has some usage caps that are unlikely to bite but feel limiting; dashboard is heavier than CF's; for a pure static site there's nothing Vercel does better than CF Pages and CF's edge network is broader.

### Netlify (free / personal tier)

Similar profile to Vercel.

- *Why-not:* same reasoning. CF Pages is strictly comparable or better for static + free + custom-domain + edge.

### Self-host on a VPS

A small box, nginx, certbot.

- *Why-not:* introduces ops work (server upgrades, security patches, monitoring). Free CDN with edge presence in 300+ cities is simply better for a portfolio that gets read globally. The user has explicitly asked for free hosting.

## Benefits

- **Free.** No card required for the static-site tier.
- **Global edge CDN.** Pages are served from the nearest CF data center to the reader.
- **Easy custom domain.** Point a CNAME (or use CF DNS), done. Free SSL via CF.
- **Preview deployments per PR.** Each PR gets a unique URL automatically.
- **Build minutes are generous.** ~500/month free; we'll use far less.
- **Aggregated analytics for free.** No client-side script required (CF logs requests).
- **CF DNS is sane.** No DNS lock-in. If we leave, point the domain elsewhere.

## Harms / Tradeoffs

- **Vendor coupling.** We're on Cloudflare. Mitigation: the build output is plain static files, portable anywhere. The fallback to GitHub Pages is one workflow file away.
- **CF's build environment has its own runtime quirks.** Astro builds cleanly on CF, but if we ever add an Astro integration that needs system binaries (e.g., Sharp for image processing), we may bump the build env. Mitigation: stick to JS-only integrations; pre-process images locally if needed.
- **Account dependency.** If the user loses access to his Cloudflare account, the site is unreachable until reassigned. Mitigation: GitHub remains the source of truth; redeployment is fast.
- **Analytics is shallow.** CF's free analytics show requests and countries, not user paths. For a portfolio this is fine. If deeper analytics ever needed, consider Plausible (paid, privacy-respecting) — but only if the value is real.

## Revisit if

- Cloudflare changes its free-tier policy in a way that materially restricts the site.
- The user wants serverless functionality (contact form, etc.) that pushes the architecture toward a different host's strengths. (CF Pages Functions are also free and likely fine.)
- The user wants a CMS / admin UI for content editing.
- Performance issues surface that root-cause to the CDN (very unlikely for static).

## See also

- [[02 - Architecture]]
- [[ADR-001-tech-stack-astro]]
