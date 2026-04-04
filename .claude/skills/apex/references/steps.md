# APEX Step Reference

Detailed instructions for each step of the APEX workflow. The main SKILL.md has the condensed version — this file contains the full guidance for when you're executing each step.

## Table of Contents

1. [Step 00 — Init](#step-00--init)
2. [Step 01 — Analyze](#step-01--analyze)
3. [Step 02 — Plan](#step-02--plan)
4. [Step 03 — Execute](#step-03--execute)
5. [Step 04 — Validate](#step-04--validate)
6. [Step 05 — Examine](#step-05--examine)
7. [Step 06 — Resolve](#step-06--resolve)
8. [Step 07 — Tests](#step-07--tests)
9. [Step 08 — Run Tests](#step-08--run-tests)
10. [Step 09 — Finish](#step-09--finish)

---

## Step 00 — Init

**Purpose**: Set up the workspace and parse configuration.

### Procedure

1. **Parse flags** from the arguments string:
   - Split arguments into tokens
   - Match each token against the flag table
   - Everything that isn't a flag = task description
   - If `-pr` is present, also enable `-b`

2. **Interactive mode** (`-i`):
   - Present all flags with current state using AskUserQuestion
   - Let user toggle each one
   - Confirm before proceeding

3. **Branch mode** (`-b`):
   - Run `git branch --show-current`
   - If on `main` or `master`: create feature branch
   - Branch name: `feat/{kebab-case-task-summary}`
   - `git checkout -b feat/{name}`

4. **Generate task ID**:
   - List existing folders in `.claude/output/apex/` (if any)
   - Find highest number prefix, increment by 1
   - Format: `{NN}-{kebab-case-task}` (e.g., `03-add-invite-flow`)

5. **Save mode** (`-s`):
   - Create `.claude/output/apex/{task-id}/`
   - Write `00-context.md`:

```markdown
# APEX Context

- **Task**: {task description}
- **Task ID**: {task-id}
- **Timestamp**: {ISO datetime}
- **Flags**: {list of active flags}

## Acceptance Criteria

{Derived from task description — concrete, testable conditions}
```

6. **Resume mode** (`-r`):
   - Search `.claude/output/apex/` for folder matching the provided ID
   - Partial match: `01` matches `01-add-auth-middleware`
   - If multiple matches: list them and ask user to pick
   - Read `00-context.md` to restore task + flags
   - Scan for existing step files (01-analyze.md, 02-plan.md, etc.)
   - Identify highest completed step
   - Resume from next step

### Output

Announce: "APEX initialized. Task: {description}. Flags: {flags}. Starting analysis..."

---

## Step 01 — Analyze

**Purpose**: Pure context gathering. Understand the codebase as it is — no opinions, no plans.

The temptation is to start planning while analyzing. Resist it. This step is about building a complete mental model of the relevant code before making any decisions.

### Procedure

1. **Read project rules**: Read `CLAUDE.md` in full
2. **Keyword search**: Grep for terms related to the task (feature name, related concepts)
3. **File discovery**: Glob for potentially relevant files across all layers:
   - `src/types/` — existing type definitions
   - `src/lib/queries/` — existing query hooks
   - `src/stores/` — existing stores
   - `src/components/` — existing components
   - `app/` — existing routes/screens
   - `supabase/migrations/` — existing schema
   - `supabase/functions/` — existing edge functions
4. **Deep read**: Read each relevant file (not just the first 20 lines — the whole thing)
5. **Map connections**: Note which files import what, which stores feed which screens
6. **Pattern recognition**: How does the existing code handle similar features?
7. **Gap analysis**: What exists vs what the task needs

### Output format

```markdown
## Analysis — {task}

### Relevant Files
| File | Role | Key Exports |
|------|------|-------------|
| `path/file.ts` | {what it does} | {exports used} |

### Existing Patterns
- {Pattern 1}: {how the codebase handles X}
- {Pattern 2}: {convention used for Y}

### Dependencies & Connections
- {File A} imports from {File B}
- {Store X} feeds {Screen Y} via {Query Z}

### Gap Analysis
- Exists: {what's already there}
- Missing: {what needs to be created/changed}
- Conflicts: {potential issues to watch for}
```

If `-s`: save to `01-analyze.md`

If not `-a`: present findings and ask "Ready to plan?"

---

## Step 02 — Plan

**Purpose**: Create a concrete, file-by-file implementation strategy.

The plan is a contract — once approved, execution follows it exactly. Make it specific enough that someone could implement it without asking questions.

### Procedure

1. **List every file** to create or modify
2. **Order by layer**: types → migrations → edge functions → queries → stores → components → screens
3. **For each file**, specify:
   - Action: CREATE / MODIFY
   - What changes (specific functions, types, fields — not vague)
   - New imports needed
   - New exports
   - Estimated complexity (S/M/L)
4. **Define acceptance criteria**: 3-5 concrete, testable conditions
5. **Risk assessment**:
   - Does this touch auth? → flag it
   - Does this change DB schema? → migration needed
   - Does this affect navigation? → flag it
   - Does this change the design system? → flag it
6. **Dual platform check**: List any web-specific considerations

### Output format

```markdown
## Implementation Plan — {task}

### Acceptance Criteria
1. {Concrete testable condition}
2. {Concrete testable condition}
3. {Concrete testable condition}

### File Changes (in order)

#### 1. `src/types/index.ts` — MODIFY
- Add: `interface TaskFilter { ... }`
- Complexity: S

#### 2. `src/lib/queries/tasks.ts` — MODIFY
- Add: `useFilteredTasks(filter: TaskFilter)` hook
- Imports: `TaskFilter` from types
- Complexity: M

#### 3. `app/(app)/tasks/index.tsx` — MODIFY
- Add filter UI using new `useFilteredTasks` hook
- Add empty state for no results
- Complexity: L

### Risks
- {Risk 1}: {mitigation}

### Not In Scope
- {Explicitly excluded items}
```

If `-s`: save to `02-plan.md`

If not `-a`: present plan and wait for explicit approval. Do not proceed without it.

---

## Step 03 — Execute

**Purpose**: Implement the plan systematically with progress tracking.

### Procedure

1. **Create tasks** — one task per file change from the plan (use TaskCreate)
2. **For each task**, in order:
   a. Mark task as in_progress
   b. Read the target file (if MODIFY) — never modify without reading first
   c. Implement the change as specified in the plan
   d. If something in the plan doesn't work as expected, note the deviation but keep going
   e. Mark task as completed
3. **Progress updates** — after every 2-3 files, give a brief status
4. **Stay in scope** — implement exactly what the plan says, nothing more

### Key rules during execution

- Read before write. Every time.
- Use design tokens, never hardcode values
- Handle loading, empty, and error states on every screen
- Keep screens thin — business logic in hooks/queries
- No `any` without justification
- Follow existing patterns found in Step 01

### Output format

Brief per-file summary as you go:

```
[1/5] src/types/index.ts — Added TaskFilter interface
[2/5] src/lib/queries/tasks.ts — Added useFilteredTasks hook
...
```

If `-s`: save execution log to `03-execute.md`

---

## Step 04 — Validate

**Purpose**: Self-check before anyone else sees the code.

### Procedure

1. **Lint**: Run `npm run lint` (if available and configured)
2. **Type check**: Run `npx tsc --noEmit` (if TypeScript project)
3. **Manual review**: Re-read every modified file from top to bottom
4. **Checklist**:
   - [ ] All acceptance criteria from the plan are met
   - [ ] No hardcoded colors, spacing, or magic numbers
   - [ ] Loading, empty, and error states present on every new screen
   - [ ] Touch targets >= 44px
   - [ ] No `console.log` left behind (except Edge Functions)
   - [ ] No `any` TypeScript without justification
   - [ ] Imports are clean (no unused)
   - [ ] Design tokens used throughout
5. **Fix issues** found during validation — don't just list them

### Output format

```markdown
## Validation Results

### Commands
- `npm run lint`: {result}
- `npx tsc --noEmit`: {result}

### Checklist
- [x] Acceptance criteria met
- [x] Design tokens used
- [ ] Missing empty state on FilterScreen → FIXED

### Issues Found & Fixed
1. {Issue}: {fix applied}

### Status: PASS / FAIL
```

If `-s`: save to `04-validate.md`

If not `-a` and more steps remain: ask to continue.

---

## Step 05 — Examine (requires `-x`)

**Purpose**: Adversarial code review. Be the tough reviewer trying to find real problems.

This step exists because self-validation (Step 04) has a bias — you wrote the code, so you're inclined to think it's fine. The examine step forces a critical perspective.

### Procedure

1. Run `git diff` to see all changes in one view
2. **Security review**:
   - Hardcoded credentials or secrets?
   - SQL injection (concatenated queries)?
   - XSS (unescaped user input in render)?
   - Auth bypass (`auth.uid()` missing, RLS gaps)?
   - CORS issues in Edge Functions?
3. **Logic review**:
   - Edge cases not handled (null, empty, boundary)?
   - Race conditions (stale closures, double-submit)?
   - Error handling missing or errors swallowed?
   - Mutation without cache invalidation?
4. **Performance review**:
   - N+1 queries?
   - Missing `useMemo`/`useCallback` where expensive?
   - Large re-renders from poor state structure?
5. **Clean code review**:
   - Functions doing too many things?
   - Nesting > 3 levels?
   - Duplication that should be extracted?

### Output format

```markdown
## Examination — Adversarial Review

| Severity | Issue | Location | Impact | Fix |
|----------|-------|----------|--------|-----|
| BLOCKING | {desc} | `file:line` | {why it matters} | {specific fix} |
| CRITICAL | {desc} | `file:line` | {why it matters} | {specific fix} |
| SUGGESTION | {desc} | `file:line` | {why it matters} | {specific fix} |

### Summary
- BLOCKING: {N}
- CRITICAL: {N}
- SUGGESTION: {N}
- Verdict: {PROCEED / RESOLVE FIRST}
```

If `-s`: save to `05-examine.md`

If BLOCKING or CRITICAL issues found: proceed to Step 06 (Resolve).

---

## Step 06 — Resolve (requires `-x` + issues found)

**Purpose**: Fix all BLOCKING and CRITICAL issues from the examination.

### Procedure

1. Fix each BLOCKING issue first, then CRITICAL
2. For each fix: read the file, apply the fix, verify it resolves the issue
3. SUGGESTION items are optional — fix only if trivial
4. After all fixes: re-run validation (Step 04 checklist, abbreviated)

### Output format

```markdown
## Resolution Log

| Issue | Fix Applied | Verified |
|-------|-------------|----------|
| {from examine} | {what was changed} | YES/NO |
```

If `-s`: save to `06-resolve.md`

---

## Step 07 — Tests (requires `-t`)

**Purpose**: Create appropriate tests for the implementation.

### Procedure

1. **Analyze testability**: What parts of the implementation have testable logic?
   - Query hooks with business logic
   - Utility functions
   - Store actions
   - Edge Functions
2. **Skip**: Don't test pure UI rendering or trivial passthrough
3. **Create test files** following project conventions:
   - Co-locate with source: `__tests__/` or `.test.ts` suffix
   - Use project's test framework (Jest for Keurzen)
4. **Coverage focus**:
   - Happy path
   - Edge cases (empty, null, boundary values)
   - Error paths
   - Concurrent scenarios (if relevant)

### Output format

```markdown
## Test Analysis

### What to test
| Module | Why | Priority |
|--------|-----|----------|
| {module} | {business logic present} | HIGH |

### Test files created
- `src/lib/queries/__tests__/tasks.test.ts` — 5 tests
- ...
```

If `-s`: save to `07-tests.md`

---

## Step 08 — Run Tests (requires `-t`)

**Purpose**: Run tests until they all pass.

### Procedure

1. Run `npm run test` (or relevant test command)
2. If failures:
   - Read error output
   - Identify root cause
   - Fix the test or the code (prefer fixing the code if the test is correct)
   - Re-run
3. Max 3 fix-and-retry loops. If still failing after 3: report the failures and stop.

### Output format

```markdown
## Test Runner

### Run 1
- Command: `npm run test`
- Result: 3 passed, 1 failed
- Failure: {test name} — {error}
- Fix: {what was changed}

### Run 2
- Result: 4 passed, 0 failed
- Status: ALL GREEN
```

If `-s`: save to `08-run-tests.md`

---

## Step 09 — Finish (requires `-pr`)

**Purpose**: Create a pull request with a comprehensive summary.

### Procedure

1. **Stage changes**: `git add` relevant files (not `.env` or secrets)
2. **Commit**: Create descriptive commit message summarizing all changes
3. **Push**: `git push -u origin {branch-name}`
4. **Create PR** using `gh pr create`:

```bash
gh pr create --title "{short title}" --body "$(cat <<'EOF'
## Summary
{1-3 bullet points from the plan's acceptance criteria}

## Changes
{File list with brief description of each change}

## APEX Workflow
- Analyze: {key findings}
- Plan: {N files, acceptance criteria}
- Execute: {all tasks completed}
- Validate: {lint + type check results}
{- Examine: {N issues found, all resolved} (if -x)}
{- Tests: {N tests, all passing} (if -t)}

## How to Test
{Step-by-step manual test scenario}

## Risks
{From the plan's risk assessment}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Output format

```markdown
## Finish

- Branch: `feat/{name}`
- PR: {URL}
- Status: Ready for review
```

If `-s`: save to `09-finish.md`
