# Publishing and Data Exposure

> **Status (2026-05-25): shipped.** Public repo live at https://github.com/rquader/InstaDM. Current release: [v0.1.1](https://github.com/rquader/InstaDM/releases/latest) (app 1.0.1). Full change record: [[2026-05-25 — Public GitHub Release and macOS 26 Crash Fix]].

When pushing future updates or submitting to the App Store: do these steps, in this order, and re-check the data-exposure section before you press the button.

## Is your private data at risk if you publish?

**Short answer: no, by construction — but ONLY if you follow the pre-publish checklist below.** The app never writes user data into the source tree. All sensitive state lives in macOS-owned folders that are never touched by `git`:

| Data | Where it lives | In source tree? |
|---|---|---|
| Instagram session cookies | `~/Library/Containers/io.github.rquader.instadm/Data/Library/WebKit/` | No |
| Settings (theme, notification level, allowed-surfaces toggles) | `~/Library/Containers/io.github.rquader.instadm/Data/Library/Preferences/io.github.rquader.instadm.plist` | No |
| Cached page assets | `~/Library/Containers/io.github.rquader.instadm/Data/Library/Caches/` | No |
| Notification contents | macOS Notification Center only | No |
| Your username / email / account ID | Memory only, never written | No |

**What *could* leak via a sloppy commit:**

| Leak | Where | How to prevent |
|---|---|---|
| Your macOS short name | `InstaDM.xcodeproj/project.xcworkspace/xcuserdata/<username>.xcuserdatad/` | Already covered by `.gitignore`; verify with `git status --ignored` before push |
| Your Apple ID / Developer Team ID | `DEVELOPMENT_TEAM = ABC123XYZ;` line in `.pbxproj` if you signed builds | Strip that line, or leave it empty, before commit |
| Your personal bundle ID | Was `com.rafan.instadm` in early local builds | **Now committed as `io.github.rquader.instadm`** — intentional public namespace keyed to GitHub handle. Forks should use their own ID. |
| Your real name | `git log` commit author | Use a separate git identity for this repo: `git config user.name "..."` and `git config user.email "..."` in the repo |
| Personal photos | If you ever drop them in `Assets.xcassets` | Use generic icons only |
| `.DS_Store`, build folders, DerivedData | Root of working tree | `.gitignore` covers; `git status --ignored` to verify |
| Notes in this folder (Obsidian) | NOT in the repo — keep it that way | The notes folder lives in iCloud, not in `~/Developer/InstagramDMOnlyApp/`. Don't `git add` it. |

**What is *never* at risk regardless of what you publish:**

- DMs themselves — they only ever exist in the WKWebView's memory and in Instagram's servers. Source code can't extract them.
- Session cookies — held by WebKit in the container, not readable by source.
- Notification text — passed to `UNUserNotificationCenter` and forgotten; never persisted.

The privacy model is "transparent display only" — the app never *holds* private data, it just shows what Instagram shows. So publishing the source can't expose anything the source doesn't already have.

---

## Path A: Publishing on GitHub

**Done 2026-05-25.** Repo: `rquader/InstaDM` (public).

### What we actually did

1. Git identity: GitHub noreply email on commits; display name (GitHub handle).
2. Bundle ID: `io.github.rquader.instadm` (not the old `com.example` placeholder — stable upstream ID).
3. No `DEVELOPMENT_TEAM` in committed `.pbxproj`.
4. No `LICENSE` / `CONTRIBUTING.md` — source-available; default copyright; not soliciting drive-by PRs.
5. `.gitignore` covers `xcuserdata/`, `.DS_Store`, `.cursor/`, `.claude/`.
6. `gh repo create InstaDM --public --source=. --push`
7. Release workflow: push `v*` tag → Actions builds unsigned Release `.app` → attaches `InstaDM.app.zip`.
8. Deleted broken `v0.1.0` release after macOS 26 crash fix shipped as v0.1.1.

### Before the first `git init` (reference for future projects)

1. **Decide on a separate git identity** for this repo. In the repo folder, run:
   ```
   git config user.name "<a handle, not your real name>"
   git config user.email "<a noreply email, not your personal one>"
   ```
   GitHub provides per-account `@users.noreply.github.com` emails — use one.

2. **Bundle identifier**: use `io.github.<handle>.<appname>` for a public repo you also run personally, *or* `com.example.*` if you want clones to customize. This project uses **`io.github.rquader.instadm`**.

3. **Strip `DEVELOPMENT_TEAM`**: same search in `.pbxproj`. Remove the line or set to `""`.

4. **Rename if you want to be safe**: "InstaDM" contains "Insta" — borderline trademark. Rename to something neutral (`DMOnly`, `FocusDM`, `MessagesOnly`) for the public version. Touches the Xcode target name, the `InstaDM.xcodeproj` directory name, the `InstaDM/` source folder, and `INFOPLIST_KEY_CFBundleDisplayName`. Invasive but clean.

5. **Add (or verify) the README's DISCLAIMER section**: already present in this repo. Says "Not affiliated with Instagram or Meta." Don't remove it.

6. **Verify `.gitignore`**: should already be clean. Run:
   ```
   git status --ignored
   ```
   Confirm `xcuserdata/`, `.DS_Store`, `DerivedData/`, `build/` are all listed as ignored.

### Then the actual push

```
cd ~/Developer/InstagramDMOnlyApp
git init
git add .
git status   # SCAN for anything surprising before committing
git commit -m "Initial public release"
gh repo create <repo-name> --public --source=. --push
```

Or for a private repo (recommended first pass):
```
gh repo create <repo-name> --private --source=. --push
```

### Pre-push final checks

Run all four. If anything matches your real info, stop:

```
git ls-files | xargs grep -l "rafan"        # your name
git ls-files | xargs grep -l "@gmail"       # personal email patterns
git ls-files | xargs grep -l "/Users/"      # hardcoded paths
git log --format="%an %ae"                  # commit author identity
```

The first three should return zero matches. The fourth should show your *handle*, not your real name.

### After publishing

- Don't merge personal-config changes (bundle ID, your team) back to the public branch.
- If you make commits with personal info by accident: `git filter-repo --invert-paths --path <file>` or just nuke and re-init. Force-pushing rewrites is fine for a brand-new repo with no forks.

---

## Path B: Publishing on the Mac App Store

Harder path. Most likely a no for this app.

### Hurdles, in order

1. **Paid Apple Developer Program**: $99/yr. Required to even open App Store Connect.
2. **App Review 4.2 ("Minimum Functionality")**: Apple rejects "thin web wrappers." Our app adds real value (DM-only restriction, custom notifications, themes, allowed-surfaces feature) — defensible, but reviewers are inconsistent. Expect at least one rejection round.
3. **Trademark**: The name cannot contain "Instagram" or any IG logo. "InstaDM" is borderline → must rename. The app icon cannot reference Meta/IG branding.
4. **Clear non-affiliation notice**: In-app and in the App Store listing.
5. **Sandboxing**: Required. We already do this (`com.apple.security.app-sandbox = true`).
6. **Hardened Runtime**: Already on.
7. **Notarization**: Automatic when uploading to App Store Connect.
8. **Privacy nutrition label** in App Store Connect: declare what data is collected. Our answer is "None collected" for every category. Verifiable because we have no telemetry, no analytics, no third-party SDKs.
9. **Meta could file a complaint with Apple**: low likelihood for personal-tool-style apps but legally possible. If they do, Apple removes the app and you have limited recourse.

### Recommended decision

For this app: **don't bother with the App Store.** Publish source on GitHub and let users build their own. It sidesteps every hurdle above, costs nothing, and matches the "personal/local-first" privacy posture.

If you *do* want to App Store this:

1. Rename + rebrand (no IG references).
2. Get the $99 Developer account.
3. In Xcode → Product → Archive → Distribute → **App Store Connect**.
4. Fill out the App Store Connect listing with the disclaimer + privacy label.
5. Submit for review. Iterate on rejections.
6. Budget weeks, not days.

### Optional middle path: Developer ID Notarized Distribution

A signed, notarized `.app` you put on a download page on your own site. Users download and run — no App Store. Requires the $99 account for the **Developer ID certificate**, but no review.

- Pros: avoids App Store Review, no Meta-takedown risk via Apple
- Cons: still costs $99/yr; users may not trust a download
- Path: Xcode → Archive → Distribute → **Direct Distribution** (the option in the dialog screenshot)

For personal use only this is overkill. For sharing with a small group of friends, it's reasonable.

---

## What lives in your Obsidian notes vs your repo

These notes (in `<vault>/Programming/Native Instagram DM App Notes/`) are **personal working files** — they contain personal context, decisions, and bug histories. They are **not part of the public repo** and should never be.

Keep this boundary:

| Where | What |
|---|---|
| Obsidian notes (iCloud) | Personal — decisions, audit logs, status, risks. Reference material for *you*. |
| Repo `README.md` | Public-facing. What the app is, how to build, what features it has. |
| Repo source files | Code only, plus inline comments that document the *why* of the code (not personal context). |

If you ever want a public design doc / architecture overview, **port the relevant Obsidian content** into a `docs/` folder in the repo. Don't copy whole notes — they contain too much personal-process detail.

---

## The data-exposure question, definitively

| Could publishing the source expose... | Answer |
|---|---|
| My Instagram DMs | **No.** They're not in the source tree, never written to disk by the app, never logged. |
| My Instagram login / session cookies | **No.** Held by WebKit in the sandbox container. The source has no code path that reads them. |
| Which Instagram account I use | **No.** Not stored in the source tree. (However — if you commit a screenshot, that *would* leak. Don't.) |
| My theme / notification preferences | **No.** In `UserDefaults`, on disk, never in the repo. |
| My real name / email | **Only if** you commit with a real-name git identity, hardcode personal info, or leave `DEVELOPMENT_TEAM` set. The pre-push checks above catch these. |
| My machine's short username | **Only if** you commit `xcuserdata/`. `.gitignore` already prevents this. Confirm with `git status --ignored`. |
| My bundle ID `io.github.rquader.instadm` | Committed intentionally — public app identity, not a personal-data leak |

**The privacy model holds end-to-end.** Publishing the source doesn't broaden the data surface because the source never had it.

---

## Related notes

- [[Privacy and Legal]] — privacy posture, legal stances per distribution stage
- [[Repository Hygiene]] — the no-personal-data-in-source rules
- [[Risks and Failure Modes]] — what else could break (drift, regressions, etc.)
- [[2026-05-16 — Allowed Surfaces Pass]] — what shipped recently
