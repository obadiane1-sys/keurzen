---
name: mobile-design-premium
description: >
  Guide premium pour construire des ecrans et composants React Native / Expo avec le design system Keurzen (palette Cafe Cosy, Nunito, flat UI).
  Utiliser ce skill des qu'on cree ou modifie un ecran mobile, un composant UI, une animation, ou qu'on touche au theming / dark mode / accessibilite.
  Couvre : tokens, patterns composants, animations Reanimated 3, dark mode, accessibilite, et regles specifiques Keurzen.
  Declencheurs : "cree un ecran", "ajoute un composant", "anime ce bouton", "dark mode", "accessibilite", "premium UI", "design system",
  "refais l'UI de", "ameliore le visuel", "ajoute une micro-interaction", "touch targets", "responsive".
  REGLE CRITIQUE : toute feature doit etre implementee sur mobile ET web simultanement (dual-platform).
---

# Mobile Design Premium — Keurzen

Ce skill guide la creation d'interfaces premium pour l'app Keurzen (Expo SDK 55 / React Native / TypeScript strict).

## Quand utiliser ce skill

- Creation ou modification d'un ecran mobile ou web
- Creation d'un composant UI reutilisable
- Ajout d'animations ou micro-interactions
- Implementation du dark mode
- Audit ou correction d'accessibilite
- Tout travail touchant au design system

## Workflow

### 1. Avant de coder

1. Lire `src/constants/tokens.ts` — c'est la source de verite pour tous les tokens
2. Lire ce skill et les references pertinentes selon le contexte :
   - Tokens et palette → `reference/design-system.md`
   - Patterns composants → `reference/components.md`
   - Animations → `reference/animations.md`
   - Dark mode / accessibilite → `reference/accessibility-darkmode.md`
   - Regles Keurzen specifiques → `reference/keurzen-layer.md`
3. Verifier les composants UI existants dans `src/components/ui/` avant d'en creer de nouveaux

### 2. Implementation

1. Toujours partir des templates (`templates/screen-template.tsx` ou `templates/component-template.tsx`)
2. Utiliser exclusivement les tokens — zero valeur hardcodee
3. Respecter les patterns de la reference `components.md`
4. Ajouter les animations selon `animations.md`
5. Gerer les 3 etats : loading, empty, error
6. Verifier les touch targets >= 44px

### 3. Dual-platform (OBLIGATOIRE)

Chaque feature doit etre implementee sur les deux plateformes :
- **Mobile** : `apps/mobile/app/` + `apps/mobile/src/components/`
- **Web** : `apps/web/src/app/` + `apps/web/src/components/`

Lister explicitement les fichiers a modifier sur chaque plateforme.

### 4. Verification

- Relire chaque fichier modifie
- Verifier zero hardcode (couleurs, spacing, fontSize, borderRadius)
- Verifier accessibilite (labels, roles, touch targets)
- Lancer `npm run lint`
- Donner le scenario de test manuel

## Principes de design Keurzen

L'identite visuelle Keurzen est **"Cafe Cosy"** : chaleureuse, calme, premium.

| Principe | Application |
|----------|-------------|
| Flat UI | Pas de gradients. Ombres tres subtiles (opacity 0.04-0.08) |
| Chaleur | Palette terracotta/sauge/miel — jamais de bleu froid ou gris pur |
| Calme | Espaces genereux, hierarchie claire, pas de surcharge visuelle |
| Premium | Nunito typographie, coins arrondis (12-16px), animations fluides |
| Lisibilite | fontSize minimum 11px, contraste WCAG AA |

## References

| Fichier | Contenu |
|---------|---------|
| `reference/design-system.md` | Tokens complets : couleurs, typo, spacing, radius, shadows |
| `reference/components.md` | Patterns pour Card, Button, Input, List, Modal, etc. |
| `reference/animations.md` | Reanimated 3 : micro-interactions, transitions, springs |
| `reference/accessibility-darkmode.md` | Dark mode, contraste, touch targets, screen readers |
| `reference/keurzen-layer.md` | Regles metier et UX specifiques a Keurzen |
| `templates/screen-template.tsx` | Template de depart pour un ecran |
| `templates/component-template.tsx` | Template de depart pour un composant |
