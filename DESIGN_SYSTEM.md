# DESIGN_SYSTEM — Keurzen

## Philosophie
Premium pastel, doux, clair, rassurant, aéré.
Jamais de surcharge visuelle. Beaucoup d'air. Chaque écran doit respirer.

---

## Couleurs

### Palette principale
| Nom | Hex | Usage |
|---|---|---|
| Mint | `#88D4A9` | CTA principale, succès, validation |
| Blue | `#AFCBFF` | Accents secondaires, liens, info |
| Coral | `#FFA69E` | Alertes douces, charge lourde, suppression |
| Lavender | `#BCA7FF` | Tags, badges, éléments décoratifs |
| Navy | `#212E44` | Texte fort, titres principaux |
| Text | `#1E293B` | Texte courant |
| Background | `#F7F9FC` | Fond général de l'app |

### Palette étendue
| Nom | Hex | Usage |
|---|---|---|
| Surface | `#FFFFFF` | Cards, modals, bottom sheets |
| Border | `#E8EDF2` | Séparateurs, contours de champs |
| Placeholder | `#94A3B8` | Texte placeholder dans les inputs |
| Disabled | `#CBD5E1` | Éléments désactivés |
| Overlay | `rgba(33, 46, 68, 0.4)` | Fond des modals |

### Couleurs sémantiques TLX
| Niveau | Hex | Label |
|---|---|---|
| Légère | `#88D4A9` | 🟢 Légère |
| Moyenne | `#FFD166` | 🟡 Moyenne |
| Lourde | `#FFA69E` | 🔴 Lourde |

---

## Typographie

### Famille
- Police principale : **System font** (SF Pro sur iOS, Roboto sur Android)
- Pas de font custom au lancement — priorité à la performance

### Échelle
| Nom | Taille | Poids | Usage |
|---|---|---|---|
| Display | 28px | 700 | Titres de page principaux |
| Title | 22px | 600 | Titres de section |
| Subtitle | 18px | 600 | Sous-titres, noms de tâches |
| Body | 15px | 400 | Texte courant |
| Caption | 13px | 400 | Méta-infos, timestamps |
| Label | 12px | 500 | Badges, tags, boutons secondaires |

### Couleurs de texte
- Titre principal → `#212E44` (Navy)
- Texte courant → `#1E293B` (Text)
- Texte secondaire → `#64748B`
- Placeholder → `#94A3B8`

---

## Espacements

Utiliser une grille de **4px**.

| Nom | Valeur | Usage |
|---|---|---|
| xs | 4px | Micro-espacement interne |
| sm | 8px | Entre éléments proches |
| md | 16px | Padding standard (cards, sections) |
| lg | 24px | Entre sections |
| xl | 32px | Marges de page |
| xxl | 48px | Grands espacements verticaux |

Padding horizontal de page : **20px**

---

## Border Radius

| Nom | Valeur | Usage |
|---|---|---|
| sm | 8px | Inputs, petits éléments |
| md | 12px | Cards, boutons |
| lg | 16px | Bottom sheets, modals |
| xl | 24px | Grandes cards, hero elements |
| full | 9999px | Avatars, badges ronds, pills |

---

## Ombres

Ombres très subtiles — jamais agressives.

```javascript
// Ombre légère (cards)
shadow: {
  shadowColor: '#212E44',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}

// Ombre moyenne (modals, bottom sheets)
shadowMd: {
  shadowColor: '#212E44',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 4,
}
```

---

## Composants

### Bouton principal (CTA)
- Background : Mint `#88D4A9`
- Texte : White `#FFFFFF`, 15px, poids 600
- Border radius : 12px
- Padding : 16px vertical, 24px horizontal
- Ombre légère

### Bouton secondaire
- Background : transparent
- Bordure : 1.5px solid `#88D4A9`
- Texte : Mint `#88D4A9`, 15px, poids 600
- Border radius : 12px

### Bouton destructif
- Background : Coral `#FFA69E`
- Texte : White `#FFFFFF`, 15px, poids 600
- Border radius : 12px

### Input
- Background : White `#FFFFFF`
- Bordure : 1.5px solid `#E8EDF2`
- Border radius : 8px
- Padding : 14px
- Focus : bordure Mint `#88D4A9`
- Placeholder : `#94A3B8`

### Card
- Background : White `#FFFFFF`
- Border radius : 12px
- Ombre légère
- Padding : 16px

### Badge / Tag
- Background : teinte légère de la couleur associée (opacity 15%)
- Texte : couleur pleine associée
- Border radius : full
- Padding : 4px 10px

### Bottom Sheet / Modal
- Background : White `#FFFFFF`
- Border radius top : 24px
- Overlay : `rgba(33, 46, 68, 0.4)`
- Padding : 24px

---

## Iconographie

- Bibliothèque : **lucide-react-native** (cohérence, légèreté)
- Taille standard : 20px
- Taille grande : 24px
- Couleur par défaut : `#64748B`
- Couleur active : couleur sémantique du contexte

---

## Animation

- Transitions : douces, jamais brusques
- Duration standard : 200ms
- Easing : `ease-in-out`
- Utiliser `react-native-reanimated` pour les animations complexes (bottom sheets, transitions de page)

---

## Règles absolues

1. **Jamais de fond blanc pur sur fond blanc pur** — toujours une distinction surface / background
2. **Jamais de rouge vif** pour les erreurs — utiliser Coral `#FFA69E`
3. **Toujours du padding horizontal 20px** sur les écrans principaux
4. **Un seul CTA principal par écran** — pas de compétition visuelle
5. **Les états vides ont toujours une illustration ou un message encourageant** — jamais une page blanche
6. **Pas d'animation superflue** — chaque animation doit avoir une raison fonctionnelle
