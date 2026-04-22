# Accessibilite & Dark Mode — Keurzen

## Accessibilite

### Touch Targets

Regle absolue : **tout element interactif >= 44x44px**.

```tsx
import { TouchTarget } from '../../constants/tokens';

// Methode 1 : dimension directe
<TouchableOpacity style={{ minWidth: TouchTarget.min, minHeight: TouchTarget.min }}>

// Methode 2 : hitSlop pour les petits elements visuels
<TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>

// Methode 3 : padding suffisant
<Pressable style={{ padding: Spacing.md }}> {/* 12px padding = element visuel 20px + 24px padding = 44px */}
```

### Labels et roles

Chaque element interactif doit avoir un label accessible :

```tsx
// Boutons
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Ajouter une tache"
  accessibilityHint="Ouvre le formulaire de creation"
>

// Liens
<TouchableOpacity accessibilityRole="link" accessibilityLabel="Voir le profil de Marie">

// Toggle / switch
<Switch
  accessibilityRole="switch"
  accessibilityLabel="Notifications activees"
  accessibilityState={{ checked: isEnabled }}
/>

// Images decoratives
<Image accessibilityElementsHidden={true} importantForAccessibility="no" />

// Images informatives
<Image accessibilityRole="image" accessibilityLabel="Graphique de repartition des taches" />

// Headers
<Text accessibilityRole="header">Mes taches</Text>
```

### Navigation au lecteur d'ecran

```tsx
// Grouper les elements lies
<View accessible={true} accessibilityLabel="Tache: Faire les courses, assignee a Marie, urgente">
  <Text>Faire les courses</Text>
  <Text>Marie</Text>
  <Badge label="Urgent" />
</View>

// Ordre de lecture logique
<View accessibilityViewIsModal={true}> {/* Pour les modales */}

// Annoncer les changements dynamiques
import { AccessibilityInfo } from 'react-native';
AccessibilityInfo.announceForAccessibility('Tache ajoutee avec succes');
```

### Contraste

WCAG AA minimum (ratio 4.5:1 pour le texte, 3:1 pour les grands textes) :

| Combinaison | Ratio | Status |
|-------------|-------|--------|
| `textPrimary` (#3D2C22) sur `background` (#FAF6F1) | ~10:1 | OK |
| `textSecondary` (#7A6B5D) sur `background` (#FAF6F1) | ~4.5:1 | OK (limite) |
| `textMuted` (#A89888) sur `background` (#FAF6F1) | ~2.5:1 | Attention — utiliser uniquement pour le decoratif |
| `textInverse` (#FFFDF9) sur `terracotta` (#C4846C) | ~3.2:1 | OK pour grands textes (>= 18px bold) |

Regles :
- **Texte informatif** : toujours `textPrimary` ou `textSecondary`
- **Texte muted** : uniquement pour placeholders, timestamps, metadonnees non essentielles
- **Texte sur fond colore** : utiliser `textInverse` avec fontSize >= `lg` et weight `bold`
- **Ne jamais** mettre de texte `textMuted` sur un fond autre que `background`

### Tailles de texte

- Minimum absolu : 11px (`fontSize.xs`) — uniquement pour labels tres secondaires
- Corps de texte : minimum 15px (`fontSize.base`)
- Supporter `fontScale` du systeme via les tokens Typography (pas de dimensions fixes en dp)

### Mouvement reduit

```tsx
import { useReducedMotion } from 'react-native-reanimated';

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reducedMotion ? FadeIn.duration(0) : FadeIn.duration(Animation.duration.normal)}
    >
      {children}
    </Animated.View>
  );
}
```

## Dark Mode

### Architecture

Le dark mode Keurzen suit la palette Cafe Cosy — des tons bruns fonces et chauds, jamais de gris froid ou de noir pur.

```tsx
// src/constants/tokens.ts — extension dark mode
export const DarkColors = {
  // Backgrounds
  background: '#1A1412',         // Brun tres fonce (pas noir)
  backgroundCard: '#261E1A',     // Carte sombre
  backgroundElevated: '#2E2520', // Modales, sheets
  backgroundSubtle: '#1F1915',   // Sections

  // Text
  textPrimary: '#F0EAE2',       // Sable clair
  textSecondary: '#B8A99A',     // Gris chaud moyen
  textMuted: '#7A6B5D',         // Gris chaud
  textInverse: '#1A1412',       // Pour texte sur fond clair

  // Borders
  border: '#3D3229',            // Brun moyen fonce
  borderLight: '#2E2520',       // Subtil
  borderFocus: '#C4846C',       // Terracotta (inchange)

  // Brand — les accents restent identiques
  terracotta: '#C4846C',
  sauge: '#8BA888',
  miel: '#D4A959',
  rose: '#D4807A',
  prune: '#9B8AA8',

  // Feedback — inchange
  success: '#8BA888',
  warning: '#D4A959',
  error: '#D4807A',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 253, 249, 0.05)',
} as const;
```

### Hook useTheme

```tsx
import { useColorScheme } from 'react-native';
import { Colors, DarkColors } from '../constants/tokens';

export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DarkColors : Colors;
}

// Usage dans un composant
function MyScreen() {
  const colors = useThemeColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>Hello</Text>
    </View>
  );
}
```

### Regles dark mode

1. **Couleurs d'accent identiques** — terracotta, sauge, miel ne changent pas entre themes
2. **Pas de noir pur** — `#1A1412` (brun tres fonce) au lieu de `#000`
3. **Pas de blanc pur** — `#F0EAE2` (sable clair) au lieu de `#FFF`
4. **Hierarchie inversee** — en dark mode, l'elevation = fond plus clair (pas plus fonce)
5. **Ombres reduites** — les ombres sont moins visibles en dark mode, utiliser les bordures pour separer
6. **Tester le contraste** — verifier que textPrimary sur background garde un ratio >= 7:1

### Shadows en dark mode

```tsx
export const DarkShadows = {
  // En dark mode, les ombres sont moins utiles — on s'appuie sur les bordures
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  // Alternative : bordure subtile au lieu d'ombre
  cardBorder: {
    borderWidth: 1,
    borderColor: '#3D3229',
  },
};
```

### Images et icones

```tsx
// Icones : adapter la couleur au theme
<Icon color={colors.textPrimary} size={24} />

// Images : pas de filtre, mais background adapte
<View style={{ backgroundColor: colors.backgroundCard, borderRadius: BorderRadius.md }}>
  <Image source={imageSource} />
</View>

// Mascotte : version claire pour dark mode si disponible
const mascotSource = scheme === 'dark' ? MascotDark : MascotLight;
```

## Checklist accessibilite

Avant de valider un ecran :

- [ ] Tous les touchables >= 44x44px (ou hitSlop equivalent)
- [ ] Tous les boutons ont `accessibilityRole="button"` et `accessibilityLabel`
- [ ] Les headers ont `accessibilityRole="header"`
- [ ] Les images decoratives sont cachees du lecteur d'ecran
- [ ] Contraste texte/fond >= 4.5:1 pour le texte normal
- [ ] Contraste texte/fond >= 3:1 pour le texte >= 18px bold
- [ ] Les etats (loading, error, empty) sont annonces
- [ ] Les animations respectent `useReducedMotion`
- [ ] La navigation au clavier fonctionne (web)
- [ ] Les couleurs ne sont pas le seul moyen de communiquer l'information
