#!/bin/bash
# ============================================================
# Hook: block-dangerous-commands.sh
# Fire on: PreToolUse (Bash)
# Exit 2 = BLOCK the command
# Exit 0 = ALLOW
# ============================================================

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Liste des patterns dangereux (regex étendues)
DANGEROUS_PATTERNS=(
  'rm -rf /'
  'rm -rf ~'
  'rm -rf \*'
  '--dangerously-skip-permissions'
  'DROP TABLE'
  'DROP DATABASE'
  'TRUNCATE TABLE'
  'supabase db reset'
  'git push --force'
  'git push -f'
  'git reset --hard origin'
  'chmod -R 777'
  '> /dev/sda'
  'mkfs\.'
  ':\(\)\{.*\|.*&\};:'
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE -- "$pattern"; then
    echo "🛑 BLOCKED: Dangerous command detected (pattern: $pattern)" >&2
    echo "Command: $COMMAND" >&2
    echo "If this is truly needed, run it manually outside Claude Code." >&2
    exit 2
  fi
done

# Avertissement (non-bloquant) pour certaines opérations sensibles
WARN_PATTERNS=(
  'npm publish'
  'eas build --profile production'
)

for pattern in "${WARN_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE -- "$pattern"; then
    echo "⚠️  Sensitive command — proceeding: $pattern" >&2
  fi
done

exit 0
