# Keurzen — Conventions & verification

**Load this when**: starting a new feature · writing components · closing a step · doing a QA pass.

---

## Naming

### Business names (aligned with product language)
`household` · `member` · `task` · `timeLog` · `tlxEntry` · `weeklyStat` · `alert` · `expense` · `invitation` · `onboarding` · `guidedTour`

### Files
- Screens: `kebab-case.tsx`
- Components: `PascalCase.tsx`
- Stores: `camelCaseStore.ts`
- Hooks: `useCamelCase.ts`
- Types: singular, `PascalCase`

---

## Code quality

- **Strong typing everywhere** — no `any` without a one-line inline justification comment.
- **Small, reusable components.** Composition over large files.
- **Thin screens** — move business logic to hooks/services.
- **No magic numbers** — use tokens or named constants.
- **Handle loading, empty, error states** on every screen.
- **Tests for critical logic** (weekly stats, TLX, notifications dedup, invitation flow).
- **Centralize constants** in `packages/shared`.
- **One concern per file** when possible.

---

## UX rules

- Premium, calm tone. Never visually noisy.
- Rounded cards, soft shadows, clear hierarchy.
- Mobile-first. Touch targets ≥ 44×44 pt.
- Always include empty states with a positive next-step CTA.
- Mascot present on onboarding and invitation screens only.
- All colors, spacing, radii come from design tokens. **Never hardcode.**
- Full design system details: see `DESIGN_SYSTEM.skill.md`.

---

## Verification loop — mandatory before closing a step

### 1. Self-check
- Reread every modified file.
- Confirm nothing out-of-scope was touched.
- Verify business logic matches the spec.
- Verify UI consistency with the design system.

### 2. Code verification
- Run `npm run lint`.
- Run `npm run test` if business logic was touched.
- Report results explicitly.
- If any failure: fix before continuing.

### 3. Functional verification
- Give the exact manual test scenario (mobile AND web).
- Give expected result.
- List edge cases covered.
- List regression risks.

### 4. Verdict
Declare explicitly: **ready to test** or **not ready** (with blocker).

### Mandatory output format
- Plan executed
- Files modified (mobile AND web)
- Commands run + results
- How to test manually
- Risks / points to watch
- Verdict

---

## Product priorities (in order)
1. Clarity
2. Stability
3. Premium UX
4. Maintainability
5. Shipping in small validated steps
