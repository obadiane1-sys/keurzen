# Verify — Boucle de vérification Keurzen

Lis CLAUDE.md avant de commencer.

Je veux que tu exécutes la boucle de vérification complète sur le travail suivant : $ARGUMENTS

## Étapes obligatoires

### 1. Self-check
- Relire chaque fichier modifié dans cette session
- Vérifier qu'aucun fichier hors scope n'a été touché
- Vérifier que la logique métier demandée est respectée
- Vérifier la cohérence UI avec le design system Keurzen (tokens, états, touch targets)

### 2. Vérification code
- Lancer `npm run lint`
- Lancer `npm run test`
- Reporter le résultat exact (0 erreurs ou liste des erreurs)
- Si erreur : corriger ou expliquer le blocage

### 3. Vérification fonctionnelle
- Donner le scénario exact à tester manuellement (étape par étape)
- Donner le résultat attendu à chaque étape
- Lister les edge cases (données vides, réseau ko, session expirée, permissions manquantes)
- Lister les modules adjacents à vérifier en régression

### 4. Verdict final

Terminer avec :
```
## Verdict
- Statut : ✅ Prêt à tester / ❌ Pas encore prêt
- Bloquant : [description ou "aucun"]
- Actions restantes : [liste ou "aucune"]
```

## Format de sortie

- Plan exécuté
- Fichiers modifiés
- Commandes lancées + résultats
- Comment tester manuellement
- Risques / points à surveiller
- Verdict
