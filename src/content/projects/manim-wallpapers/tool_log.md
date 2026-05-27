---
title: Tool Audit Log
tags: [manim, wallpaper, audit, hook]
---

# Tool Audit Log

Every globally-acting tool call Claude Code makes in this project is
appended below **by a PreToolUse hook** (`.claude/hooks/log_bash.sh`)
that fires before each matching tool call. Configured in
`.claude/settings.local.json` with matcher `Bash|WebSearch|WebFetch`,
the hook cannot be bypassed by the assistant.

**Tracked tools** — every one of these has *blanket permission* and
can act outside the project folders:

- `Bash` — any shell command
- `WebSearch` — search-engine query
- `WebFetch` — fetch the contents of a URL

**Not tracked** (intentional):

- `Edit` / `Write` / `MultiEdit` — path-scoped to the two project
  folders by the permission rules; the action is visible in the chat.
- `Read` — read-only; safe.
- `Task*`, `Skill`, `AskUserQuestion` — meta-actions visible in the
  chat.

Format: `### YYYY-MM-DD HH:MM:SS — <ToolName>` plus tool-specific
details (command for Bash, query for WebSearch, URL+prompt for
WebFetch).

If a line you didn't expect appears here, that is exactly the audit
signal you wanted.

---

## Pipe-test entries (initial setup — can be deleted)

### 2026-05-13 03:35:40 — Bash
_pipe-test_

```bash
ls -la
```

### 2026-05-13 03:35:40 — WebSearch
> macOS wallpaper design

### 2026-05-13 03:35:40 — WebFetch
<https://example.com>

Prompt: _summarize_

## Live entries
