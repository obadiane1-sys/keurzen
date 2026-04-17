#!/bin/bash
# ============================================================
# Hook: protect-supabase-migrations.sh
# Fire on: PreToolUse (Write|Edit|MultiEdit)
# Bloque l'édition silencieuse de migrations Supabase existantes
# Les NOUVELLES migrations sont autorisées
# ============================================================

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# On ne protège que les fichiers de migration existants
if echo "$FILE_PATH" | grep -qE 'supabase/migrations/.*\.sql$'; then

  # Si le fichier existe déjà, c'est une MODIFICATION — on bloque
  if [ -f "$FILE_PATH" ]; then
    if [ "$TOOL_NAME" = "Edit" ] || [ "$TOOL_NAME" = "MultiEdit" ]; then
      echo "🛑 BLOCKED: Modifying an existing Supabase migration is risky." >&2
      echo "File: $FILE_PATH" >&2
      echo "" >&2
      echo "Migrations should be immutable once applied." >&2
      echo "Instead: create a NEW migration file that corrects the previous one:" >&2
      echo "  supabase migration new fix_$(basename "$FILE_PATH" .sql)" >&2
      exit 2
    fi
  fi

  # Pour les NOUVELLES migrations (Write), on laisse passer mais on rappelle les règles
  if [ "$TOOL_NAME" = "Write" ] && [ ! -f "$FILE_PATH" ]; then
    echo "📋 New migration detected — Keurzen RLS checklist:" >&2
    echo "  ✓ Enable RLS on new tables: ALTER TABLE ... ENABLE ROW LEVEL SECURITY;" >&2
    echo "  ✓ Add SELECT/INSERT/UPDATE/DELETE policies for household members" >&2
    echo "  ✓ Test with supabase db lint" >&2
  fi
fi

# Protection supplémentaire : .env, secrets
if echo "$FILE_PATH" | grep -qE '\.env(\..*)?$|secrets/'; then
  echo "🛑 BLOCKED: Cannot write to env/secrets files: $FILE_PATH" >&2
  exit 2
fi

exit 0
