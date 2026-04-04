---
name: apex
description: Systematic feature implementation using APEX methodology (Analyze-Plan-Execute-eXamine). Use this skill whenever the user invokes /apex, says "implement feature X end-to-end", "build X from analysis to PR", wants a structured multi-step implementation workflow, or needs a full feature pipeline with optional review, testing, and PR creation. Also triggers for "apex mode", "full pipeline", or any request combining analysis + planning + implementation + validation in one workflow.
---

# /apex — APEX Implementation Workflow

Systematic feature implementation: **A**nalyze → **P**lan → **E**xecute → e**X**amine.

Each step builds on the previous one. The workflow ensures thorough context gathering before code, clear plans before implementation, and self-validation before merge.

## Usage

```
/apex [-a] [-x] [-s] [-t] [-b] [-pr] [-i] [-e] [-r <task-id>] <task description>
```

## Flag Parsing

Parse flags from `$ARGUMENTS` before anything else. Extract all flags, then treat the remaining text as the task description.

### Enable flags

| Short | Long | Description | Default |
|-------|------|-------------|---------|
| `-a` | `--auto` | Autonomous mode: skip confirmations, auto-approve plans | OFF |
| `-x` | `--examine` | Adversarial review after validation | OFF |
| `-s` | `--save` | Save each step output to `.claude/output/apex/{task-id}/` | OFF |
| `-t` | `--test` | Include test creation and test runner steps | OFF |
| `-e` | `--economy` | No subagents, inline everything to save tokens | OFF |
| `-b` | `--branch` | Verify not on main, create feature branch if needed | OFF |
| `-pr` | `--pull-request` | Create PR at end (implies `-b`) | OFF |
| `-i` | `--interactive` | Ask user to configure flags via menu before starting | OFF |
| `-r` | `--resume` | Resume a previous task by ID or partial match | OFF |

### Disable flags (uppercase or `--no-*`)

`-A` `--no-auto` · `-X` `--no-examine` · `-S` `--no-save` · `-T` `--no-test` · `-E` `--no-economy` · `-B` `--no-branch` · `-PR` `--no-pull-request`

## Interactive Mode (`-i`)

When `-i` is present, before starting the workflow, present a flag configuration menu using AskUserQuestion. Show each flag with its current state and let the user toggle. Then proceed with the configured flags.

## Resume Mode (`-r`)

When `-r <id>` is present:
1. Look in `.claude/output/apex/` for a folder matching `<id>` (partial match OK)
2. Read `00-context.md` to restore the original task, flags, and acceptance criteria
3. Scan step files (`01-analyze.md`, `02-plan.md`, etc.) to find the highest completed step
4. Continue from the next incomplete step
5. If multiple matches, ask the user to specify

## Workflow Steps

The workflow has 10 steps. Steps 05-06 require `-x`, steps 07-08 require `-t`, step 09 requires `-pr`. Read the detailed instructions for each step from `references/steps.md` as you reach it.

| Step | Name | When | Purpose |
|------|------|------|---------|
| 00 | **Init** | Always | Parse flags, generate task ID, create output folder if `-s` |
| 01 | **Analyze** | Always | Pure context gathering — explore codebase, understand what exists |
| 02 | **Plan** | Always | File-by-file implementation strategy with acceptance criteria |
| 03 | **Execute** | Always | Todo-driven implementation with progress tracking |
| 04 | **Validate** | Always | Self-check: lint, type-check, manual review of changes |
| 05 | **Examine** | `-x` | Adversarial code review (security, logic, performance) |
| 06 | **Resolve** | `-x` + issues | Fix issues found during examination |
| 07 | **Tests** | `-t` | Analyze what to test, create test files |
| 08 | **Run Tests** | `-t` | Run tests in loop until all pass |
| 09 | **Finish** | `-pr` | Create pull request with summary |

### Confirmation gates (when `-a` is OFF)

- After step 01 (Analyze): "Here's what I found. Ready to plan?"
- After step 02 (Plan): "Here's the implementation plan. Approve to proceed?"
- After step 04 (Validate): "Validation complete. Continue to [examine/tests/finish]?"

When `-a` is ON, skip all confirmations and proceed automatically.

### Save mode (`-s`)

When `-s` is ON, save each step's output to `.claude/output/apex/{task-id}/`:

```
.claude/output/apex/
  01-add-auth-middleware/
    00-context.md      # Flags, task, timestamp, acceptance criteria
    01-analyze.md      # Analysis findings
    02-plan.md         # Implementation plan
    03-execute.md      # Execution log with diffs
    04-validate.md     # Validation results
    05-examine.md      # Review findings (if -x)
    06-resolve.md      # Resolution log (if -x)
    07-tests.md        # Test analysis (if -t)
    08-run-tests.md    # Test runner log (if -t)
    09-finish.md       # PR link and summary (if -pr)
```

Task ID format: `{NN}-{kebab-case-task}` where NN is auto-incremented.

## Step Details

Read `references/steps.md` for the detailed instructions of each step. Below is the condensed version.

### 00 — Init

1. Parse all flags from arguments
2. Extract task description (everything after flags)
3. If `-pr`, also enable `-b`
4. If `-b`, check current branch — if on main, create and checkout feature branch
5. If `-s`, create output directory and write `00-context.md` with: flags, task description, timestamp, and acceptance criteria (derive from task if not explicit)
6. If `-i`, show flag menu first

### 01 — Analyze

Context gathering ONLY — no opinions, no plans yet. The goal is to understand the codebase as it is right now.

1. Read `CLAUDE.md` for project rules
2. Identify all files related to the task (Glob + Grep)
3. Read each relevant file
4. Map: existing types, queries, stores, components, routes, migrations
5. Note patterns, conventions, and potential conflicts
6. Output: structured analysis with file inventory

### 02 — Plan

Create a concrete file-by-file implementation strategy based on the analysis.

1. List every file to create or modify, in order
2. For each file: what changes, what it imports, what it exports
3. Order: types → migrations → queries → stores → components → screens
4. Define acceptance criteria (concrete, testable)
5. Flag risks: auth, schema, navigation, design system
6. If not `-a`: present plan and wait for approval

### 03 — Execute

Implement the plan using task tracking for progress visibility.

1. Create a task for each file change from the plan
2. For each task: read the file first, implement the change, mark complete
3. Follow the exact order from the plan
4. If a change requires adjusting the plan, note it but keep going
5. Don't refactor unrelated code

### 04 — Validate

Self-check all changes.

1. Run `npm run lint` (if available)
2. Run `npx tsc --noEmit` for type checking (if TypeScript)
3. Re-read each modified file and verify correctness
4. Check: no hardcoded values, loading/empty/error states, token usage
5. List any issues found
6. If issues: fix them before proceeding

### 05 — Examine (requires `-x`)

Adversarial code review — pretend you're a critical reviewer trying to find problems.

1. Run `git diff` to see all changes
2. Review for: security issues, logic errors, edge cases, performance
3. Check: SQL injection, XSS, auth bypass, race conditions
4. Check: missing error handling, uncovered edge cases
5. Output: findings table with severity (BLOCKING / CRITICAL / SUGGESTION)

### 06 — Resolve (requires `-x` + issues found)

Fix all BLOCKING and CRITICAL issues from the examination.

### 07 — Tests (requires `-t`)

1. Analyze which parts of the implementation need tests
2. Identify test file locations following project conventions
3. Create test files with comprehensive coverage
4. Focus on: business logic, edge cases, error paths

### 08 — Run Tests (requires `-t`)

1. Run `npm run test` (or project-specific test command)
2. If failures: read error, fix, re-run
3. Loop until all tests pass (max 3 attempts)

### 09 — Finish (requires `-pr`)

1. Stage all changes
2. Create commit with descriptive message
3. Push branch
4. Create PR using `gh pr create` with summary from all steps

## Economy Mode (`-e`)

When economy mode is ON:
- No subagents — do everything inline
- Skip adversarial review even if `-x` was set
- Shorter analysis (focus on directly relevant files only)
- Shorter plan (skip risk analysis)
- Still validate

## Keurzen-Specific Context

This skill operates within the Keurzen project. Key conventions:

- **Stack**: Expo SDK 55, React Native, TypeScript strict, Supabase, TanStack Query v5, Zustand
- **File order**: types → migrations → queries → stores → components → screens
- **Design system**: Always use tokens from `src/constants/tokens.ts`
- **Dual platform**: Changes must work on both mobile and web
- **Verification**: Always run the verification loop from CLAUDE.md before declaring a step complete

Read `CLAUDE.md` at the start of every /apex run for the full ruleset.
