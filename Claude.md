# Keurzen

Premium household management app & coach — fairness, time visibility, mental load reduction.
Core modules: auth · onboarding · household · tasks · calendar · time tracking · TLX · dashboard · weekly stats · alerts · budget · notifications · settings.

## Stack
- **Mobile**: Expo SDK 55, React Native 0.83, Expo Router 4, TypeScript strict
- **Web**: Next.js + Tailwind (separate app, same monorepo)
- **State**: Zustand · TanStack Query v5 · react-hook-form + zod · victory-native
- **Backend**: Supabase (Auth OTP, Postgres + RLS, Edge Functions)

## Monorepo layout
```
apps/mobile/     → Expo app (app/ = Expo Router screens)
apps/web/        → Next.js app (src/app/(app)/ = pages)
packages/shared  → types, constants, utilities
packages/queries → TanStack Query hooks
packages/stores  → Zustand stores
apps/mobile/supabase/ → migrations & Edge Functions
```
Design tokens: `apps/mobile/src/constants/tokens.ts` · `apps/web/src/app/globals.css`.

## Commands
```bash
npm run dev | lint | test | format | build   # monorepo (turbo)
cd apps/mobile && npx expo start --tunnel
cd apps/web && npm run dev
npx supabase db push
npx supabase functions deploy <name>
```

## Non-negotiable rules
- **Dual-platform**: every feature ships on mobile AND web simultaneously. Shared logic → `packages/`.
- **Never modify an existing migration** — create a new one instead.
- **Never write to `.env*`, `secrets/`**. Never hardcode keys or tokens.
- **Never use `any`** without an inline justification comment.
- **Always handle loading, empty, error states** on every screen.
- **Design tokens only** — never hardcode colors, spacing, or radii.
- **Business naming**: `household`, `member`, `task`, `timeLog`, `tlxEntry`, `weeklyStat`, `alert`, `expense`, `invitation`.

## Working style
For every request:
1. Explain understanding → 2. Propose plan → 3. List files to modify (mobile AND web) → 4. Implement requested scope only → 5. Summarize changes → 6. Give test scenarios.

Scope discipline: break broad requests into phases · one main module per pass · no unrelated refactor · no architecture change without rationale · no file deletion without reason · never invent behavior if specs exist in `/docs` or `/specs`.

## Workflow preferences
- **Plan mode** (Shift+Tab×2) for any change touching >2 files.
- **`/model opusplan`** for complex features (Opus plans, Sonnet executes).
- Small commits, clear messages, commit often.
- Visual HTML preview before implementation when UI-heavy.

## Cockpit
- **Agents**: `product-architect` · `expo-mobile-builder` · `supabase-backend` · `design-system-guardian` · `qa-regression` · `release-manager` · `code-reviewer` · `codebase-explorer` · `docs-researcher` · `web-searcher`
- **Slash commands**: `/phase-plan` `/build-feature` `/fix-bug` `/db-change-safe` `/ui-premium-pass` `/qa-pass` `/ship-release` `/verify` `/qa-check` `/new-feature` `/mobile-design-premium`
- **Session prompts**: `prompts/claude/`
- **Roadmap**: see `ROADMAP.md` (current milestone + exit conditions).

## Domain-specific guidance (lazy-loaded — read only when relevant)
- **Auth / invitation / signup / deep-link work** → read @docs/claude/AUTH.md
- **Supabase / migrations / RLS / Edge Functions** → read @apps/mobile/supabase/CLAUDE.md
- **UI / styling / design system / mascot** → read @DESIGN_SYSTEM.skill.md
- **Naming · code quality · UX details · verification loop** → read @docs/claude/CONVENTIONS.md
- **Phase planning** → read @POWER_STACK_WORKFLOW.md
- **Marketing site** → separate repo, read @marketing-site/CLAUDE.md there
