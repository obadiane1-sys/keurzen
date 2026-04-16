# CLAUDE.md — Keurzen

Ce fichier est lu automatiquement par Claude Code à chaque session.
Il définit le contexte, les règles et les conventions du projet.

---

## Project

**Keurzen** is a premium household management app and coach, focused on fairness, time visibility, and mental load reduction. It guides couples toward a balanced household by tracking tasks, measuring perceived workload (TLX), and providing weekly coaching insights.

Core modules :
`auth` · `onboarding` · `household` · `tasks` · `calendar` · `time tracking` · `TLX` · `dashboard` · `weekly stats` · `alerts` · `budget` · `notifications` · `settings` · `help` · `legal`

---

## Stack

| Couche | Technologie |
|---|---|
| Monorepo | Turborepo (`apps/mobile`, `apps/web`, `packages/*`) |
| Mobile | Expo SDK 55 / React Native 0.83 / TypeScript strict |
| Web | Next.js / React / Tailwind CSS / TypeScript strict |
| Navigation | Expo Router 4 (mobile), Next.js App Router (web) |
| État global | Zustand |
| Data fetching | TanStack Query v5 |
| Backend | Supabase (Auth, Postgres, RLS, Edge Functions Deno) |
| Client Supabase | supabase-js v2 |
| Forms | react-hook-form + zod |
| Charts | victory-native (mobile) |
| Icons | @expo/vector-icons Ionicons (mobile), lucide-react (web) |
| UI | Design system custom "Lavender" |

---

## Key paths

### Mobile (`apps/mobile/`)

| Rôle | Chemin |
|---|---|
| Écrans | `apps/mobile/app/` (Expo Router file-based) |
| Logique métier | `apps/mobile/src/lib/queries/` (TanStack hooks) |
| Stores | `apps/mobile/src/stores/` |
| Composants UI | `apps/mobile/src/components/ui/` |
| Types | `apps/mobile/src/types/index.ts` |
| Design tokens | `apps/mobile/src/constants/tokens.ts` |

### Web (`apps/web/`)

| Rôle | Chemin |
|---|---|
| Pages | `apps/web/src/app/(app)/` (Next.js App Router) |
| Composants | `apps/web/src/components/` |
| CSS / tokens | `apps/web/src/app/globals.css` (CSS variables) |

### Shared packages (`packages/`)

| Package | Contenu |
|---|---|
| `packages/shared` | Types, constantes, utilitaires partagés |
| `packages/queries` | Hooks TanStack Query partagés |
| `packages/stores` | Stores Zustand partagés |

### Backend

| Rôle | Chemin |
|---|---|
| Migrations | `apps/mobile/supabase/migrations/` |
| Edge Functions | `apps/mobile/supabase/functions/<name>/index.ts` |

---

## Cockpit Claude Code

- Settings : `.claude/settings.json`
- Agents : `product-architect` · `expo-mobile-builder` · `supabase-backend` · `design-system-guardian` · `qa-regression` · `release-manager` · `code-reviewer` · `codebase-explorer` · `docs-researcher` · `web-searcher`
- Skills : `/phase-plan` · `/build-feature` · `/fix-bug` · `/db-change-safe` · `/ui-premium-pass` · `/qa-pass` · `/ship-release` · `/verify` · `/qa-check` · `/new-feature` · `/mobile-design-premium`
- Session prompts : `prompts/claude/`

---

## Roadmap

See `ROADMAP.md` for current milestone, phases and exit conditions.
Post-launch V2 feature : active task rebalancing (suggestions, never automatic).

---

## Dual-platform rule

Every feature must be implemented on both platforms simultaneously :
- Mobile app : `apps/mobile/` (Expo / React Native)
- Web app : `apps/web/` (Next.js / React)

Never implement a feature on one platform without the other.
For each prompt, explicitly list the files to modify on both sides.
Shared logic (types, queries, stores) goes in `packages/`.

---

## Commands

```bash
# Monorepo (racine)
npm run lint                                    # ESLint (turbo)
npm run test                                    # Jest (turbo)
npm run format                                  # Prettier
npm run dev                                     # Dev toutes les apps (turbo)
npm run build                                   # Build toutes les apps (turbo)

# Mobile
cd apps/mobile && npx expo start --tunnel       # Dev server mobile
npx expo install --fix                          # Fix SDK mismatches

# Web
cd apps/web && npm run dev                      # Dev server web (Next.js)
cd apps/web && npm run build                    # Build web

# Backend
npx supabase db push                            # Apply migrations
npx supabase functions deploy <name>            # Deploy Edge Function
npx supabase functions logs <name> --tail       # Logs Edge Function
npx supabase secrets list                       # Lister les secrets

# Git
git status / git diff / git add / git commit
```

---

## Working style

Always work in this order :
1. Explain understanding
2. Propose a plan
3. List files to modify (mobile AND web)
4. Implement only the requested scope
5. Summarize changes
6. Explain how to test

---

## Product priorities

1. Clarity
2. Stability
3. Premium UX
4. Maintainability
5. Shipping in small validated steps

---

## Scope control

If a request is broad :
- Break it into phases first
- Do not implement more than one main module in one pass unless explicitly asked
- Never refactor unrelated areas
- Never change architecture without explaining why
- Never delete files without explicit reason
- Never invent product behavior if specs exist in `/docs` or `/specs`

---

## Do not

- Do not refactor unrelated areas
- Do not change architecture without explaining why
- Do not delete files without explicit reason
- Do not invent product behavior if specs exist in /docs or /specs
- Do not add dependencies unless necessary
- Do not touch secrets or env values without explicit instruction
- Do not read or write `.env` / `.env.local` / `.env.*` files
- Do not navigate toward the dashboard from `join/[token].tsx`
- Do not call any Auth revocation logic when deleting an invitation

---

## Safety rails

Before any major change, always explain :
- Why the change is needed
- What files will be affected
- What risks exist
- Whether this impacts auth, db schema, navigation, or styling system

---

## Auth navigation rules — impératives

La logique de navigation dans `_layout.tsx` doit respecter cet ordre strict :

```typescript
// 1. Pas de session → login
if (!session) → redirect('/(auth)/login')

// 2. Session + mot de passe à définir → sécurité
if (session && needsPasswordSetup) → redirect('/(app)/settings/security')

// 3. Session normale → dashboard
if (session) → redirect('/(app)/dashboard')
```

`needsPasswordSetup` est un flag Zustand dans `authStore`, jamais dans le routing.

---

## Flux invitation Magic Link — règles impératives

Séquence obligatoire dans `app/keurzen/join/[token].tsx` :

1. Lire le token depuis les params
2. Appeler `accept-invitation` edge function
3. Si succès → `authStore.setNeedsPasswordSetup(true)`
4. `router.replace('/(app)/settings/security')`

Ne jamais naviguer vers le dashboard depuis ce fichier.
Le layout intercepte et confirme la redirection via `needsPasswordSetup`.

---

## Signup — règles impératives

- Après `supabase.auth.signUp()`, toujours vérifier le retour
- Si email déjà existant → afficher : "Un compte existe déjà avec cette adresse. Connectez-vous."
- Jamais afficher "Compte créé" si la création a échoué
- Gérer les deux cas : confirmation email activée / désactivée
- Le champ email pré-rempli depuis une invitation doit être verrouillé (non éditable)

---

## Invitation — suppression — règles impératives

- Croix sur invitation en attente → modale de confirmation avec l'email concerné
- Confirmation → `DELETE FROM invitations WHERE id = $1` uniquement
- Zéro logique de révocation Auth
- Rafraîchir la liste après suppression

---

## Deep link — règles impératives

- Le scheme `keurzen://` doit être déclaré dans `app.json`
- Le `redirectTo` du Magic Link doit pointer vers `keurzen://keurzen/join`
- Les Redirect URLs dans Supabase Dashboard doivent inclure `keurzen://`
- Ne jamais tester les deep links sur simulateur — appareil physique uniquement

---

## Backend rules

- Prefer explicit schemas and migrations
- Never create duplicate weekly stats
- All weekly imbalance logic must be deterministic
- Notifications must avoid duplicates
- Mark overdue tasks safely
- One TLX entry per user per week
- One onboarding display after signup only
- Migrations must be idempotent (`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE`)
- `SECURITY DEFINER` RPCs must have `SET search_path = public`
- Never accept `user_id` as RPC parameter — always use `auth.uid()`
- Always use `service_role` in Edge Functions, never the anon key
- Tokens d'invitation invalidés après usage

---

## Code quality rules

- Strong typing everywhere — no `any` without justification
- Small reusable components
- Clear names aligned with business language
- No magic numbers — use tokens
- Handle loading, empty, and error states on every screen
- Add basic tests for critical logic
- Keep UI consistent with design tokens
- Prefer composition over large files
- Keep screens thin — move business logic to hooks/services
- Centralize constants
- One concern per file when possible

---

## Naming conventions

Business names aligned with product language :
`household` · `member` · `task` · `timeLog` · `tlxEntry` · `weeklyStat` · `alert` · `expense` · `invitation` · `onboarding` · `guidedTour`

Files :
- Écrans : `kebab-case.tsx`
- Composants : `PascalCase.tsx`
- Stores : `camelCaseStore.ts`
- Hooks : `useCamelCase.ts`

---

## UX rules

- Premium "Lavender" UI — soft purples, lavender accents, never hardcode values, always use tokens
- Rounded cards, soft shadows, clear hierarchy
- Mobile-first, touch targets >= 44px
- Always include empty states
- No visually noisy screens
- Preserve calm, premium tone
- Mascot on onboarding and invitation screens

---

## Design system — Palette "Lavender"

### Brand
```
Primary:        #967BB6   ← CTA principale, FAB, liens actifs
PrimaryLight:   #E5DBFF   ← Fonds sélectionnés, pills actives
PrimarySurface: #F3F0FF   ← Fonds inputs, toggles inactifs
```

### Feedback
```
Success: #81C784   ← Validation, succès
Warning: #FFF9C4   ← Warnings, highlights
Error:   #F4C2C2   ← Alertes, erreurs
```

### Texte & Fonds
```
Text:       #5F5475           ← texte principal (violet profond)
Secondary:  rgba(95,84,117,0.8) ← texte secondaire
Muted:      rgba(95,84,117,0.6) ← placeholders
Background: #FFFFFF           ← fond global (blanc)
Card:       #F9F8FD           ← fond cartes
Border:     #DCD7E8           ← bordures (lavande)
```

### Principes
- Flat UI strict — pas de gradients
- Ombres subtiles lavande (jamais #000) — opacity 0.04-0.12
- Typographie Nunito (regular, medium, semibold, bold, extrabold)
- Coins arrondis 12-16px pour cartes et boutons
- Touch targets >= 44px
- Jamais de bleu froid ni de gris pur

All tokens in `apps/mobile/src/constants/tokens.ts` (mobile) and `apps/web/src/app/globals.css` (web CSS variables) — never hardcode values.

---

## Mascot

Soft kawaii house mascot, no arms, no legs, open eyes, calm premium expression.
Component : `apps/mobile/src/components/ui/Mascot.tsx`

---

## Verification loop — obligatoire avant de clore un step

### 1. Self-check
- Relire chaque fichier modifié
- Vérifier qu'aucun fichier hors scope n'a été touché
- Vérifier la logique métier
- Vérifier la cohérence UI avec le design system

### 2. Vérification code
- Lancer `npm run lint`
- Lancer `npm run test` si logique métier touchée
- Indiquer explicitement les résultats
- Si échec : corriger avant de continuer

### 3. Vérification fonctionnelle
- Donner le scénario exact à tester manuellement (mobile ET web)
- Donner le résultat attendu
- Lister les edge cases
- Lister les risques de régression

### 4. Verdict
- Déclarer explicitement : **prêt à tester** ou **pas encore prêt**
- Si bloquant : s'arrêter et indiquer lequel

### Format de sortie obligatoire
- Plan exécuté
- Fichiers modifiés (mobile ET web)
- Commandes lancées + résultats
- Comment tester manuellement
- Risques / points à surveiller
- Verdict
