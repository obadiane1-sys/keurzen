# Design System Tokens — Keurzen Cafe Cosy

Source de verite : `apps/mobile/src/constants/tokens.ts`

## Palette de couleurs

### Brand (accents)

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.terracotta` | `#C4846C` | CTA principale, FAB, liens actifs, focus |
| `Colors.sauge` | `#8BA888` | Succes, validation, accent secondaire |
| `Colors.miel` | `#D4A959` | Warnings, highlights, info |
| `Colors.rose` | `#D4807A` | Alertes douces, retard, erreurs |
| `Colors.prune` | `#9B8AA8` | Charge mentale, TLX |

### Texte

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.textPrimary` | `#3D2C22` | Titres, corps de texte |
| `Colors.textSecondary` | `#7A6B5D` | Labels, texte secondaire |
| `Colors.textMuted` | `#A89888` | Placeholders, metadonnees |
| `Colors.textInverse` | `#FFFDF9` | Texte sur fond sombre/colore |

### Fonds

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.background` | `#FAF6F1` | Fond global (creme) |
| `Colors.backgroundCard` | `#FFFDF9` | Fond des cartes (blanc casse) |
| `Colors.backgroundElevated` | `#FFFDF9` | Fond eleve (modales, sheets) |
| `Colors.backgroundSubtle` | `#F0EAE2` | Fond subtil (sections, tags) |

### Bordures

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.border` | `#E8DFD5` | Bordures standard (sable) |
| `Colors.borderLight` | `#F0EAE2` | Bordures legeres |
| `Colors.borderFocus` | `#C4846C` | Bordure au focus (terracotta) |

### Feedback

| Token | Hex | Equivalent |
|-------|-----|-----------|
| `Colors.success` | `#8BA888` | = sauge |
| `Colors.warning` | `#D4A959` | = miel |
| `Colors.error` | `#D4807A` | = rose |
| `Colors.info` | `#D4A959` | = miel |

### Overlays

| Token | Valeur |
|-------|--------|
| `Colors.overlay` | `rgba(61, 44, 34, 0.35)` |
| `Colors.overlayLight` | `rgba(61, 44, 34, 0.08)` |

### Membres (couleurs assignees)

`Colors.memberColors` : tableau de 8 couleurs pour differencier les membres du foyer.

## Typographie — Nunito

### Familles

| Token | Font |
|-------|------|
| `Typography.fontFamily.regular` | `Nunito_400Regular` |
| `Typography.fontFamily.medium` | `Nunito_500Medium` |
| `Typography.fontFamily.semibold` | `Nunito_600SemiBold` |
| `Typography.fontFamily.bold` | `Nunito_700Bold` |
| `Typography.fontFamily.extrabold` | `Nunito_800ExtraBold` |

### Tailles

| Token | Taille | Usage type |
|-------|--------|------------|
| `fontSize.xs` | 11px | Minimum absolu, labels secondaires |
| `fontSize.sm` | 13px | Captions, badges |
| `fontSize.base` | 15px | Corps de texte |
| `fontSize.md` | 16px | Corps important |
| `fontSize.lg` | 18px | Sous-titres |
| `fontSize.xl` | 20px | Titres de section |
| `fontSize['2xl']` | 24px | Titres d'ecran |
| `fontSize['3xl']` | 28px | Titres principaux |
| `fontSize['4xl']` | 32px | Hero |
| `fontSize['5xl']` | 40px | Display |

### Interlignage

| Token | Ratio | Usage |
|-------|-------|-------|
| `lineHeight.tight` | 1.2 | Titres |
| `lineHeight.normal` | 1.5 | Corps |
| `lineHeight.relaxed` | 1.75 | Texte long |

## Spacing

| Token | Valeur | Usage |
|-------|--------|-------|
| `Spacing.xs` | 4px | Micro-gaps |
| `Spacing.sm` | 8px | Gaps internes |
| `Spacing.md` | 12px | Padding interne composants |
| `Spacing.base` | 16px | Padding standard, marges sections |
| `Spacing.lg` | 20px | Espacement entre sections |
| `Spacing.xl` | 24px | Grands espacements |
| `Spacing['2xl']` | 32px | Separation majeure |
| `Spacing['3xl']` | 40px | Separation de bloc |
| `Spacing['4xl']` | 48px | Header spacing |
| `Spacing['5xl']` | 64px | Top-level spacing |

## Border Radius

| Token | Valeur | Usage |
|-------|--------|-------|
| `BorderRadius.sm` | 8px | Badges, tags |
| `BorderRadius.md` | 12px | Inputs, boutons |
| `BorderRadius.lg` | 16px | Cards |
| `BorderRadius.xl` | 16px | Cards larges |
| `BorderRadius['2xl']` | 24px | Bottom sheets |
| `BorderRadius.full` | 9999px | Avatars, pills |

Aliases : `BorderRadius.input = 12`, `BorderRadius.card = 16`, `BorderRadius.button = 12`, `BorderRadius.fab = 16`

## Shadows

L'esthetique Keurzen est **flat** — les ombres sont tres subtiles, uniquement pour separer les plans.

| Token | Opacity | Radius | Usage |
|-------|---------|--------|-------|
| `Shadows.sm` | 0.04 | 4px | Boutons |
| `Shadows.md` | 0.06 | 10px | Elevation moyenne |
| `Shadows.lg` | 0.08 | 20px | Cartes elevees, modales |
| `Shadows.card` | 0.06 | 10px | Cartes standard |

Couleur d'ombre : toujours `#3D2C22` (brun profond, jamais noir).

## Animation

| Token | Valeur | Usage |
|-------|--------|-------|
| `Animation.duration.fast` | 150ms | Hover, toggle |
| `Animation.duration.normal` | 250ms | Transitions standard |
| `Animation.duration.slow` | 400ms | Apparitions, modales |

### Springs

| Token | Damping | Stiffness | Usage |
|-------|---------|-----------|-------|
| `spring.gentle` | 20 | 200 | Entrees naturelles |
| `spring.bouncy` | 10 | 300 | Feedback tactile, FAB |
| `spring.stiff` | 30 | 400 | Corrections rapides |

## Regles strictes

1. **Zero hardcode** — toute valeur visuelle vient des tokens
2. **Minimum 11px** — jamais de texte en dessous de `fontSize.xs`
3. **Touch targets >= 44px** — `TouchTarget.min`
4. **Pas de gradients** — flat UI uniquement
5. **Pas de noir pur** — utiliser les bruns de la palette
6. **Ombres brunes** — jamais `#000` en shadowColor
