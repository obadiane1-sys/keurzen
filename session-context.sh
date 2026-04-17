#!/bin/bash
# ============================================================
# Hook: session-context.sh
# Fire on: SessionStart
# Injecte du contexte utile au début de chaque session :
# - Branche git courante
# - Phase Keurzen en cours
# - Derniers fichiers modifiés
# - Rappel des commandes essentielles
# ============================================================

echo "═══════════════════════════════════════════════════"
echo "  KEURZEN — Claude Code session"
echo "═══════════════════════════════════════════════════"

# Git branch
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  STATUS=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  echo "  Branch: $BRANCH | Uncommitted changes: $STATUS files"
fi

# Lecture de la phase en cours (à adapter selon ton workflow)
if [ -f "PHASE.md" ]; then
  PHASE=$(head -1 PHASE.md)
  echo "  Phase: $PHASE"
fi

# Derniers fichiers touchés (contexte utile)
echo ""
echo "  Recently modified:"
git log --name-only --oneline -5 2>/dev/null | grep -v "^[0-9a-f]" | head -5 | sed 's/^/    /'

echo ""
echo "  Commands: /security-check  /pre-launch  /audit  /palier  /check"
echo "═══════════════════════════════════════════════════"

exit 0
