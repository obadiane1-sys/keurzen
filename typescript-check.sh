#!/bin/bash
# ============================================================
# Hook: typescript-check.sh
# Fire on: PostToolUse (Write|Edit|MultiEdit) — ASYNC
# Run `tsc --noEmit` en arrière-plan pour feedback continu
# Les erreurs sont loggées dans .claude/logs/tsc.log
# Non-bloquant
# ============================================================

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Ne déclenche le check que sur des fichiers TS/TSX
case "$FILE_PATH" in
  *.ts|*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Skip si pas de tsconfig.json
[ ! -f "tsconfig.json" ] && exit 0

mkdir -p .claude/logs
LOG=".claude/logs/tsc.log"

# Run tsc --noEmit, capture les erreurs
{
  echo "=== $(date '+%Y-%m-%d %H:%M:%S') — after $FILE_PATH ==="
  npx tsc --noEmit --pretty false 2>&1 | head -50
  echo ""
} >> "$LOG"

# ESLint sur le fichier modifié uniquement (rapide)
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
  {
    echo "--- ESLint: $FILE_PATH ---"
    npx eslint "$FILE_PATH" --quiet 2>&1 | head -20
    echo ""
  } >> "$LOG"
fi

exit 0
