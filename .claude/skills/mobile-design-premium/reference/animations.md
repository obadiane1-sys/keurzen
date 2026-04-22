# Animations Reanimated 3 — Keurzen

## Philosophie

Les animations Keurzen sont **subtiles et fonctionnelles** :
- Elles guident l'attention, pas la distraient
- Elles donnent un feedback tactile immediat
- Elles rendent les transitions naturelles
- Duree courte (150-400ms), pas de bounce excessif

## Setup

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
  SlideInRight,
  Layout,
  Easing,
} from 'react-native-reanimated';
import { Animation } from '../../constants/tokens';
```

## Micro-interactions

### Feedback au tap (scale)

Le pattern le plus courant — un leger scale down au press.

```tsx
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { Animation } from '../../constants/tokens';

function PressableCard({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, Animation.spring.stiff); }}
      onPressOut={() => { scale.value = withSpring(1, Animation.spring.gentle); }}
      onPress={onPress}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

### Toggle / Switch

```tsx
const isActive = useSharedValue(0);

const thumbStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: withSpring(isActive.value * 20, Animation.spring.stiff) }],
  backgroundColor: withTiming(
    isActive.value ? Colors.terracotta : Colors.border,
    { duration: Animation.duration.fast }
  ),
}));
```

### Checkbox

```tsx
const checked = useSharedValue(0);

const checkStyle = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(checked.value, Animation.spring.bouncy) }],
  opacity: withTiming(checked.value, { duration: Animation.duration.fast }),
}));
```

### FAB (Floating Action Button)

```tsx
const fabScale = useSharedValue(0);

// Apparition au mount
useEffect(() => {
  fabScale.value = withSpring(1, Animation.spring.bouncy);
}, []);

const fabStyle = useAnimatedStyle(() => ({
  transform: [{ scale: fabScale.value }],
}));
```

## Transitions d'ecran

### Apparition de liste (staggered)

```tsx
function ListItem({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).duration(Animation.duration.normal)}
      layout={Layout.springify().damping(20).stiffness(200)}
    >
      {children}
    </Animated.View>
  );
}
```

### Slide in depuis la droite

```tsx
<Animated.View entering={SlideInRight.duration(Animation.duration.normal).easing(Easing.out(Easing.cubic))}>
  {content}
</Animated.View>
```

### Fade in simple

```tsx
<Animated.View entering={FadeIn.duration(Animation.duration.normal)}>
  {content}
</Animated.View>
```

### Collapse / Expand

```tsx
const height = useSharedValue(0);
const isExpanded = useSharedValue(false);

function toggle() {
  isExpanded.value = !isExpanded.value;
  height.value = withTiming(isExpanded.value ? measuredHeight : 0, {
    duration: Animation.duration.normal,
    easing: Easing.inOut(Easing.cubic),
  });
}

const collapsibleStyle = useAnimatedStyle(() => ({
  height: height.value,
  overflow: 'hidden',
  opacity: withTiming(height.value > 0 ? 1 : 0, { duration: Animation.duration.fast }),
}));
```

## Transitions de navigation

### Shared element (entre liste et detail)

```tsx
import { SharedTransition, withSpring } from 'react-native-reanimated';

const transition = SharedTransition.custom((values) => {
  'worklet';
  return {
    originX: withSpring(values.targetOriginX, Animation.spring.gentle),
    originY: withSpring(values.targetOriginY, Animation.spring.gentle),
    width: withSpring(values.targetWidth, Animation.spring.gentle),
    height: withSpring(values.targetHeight, Animation.spring.gentle),
  };
});

// Dans la liste
<Animated.Image sharedTransitionTag={`task-${id}`} sharedTransitionStyle={transition} />

// Dans le detail
<Animated.Image sharedTransitionTag={`task-${id}`} sharedTransitionStyle={transition} />
```

## Gestes

### Swipe to dismiss / delete

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const translateX = useSharedValue(0);

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = Math.max(-120, e.translationX);
  })
  .onEnd(() => {
    if (translateX.value < -80) {
      // Seuil atteint — action (delete, archive, etc.)
      translateX.value = withTiming(-200, { duration: Animation.duration.normal });
    } else {
      translateX.value = withSpring(0, Animation.spring.gentle);
    }
  });
```

### Pull to refresh (indicateur custom)

```tsx
const pullProgress = useSharedValue(0);

const indicatorStyle = useAnimatedStyle(() => ({
  transform: [
    { rotate: `${pullProgress.value * 360}deg` },
    { scale: Math.min(pullProgress.value, 1) },
  ],
  opacity: withTiming(pullProgress.value > 0.3 ? 1 : 0, { duration: Animation.duration.fast }),
}));
```

## Patterns de spring recommandes

| Contexte | Spring | Pourquoi |
|----------|--------|----------|
| Press feedback | `stiff` (d:30, s:400) | Retour rapide, pas de bounce |
| Entree d'element | `gentle` (d:20, s:200) | Naturel, deceleration douce |
| FAB / toggle | `bouncy` (d:10, s:300) | Feedback ludique mais controle |
| Correction snap | `stiff` | Precision, pas de flottement |
| Layout change | `gentle` | Transition fluide |

## Performance

1. **Utiliser `useAnimatedStyle`** — pas de `style={{ transform: [...] }}` direct
2. **Worklets** — la logique d'animation tourne sur le thread UI via `'worklet'`
3. **Eviter `useEffect` pour les animations** — preferer les callbacks Reanimated
4. **`cancelAnimation()`** — annuler les animations en cours avant d'en lancer de nouvelles
5. **Pas d'animation sur mount inutile** — animer seulement ce qui a un sens UX

## Anti-patterns

| Anti-pattern | Correction |
|-------------|------------|
| `Animated.timing` (ancienne API) | `withTiming()` (Reanimated 3) |
| `duration: 1000` | Max 400ms — `Animation.duration.slow` |
| Bounce excessif (`damping: 5`) | Min `damping: 10` |
| Animation sur chaque re-render | Conditionner au changement d'etat |
| `LayoutAnimation` (RN core) | `Layout` de Reanimated |
| Spring sans config | Toujours utiliser les tokens `Animation.spring.*` |
