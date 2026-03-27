#!/bin/bash
# PostToolUse hook — runs ESLint after Edit/Write on .ts/.tsx files.
# Injects lint errors into Claude's context via additionalContext.

f=$(jq -r '.tool_input.file_path // empty' 2>/dev/null)

# Skip non-TypeScript files
echo "$f" | grep -qE '\.(ts|tsx)$' || exit 0

cd /Users/ouss/Keurzen || exit 0

OUT=$(npm run lint 2>&1)
RC=$?

# Lint passed — silent exit
[ $RC -eq 0 ] && exit 0

# Lint failed — inject errors as context for Claude
echo "$OUT" | grep " error " | head -15 | python3 -c "
import json, sys
errs = sys.stdin.read().strip()
if not errs:
    exit(0)
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'PostToolUse',
        'additionalContext': 'Lint errors after edit — fix before proceeding:\n' + errs
    }
}))
"
