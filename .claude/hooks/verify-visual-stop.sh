#!/usr/bin/env bash
# Stop hook: nudge to verify visual changes with Playwright MCP.
#
# Fires when the working tree has uncommitted changes to visual files
# (css/tsx/jsx/html/svg/...) but no Playwright MCP browser tool was used
# this session. Fail-open: any error/missing dep just allows the stop.

input=$(cat)

command -v jq >/dev/null 2>&1 || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true

# Don't loop: if we already blocked this stop once, let it through.
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0

transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty')

# Uncommitted visual files in the working tree? (handles renames: "old -> new")
changed=$(git status --porcelain 2>/dev/null \
  | sed 's/^...//; s/.* -> //' \
  | grep -Ei '\.(css|scss|sass|less|tsx|jsx|vue|svelte|html|svg)$' || true)
[ -z "$changed" ] && exit 0

# Already drove Playwright MCP this session? Then nothing to nag about.
# Structural match on tool_use names so script/file contents that merely
# mention the string don't count as a real verification.
if [ -n "$transcript" ] && [ -f "$transcript" ]; then
  if jq -rs '[.. | objects | select(.type? == "tool_use") | .name? // empty]
             | any(startswith("mcp__playwright__browser"))' \
       "$transcript" 2>/dev/null | grep -q true; then
    exit 0
  fi
fi

files=$(printf '%s' "$changed" | tr '\n' ' ')
jq -nc --arg files "$files" '{
  decision: "block",
  reason: ("Visual files changed but not verified with Playwright MCP this session: \($files). Project policy: drive the running dev app with the Playwright MCP tools (browser_navigate / browser_snapshot / browser_take_screenshot), confirm the change renders correctly, then stop. If there is genuinely no UI surface to verify, say so explicitly and stop.")
}'
