#!/bin/bash
# ============================================================
# Hook: session-summary.sh
# Fire on: Stop — ASYNC
# Log la fin de session et un bref résumé
# Utile pour retrouver le contexte à la reprise
# ============================================================

mkdir -p .claude/logs
LOG=".claude/logs/sessions.log"

{
  echo "=== Session ended: $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo "Branch: $(git branch --show-current 2>/dev/null)"
  echo "Last commits:"
  git log --oneline -3 2>/dev/null | sed 's/^/  /'
  echo ""
} >> "$LOG"

exit 0
