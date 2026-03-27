# Fix Bug — Keurzen

Lis CLAUDE.md avant de commencer.

Je veux diagnostiquer et corriger le bug suivant : $ARGUMENTS

## Ce que j'attends

### 1. Diagnostic (avant tout code)
- Identifier le fichier et la ligne exacte en cause
- Expliquer pourquoi le bug se produit
- Identifier si c'est un bug d'UI, de logique, de RLS, de cache, ou de type
- Évaluer l'impact : bloquant / dégradé / cosmétique

### 2. Correction minimale
- Modifier uniquement ce qui cause le bug
- Ne pas refactoriser autour
- Ne pas changer le comportement des autres features
- Si la correction nécessite une migration SQL : utiliser `/db-change-safe`

### 3. Vérification
- Lancer `npm run lint`
- Lancer `npm run test` si la logique est touchée
- Reporter les résultats

## Contraintes

- Un bug = une cause = une correction
- Si plusieurs bugs sont liés, les traiter séparément
- Ne jamais supprimer un fichier pour corriger un bug

## Sortie

```
## Diagnostic
- Fichier : ...
- Cause : ...
- Impact : ...

## Correction appliquée
- Fichier modifié : ...
- Changement : ...

## Résultats
- lint : ...
- tests : ...
```

## Comment tester

Donner le scénario de reproduction exact + le comportement attendu après correction.
