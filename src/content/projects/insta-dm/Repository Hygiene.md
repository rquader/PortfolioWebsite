# Repository Hygiene

The app is for personal use first, **and is now public on GitHub** (2026-05-25). The codebase was pushed without leaking machine-specific info. See [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]].

## What stays out of source by design

These never end up in the project directory anyway, but worth confirming:

| Thing | Where it lives | Safe to push? |
|---|---|---|
| Instagram session cookies | `~/Library/WebKit/<bundle-id>/` (managed by `WKWebsiteDataStore`) | ✅ Not in source tree |
| User preferences (notification level, etc.) | `~/Library/Preferences/<bundle-id>.plist` | ✅ Not in source tree |
| Cache, page data | `~/Library/Caches/<bundle-id>/` | ✅ Not in source tree |
| Logged-in user's username, account ID | Memory only, never persisted to source | ✅ Don't change this |

## What must not be hardcoded

- ❌ Your Instagram username, account ID, real name.
- ❌ Any personal Apple ID / Apple Developer team ID. The project file (`.pbxproj`) will contain a `DEVELOPMENT_TEAM` if you sign with a team — set it to empty or "None" before pushing, or expect anyone who clones to override it.
- ❌ Your bundle identifier with your name in it (e.g. `com.rafan.instadm`) unless that's intentional. **This repo uses `io.github.rquader.instadm`** — a public GitHub-keyed ID, committed on purpose.
- ❌ Hardcoded paths under `/Users/<you>/`. Use `FileManager.default.urls(for:in:)` for any path lookup.
- ❌ A personal app icon featuring you. The shipped icon should be generic; or none and let macOS show the default.
- ❌ `.DS_Store`, Xcode user-specific state (see `.gitignore` below).

## `.gitignore`

Standard Xcode-Swift gitignore. Copy verbatim:

```gitignore
# Xcode
build/
DerivedData/
*.xcuserstate
*.xcuserdatad/
xcuserdata/

# Swift Package Manager
.swiftpm/
.build/
Packages/
Package.pins
Package.resolved
*.xcodeproj/project.xcworkspace/xcuserdata/

# macOS
.DS_Store
.AppleDouble
.LSOverride

# IDE
.vscode/
.idea/
.cursor/
.claude/

# Personal
*.local.*
*.private.*
```

The `*.local.*` / `*.private.*` patterns are a convention you can use later if you ever need a file with user-specific values — name it `Config.local.swift` etc. and it'll be auto-ignored.

## Bundle identifier strategy

**Current committed value:** `io.github.rquader.instadm` in `.pbxproj`.

In Xcode → project settings → Signing & Capabilities:
- **Team**: leave as "None" for unsigned local/CI builds, or set yours for signed builds. Do not commit `DEVELOPMENT_TEAM`.
- **Forks**: retarget to `io.github.<your-handle>.instadm` or similar.

Early local builds used `com.rafan.instadm`; that was scrubbed before the public push.

## License / contributions (2026-05-25 decision)

No `LICENSE` file in the repo — source-available, default copyright applies. No `CONTRIBUTING.md` — not actively soliciting outside contributions. Issues welcome; PRs case-by-case. Re-add MIT/Apache only if you explicitly want to grant reuse rights.

## README for the public repo

When the time comes, the public README should cover:

1. **What it is**: native macOS app that gives you Instagram DMs and only DMs.
2. **Why**: removing addictive surfaces (feed, reels, explore).
3. **Requirements**: macOS 14+, Xcode 15+.
4. **How to install**:
   - Clone, open in Xcode, change the bundle ID, build, archive to your `/Applications`.
   - (No prebuilt binaries distributed — users build their own to avoid signing/notarization headaches.)
5. **Caveats**:
   - Uses Instagram's web client in a `WKWebView`. May break occasionally when Instagram redesigns.
   - Not affiliated with Instagram / Meta.
   - For personal use; do not use with multiple accounts in parallel.
6. **Configuration**: notification levels, polling interval, etc.
7. **License**: pick one (MIT is fine for a personal toy; if you want others to contribute, MIT or Apache-2.0).

Keep it short. Nobody reads long READMEs.

## License

For personal use: no license needed. For public release: include a `LICENSE` file before anyone forks.

## Things to verify before the first `git push origin main`

- [ ] `git ls-files | xargs grep -l "<your-name>"` returns nothing.
- [ ] `git ls-files | xargs grep -l "<your-email>"` returns nothing.
- [ ] `grep -r "rafan" .` (or your actual identifier) returns only file-paths from `.git/` or similar.
- [ ] `.gitignore` is in place; `git status --ignored` shows the expected ignored files.
- [ ] Bundle ID is the placeholder, not your personal one.
- [ ] The `DEVELOPMENT_TEAM` in `.pbxproj` is empty or a placeholder.
- [ ] No app icon featuring you.
- [ ] Take a moment to skim `git log` — early commits sometimes contain personal info in commit messages.

## Notes for AI assistants

If you're contributing to this codebase:
- Never hardcode the user's Instagram username, email, or any personally-identifying info as test fixtures or examples.
- If you need example data, use `@username`, `friend1`, `user_xyz` etc.
- Cookies, session tokens, and any data extracted from `WKWebsiteDataStore` are user secrets — never log them, never write them to a file in the project directory.
