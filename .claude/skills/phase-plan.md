# Phase Plan — Keurzen

Lis CLAUDE.md et docs/product/vision.md avant de commencer.

Je veux découper la feature ou phase suivante en étapes implémentables : $ARGUMENTS

## Ce que j'attends

1. **Compréhension** — reformuler la demande en une phrase
2. **Périmètre MVP** — ce qui est strictement nécessaire pour valider
3. **Phases ordonnées** — chaque phase = 1 PR ou 1 session max
4. **Fichiers impactés** — par phase (routes, queries, migrations, composants)
5. **Dépendances** — ce qui doit être fait avant chaque phase
6. **Risques** — auth / schema / navigation / design system

## Contraintes

- Une phase = une seule préoccupation
- Ne pas proposer plus de 5 phases sans validation intermédiaire
- Ne pas coder — ce skill produit un plan uniquement
- Signaler explicitement si la feature nécessite une migration SQL

## Sortie

```
## Compréhension
...

## Phase 1 — [nom]
- Objectif : ...
- Fichiers : ...
- Dépendances : ...

## Phase 2 — [nom]
...

## Risques
...
```

## Comment tester

Ce skill ne produit pas de code. Tester = valider le plan avec l'équipe avant de lancer `/build-feature Phase 1`.
