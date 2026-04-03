
# DESIGN_SYSTEM — Keurzen

## Philosophie

**Cocon chaleureux** — l'app comme un nid douillet.
Direction : Cafe Cosy (Kinfolk x cafe artisanal).
Douceur, chaleur, air. Jamais de surcharge visuelle. Chaque écran respire.

---

## Couleurs

### Palette principale

| Rôle | Nom | Hex | Usage |
|---|---|---|---|
| Accent principal | Terracotta | `#C4846C` | CTA, FAB, liens actifs, tab active |
| Accent secondaire | Sauge | `#8BA888` | Succès, validation, tâches complétées |
| Accent tertiaire | Miel | `#D4A959` | Warnings, highlights, badges info |
| Alerte douce | Rose | `#D4807A` | Tâches en retard, erreurs douces |
| Charge mentale | Prune | `#9B8AA8` | TLX, badges charge mentale |

### Neutres chauds

| Rôle | Nom | Hex |
|---|---|---|
| Fond global | Crème | `#FAF6F1` |
| Card / Surface | Blanc cassé | `#FFFDF9` |
| Bordure | Sable | `#E8DFD5` |
| Bordure légère | Sable clair | `#F0EAE2` |
| Texte principal | Brun profond | `#3D2C22` |
| Texte secondaire | Brun moyen | `#7A6B5D` |
| Texte muted | Brun clair | `#A89888` |
| Placeholder | Taupe | `#B8A99A` |

### Couleurs sémantiques TLX

| Niveau | Hex | Mapping |
|---|---|---|
| Légère | `#8BA888` (sauge) | Charge faible |
| Moyenne | `#D4A959` (miel) | Charge moyenne |
| Lourde | `#D4807A` (rose) | Charge élevée |

### Couleurs membres du foyer

Versions chaudes/sourdes :
`#D4807A` · `#8BA888` · `#7EB3C4` · `#9B8AA8` · `#D4A959` · `#C4846C` · `#C48BA0` · `#6BA08F`

### Overlays

| Rôle | Valeur |
|---|---|
| Overlay modal | `rgba(61, 44, 34, 0.35)` |
| Overlay léger | `rgba(61, 44, 34, 0.08)` |

---

## Typographie

### Famille

**Nunito** — rondeur chaleureuse, cohérente avec l'ambiance cocon.

### Échelle

| Nom | Taille | Poids | Usage |
|---|---|---|---|
| Display | 32px | ExtraBold (800) | Chiffres hero (score TLX, stats) |
| H1 | 28px | Bold (700) | Titres de page |
| H2 | 22px | Bold (700) | Titres de section |
| H3 | 18px | SemiBold (600) | Sous-titres, noms de tâches |
| Body | 15px | Regular (400) | Texte courant |
| Body Small | 13px | Regular (400) | Texte secondaire |
| Caption | 11px | Medium (500) | Méta-infos, timestamps |
| Overline | 12px | SemiBold (600) | Labels de sections (uppercase, letter-spacing 1px) |
| Label | 13px | SemiBold (600) | Badges, tags, boutons |

### Couleurs de texte

- Titre principal : Brun profond `#3D2C22`
- Texte courant : Brun profond `#3D2C22`
- Texte secondaire : Brun moyen `#7A6B5D`
- Texte muted : Brun clair `#A89888`
- Placeholder : Taupe `#B8A99A`
- Texte inverse : Blanc cassé `#FFFDF9`

---

## Espacements

Grille de base **4px**.

| Token | Valeur | Usage |
|---|---|---|
| `xs` | 4px | Micro-gaps |
| `sm` | 8px | Entre éléments proches |
| `md` | 12px | Gap entre cards |
| `base` | 16px | Padding intérieur cards |
| `lg` | 20px | Padding horizontal de page |
| `xl` | 24px | Entre sections |
| `2xl` | 32px | Grands espacements |
| `3xl` | 48px | Respiration entre blocs majeurs |

Padding horizontal de page : **20px**

### Hiérarchie des sections

- Label Overline (12px, SemiBold, uppercase, letter-spacing 1px, `#A89888`)
- 8px entre label et contenu
- 24px entre sections

### Séparateurs

- Entre items dans une card : hairline `#F0EAE2`
- Entre sections : espace vide (pas de ligne)

---

## Border Radius

| Élément | Valeur |
|---|---|
| Cards | 16px |
| Boutons | 12px |
| Inputs | 12px |
| Bottom sheets (top) | 24px |
| Badges / Pills | 9999px |
| Avatars | 9999px |
| Tab icon active bg | 12px |
| FAB | 16px (carré arrondi) |

---

## Ombres

Shadow color : `#3D2C22` (brun chaud) — jamais de gris-bleu.

```
sm:   offset(0, 1)   opacity 0.04   radius 4    — inputs, petits éléments
md:   offset(0, 3)   opacity 0.06   radius 10   — cards
lg:   offset(0, 6)   opacity 0.08   radius 20   — modals, bottom sheets
```

---

## Composants

### Boutons

| Variante | Fond | Texte | Détail |
|---|---|---|---|
| Primary | Terracotta `#C4846C` | `#FFFDF9` | CTA principal, ombre sm |
| Secondary | Sauge `#8BA888` | `#FFFDF9` | Actions positives |
| Outline | Transparent | Terracotta `#C4846C` | Bordure 1.5px terracotta |
| Ghost | Transparent | Brun `#3D2C22` | Pas d'ombre, pas de bordure |
| Danger | Rose `#D4807A` | `#FFFDF9` | Suppression, destructif |

Disabled : opacity 0.5 sur toutes les variantes.

### Tab bar

- Fond : `#FFFDF9`
- Bordure top : hairline `#E8DFD5`
- Inactif : brun clair `#A89888` (icône + label)
- Actif : terracotta `#C4846C` (icône + label), fond `#C4846C15` derrière l'icône
- Un seul accent — plus de couleurs différentes par onglet

### Inputs

- Fond : `#FFFDF9`
- Bordure : 1.5px `#E8DFD5`
- Border radius : 12px
- Focus : bordure terracotta `#C4846C`
- Placeholder : taupe `#B8A99A`
- Label : brun moyen `#7A6B5D`, 13px SemiBold

### Cards

- Fond : `#FFFDF9`
- Pas de bordure par défaut (l'ombre suffit sur fond crème)
- Ombre md
- Padding : 16px
- Border radius : 16px

### Badges / Tags

- Fond : couleur associée à 12% d'opacité
- Texte : couleur pleine
- Border radius : full (9999px)
- Padding : 4px 12px
- Font : Label (13px SemiBold)

### Alert card

- Fond : rose `#D4807A` à 8% d'opacité
- Bordure : rose à 20% d'opacité
- Icône : rose plein
- Border radius : 16px

### FAB

- Fond : terracotta `#C4846C`
- Icône : blanc cassé `#FFFDF9`
- Taille : 56×56
- Border radius : 16px (carré arrondi)
- Ombre lg

### Bottom sheet / Modal

- Fond : `#FFFDF9`
- Overlay : `rgba(61, 44, 34, 0.35)`
- Border radius top : 24px
- Handle : `#E8DFD5`, 40×4px, centré

---

## Iconographie

- Bibliothèque : **Ionicons**
- Taille standard : 20px
- Taille grande : 24px
- Couleur par défaut : brun moyen `#7A6B5D`
- Couleur active : couleur sémantique du contexte

---

## Animations

- Duration fast : 150ms
- Duration normal : 250ms
- Duration slow : 400ms
- Spring gentle : damping 20, stiffness 200
- Spring bouncy : damping 10, stiffness 300

---

## Mascotte

Maison kawaii douce conservée telle quelle. Sa douceur s'intègre naturellement dans l'univers cocon.
Composant : `src/components/ui/Mascot.tsx`

---

## Règles absolues

1. Jamais de fond blanc pur `#FFFFFF` — utiliser blanc cassé `#FFFDF9` pour les surfaces
2. Jamais de rouge vif pour les erreurs — utiliser rose `#D4807A`
3. Toujours 20px de padding horizontal sur les écrans
4. Un seul CTA principal par écran
5. Les états vides ont toujours la mascotte ou un message encourageant
6. Pas d'animation superflue
7. Les ombres utilisent toujours le brun chaud `#3D2C22`, jamais du gris-bleu
8. Tab bar mono-accent (terracotta uniquement)
9. Cards sans bordure — l'ombre chaude distingue du fond crème

---

## Migration depuis l'ancien design

| Avant | Après |
|---|---|
| Fond `#F5EFE0` | Fond `#FAF6F1` |
| Mint `#88D4A9` (CTA) | Terracotta `#C4846C` (CTA) |
| Mint `#88D4A9` (succès) | Sauge `#8BA888` (succès) |
| Coral `#FFA69E` (alertes) | Rose `#D4807A` (alertes) |
| Lavender `#BCA7FF` (TLX) | Prune `#9B8AA8` (TLX) |
| Blue `#AFCBFF` (info) | Miel `#D4A959` (info/highlights) |
| Navy `#212E44` (titres) | Brun profond `#3D2C22` (titres) |
| Text `#1E293B` | Brun profond `#3D2C22` |
| Border `#E8EDF2` | Sable `#E8DFD5` |
| Background card `#FFFFFF` | Blanc cassé `#FFFDF9` |
| Shadow color `#1E293B` | Shadow color `#3D2C22` |
| Tab bar 5 couleurs | Tab bar mono-terracotta |
| Cards avec bordure | Cards sans bordure, ombre douce |
| FAB rond | FAB carré arrondi 16px |
| Warning `#FBBF24` | Miel `#D4A959` |
| Error `#F87171` | Rose `#D4807A` |
