## Required static files (GitHub Pages)

If you deploy via the included GitHub Actions workflow (`.github/workflows/deploy.yml`),
the site is served under a **base path** like `/<repo-name>/`. This repo is already
configured for that (`astro.config.mjs` uses `PUBLIC_BASE_URL`).

That means two things:

- Your **assets must exist in the repo**, under `public/`, so GitHub Pages can publish them.
- Your **links must be base-aware**. This codebase uses `Astro.resolve(...)` for that.

### Files you should keep in `public/`

- **Resume PDF**: `public/Rafan_Quader_Resume.pdf`
- **Threshold photo**: `public/images/rafan-speaking-1.jpg`
  - There is a dev-friendly fallback placeholder at `public/images/rafan-speaking-1.svg`.

### Quick check

```bash
ls -la public/Rafan_Quader_Resume.pdf public/images/rafan-speaking-1.jpg
```

If either file is missing from Git, GitHub Pages will show a broken image / broken download.

