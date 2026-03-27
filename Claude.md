# CLAUDE.md

## Project
Keurzen is a premium household management app focused on:
- shared tasks
- time tracking
- mental load tracking with NASA-TLX
- weekly imbalance detection
- dashboard insights
- budget sharing
- onboarding and guided tours

## Stack
- **Mobile**: Expo SDK 55, React Native 0.83, expo-router 4, TypeScript strict
- **State**: Zustand (auth, household, ui stores)
- **Data**: TanStack Query v5 + Supabase JS v2
- **Backend**: Supabase (Postgres, RLS, Edge Functions on Deno)
- **UI**: custom design system — `src/constants/tokens.ts`, `src/components/ui/`
- **Forms**: react-hook-form + zod
- **Charts**: victory-native

## Key paths
- Routes: `app/` (Expo Router file-based)
- Business logic: `src/lib/queries/` (TanStack hooks), `src/stores/`
- UI components: `src/components/ui/`
- Types: `src/types/index.ts`
- Design tokens: `src/constants/tokens.ts`
- Migrations: `supabase/migrations/`
- Edge Functions: `supabase/functions/<name>/index.ts`

## Cockpit Claude Code
- Settings: `.claude/settings.json`
- Agents: `product-architect` · `expo-mobile-builder` · `supabase-backend` · `design-system-guardian` · `qa-regression` · `release-manager`
- Skills: `/phase-plan` · `/build-feature` · `/fix-bug` · `/db-change-safe` · `/ui-premium-pass` · `/qa-pass` · `/ship-release` · `/verify` · `/qa-check`
- Session prompts: `prompts/claude/` (session-feature, session-ui, session-backend...)

## Commands
```bash
npm run lint            # ESLint (ESLINT_USE_FLAT_CONFIG=false already set in .claude/settings.json)
npm run test            # Jest
npm run format          # Prettier
npx expo start --tunnel # Dev server via tunnel
npx expo install --fix  # Fix Expo SDK version mismatches
npx supabase db push    # Apply migrations
npx supabase functions deploy <name>   # Deploy Edge Function
npx supabase secrets list
git status / git diff / git add / git commit
```

## Product priorities
1. clarity
2. stability
3. premium UX
4. maintainability
5. shipping in small validated steps

## Working style
Always work in this order:
1. explain understanding
2. propose a plan
3. list files to modify
4. implement only the requested scope
5. summarize changes
6. explain how to test

## Scope control
If a request is broad:
- break it into phases first
- do not implement more than one main module in one pass unless explicitly asked

## Do not
- do not refactor unrelated areas
- do not change architecture without explaining why
- do not delete files without explicit reason
- do not invent product behavior if specs exist in /docs or /specs
- do not add dependencies unless necessary
- do not touch secrets or env values without explicit instruction
- do not read or write .env / .env.local / .env.* files

## Safety rails
Before any major change, always explain:
- why the change is needed
- what files will be affected
- what risks exist
- whether this impacts auth, db schema, navigation, or styling system

## Code quality rules
- strong typing everywhere
- small reusable components
- clear names
- no magic numbers
- handle loading, empty, and error states
- add basic tests for critical logic
- keep UI consistent with design tokens
- prefer composition over large files
- keep screens thin
- move business logic to hooks/services
- centralize constants
- one concern per file when possible

## Naming conventions
Use business names aligned with product language:
- household, member, task, timeLog, tlxEntry, weeklyStat, alert, expense, invitation, onboarding, guidedTour

## UX rules
- premium pastel UI
- rounded cards
- soft shadows
- clear hierarchy
- mobile-first
- touch targets >= 44px
- always include empty states
- no visually noisy screens
- preserve calm, premium tone

## Design system
Palette:
- Mint: #88D4A9
- Blue: #AFCBFF
- Coral: #FFA69E
- Lavender: #BCA7FF
- Navy: #212E44
- Text: #1E293B
- Light Gray: #E2E8F0
- Background: #F7F9FC

All tokens in `src/constants/tokens.ts` — never hardcode values.

## Mascot
Soft kawaii house mascot, no arms, no legs, open eyes, calm premium expression.
Component: `src/components/ui/Mascot.tsx`

## App modules
auth · onboarding · household · tasks · calendar · time tracking · TLX · dashboard · weekly stats · alerts · budget · notifications · settings · help · legal

## Roadmap
Active milestone: see ROADMAP.md.
Post-launch V2 feature: active task rebalancing (suggestions, never automatic).

## Backend rules
- prefer explicit schemas and migrations
- never create duplicate weekly stats
- all weekly imbalance logic must be deterministic
- notifications must avoid duplicates
- mark overdue tasks safely
- one TLX entry per user per week
- one onboarding display after signup only
- migrations must be idempotent (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE)
- SECURITY DEFINER RPCs must have SET search_path = public
- never accept user_id as RPC parameter — always use auth.uid()

## Verification loop — obligatoire avant de clore un step

Avant de déclarer le travail terminé, exécuter systématiquement :

### 1. Self-check
- Relire chaque fichier modifié
- Vérifier qu'aucun fichier hors scope n'a été touché
- Vérifier que la logique métier demandée est respectée
- Vérifier la cohérence UI avec le design system Keurzen

### 2. Vérification code
- Lancer `npm run lint` si du code TypeScript/TSX a été modifié
- Lancer `npm run test` si de la logique métier a été touchée
- Indiquer explicitement ce qui a été lancé et le résultat
- Si une commande échoue : corriger ou expliquer pourquoi

### 3. Vérification fonctionnelle
- Donner le scénario exact à tester manuellement
- Donner le résultat attendu
- Lister les edge cases à vérifier
- Lister les risques de régression sur les modules adjacents

### 4. Verdict
- Déclarer explicitement : **prêt à tester** ou **pas encore prêt**
- Si bloquant : s'arrêter et indiquer lequel

### Format de sortie obligatoire
- Plan exécuté
- Fichiers modifiés
- Commandes lancées + résultats
- Comment tester manuellement
- Risques / points à surveiller
- Verdict
