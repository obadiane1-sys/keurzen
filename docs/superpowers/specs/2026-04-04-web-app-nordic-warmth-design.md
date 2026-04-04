# Keurzen Web App — "Nordic Warmth" Design Spec

> Date: 2026-04-04
> Status: Validated
> Approach: B — Nordic Warmth (evolution premium de Cafe Cosy pour le web)

---

## 1. Decisions strategiques

| Decision | Choix |
|---|---|
| Architecture | Monorepo hybride — Next.js (web) + Expo (mobile) + packages partages |
| Monorepo tool | Turborepo |
| Scope web V1 | Core features : Dashboard, Taches, Calendrier, Listes, Settings |
| Design direction | Nordic Warmth — Cafe Cosy eleve pour le web |
| Navigation | Sidebar fixe a gauche |
| Scope web V2 (post-launch) | Budget, Repas/recettes, Analyse detaillee, Notifications center, TLX questionnaire |

---

## 2. Architecture monorepo

```
keurzen/
├── apps/
│   ├── mobile/              ← Expo SDK 55 (contenu actuel de /Keurzen)
│   └── web/                 ← Next.js 15 + Tailwind + App Router
├── packages/
│   ├── shared/              ← Types, constantes, utils partagees
│   │   ├── types/           ← app.types.ts, database.types.ts
│   │   ├── constants/       ← tokens (couleurs, spacing — format agnostique)
│   │   └── utils/           ← helpers purs (dates, formatters, validators)
│   ├── queries/             ← TanStack Query hooks + services Supabase
│   │   ├── hooks/           ← useTasks, useHousehold, useTlx...
│   │   └── services/        ← task.service.ts, auth.service.ts...
│   └── stores/              ← Zustand stores (auth, household, ui)
├── turbo.json
├── package.json             ← workspaces root
└── tsconfig.base.json
```

### Principe de partage

La logique metier (queries, stores, types, services) vit dans `packages/` et est importee par les deux apps. Seul le rendu UI est specifique a chaque plateforme.

### Ce qui reste specifique

- `apps/mobile/` : composants React Native, navigation Expo Router, tokens RN (shadows objets, Nunito)
- `apps/web/` : composants React/HTML, navigation Next.js App Router, tokens CSS (Tailwind), Instrument Sans + Inter

---

## 3. Design System Web — "Nordic Warmth"

### 3.1 Palette de couleurs

Meme famille Cafe Cosy, legerement desaturee (~5%) pour le web (confort sur grand ecran) :

| Token | Mobile | Web | Usage |
|---|---|---|---|
| terracotta | `#C4846C` | `#C07A62` | Accent principal, CTA, liens actifs |
| sauge | `#8BA888` | `#82A47E` | Succes, validation |
| miel | `#D4A959` | `#CFA24F` | Warnings, highlights |
| rose | `#D4807A` | `#CF7B74` | Alertes, erreurs |
| prune | `#9B8AA8` | `#9585A3` | TLX, charge mentale |
| background | `#FAF6F1` | `#FDFBF8` | Fond global |
| backgroundCard | `#FFFDF9` | `#FFFFFF` | Cards |
| textPrimary | `#3D2C22` | `#2D1F17` | Titres |
| textSecondary | `#7A6B5D` | `#6B5D50` | Texte secondaire |
| textMuted | `#A89888` | `#9E8F80` | Placeholders, captions |
| border | `#E8DFD5` | `#EBE5DD` | Bordures |
| borderLight | `#F0EAE2` | `#F3EDE6` | Bordures subtiles |

### 3.2 Typographie

| Role | Font | Taille | Weight |
|---|---|---|---|
| H1 (page title) | Instrument Sans | 32px | 700 |
| H2 (section) | Instrument Sans | 24px | 600 |
| H3 (card title) | Instrument Sans | 18px | 600 |
| Body | Inter | 15px | 400 |
| Body small | Inter | 13px | 400 |
| Label | Inter | 13px | 500 |
| Caption | Inter | 11px | 400 |
| Overline | Inter | 11px | 600, uppercase, tracking 0.05em |

### 3.3 Ombres

```css
--shadow-sm: 0 1px 2px rgba(45, 31, 23, 0.04);
--shadow-md: 0 2px 8px rgba(45, 31, 23, 0.05);
--shadow-lg: 0 4px 16px rgba(45, 31, 23, 0.07);
--shadow-card: 0 1px 4px rgba(45, 31, 23, 0.04), 0 0 0 1px rgba(45, 31, 23, 0.03);
```

### 3.4 Spacing & Radius

Memes valeurs que le mobile, converties en `rem` :

- Spacing: 0.25 / 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2 / 2.5 / 3 rem
- Border radius: 8 / 12 / 16 / 24 / 9999 px

### 3.5 Micro-interactions

- Hover cards : `transform: translateY(-1px)` + ombre intensifiee
- Transitions : `150ms ease` par defaut, `250ms` pour layouts
- Focus rings : `2px solid terracotta`, offset `2px`
- Boutons press : `scale(0.98)`

---

## 4. Layout & Navigation

### 4.1 Structure globale

```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌─────────────────────────────────┐ │
│ │          │ │                                 │ │
│ │  SIDEBAR │ │       MAIN CONTENT             │ │
│ │  240px   │ │       max-width: 1080px         │ │
│ │          │ │       padding: 32px             │ │
│ │  Logo    │ │                                 │ │
│ │  ──────  │ │                                 │ │
│ │  Accueil │ │                                 │ │
│ │  Taches  │ │                                 │ │
│ │  Agenda  │ │                                 │ │
│ │  Listes  │ │                                 │ │
│ │  ──────  │ │                                 │ │
│ │  Foyer   │ │                                 │ │
│ │  Inviter │ │                                 │ │
│ │  ──────  │ │                                 │ │
│ │          │ │                                 │ │
│ │  Avatar  │ │                                 │ │
│ │  Settings│ │                                 │ │
│ └──────────┘ └─────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 4.2 Sidebar

- Largeur : 240px expanded, 64px collapsed (icones)
- Toggle : bouton chevron ou raccourci `[`
- Groupes :
  - **Navigation** : Accueil, Taches, Agenda, Listes
  - **Foyer** : Mon foyer, Invitations
  - **Bas (fixe)** : Avatar + nom, Settings, Deconnexion
- Style : fond `background`, items `border-radius: 8px`, hover `rgba(terracotta, 0.08)`, actif `rgba(terracotta, 0.12)` + texte terracotta
- Icones : Lucide React

### 4.3 Responsive breakpoints

| Breakpoint | Layout |
|---|---|
| `>= 1280px` | Sidebar expanded (240px) + contenu |
| `1024-1279px` | Sidebar collapsed (64px) + contenu |
| `768-1023px` | Sidebar en drawer overlay + contenu pleine largeur |
| `< 768px` | Bottom nav mobile-style (5 tabs) |

### 4.4 Page header

Pas de top bar globale. Chaque page a son header :

```
H1 Titre de la page              🔔 Notifs  [Avatar]
Sous-titre optionnel
─────────────────────────────────────────────────────
Contenu...
```

---

## 5. Pages V1

### 5.1 Dashboard

- **Header** : Greeting + nom + avatar + cloche notifications
- **Stats row** : 3 StatCards en grille (Aujourd'hui, En retard, Total actif)
- **Cards 2 colonnes** :
  - Repartition semaine (barres par membre)
  - Charge mentale TLX (score + delta)
- **Cards 2 colonnes** :
  - Taches du jour (liste, max 4, lien "Tout voir")
  - Termine recemment (liste, max 5)
- **Full width** : Rapport de la semaine
- Responsive : 3 → 2 → 1 colonne

### 5.2 Taches

- **Header** : Titre + bouton "+ Creer"
- **Barre** : Recherche + filtres
- **Tabs** : Toutes | Aujourd'hui | En retard | Faites
- **Layout** : Split view — liste a gauche, panel detail a droite
  - `>= 1024px` : split view cote a cote
  - `< 1024px` : panel en overlay/modal
- **Detail** : titre, description, assignee, date, priorite, recurrence — editable inline
- **Creation** : modal centree

### 5.3 Calendrier

- **Header** : Titre + navigation mois + toggle Semaine/Mois
- **Vue mois** par defaut (plus utile sur grand ecran)
- **Grille** : 7 colonnes, dots colores par membre sur chaque jour
- **Clic jour** : liste des taches en dessous de la grille

### 5.4 Listes partagees

- **Header** : Titre + bouton "+ Creer"
- **Grille de cards** : 3 colonnes desktop, 2 tablette, 1 mobile
- **Card** : emoji + nom + nombre d'items
- **Detail** : split view ou page dediee avec checklist

### 5.5 Settings

- Layout 1 colonne centree, max-width 640px
- Sections empilees :
  - Profil (avatar, nom, email)
  - Foyer (nom, membres, quitter)
  - Invitations (liste + formulaire)
  - Securite (mot de passe)
  - Legal (CGU, confidentialite)

---

## 6. Composants

### 6.1 Partages (`packages/`)

| Package | Contenu |
|---|---|
| `shared/types` | Task, Household, Member, TlxEntry, WeeklyStat, List, Invitation... |
| `shared/constants` | Palette hex, spacing nombres, radius — format agnostique |
| `shared/utils` | formatDate, getGreeting, mapPriority, tlxColor, schemas zod |
| `queries/services` | task.service, auth.service, household.service, list.service |
| `queries/hooks` | useTasks, useHousehold, useTlx, useWeeklyBalance... |
| `stores/` | authStore, householdStore, uiStore |

### 6.2 Specifiques web (`apps/web`)

| Composant | Role |
|---|---|
| `Sidebar` | Navigation, collapse, drawer responsive |
| `PageHeader` | H1 + notifs + avatar |
| `Card` | Card HTML, shadow-card, hover transition |
| `Button` | Variantes : primary, secondary, ghost, danger |
| `Input` | Label, erreur, icone, focus ring terracotta |
| `Badge` | Status (priorite, type) |
| `Avatar` | Image ou fallback initiale |
| `EmptyState` | Illustration + message + CTA |
| `Modal` | Dialogs (creation, confirmation) |
| `SplitView` | Liste + panel detail (taches) |
| `DataTable` | Lignes avec tri et filtres |
| `Calendar` | Grille mensuelle/semaine |
| `StatCard` | Chiffre + label + icone |
| `ProgressBar` | Barre repartition membres |
| `Toast` | Notifications ephemeres |

### 6.3 Import tokens

`packages/shared/constants/tokens.ts` exporte les valeurs brutes :

```ts
export const colors = {
  terracotta: '#C07A62',
  sauge: '#82A47E',
  miel: '#CFA24F',
  rose: '#CF7B74',
  prune: '#9585A3',
  background: '#FDFBF8',
  backgroundCard: '#FFFFFF',
  textPrimary: '#2D1F17',
  textSecondary: '#6B5D50',
  textMuted: '#9E8F80',
  border: '#EBE5DD',
  borderLight: '#F3EDE6',
} as const;
```

- **Web** : `tailwind.config.ts` mappe vers classes (`bg-terracotta`, `text-sauge`...)
- **Mobile** : importe directement (migration progressive depuis `Colors.terracotta`)

---

## 7. Stack technique web

| Couche | Choix | Justification |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR, layouts, Server Components |
| Styling | Tailwind CSS 4 | Rapide, tokens custom |
| State | Zustand 5 (`packages/stores`) | Partage avec mobile |
| Data fetching | TanStack Query v5 (`packages/queries`) | Partage avec mobile |
| Backend | Supabase (meme projet) | Zero duplication |
| Icones | Lucide React | Coherent, leger |
| Fonts | Instrument Sans + Inter | Via `next/font` |
| Forms | react-hook-form + zod (`packages/shared`) | Schemas partages |
| Animations | CSS transitions + Framer Motion | Leger, performant |
| Auth | `@supabase/ssr` | Cookies HTTP-only |
| Deploy | Vercel | Integration Turborepo native |

### Auth adapter pattern

```ts
// packages/queries/services/auth.service.ts
export function createAuthService(client: SupabaseClient) {
  return {
    signIn: (email, password) => client.auth.signInWithPassword({ email, password }),
    signOut: () => client.auth.signOut(),
    getSession: () => client.auth.getSession(),
  };
}
```

Chaque app cree le client Supabase avec sa strategie de stockage (SecureStore mobile, cookies web) et injecte dans le service.

---

## 8. Scope V2 web (post-lancement)

- Budget (depenses, categories, solde mensuel)
- Repas / recettes (planning, favoris, historique)
- Analyse detaillee (graphiques, tendances)
- Notifications center (page dediee)
- TLX questionnaire complet (6 dimensions NASA-TLX)
- Command palette (Cmd+K)
- Raccourcis clavier

---

## 9. Ce qui ne change PAS

- App mobile : aucune modification
- Backend Supabase : meme projet, meme DB, memes RLS, memes Edge Functions
- `keurzen-site` : reste le site vitrine independant
