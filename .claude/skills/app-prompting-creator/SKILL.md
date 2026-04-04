---
name: app-prompting-creator
description: Generate comprehensive, production-ready implementation prompts for complex app features. Use this skill whenever the user asks to "create a prompt for", "generate implementation instructions", "write a spec for", wants to plan a complex feature with multiple screens/services/queries, or says things like "prepare a prompt to build X". Also triggers when the user wants to describe a feature in enough detail that another AI agent (or a future session) could implement it autonomously without follow-up questions.
---

# App Prompting Creator

Generate implementation prompts that are so precise, complete, and well-structured that an AI coding agent can execute them autonomously — producing production-quality code on the first pass with zero follow-up questions.

This skill combines the best prompting techniques from Anthropic, OpenAI, and Google into a battle-tested framework for app feature specification.

## When to use

- User wants to describe a complex feature for implementation
- User wants to create a prompt they'll paste into another session or agent
- User says "prepare the instructions for building X"
- A feature involves 3+ files across multiple layers (types, services, queries, UI)

## How it works

Read `references/mega-prompt-framework.md` for the full framework. Below is the condensed workflow.

### Step 1 — Understand the feature

Before writing anything, investigate:

1. **Read the codebase** — scan existing patterns, tokens, types, services, queries, stores, screens
2. **Ask the user** what the feature does, who uses it, what data it touches
3. **Identify all layers** that need changes: types, database, services, queries, stores, components, screens
4. **Map edge cases** — loading, empty, error, offline, permissions

### Step 2 — Structure the prompt

Use this exact structure (order matters — context at top, instructions at bottom):

```
<role>
[Who the AI agent is — stack expertise, coding style, constraints]
</role>

<context>
[Project info: stack, key paths, existing patterns, design tokens]
[Database schema relevant to this feature]
[Existing code patterns to follow (paste 1-2 examples)]
</context>

<task>
[Clear, single-sentence objective]
</task>

<requirements>
[Business rules as numbered list — exhaustive, no ambiguity]
</requirements>

<implementation_plan>
[Ordered list of files to create/modify, with layer progression:
 types → migrations → services → queries → stores → components → screens]
[For each file: what it does, what it imports, what it exports]
</implementation_plan>

<examples>
[2-3 concrete input/output examples showing exact behavior]
[Include edge cases in examples]
</examples>

<output_format>
[Exact format: full file content, or diffs, or specific sections]
[File naming conventions]
[What NOT to change]
</output_format>

<verification>
[TypeScript: npx tsc --noEmit → 0 errors]
[Build: npx expo export -p web → success]
[Test scenarios with expected results]
[Edge cases checklist]
</verification>

<constraints>
[Absolute rules — what to never do]
[Dependencies — what not to add]
[Scope — what not to touch]
</constraints>
```

### Step 3 — Apply power techniques

For each prompt, apply these techniques based on what makes the feature harder:

**Always apply:**
- **Explicit file ordering** — types first, screens last. Prevents circular dependencies
- **Paste existing patterns** — include 1 real code example from the codebase as a "follow this pattern" reference
- **Edge state mandate** — "Every screen handles: loading, empty, error states"
- **Verification loop** — always end with concrete test scenarios + expected results

**Apply for complex logic:**
- **Chain of thought scaffolding** — break complex algorithms into numbered steps with intermediate values. Example: "TLX score = (mental + physical + temporal + (100-performance) + effort + frustration) / 6. Step 1: invert performance. Step 2: sum all 6 values. Step 3: divide by 6."
- **Decision tables** — for branching logic, use markdown tables: "| Condition | Action | UI |"
- **Threshold definitions** — never say "high/low", always give numbers: "deviation > 20% = watch, > 30% = unbalanced"

**Apply for multi-screen features:**
- **Navigation map** — "Screen A → tap button → Screen B → back → Screen A (state preserved)"
- **Store hydration sequence** — which store gets populated when, by which query
- **Data flow diagram** — "User taps Save → mutation fires → invalidates query X → screen Y re-renders"

**Apply for UI-heavy features:**
- **Token-only styling** — "All colors from C constant. All spacing from Spacing. Never hardcode hex/px values."
- **Component hierarchy** — "Screen → Section → Card → Row → Chip"
- **Touch targets** — "All interactive elements >= 44px"
- **Platform divergence** — "Alert.alert on mobile, window.confirm on web"

**Apply to reduce hallucination:**
- **"Investigate before answering"** — "Read each file before modifying it. Never assume a function exists — grep for it first."
- **Explicit non-goals** — "Do NOT refactor unrelated code. Do NOT add dependencies. Do NOT create .web.tsx files."
- **Grounding quotes** — paste the exact function signatures, type definitions, or store shapes the agent must use

### Step 4 — Self-review before delivering

Before presenting the prompt to the user, verify:

- [ ] Every file mentioned exists (or is explicitly marked as "create new")
- [ ] Every import path is valid relative to the project structure
- [ ] Every type referenced is defined or included in the prompt
- [ ] Business rules are exhaustive — no "use your judgment" escape hatches
- [ ] Edge cases are listed, not implied
- [ ] Output format is unambiguous — the agent knows exactly what to produce
- [ ] Verification steps are concrete and automatable

### Step 5 — Present to user

Show the prompt with a summary:
- Feature name
- Files affected (count)
- Estimated complexity (layers touched)
- Key risks or decisions that need user input

Wait for user validation before finalizing. Offer to adjust scope, add/remove requirements, or split into phases.

## Quality signals

A great implementation prompt:
- Can be copy-pasted into a fresh Claude session and executed without ANY follow-up questions
- Produces code that passes `npx tsc --noEmit` on first try
- Handles every edge case the user would encounter in testing
- Follows existing codebase patterns exactly (not inventing new patterns)
- Results in code that a senior developer would approve in PR review

A bad implementation prompt:
- Uses vague language ("handle errors appropriately", "style it nicely")
- References files or functions without pasting their signatures
- Leaves business rules ambiguous ("sort by relevance")
- Doesn't specify what NOT to do (scope creep)
- Omits verification steps

## Adapting to the project

Before generating any prompt, always:
1. Read `CLAUDE.md` for project rules and conventions
2. Scan the file structure to understand existing patterns
3. Read 1-2 existing files in the same layer as the feature (e.g., an existing query hook if writing a new one)
4. Check the design tokens / constants file for available values
5. Check the types file for existing type definitions

This grounding step is what separates a generic prompt from a prompt that produces code matching the codebase perfectly.
