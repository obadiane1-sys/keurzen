# Keurzen — Application mobile de gestion collaborative du foyer

Application mobile React Native + Expo production-ready pour gérer les tâches, le temps, la charge mentale et le budget d'un foyer.

---

## Prérequis

- Node.js ≥ 18
- Expo CLI : `npm install -g expo-cli eas-cli`
- Compte Supabase ([supabase.com](https://supabase.com))
- Expo Account ([expo.dev](https://expo.dev))
- iOS : Xcode 15+ (Mac uniquement)
- Android : Android Studio + SDK

---

## Installation rapide

```bash
# 1. Cloner et installer les dépendances
git clone <repo>
cd keurzen
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Appliquer les migrations Supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 4. (Optionnel) Charger les données de démo
supabase db reset  # puis exécuter supabase/seed/seed.sql

# 5. Lancer l'app
npm start
```

---

## Structure du projet

```
keurzen/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout (providers)
│   ├── index.tsx                 # Route guard → redirection
│   ├── (auth)/                   # Écrans auth (non protégés)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (onboarding)/             # Onboarding one-shot
│   │   └── index.tsx
│   └── (app)/                    # App principale (protégée, tabs)
│       ├── _layout.tsx           # Tab navigation
│       ├── dashboard/
│       │   ├── index.tsx         # Dashboard principal
│       │   └── tlx.tsx           # NASA-TLX
│       ├── tasks/
│       │   ├── index.tsx         # Liste des tâches
│       │   └── [id].tsx          # Détail d'une tâche
│       ├── calendar/
│       │   └── index.tsx
│       ├── budget/
│       │   └── index.tsx
│       └── settings/
│           ├── index.tsx
│           ├── profile.tsx
│           ├── household.tsx
│           ├── notifications.tsx
│           ├── security.tsx
│           ├── help.tsx
│           ├── contact.tsx
│           ├── terms.tsx
│           └── privacy.tsx
│
├── src/
│   ├── constants/
│   │   └── tokens.ts             # Design tokens (couleurs, espacements...)
│   ├── types/
│   │   └── index.ts              # Types TypeScript globaux
│   ├── stores/
│   │   ├── auth.store.ts         # Zustand — session & profil
│   │   ├── household.store.ts    # Zustand — foyer courant
│   │   └── ui.store.ts           # Zustand — état UI (toasts, modals)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Client Supabase
│   │   │   ├── auth.ts           # Fonctions auth
│   │   │   └── database.types.ts # Types DB (à regen via CLI)
│   │   └── queries/
│   │       ├── tasks.ts          # TanStack Query — tâches
│   │       ├── household.ts      # TanStack Query — foyer
│   │       ├── tlx.ts            # TanStack Query — NASA-TLX
│   │       ├── budget.ts         # TanStack Query — budget
│   │       └── weekly-stats.ts   # TanStack Query — stats hebdo
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useGuidedTour.ts
│   │   └── usePushNotifications.ts
│   ├── components/
│   │   ├── ui/                   # Composants atomiques
│   │   │   ├── Text.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Mascot.tsx        # Mascotte SVG kawaii
│   │   │   ├── Loader.tsx
│   │   │   └── Divider.tsx
│   │   └── tasks/
│   │       └── CreateTaskModal.tsx
│   └── utils/
│       └── validation.ts         # Schémas Zod
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   ├── functions/
│   │   ├── compute-weekly-stats/ # Cron: calcul stats hebdo
│   │   ├── mark-overdue-tasks/   # Cron: tâches en retard
│   │   └── morning-digest/       # Cron: notifications matin
│   └── seed/
│       └── seed.sql              # Données de démo
│
├── .env.example
├── app.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## Variables d'environnement

```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Supabase — Configuration

### 1. Migrations

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

### 2. Edge Functions (déploiement)

```bash
supabase functions deploy compute-weekly-stats
supabase functions deploy mark-overdue-tasks
supabase functions deploy morning-digest
```

### 3. Crons (via Supabase Dashboard)

| Fonction | Schedule | Description |
|----------|----------|-------------|
| `mark-overdue-tasks` | `0 0 * * *` | Chaque jour à minuit |
| `compute-weekly-stats` | `0 6 * * 1` | Lundi à 6h |
| `morning-digest` | `0 8 * * *` | Chaque jour à 8h |

### 4. Storage (bucket avatars)

```sql
-- Créer via Dashboard ou CLI
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
```

---

## Build iOS / Android

### Développement (Expo Go)

```bash
npm start
# Scanner le QR code avec Expo Go
```

### Build de production (EAS)

```bash
# Installer EAS CLI
npm install -g eas-cli
eas login

# Configurer
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Soumettre sur les stores
eas submit --platform ios
eas submit --platform android
```

### eas.json (exemple)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Tests

```bash
# Lancer tous les tests unitaires
npm test

# Avec couverture
npm test -- --coverage
```

### Tests disponibles

- `src/__tests__/tlx.test.ts` — Calcul score NASA-TLX
- `src/__tests__/validation.test.ts` — Schémas Zod (password, tâche, budget)
- `src/__tests__/weekly-stats.test.ts` — Calcul des niveaux de déséquilibre

---

## Charte graphique (rappel)

| Token | Valeur | Usage |
|-------|--------|-------|
| `mint` | `#88D4A9` | CTA secondaire, success |
| `blue` | `#AFCBFF` | Info, accents |
| `coral` | `#FFA69E` | CTA primaire, alertes |
| `lavender` | `#BCA7FF` | TLX, accents doux |
| `navy` | `#212E44` | Textes foncés |
| `background` | `#F7F9FC` | Fond global |

---

## Choix techniques

| Domaine | Choix | Raison |
|---------|-------|--------|
| Navigation | Expo Router | File-based, typage fort, deep links natifs |
| État global | Zustand | Minimaliste, performant, pas de boilerplate |
| Server state | TanStack Query | Cache automatique, invalidation, optimistic updates |
| Backend | Supabase | Auth + DB + Storage + Edge Functions intégrés |
| Formulaires | React Hook Form + Zod | Validation type-safe, performance |
| Dates | dayjs | Léger, modulaire |
| Graphiques | SVG natif | Léger pour les barres simples |
| Sécurité | Supabase RLS | Sécurité niveau DB, pas uniquement applicatif |

---

## Check-list qualité

- [x] Schéma DB complet avec contraintes
- [x] RLS sur toutes les tables
- [x] Validation Zod côté client
- [x] Gestion d'erreurs sur toutes les mutations
- [x] États vides illustrés (5 variants)
- [x] Loaders sur tous les écrans asynchrones
- [x] Onboarding one-shot avec marquage Supabase
- [x] Score NASA-TLX avec performance inversée
- [x] Badge "en retard" live + workflow backend quotidien
- [x] Calcul déséquilibre avec seuils configurables
- [x] Push notifications avec tokens Supabase
- [x] Avatar fallback avec initiales
- [x] Zones tactiles ≥ 44px
- [x] Accessibilité basique (labels, hitSlop)
- [x] Pas de secrets exposés côté client
- [x] Tests unitaires sur logique critique
- [x] Seed de données de démo
- [x] .env.example documenté
