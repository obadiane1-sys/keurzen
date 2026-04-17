#!/bin/bash
# ============================================================
# Hook: auto-format.sh
# Fire on: PostToolUse (Write|Edit|MultiEdit)
# Run Prettier sur le fichier qui vient d'être modifié
# Non-bloquant : on ne fait jamais exit 2 ici
# ============================================================

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Skip si fichier vide ou inexistant
[ -z "$FILE_PATH" ] && exit 0
[ ! -f "$FILE_PATH" ] && exit 0

# Ne formater que les fichiers supportés
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.css|*.html|*.yaml|*.yml)
    # Prettier silencieux, ignore les erreurs (ex: fichier non-parsable en cours d'édition)
    npx prettier --write "$FILE_PATH" --log-level=error 2>/dev/null || true
    ;;
  *.sql)
    # Pas de formatter SQL universel ; on skip
    ;;
esac

exit 0
