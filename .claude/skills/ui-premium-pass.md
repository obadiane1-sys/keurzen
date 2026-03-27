# UI Premium Pass — Keurzen

Lis CLAUDE.md et `src/constants/tokens.ts` avant de commencer.

Je veux améliorer l'UI de l'écran suivant sans toucher au métier : $ARGUMENTS

## Ce que j'attends

### 1. Audit visuel
- Lire le fichier de l'écran en entier
- Identifier les valeurs hardcodées (couleurs, spacing, fontSize)
- Identifier les états manquants (loading, empty, error)
- Identifier les touch targets < 44px
- Identifier les déviations de ton (messages agressifs, hiérarchie cassée)

### 2. Corrections UI uniquement
- Remplacer les hardcodes par les tokens (`Colors.*`, `Spacing.*`, `BorderRadius.*`, `Typography.*`)
- Ajouter les états manquants
- Corriger les touch targets
- Uniformiser la hiérarchie typographique

### 3. Ce qu'il ne faut pas toucher
- Logique de requêtes ou mutations
- Stores Zustand
- Comportements de navigation
- Tout ce qui n'est pas visible à l'écran

## Contrôle design system

```
Palette : Colors.mint / blue / coral / lavender / navy / textPrimary / textMuted / background
Spacing : Spacing.xs / sm / md / base / lg / xl / 2xl / 3xl / 4xl
Radius  : BorderRadius.sm / md / lg / xl / full
Shadow  : Shadows.sm / md
Touch   : minWidth: 44, minHeight: 44
```

## Sortie

- Liste des problèmes détectés (avec ligne)
- Corrections appliquées
- Lint lancé + résultat

## Comment tester

Recharger l'écran dans le simulateur. Vérifier visuellement : hiérarchie, espacement, états, cohérence avec les autres écrans de l'app.
