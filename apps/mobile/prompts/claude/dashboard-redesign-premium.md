# Dashboard Redesign — Premium Keurzen UI

## Objectif

Refactoriser complètement l'écran Dashboard pour lui donner un look premium digne d'une app de référence. Ce redesign touche UNIQUEMENT le rendu visuel et la structure des composants UI. Les hooks de données, les stores et la logique métier restent INCHANGÉS.

## Contexte

Le dashboard actuel (Phase 7) fonctionne mais a un look générique. Ce redesign applique le DESIGN_SYSTEM.skill.md à la lettre avec des ajustements typographiques (polices plus grandes, plus lisibles) et un layout plus aéré et premium.

-----

## RÈGLES ABSOLUES

1. **NE PAS toucher la logique métier** — hooks, stores, services, queries restent identiques
1. **NE PAS modifier le schéma DB** ni les Edge Functions
1. **Pas de shadows** — design 100% flat
1. **Pas de dégradés** — couleurs plates uniquement
1. **Utiliser `Animated` de React Native** — PAS de `react-native-reanimated` (non installé)
1. **Texte minimum 11px** — jamais en dessous
1. **Mobile ET web** — chaque composant doit fonctionner sur les deux plateformes Expo
1. **Couleurs 100% issues de la palette** ci-dessous
1. **Bordures max 1.5px**
1. **Focus state sur tous les touchables** — feedback visuel au press

-----

## PALETTE DE COULEURS

```typescript
// Dans src/constants/colors.ts — ces valeurs existent déjà, les réutiliser
const COLORS = {
  // Primaires
  mint: '#88D4A9',
  mintLight: '#E1F5EE',
  mintDark: '#7ECEC1',
  coral: '#FFA69E',
  coralLight: '#FAECE7',
  coralDark: '#E8937A',
  blue: '#AFCBFF',
  blueLight: '#E8F0FF',
  lavender: '#BCA7FF',
  lavenderLight: '#EEEDFE',
  navy: '#212E44',
  navyMid: '#2C3A4F',
  
  // Neutres
  text: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  background: '#F5EFE0',    // Fond crème chaud (pas le gris froid F7F9FC)
  surface: '#FFFFFF',
  border: '#E8EDF2',
  cream: '#FFF8F0',
  warmGray: '#F0EDE6',
  
  // TLX sémantiques
  tlxLight: '#88D4A9',
  tlxMedium: '#FFD166',
  tlxHeavy: '#FFA69E',
}
```

Si la couleur `background` du projet est actuellement `#F7F9FC`, la changer en `#F5EFE0` (crème chaud) sur le dashboard uniquement. Ne pas modifier le token global si d'autres écrans l'utilisent.

-----

## TYPOGRAPHIE MISE À JOUR

Les tailles actuelles sont trop petites. Voici les nouvelles tailles à appliquer sur le Dashboard :

|Rôle                  |Ancienne taille|Nouvelle taille|Poids  |Couleur      |
|----------------------|---------------|---------------|-------|-------------|
|Display (greeting)    |28px           |**30px**       |800    |Navy         |
|Title (sections)      |22px           |**22px**       |600    |Navy         |
|Subtitle (card titles)|18px           |**18px**       |600    |Navy         |
|Body (texte courant)  |15px           |**16px**       |400-500|Text         |
|Caption (meta-info)   |13px           |**14px**       |400-500|TextSecondary|
|KPI Value             |—              |**32px**       |800    |Navy         |
|Label (badges, tags)  |12px           |**13px**       |600    |Contextuel   |
|Small (chips)         |—              |**12px**       |500    |TextSecondary|

**Règle** : aucun texte visible ne doit descendre en dessous de 12px sur le dashboard.

-----

## STRUCTURE DU DASHBOARD (top → bottom)

### 1. Header

```
[Date caption 14px muted]          [Bell icon + notif dot] [Avatar 44px]
[Greeting 30px bold]
  "Bonjour, {prénom}" — prénom en couleur mintDark

[Pill household] 🏠 Foyer {nom} — bg warmGray, border border, radius 20
```

### 2. Alertes (si présentes)

Chaque alerte = une rangée colorée avec icône + message + chevron right.

- Overdue → bg coralLight, border coral 40%, icône AlertTriangle coral
- Imbalance → bg lavenderLight, border lavender 40%, icône Brain lavender
- Reminder → bg blueLight, border blue 40%, icône Bell blue
  Gap entre alertes : 10px. Radius : 16px. Padding : 14px 18px.

### 3. KPI Cards (2 cards côte à côte)

Layout : flex row, gap 12px, chaque card flex: 1, minWidth: 155px

Chaque card :

- bg surface, border 1.5px border, radius 20
- Padding : 22px 20px
- Icône dans un carré 44x44 radius 14, bg accentColor 18%
- Label 14px textSecondary à droite de l'icône
- Valeur 32px bold navy en dessous
- Trend indicator (flèche + pourcentage 13px en mint ou coral)
- Subtext 14px textMuted
- Cercle décoratif en haut à droite : 60x60, bg accent 15%, position absolute top -20 right -20

Card 1 — Tâches faites :

- Icône : Check (24px, mint)
- Fond icône : mintLight
- Valeur : nombre de tâches complétées cette semaine
- Subtext : "sur {total} cette semaine"

Card 2 — Heures totales :

- Icône : Clock (24px, blue)
- Fond icône : blueLight
- Valeur : "{n}h"
- Subtext : delta vs semaine précédente

### 4. Carte d'équilibre (Weekly Balance)

La plus grande carte du dashboard.

- bg surface, border 1.5px, radius 20
- Header : titre "Équilibre de la semaine" (18px bold) + badge statut + mascotte (72px)
- Badge statut = pill avec dot coloré + texte :
  - Écart < 20% → "Équilibré" (mint, bg mintLight)
  - Écart 20-40% → "Léger écart" (amber #FFD166, bg #FAEEDA)
  - Écart > 40% → "Déséquilibre" (coral, bg coralLight)
- À côté du badge : "{n}h au total" en caption muted
- Mascotte Keurzen à droite : expression dynamique (happy/normal/tired selon écart)

Pour chaque membre :

- Avatar 36px + nom 16px bold navy
- À droite : heures en 18px bold navy + pourcentage en 14px muted
- Barre de progression en dessous : hauteur 12px, radius 12, bg accentColor 22%, fill accentColor
- Sous la barre : chips des top tâches (12px, bg warmGray, radius 8, padding 3px 10px)

### 5. Charge mentale (TLX)

- bg surface, border 1.5px, radius 20, padding 22px
- Header : icône Brain dans carré 40x40 lavenderLight + titre 18px + "Cette semaine" muted
- Pour chaque membre : avatar 34px + nom 16px + pill de niveau
  - Légère → bg mintLight, border mint 30%, dot mint, texte #0F6E56
  - Moyenne → bg #FAEEDA, border #FFD166 30%, dot #FFD166, texte #854F0B
  - Lourde → bg coralLight, border coral 30%, dot coral, texte #993C1D

### 6. Tâches à venir

- bg surface, border 1.5px, radius 20, padding 22px
- Header : icône Calendar dans carré 40x40 blueLight + titre 18px + bouton "Voir tout"
- Chaque tâche : dot priorité (10px, high=coral, medium=#FFD166, low=mint) + titre 16px + meta 14px muted + avatar assigné 30px
- Séparateur entre tâches : 1px border color
- Hover : bg warmGray

### 7. Budget du mois

- bg surface, border 1.5px, radius 20, padding 22px
- Header : icône Wallet dans carré 40x40 coralLight + titre 18px
- Layout : cercle SVG progressif (90x90) à gauche + stats à droite
  - Cercle : stroke 10px, bg coral 20%, fill dynamique (>80% coral, >50% #FFD166, sinon mint)
  - Pourcentage au centre du cercle : 20px bold
  - Stats : "Dépensé" caption + montant 22px bold / "Restant" caption + montant 18px en mint ou coral
- En dessous : chips catégories (emoji + nom + montant) en row wrappée

-----

## ANIMATIONS (React Native Animated API)

Utiliser `Animated` de `react-native` (PAS react-native-reanimated — non installé).

### Entrée des sections

Chaque section entre avec un fadeInUp staggeré via `Animated.timing` + `Animated.stagger` :

- Opacity 0 → 1, translateY 16 → 0
- Duration : 500ms par section
- Delay : 50ms entre chaque section
- Easing : `Easing.out(Easing.ease)`
- `useNativeDriver: true`

### Mascotte

- Pas d'animation de flottement (complexe sans reanimated)
- Expression change sans animation (swap immédiat)

### Barres de progression

- Width animée via `Animated.timing`, durée 800ms
- `useNativeDriver: false` (width ne supporte pas le native driver)

### Press feedback sur les cards

- Utiliser `TouchableOpacity` avec `activeOpacity={0.85}` (pas d'animation scale custom)
- Pas de shadow, pas d'elevation

-----

## MASCOTTE KEURZEN

La mascotte est un composant SVG existant (`KeurzenMascot` ou `Mascot`).
Elle accepte une prop `expression` avec les valeurs : `'normal' | 'happy' | 'tired' | 'surprised' | 'error' | 'loading'`
Et une prop `size` pour la taille.

Sur le dashboard, l'utiliser dans la carte d'équilibre avec :

- `expression='happy'` si équilibré
- `expression='normal'` si léger écart
- `expression='tired'` si déséquilibre

Si le composant Mascot n'existe pas encore dans le projet, créer un composant SVG dans `src/components/ui/KeurzenMascot.tsx` qui dessine :

- Toit triangulaire mint/teal (#7ECEC1) avec contour brun (#3D2C1E, 2.5px)
- Corps rectangulaire crème (#FFF8F0) avec contour brun, coins arrondis (rx=6)
- Porte arrondie mint light (#E1F5EE)
- Joues coral (#FFA69E, opacity 0.45)
- Yeux et bouche qui changent selon l'expression
- Nœud papillon mint sur le toit

-----

## BLOBS DÉCORATIFS

En arrière-plan du header (position absolute, overflow hidden, pointerEvents none, z-index 0) :

- Cercle mint : top -40, right -30, 180x180, opacity 0.12
- Cercle lavender : top 60, left -50, 140x140, opacity 0.10
- Cercle coral : top 140, right 40, 90x90, opacity 0.08

-----

## COMPOSANTS À CRÉER OU REFACTORER

### Fichiers à modifier (adapter les noms aux fichiers existants du projet) :

1. **Dashboard screen** — le fichier principal du dashboard (probablement `app/(app)/index.tsx` ou `app/(tabs)/index.tsx`)
1. **KPICard** — nouveau composant `src/components/dashboard/KPICard.tsx`
1. **WeeklyBalanceCard** — refactorer `src/components/dashboard/WeeklyBalanceCard.tsx`
1. **MentalLoadCard** — nouveau ou refactorer `src/components/dashboard/MentalLoadCard.tsx`
1. **AlertCard** — refactorer `src/components/dashboard/AlertCard.tsx`
1. **UpcomingTasks** — nouveau composant `src/components/dashboard/UpcomingTasks.tsx`
1. **BudgetSnapshot** — nouveau composant `src/components/dashboard/BudgetSnapshot.tsx`
1. **KeurzenMascot** — créer si inexistant `src/components/ui/KeurzenMascot.tsx`

### Organisation :

- Tous les composants dashboard dans `src/components/dashboard/`
- Chaque composant = un fichier séparé
- Les composants lisent les données via les props (pas de fetch interne)
- Le screen dashboard orchestre les hooks et passe les données aux composants

-----

## GREETING DYNAMIQUE

```typescript
const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
}
```

-----

## VÉRIFICATION AVANT DE TERMINER

1. Relire chaque fichier modifié — aucun fichier hors scope touché
1. Couleurs 100% issues de la palette section COLORS
1. Pas de shadow / elevation nulle part
1. Taille texte >= 12px partout sur le dashboard
1. Border radius cohérent (20 pour cards, 16 pour alertes, 12-14 pour icônes/inputs)
1. `npm run lint` → 0 erreur
1. Fonctionne sur mobile ET web Expo
1. Mascotte avec la bonne expression
1. Animations via `Animated` de React Native (pas reanimated)
1. Les hooks de données existants n'ont PAS été modifiés
1. Le dashboard ScrollView scroll correctement sur les deux plateformes

-----

## SCÉNARIOS DE TEST MANUEL

1. **Ouvrir le dashboard** → animations staggered visibles, greeting correct
1. **Membre avec déséquilibre > 40%** → mascotte tired, badge coral "Déséquilibre"
1. **Aucune alerte** → section alertes absente (pas d'espace vide)
1. **Budget > 80%** → cercle en coral
1. **Scroll complet** → toutes les sections visibles, pas de coupure
1. **Web** → layout identique, hover states fonctionnels
1. **Rotation écran** → le layout s'adapte (max-width sur le container)
