# Ship Release — Keurzen

Lis CLAUDE.md et docs/product/dod.md avant de commencer.

Je veux vérifier si la feature suivante est prête à livrer : $ARGUMENTS

## Ce que j'attends

### 1. Vérification code

```bash
npm run lint    # 0 erreurs obligatoire
npm run test    # tous les tests doivent passer
```

- Reporter le résultat exact
- Si erreur : identifier le fichier, proposer la correction

### 2. Vérification DoD

- [ ] Logique métier fonctionnelle
- [ ] UI cohérente avec le design system (tokens, états, touch targets)
- [ ] États loading / empty / error présents
- [ ] Types stricts, pas de `any`
- [ ] Pas de `console.log` oubliés
- [ ] Pas de valeurs hardcodées
- [ ] Pas de régression évidente sur les modules adjacents

### 3. Vérification backend (si applicable)

- [ ] Migration présente et idempotente
- [ ] RLS vérifiée
- [ ] Edge Function déployée
- [ ] Secrets documentés

### 4. Verdict

```
## Statut : ✅ Prêt / ❌ Bloqué

### Bloquants (P0)
- ...

### Avertissements (P1)
- ...

### Actions restantes
- [ ] ...
```

## Commandes de livraison

```bash
# Si migration :
npx supabase db push

# Si Edge Function :
npx supabase functions deploy <nom>

# Vérification secrets :
npx supabase secrets list
```

## Comment tester

Rejouer le scénario nominal complet + au moins un cas d'erreur (réseau coupé ou session expirée) avant de merger.
