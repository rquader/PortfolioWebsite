#!/usr/bin/env python3
"""PostToolUse Bash hook: append every Bash command Claude Code runs in
this project to the Obsidian-side Bash Log.

Wired up by `.claude/settings.local.json` -> hooks.PostToolUse[Bash].
Receives the full hook payload JSON on stdin (tool_input + tool_response).

npm install commands get an extra detail line with the parsed
"added N packages" summary, so they stand out in the log.

Silent on failure: never blocks the Bash tool. If the log cannot be
written, the agent's work continues unimpeded."""

import datetime
import json
import pathlib
import re
import sys

LOG_PATH = pathlib.Path(
    "/Users/rafanquader/Library/Mobile Documents/iCloud~md~obsidian/"
    "Documents/RafansPortableVault/Programming/Portfolio_Website/Bash Log.md"
)

HEADER = """---
tags: [log, bash, auto-generated]
---

# Bash Log

Auto-appended by `.claude/hooks/log-bash.py` after every `Bash` tool
invocation in this project. Read top-to-bottom for chronological order.
Format: `- timestamp  command  — _description_`. `npm install` entries
get an indented detail line with the package-count summary.

"""


def md_code(text: str) -> str:
    """Render `text` as Markdown code without breaking on internal backticks."""
    if "\n" in text:
        indented = text.replace("\n", "\n  ")
        return f"\n  ```bash\n  {indented}\n  ```"
    if "`" not in text:
        return f"`{text}`"
    n = 1
    while ("`" * n) in text:
        n += 1
    fence = "`" * n
    return f"{fence} {text} {fence}"


_NPM_INSTALL_RE = re.compile(r"^\s*npm\s+(install|i|add)\b")
_ADDED_LINE_RE = re.compile(
    r"(added\s+\d+\s+package(?:s)?(?:[^.]*?\d+\s+package(?:s)?)?[^.]*?in\s+\S+)",
    re.IGNORECASE,
)
_REMOVED_LINE_RE = re.compile(
    r"(removed\s+\d+\s+package(?:s)?[^.\n]*)", re.IGNORECASE
)
_CHANGED_LINE_RE = re.compile(
    r"(changed\s+\d+\s+package(?:s)?[^.\n]*)", re.IGNORECASE
)


def is_npm_install(cmd: str) -> bool:
    return bool(_NPM_INSTALL_RE.match(cmd))


def extract_npm_summary(output: str) -> str:
    """Pull the most informative one-liner from npm install output."""
    if not output:
        return ""
    for pattern in (_ADDED_LINE_RE, _REMOVED_LINE_RE, _CHANGED_LINE_RE):
        match = pattern.search(output)
        if match:
            return match.group(1).strip()
    # Fallback: the very first non-empty stdout line.
    for line in output.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped
    return ""


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return

    tool_input = payload.get("tool_input") or {}
    cmd = (tool_input.get("command") or "").strip()
    desc = (tool_input.get("description") or "").strip()
    if not cmd:
        return

    tool_response = payload.get("tool_response") or {}
    # Claude Code's PostToolUse payload field name has varied across
    # versions; try the common spellings.
    raw_output = (
        tool_response.get("output")
        or tool_response.get("stdout")
        or tool_response.get("content")
        or ""
    )
    if isinstance(raw_output, list):
        raw_output = "\n".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in raw_output
        )

    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"- `{ts}` {md_code(cmd)}"
    if desc:
        line += f" — _{desc}_"
    line += "\n"

    if is_npm_install(cmd):
        summary = extract_npm_summary(str(raw_output))
        if summary:
            line += f"    - _{summary}_\n"

    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        if not LOG_PATH.exists():
            LOG_PATH.write_text(HEADER)
        with LOG_PATH.open("a") as f:
            f.write(line)
    except Exception:
        return


if __name__ == "__main__":
    main()
