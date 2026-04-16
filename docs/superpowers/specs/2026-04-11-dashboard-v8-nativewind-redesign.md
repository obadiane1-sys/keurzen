# Dashboard V8 — NativeWind Redesign

**Date:** 2026-04-11
**Scope:** Mobile uniquement (`apps/mobile/`)
**Branch:** `feat/dashboard-v8-nativewind`

---

## Contexte

Redesign complet du dashboard mobile basé sur un mockup Sketch fourni par l'utilisateur. Abandonne la palette "Cafe Cosy" au profit d'une palette froide/moderne. Migre le styling de `StyleSheet.create()` vers NativeWind (Tailwind CSS pour React Native).

## Décisions clés

- **Palette** : nouvelle palette froide/moderne (cyan, rose, doré) — Cafe Cosy abandonné pour le dashboard
- **Styling** : migration vers NativeWind (Tailwind CSS pour React Native)
- **Layout** : système de 3 tabs horizontaux remplaçant le scroll vertical continu
- **Bottom nav** : redesign complet avec FAB central
- **Fonts** : Nunito (display) + Outfit (functional)
- **Icônes** : Material Symbols Outlined

---

## Phase 0 — Setup NativeWind + Tokens

### Installation
- `nativewind` + `tailwindcss` dans `apps/mobile/`
- Configuration `tailwind.config.js` avec les tokens du design system
- Configuration Babel/Metro pour NativeWind
- Vérification que l'app démarre correctement avec NativeWind

### Palette

#### Couleurs principales
| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#00E5FF` | CTA, liens actifs, accents principaux |
| `secondary` | `#FFB6C1` | Bien-être, accents doux |
| `tertiary` | `#FFD700` | Conseils, highlights |
| `danger` | `#FF6B6B` | Alertes, charge mentale |
| `success` | `#48BB78` | Validation, progression positive |
| `info` | `#4299E1` | Information contextuelle |
| `purple` | `#9F7AEA` | Accent tertiaire (stats, TLX) |

#### Fonds & textes
| Token | Valeur | Usage |
|---|---|---|
| `background` | `#F7F9FC` | Fond global (gris bleuté clair) |
| `surface` | `#FFFFFF` | Fond des cards |
| `surface-dark` | `#2D3748` | Fond cards dark mode |
| `text` | `#2D3748` | Texte principal |
| `text-muted` | `#718096` | Texte secondaire, labels |
| `border` | `#E2E8F0` | Bordures subtiles |

#### Dark mode
| Token | Valeur |
|---|---|
| `background-dark` | `#1A202C` |
| `surface-dark` | `#2D3748` |
| `text-dark` | `#F7F9FC` |
| `text-muted-dark` | `#A0AEC0` |

### Typographie
- **Display** : `Nunito` — titres, scores, greeting (weights: 400, 600, 700, 800)
- **Functional** : `Outfit` — labels, boutons, captions (weights: 400, 500, 600, 700)

### Ombres
| Token | Valeur |
|---|---|
| `shadow-soft` | `0 4px 20px -2px rgba(0,0,0,0.05)` |
| `shadow-badge` | `0 4px 10px rgba(0,0,0,0.08)` |

### Rayons
| Token | Valeur |
|---|---|
| `rounded-xl` | `1rem` (16px) |
| `rounded-2xl` | `1.5rem` (24px) |
| `rounded-3xl` | `2rem` (32px) |
| `rounded-full` | `9999px` |

---

## Phase 1 — Layout principal (Header, Tabs, Bottom Nav)

### Header
- Flex row, justify-between, align-center
- **Gauche** : avatar mascotte (48x48, rond, bordure `primary/20`, shadow soft) + greeting "Bonjour, **[Prénom]**" Nunito bold xl + emoji sparkle
- **Droite** : bouton notification (40x40, badge-icon blanc rond, shadow) avec pastille rouge danger si notifications non-lues
- Padding : `pt-8 px-6 pb-2`
- Fond : `background`

### Tabs
Barre horizontale scrollable sous le header :
- Container : `px-6 mb-8`, overflow-x scroll, hide-scrollbar
- Gap entre tabs : `16px`

| Tab | Icône Material | Label |
|---|---|---|
| `insights` | `lightbulb` | Insights & Actions |
| `stats` | `bar_chart` | My Stats |
| `tasks` | `checklist` | Tasks |

- **Tab actif** : `border-2 border-primary bg-primary/5 text-primary`
- **Tab inactif** : `border-2 border-transparent bg-surface text-muted shadow-soft`
- Chaque tab : `px-6 py-3 rounded-full flex-row items-center gap-2`
- Icône dans cercle 24x24 : actif = `bg-primary/20 text-primary`, inactif = `bg-gray-100`
- Label : Outfit bold 14px, `whitespace-nowrap`

### Bottom Nav
Fixe en bas, 5 items :

| # | Icône | Label | Comportement |
|---|---|---|---|
| 1 | `home` | Accueil | Route dashboard |
| 2 | `task_alt` | Tâches | Route tasks |
| 3 | `add` | — | **FAB** : 64x64, `bg-primary`, `rounded-[2rem]`, `shadow-lg shadow-primary/30`, élevé -32px |
| 4 | `bar_chart_4_bars` | Stats | Route stats |
| 5 | `grid_view` | Hub | Route hub |

- Container : `bg-surface border-t border-border px-6 pt-3 pb-8`
- Item actif : `text-primary`
- Items inactifs : `text-muted`
- Labels : Outfit bold 10px uppercase

---

## Phase 2 — Tab "Insights & Actions"

Tab par défaut. Trois sections verticales avec gap de 32px.

### 2.1 — Carousel d'insights
Scroll horizontal, cards de 280px min-width, gap 16px, padding horizontal 24px.

**3 types de cards :**

| Type | Fond | Icône | Accent | Label |
|---|---|---|---|---|
| Alerte | `#FFF5F5` + `border-danger/20` | `error` | `danger` | "Attention [Prénom] !" |
| Conseil | `surface` + `border-border` | `chat_bubble` | `tertiary` | "Conseil" |
| Bien-être | `surface` + `border-border` | `favorite` | `secondary` | "Bien-être" |

Structure de chaque card :
- `p-5 rounded-3xl shadow-soft min-w-[280px] flex-col justify-between`
- **Header** : icône badge (40x40) + label catégorie (10px uppercase tracking-widest, Outfit bold, couleur accent ou muted)
- **Body** : message Nunito bold 16px, `mb-4`
- **Footer** : CTA texte uppercase Outfit bold 12px + icône `arrow_right_alt`

### 2.2 — Score du Foyer
Card full-width blanche avec décor.

- Container : `bg-surface rounded-3xl p-6 shadow-soft border border-border relative overflow-hidden`
- **Décor** : cercle absolu `-top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl`
- **Header** : "Score du Foyer" Nunito bold 18px + icône info (badge-icon 32x32) à droite
- **Content** : flex row justify-between
  - **Gauche** : score `text-4xl font-extrabold` ("85" + "/100" en muted), trend `text-success text-sm` avec icône `trending_up`, message coach `text-muted text-sm mt-3`
  - **Droite** : SVG gauge circulaire 112x112, cercle fond `gray-100`, arc `primary`, icône `balance` au centre dans badge `primary/10`

### 2.3 — Tâches à venir
- **Header** : "Tâches à venir" Nunito bold 18px + "Voir tout" lien `primary` uppercase 12px tracking-widest
- **Liste** : gap 16px vertical
- **Task card** : `bg-surface p-4 rounded-3xl shadow-soft border border-border/50 flex-row items-center justify-between`
  - Icône catégorie (48x48 badge-icon, fond `accent/10`, couleur contextuelle)
  - Titre Nunito bold 14px + sous-titre Outfit bold 10px uppercase muted ("Aujourd'hui • Thomas")
  - Checkbox ronde 40x40 badge-icon, icône `radio_button_unchecked` en `gray-300`

---

## Phase 3 — Tab "My Stats"

### 3.1 — Score Hero (détaillé)
Reprise du Score du Foyer mais en version étendue :
- Gauge circulaire plus grande (160px)
- Score + trend + message coach
- Bouton CTA "Voir le bilan hebdo" — Outfit bold, `text-primary` uppercase

### 3.2 — Répartition des tâches
Card blanche full-width :
- Titre "Répartition des tâches" Nunito bold 18px
- Donut chart centré avec pourcentages par membre
- Légende : avatar + nom + pourcentage par membre
- Couleurs : `primary` membre 1, `secondary` membre 2

### 3.3 — Charge mentale
Card blanche full-width :
- Titre "Charge mentale" Nunito bold 18px
- Niveau en grand texte (Faible/Moyenne/Élevée) — couleur contextuelle (`success`/`tertiary`/`danger`)
- Barre de progression colorée
- Comparaison côte à côte des deux membres

### 3.4 — Tendance hebdo
Card blanche full-width :
- Titre "Tendance de la semaine" Nunito bold 18px
- Mini-graphe (barres ou sparkline) — évolution du score sur 4 semaines
- Texte résumé sous le graphe en `textMuted`

---

## Phase 4 — Tab "Tasks"

### 4.1 — Résumé rapide
Barre horizontale de 3 pills compteurs :
- "X à faire" : `bg-primary/10 text-primary`
- "X en retard" : `bg-danger/10 text-danger`
- "X complétées" : `bg-success/10 text-success`
- Style pill : `px-4 py-2 rounded-full` Outfit bold 12px

### 4.2 — Liste des tâches
Même style que tab Insights mais :
- Liste complète (pas limitée)
- Groupées par jour : "Aujourd'hui", "Demain", "Cette semaine"
- Header de groupe : Outfit bold 10px uppercase `textMuted` + ligne séparatrice `border`
- Task cards identiques au tab Insights

### 4.3 — Empty state
Si aucune tâche :
- Icône `task_alt` 64px dans cercle `primary/10` (96px)
- "Aucune tâche à venir" Nunito bold 16px
- "Ajoutez une tâche avec le bouton +" Outfit 14px `textMuted`
- Centré verticalement

### 4.4 — FAB cohérence
Le FAB de la bottom nav est le point d'entrée pour créer une tâche. Pas de bouton "Ajouter" dupliqué dans ce tab.

---

## Composants partagés (badge-icon)

Le pattern `badge-icon` revient partout. C'est un composant réutilisable :
```
flex items-center justify-center rounded-2xl shadow-badge border border-border bg-surface
```

Accepte des props de taille (sm: 24px, md: 32px, lg: 40px, xl: 48px) et de couleur de fond/texte.

---

## Fichiers impactés

### Nouveaux fichiers
- `apps/mobile/tailwind.config.js` — config NativeWind avec tokens
- `apps/mobile/src/components/dashboard/DashboardTabs.tsx` — système de tabs
- `apps/mobile/src/components/ui/BadgeIcon.tsx` — composant badge réutilisable
- `apps/mobile/src/components/ui/BottomNav.tsx` — nouvelle bottom nav (si pas déjà gérée par Expo Router tabs)
- `apps/mobile/src/components/dashboard/InsightCardV2.tsx` — nouvelle card insight
- `apps/mobile/src/components/dashboard/ScoreCard.tsx` — score du foyer redesigné
- `apps/mobile/src/components/dashboard/TaskCardV2.tsx` — nouvelle task card
- `apps/mobile/src/components/dashboard/StatsTab.tsx` — contenu tab My Stats
- `apps/mobile/src/components/dashboard/TasksTab.tsx` — contenu tab Tasks
- `apps/mobile/src/components/dashboard/TaskSummaryPills.tsx` — compteurs pills

### Fichiers modifiés
- `apps/mobile/package.json` — ajout nativewind, tailwindcss
- `apps/mobile/babel.config.js` — preset NativeWind
- `apps/mobile/metro.config.js` — config NativeWind
- `apps/mobile/app/(app)/dashboard/index.tsx` — refonte complète du layout
- `apps/mobile/src/constants/tokens.ts` — nouvelle palette (ou nouveau fichier tokens)
- `apps/mobile/app/(app)/_layout.tsx` — bottom nav si gérée ici

### Fichiers inchangés
- Tout le code web (`apps/web/`) — hors scope
- `packages/*` — la logique métier (queries, stores) reste identique
- Les données/hooks existants sont réutilisés, seule la couche UI change

---

## Risques

1. **NativeWind compatibilité** : certaines classes Tailwind ne sont pas supportées en RN (blur, certains pseudo-éléments). Fallback sur style inline si nécessaire.
2. **Fonts Outfit** : pas encore installée dans le projet. À ajouter via `expo-font`.
3. **SVG gauge** : `react-native-svg` nécessaire pour le cercle de score. Déjà présent via victory-native.
4. **Material Symbols** : pas disponible en React Native natif. Utiliser `@expo/vector-icons` MaterialIcons ou installer une solution compatible.
5. **Dark mode NativeWind** : nécessite une config spécifique (`darkMode: 'class'` + provider).
6. **Performance tabs** : 3 vues potentiellement lourdes. Envisager lazy loading ou `React.memo`.

---

## Hors scope

- Application web (`apps/web/`)
- Logique métier, queries, stores
- Backend, migrations, edge functions
- Écrans autres que le dashboard
- Onboarding, auth, settings
