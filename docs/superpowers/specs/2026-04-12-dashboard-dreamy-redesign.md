# Dashboard Dreamy Redesign — Spec

**Date:** 2026-04-12
**Scope:** Redesign complet du dashboard mobile + web avec nouvelle palette "Dreamy", nettoyage des composants legacy.

---

## Contexte

Le dashboard Keurzen a traversé 6 itérations (v1-v6) laissant ~25 composants legacy orphelins côté mobile et ~15 côté web. Trois design systems coexistent (Cafe Cosy, V2 Editorial Kawaii, couleurs hardcodées). Le Stitch design fournit une nouvelle direction visuelle "Dreamy" à adopter sur les deux plateformes.

## Décisions

- **Approche** : Remplacement total — supprimer tous les composants dashboard legacy, créer les nouveaux from scratch
- **Palette** : Adopter la palette Dreamy du Stitch (bleu/rose), remplacer Cafe Cosy
- **Navigation** : 5 onglets (Accueil, Tâches, [+FAB], Stats, Hub) sur mobile
- **Données** : Brancher les queries existantes, mocker les alertes
- **Alertes** : Nouveau concept, mockées en statique pour l'instant

---

## Palette "Dreamy"

| Token | Valeur | Usage |
|---|---|---|
| `primary` | `#90CAF9` | CTA, accents actifs, progress, nav active |
| `accent` | `#F4C2C2` | Accents secondaires, avatar ring, alertes douces |
| `joy` | `#FFF9C4` | Highlights, badges, warning léger |
| `background` | `#FAFCFF` | Fond global |
| `cardStart` | `#F7F9FC` | Début gradient carte |
| `cardEnd` | `#EFF3F6` | Fin gradient carte |
| `cardBorder` | `#E5E9EC` | Bordures cartes |
| `textTitle` | `#4A5568` | Texte principal |
| `textBody` | `#5A6A85` | Texte secondaire |
| `white` | `#FFFFFF` | Surfaces, overlays |

### Typographie
- Mobile : Nunito (conservé) + Fredoka One pour titres dreamy
- Web : Open Sans (body) + Fredoka One (titres)

### Principes visuels
- Cartes gradient subtil (`cardStart` → `cardEnd`) + border 1.5px `cardBorder`
- Coins ultra-arrondis : 2.5rem (cartes), 2rem (boutons/nav)
- "Blob icons" : cercles `bg-white/60` + backdrop-blur + shadow inset
- Ombres bleutées légères (`shadow-blue-50/50`)
- Gradients doux autorisés (différence vs Cafe Cosy flat strict)

---

## Structure du Dashboard

```
┌─────────────────────────────┐
│  DreamHeader                │
│  Mascot · Date · Nom · 🔔  │
├─────────────────────────────┤
│  HouseholdScoreCard         │
│  Score/100 · Gauge SVG · %  │
├─────────────────────────────┤
│  TaskEquityBar              │
│  Barre split · Légende      │
├──────────────┬──────────────┤
│  AlertCard   │  AlertCard   │
│  (alert)     │  (plan)      │
├──────────────┴──────────────┤
│  AlertCard (social, full)   │
├─────────────────────────────┤
│  UpcomingTasksList          │
│  TaskRow · TaskRow · ...    │
├─────────────────────────────┤
│  DreamBottomNav (mobile)    │
│  Accueil·Tâches·[+]·Stats·Hub│
└─────────────────────────────┘
```

---

## Composants

### `DreamHeader`
- Mascot ronde 48px, rotation 3deg, border `cardBorder`, shadow
- Date : `text-[10px] uppercase tracking-widest` couleur `primary`, Fredoka
- "Bonjour, **{prénom}**" — prénom en `accent`
- Bouton notification : cercle blanc 40px, icône notifications, pastille `accent` si non lues
- Mobile : sticky top, backdrop-blur
- Web : dans le flow
- **Données** : `useCurrentUser`

### `HouseholdScoreCard`
- Carte dream-card (gradient + border + rounded 2.5rem)
- Gauche : label "Score du Foyer" (Fredoka), score `text-6xl fredoka` + `/100` en `primary`
- Pill trend `+X%` en `bg-primary/80 text-white rounded-full`
- Droite : SVG gauge circulaire 112px (cercle blanc + cercle `primary` stroke dashoffset)
- Centre gauge : blob-icon icône `balance`
- **Données** : `computeHouseholdScore(tasks, weeklyBalance, tlx)` depuis `packages/shared`

### `TaskEquityBar`
- Carte dream-card
- Header : titre "Équité des Tâches" + pastille cible "45-55%"
- Barre horizontale h-8 rounded-full, zone cible transparente au centre
- Split : membre 1 `primary/40`, membre 2 `accent/40`, pourcentages dans la barre
- Légende : carré couleur + nom + nb tâches par membre
- **Données** : `useWeeklyBalance` depuis `packages/queries`

### `AlertCard`
- 3 variantes : `alert` (accent, warning), `plan` (primary, event_repeat), `social` (primary, volunteer_activism)
- Grid 2 colonnes pour alert+plan, full width pour social
- Status pill + blob icon + texte + bouton action
- Social : bouton CTA "Envoyer" `bg-primary rounded-2xl`
- **Données** : mockées statiques en français

### `UpcomingTasksList`
- Header "Tâches à venir" + lien "Voir tout"
- Container rounded 2rem, `bg-cardStart border-cardBorder`
- TaskRow : blob-icon catégorie + titre + meta (date · assigné) + checkbox ronde
- Séparateur border-b entre rows
- **Données** : `useTasks` filtre `status in (todo, in_progress)`, tri `due_date ASC`, limit 5

### `DreamBottomNav` (mobile uniquement)
- Fixed bottom, `bg-white/80 backdrop-blur-2xl`, rounded top 3rem
- 5 liens : Accueil (home), Tâches (check_circle), Stats (monitoring), Hub (grid_view)
- FAB central 64px, gradient `from-primary to-accent`, rounded 2rem, ring background, élevé -top-8
- Labels `text-[9px] uppercase fredoka`
- Actif : couleur `primary`

---

## Données : branchées vs mockées

| Source | Statut | Hook |
|---|---|---|
| Score composite | Branchée | `computeHouseholdScore` (packages/shared) |
| Balance hebdo | Branchée | `useWeeklyBalance` (packages/queries) |
| TLX courant | Branchée | `useCurrentTlx` (packages/queries) |
| Tâches | Branchée | `useTasks` (mobile local + shared) |
| Profil utilisateur | Branchée | `useCurrentUser` |
| Alertes | **Mockées** | Données statiques dans AlertCard |

---

## Fichiers à supprimer

### Mobile (~35 fichiers dans `apps/mobile/src/components/dashboard/`)
Tous les composants existants : HouseholdScoreCard, MentalLoadCard, MentalLoadCardV2, TlxDetailCard, TlxSummaryCard, WeeklyBalanceCard, RepartitionCard, NarrativeCard, ScoreHeroCard, TaskEquityCard, InsightsCarousel, HomeHeartCard, UpcomingTasksCard, UpcomingTasks, CircularGauge, KPICard, AlertCard, WeeklyTipCard, WeeklyReportCard, ObjectiveProgressSection, BudgetSnapshot, DecorativeBlobs, InsightCard, InsightCardV2, DashboardCard, StatusPill, MemberAvatar, ProgressBar, Icons, DashboardTabs, InsightsTab, StatsTab, TasksTab, ScoreCardV2, TaskCardV2, TaskSummaryPills, constants.

### Web (~17 fichiers dans `apps/web/src/components/dashboard/`)
Tous les composants existants : BalanceCard, TlxCard, TlxDetailCard, TodayTasks, TodayTasksCard, NarrativeCard, StatusPills, WeeklyTipCard, ObjectiveProgressSection, WeeklyReportSection, DashboardCard, ScoreGauge, DashboardSidebar, RepartitionCard, TlxSummaryCard, InsightCard, CircularGauge, plus les composants actifs (ScoreHeroCard, TaskEquityCard, MentalLoadCardV2, UpcomingTasksCard, HomeHeartCard, InsightsCarousel).

## Fichiers à créer

### Mobile (`apps/mobile/src/components/dashboard/`)
- `DreamHeader.tsx`
- `HouseholdScoreCard.tsx`
- `TaskEquityBar.tsx`
- `AlertCard.tsx`
- `UpcomingTasksList.tsx`
- `DreamBottomNav.tsx`
- `constants.ts` (tokens Dreamy)

### Web (`apps/web/src/components/dashboard/`)
- `DreamHeader.tsx`
- `HouseholdScoreCard.tsx`
- `TaskEquityBar.tsx`
- `AlertCard.tsx`
- `UpcomingTasksList.tsx`

## Fichiers à modifier

| Fichier | Changement |
|---|---|
| `apps/mobile/src/constants/tokens.ts` | Remplacer palette Cafe Cosy → Dreamy |
| `apps/web/src/app/globals.css` | Remplacer tokens CSS Cafe Cosy + V2 → Dreamy |
| `apps/mobile/app/(app)/dashboard/index.tsx` | Nouveau layout avec composants Dreamy |
| `apps/web/src/app/(app)/dashboard/page.tsx` | Nouveau layout avec composants Dreamy |
| `apps/mobile/app/(app)/_layout.tsx` | Intégrer DreamBottomNav |

## Fichiers préservés

- `packages/shared/src/utils/householdScore.ts` — logique de calcul intacte
- `packages/queries/` — tous les hooks identiques
- `apps/mobile/src/lib/queries/` — hooks locaux intacts
- `apps/mobile/src/components/ui/Mascot.tsx` — inchangé
