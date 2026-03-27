# DB Change Safe — Keurzen

Lis CLAUDE.md et les migrations existantes dans `supabase/migrations/` avant de commencer.

Je veux appliquer le changement de base de données suivant : $ARGUMENTS

## Ce que j'attends

### 1. Audit préalable
- Lire toutes les migrations existantes (001 → dernière)
- Identifier le numéro de la prochaine migration
- Vérifier si la colonne / table / fonction existe déjà
- Identifier les politiques RLS impactées

### 2. Migration idempotente
- Utiliser `ADD COLUMN IF NOT EXISTS`
- Utiliser `CREATE OR REPLACE FUNCTION`
- Utiliser `DROP POLICY IF EXISTS` avant `CREATE POLICY`
- Ne jamais utiliser `DROP TABLE` ou `DROP COLUMN` sans confirmation explicite
- Les fonctions `SECURITY DEFINER` doivent toujours avoir `SET search_path = public`
- Ne jamais accepter `user_id` en paramètre — toujours `auth.uid()`

### 3. Impact sur le client
- Identifier les types TypeScript à mettre à jour (`src/types/index.ts`)
- Identifier les queries TanStack à mettre à jour (`src/lib/queries/`)
- Identifier si le cache PostgREST doit être rechargé

### 4. Commandes

```bash
npx supabase db push
# Si nouveaux types :
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## Sortie

```
## Migration créée
- Fichier : supabase/migrations/00X_...sql
- Contenu : ...
- Idempotente : oui/non

## Impact client
- Types modifiés : ...
- Queries modifiées : ...
- Cache PostgREST : rechargement nécessaire / non

## Commande à lancer
npx supabase db push
```

## Comment tester

Lancer `npx supabase db push` et vérifier dans le Dashboard Supabase → Table Editor que la structure est correcte. Tester les RLS avec un utilisateur authentifié.
