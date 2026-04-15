# Hub — Home Page Design

**Date:** 2026-04-15
**Status:** Draft, awaiting implementation plan
**Scope:** Mobile + Web (dual-platform, required)
**Source inspiration:** Stitch mockup `stitch_keurzen_dashboard_mobile (5).zip` — adapté au design system Keurzen Lavender (Nunito, flat, aucun glassmorphism, aucun serif).

---

## 1. Objectif

Créer le **Hub**, écran d'accueil de Keurzen après login. Le Hub combine :

1. Un **résumé contextuel du jour** via un carousel horizontal de 3 cartes (score équilibre, tâches du jour, activité récente du foyer).
2. Un **launcher** vers les modules de l'app via une grille 2×4 de 7 tuiles.
3. Un **FAB** central flottant qui raccourcit la création d'une tâche.

Le Hub remplace le dashboard actuel comme landing page, tout en laissant `dashboard` entièrement intact et accessible via la tuile "Tableau de bord".

## 2. Décisions produit

| Décision | Choix retenu |
|---|---|
| Scope route | Remplir le stub existant `apps/mobile/app/(app)/hub/index.tsx` ; créer `apps/web/src/app/(app)/hub/page.tsx` |
| Landing après login | **Inchangée** : on reste sur `/(app)/dashboard`. Le Hub est accessible via l'onglet "Hub" déjà présent dans la bottom nav mobile et un nouvel item sidebar côté web |
| Fidélité design | **Esprit Stitch, DS Keurzen** : Nunito partout, cartes flat lavande, zéro glassmorphism, zéro serif |
| Carousel (3 cartes) | Score équilibre du jour · Tâches du jour · Activité récente |
| Grille launcher | 7 tuiles toutes navigables : Tableau de bord (accent mint léger), Liste de course, Budget, Réglages, Charge mentale (TLX), Calendrier, Messages |
| FAB | **Déjà en place** : le FAB central du `CustomTabBar` existe et navigue déjà vers `/tasks/create`. Rien à ajouter sur mobile. Côté web, pas de FAB — la sidebar suffit |
| Bottom nav | **Inchangée** : la structure à 4 onglets + FAB est déjà en place dans `apps/mobile/app/(app)/_layout.tsx` |
| Header | Greeting `Bonjour {prénom}` + date du jour + nom du foyer, cloche notifications (badge unread) à gauche du bloc droit, avatar utilisateur à droite → `/settings` |
| États loading/empty | Skeletons lavande partout + empty states doux (jamais masquer une carte) |

## 3. Architecture technique

### Mobile (`apps/mobile/`)

**Routes modifiées**
- `app/(app)/hub/index.tsx` — container thin (<100 lignes) qui compose header, carousel, grid. Le FAB est déjà rendu par `CustomTabBar` au niveau `_layout.tsx`, rien à ajouter ici.

**Pas de modification** de `app/(app)/_layout.tsx` : l'onglet `hub` existe déjà, les routes secondaires sont déjà masquées.

**Nouveaux composants** sous `apps/mobile/src/components/hub/`

| Fichier | Rôle | Data |
|---|---|---|
| `HubHeader.tsx` | Greeting + date locale FR + nom foyer, cloche `/notifications` (badge unread), avatar `/settings` | `authStore`, `useHousehold`, `useUnreadNotifications` |
| `HubCarousel.tsx` | `FlatList` horizontal snap pleine largeur moins 32px de padding ; pagination dots lavande en bas | — |
| `HubScoreCard.tsx` | Hero score équilibre jour + delta vs semaine précédente + CTA "Voir dashboard" → `/dashboard` | `useStats` |
| `HubTodayTasksCard.tsx` | Max 3 tâches numérotées `01 02 03`, CTA "Voir toutes les tâches" → `/tasks` | `useTasks` filtre `today` |
| `HubActivityCard.tsx` | 3 dernières actions foyer (initiale membre + verbe + temps relatif), CTA "Voir le tableau de bord" → `/dashboard` | `useRecentActivity` (à créer si absent) |
| `HubTilesGrid.tsx` | Grille 2 colonnes, 7 tuiles à partir de `HUB_TILES` | — |
| `HubTile.tsx` | Carte flat lavande ; icône Ionicons + label uppercase tracking ; `Pressable` scale 0.98 | — |

**Icônes** : Ionicons (cf. convention mobile CLAUDE.md).

### Web (`apps/web/`)

**Routes nouvelles / modifiées**
- `src/app/(app)/hub/page.tsx` — nouvelle page.
- `src/components/layout/Sidebar.tsx` — nouvel item "Hub" (avant ou après "Accueil/Dashboard" selon l'ordre des priorités produit).

**Pas de changement de redirect** : landing reste `/dashboard` après login.

**Nouveaux composants** sous `apps/web/src/components/hub/` — mêmes noms que mobile, icônes **lucide-react**, Tailwind + tokens CSS existants de `globals.css`.

### Shared (`packages/shared/`)

Nouveau fichier :

```ts
// packages/shared/src/constants/hubTiles.ts
export const HUB_TILES = [
  { key: 'dashboard', labelKey: 'Tableau de bord', route: '/dashboard',     icon: 'grid',       accent: true },
  { key: 'lists',     labelKey: 'Liste de course', route: '/lists',         icon: 'basket' },
  { key: 'budget',    labelKey: 'Budget',          route: '/budget',        icon: 'cash' },
  { key: 'settings',  labelKey: 'Réglages',        route: '/settings',      icon: 'settings' },
  { key: 'tlx',       labelKey: 'Charge mentale',  route: '/dashboard/tlx', icon: 'pulse' },
  { key: 'calendar',  labelKey: 'Calendrier',      route: '/calendar',      icon: 'calendar' },
  { key: 'messages',  labelKey: 'Messages',        route: '/messages',      icon: 'chatbubble' },
] as const;
```

Chaque plateforme mappe les `icon` keys sur sa lib respective (Ionicons côté mobile, lucide-react côté web).

## 4. Design system — aucun ajout

Respect strict des tokens existants (`apps/mobile/src/constants/tokens.ts` et `apps/web/src/app/globals.css`) :

- **Fonds** : `background #FFFFFF`, cartes `#F9F8FD`, tuile active `#E5DBFF`, tuile inactive `#F9F8FD`.
- **Bordures** : `#DCD7E8`.
- **Accent** : `#967BB6` (primaire), texte principal `#5F5475`.
- **Radius** : cartes 16px, tuiles 16px, FAB `full` (32px).
- **Ombres** : `rgba(95,84,117,0.06)` opacity 0.04–0.08, jamais #000.
- **Typo** : `Nunito_700Bold` greeting, `Nunito_600SemiBold` titres cartes, `Nunito_400Regular` body, labels tuiles uppercase `letterSpacing: 2`.
- Touch targets ≥ 44px.

Aucun nouveau token. Aucun import de police.

## 5. États UI

| Zone | Loading | Empty | Error |
|---|---|---|---|
| Header | Placeholder sur prénom | Fallback nom foyer "Mon foyer" | Silencieux |
| Score card | Skeleton hero 96px | "Ajoute ta première tâche" + CTA `/tasks/create` | "Indisponible" doux |
| Today tasks card | 3 skeleton rows | "Journée libre" + mini mascot | "Indisponible" doux |
| Activity card | 3 skeleton rows | "Aucune activité récente" | "Indisponible" doux |
| Tiles | Rendu direct (statique) | — | — |

Un composant `Skeleton` partagé sous `components/ui/Skeleton.tsx` (mobile + web) est créé si absent. Fond `primarySurface` + shimmer lavande.

## 6. Règle dual-platform

Chaque composant listé ci-dessus est livré en binôme mobile + web dans la même phase d'implémentation. Aucun merge partiel sur une seule plateforme.

## 7. Scope hors-périmètre (explicite)

- **Aucun nouveau backend** : pas de migration, pas de nouvelle Edge Function.
- **Aucune modification produit** des modules cibles (dashboard, tasks, lists, budget, calendar, messages, settings) — on n'y touche pas, on les référence uniquement.
- **Pas de refactor** de la bottom nav ou du dashboard existant.
- **Pas de notifications push** — la cloche se contente d'afficher le badge unread existant.

## 8. Risques et inconnues

1. **`useRecentActivity` data source** : ce hook peut ne pas exister aujourd'hui. Si absent, la phase d'implémentation doit décider : créer le hook à partir d'une vue/agrégation Supabase existante, ou faire un agrégat côté client à partir de `useTasks` completions récentes. À clarifier dans le plan d'implémentation.
2. **Sidebar web** : vérifier si `Sidebar.tsx` utilise une liste statique de routes — si oui, insertion directe ; sinon revoir.
3. **DS drift FAB mobile existant** : le FAB actuel dans `_layout.tsx` utilise `#90CAF9` (bleu) au lieu du violet lavande. Hors scope de cette feature, mais à noter comme dette DS pour un pass séparé.

## 9. Critères d'acceptation

- Le 4ème onglet "Hub" de la bottom nav mobile affiche désormais l'écran Hub complet (au lieu du stub).
- Un item "Hub" est présent dans la sidebar web et mène à `/hub`.
- Le carousel affiche 3 cartes swipeables avec dots de pagination.
- Chaque carte a ses trois états (loading skeleton, empty doux, data réelle).
- La grille 2×4 affiche les 7 tuiles, toutes cliquables et naviguant vers le module correspondant.
- La tuile "Tableau de bord" est visuellement mise en avant (accent mint léger).
- La landing après login reste `/dashboard` — pas de régression de redirect.
- Le design respecte strictement les tokens lavande — zéro hardcoded color, zéro nouvelle police, zéro glassmorphism.
- Lint + tests passent sur mobile et web.
