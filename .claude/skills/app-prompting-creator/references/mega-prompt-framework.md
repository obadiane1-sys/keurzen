# Mega-Prompt Framework — Reference

This document contains the full techniques catalog used by the app-prompting-creator skill.
Read specific sections as needed — don't load everything into context at once.

## Table of Contents

1. [Prompt Structure Template](#1-prompt-structure-template)
2. [Anthropic Techniques](#2-anthropic-techniques)
3. [OpenAI Techniques](#3-openai-techniques)
4. [Google Techniques](#4-google-techniques)
5. [Anti-Hallucination Patterns](#5-anti-hallucination-patterns)
6. [Complex Feature Patterns](#6-complex-feature-patterns)
7. [Example: TLX Analysis Feature](#7-example-tlx-analysis-feature)

---

## 1. Prompt Structure Template

The optimal prompt follows this information hierarchy (proven across all 3 providers):

```
1. ROLE      — who the agent is, what expertise it has
2. CONTEXT   — project state, existing code, schemas, tokens
3. TASK      — single clear objective
4. RULES     — business logic, constraints, thresholds
5. PLAN      — ordered file list with layer progression
6. EXAMPLES  — 2-3 concrete input→output pairs
7. FORMAT    — exact output structure
8. VERIFY    — test scenarios, acceptance criteria
9. DON'T     — explicit non-goals and forbidden actions
```

Why this order:
- Anthropic: "Put longform data at the TOP, queries at the end — improves response quality by 30%"
- OpenAI: "GPT-4.1 prioritizes instructions closer to the prompt's end"
- Google: "Context first, then task instructions, constraints last"

The combination: context/data at top grounds the agent, instructions at bottom get highest priority.

---

## 2. Anthropic Techniques

### XML Tags for Structure
Claude responds best to XML-delimited sections. Use consistent tag names:

```xml
<context>project info here</context>
<task>what to build</task>
<requirements>
  <rule id="1">Business rule</rule>
  <rule id="2">Another rule</rule>
</requirements>
<examples>
  <example>
    <input>User does X</input>
    <output>System does Y</output>
  </example>
</examples>
```

### Adaptive Thinking
For complex logic, guide reasoning depth:
- "Think step by step about the data flow before writing code"
- "Before implementing, verify your approach handles: [edge cases]"
- Avoid prescriptive step-by-step plans — give goals and constraints, let Claude choose the path

### Explain the Why
Instead of: "ALWAYS use service layer"
Write: "Route all Supabase calls through src/services/ because direct database access in components creates coupling that makes testing and refactoring impossible"

### Multishot Examples
3-5 examples dramatically improve consistency. Structure as:
```
Example 1 — Normal case:
Input: [concrete input]
Output: [exact expected output]

Example 2 — Edge case:
Input: [boundary condition]
Output: [how to handle it]
```

---

## 3. OpenAI Techniques

### Three Agentic Reminders (20% performance boost)
Always include in prompts for autonomous execution:
1. **Persistence**: "Keep going until the feature is completely implemented. Don't stop after one file."
2. **Tool usage**: "Read files before modifying them. Never guess — verify."
3. **Planning**: "Before writing code, outline which files need changes and in what order."

### Metaprompting
After drafting a prompt, ask: "What phrases could make this prompt more consistent? What edge cases am I missing?"

### Delimiter Best Practices
- Markdown headers for hierarchy
- XML tags for data sections
- Backticks for code
- AVOID JSON for large document sets (poor LLM performance)

---

## 4. Google Techniques

### Two-Step Verification
For features with complex business logic:
1. First ask the agent to VERIFY its understanding: "Before implementing, list all business rules you'll follow and all edge cases you'll handle"
2. Then implement

### Grounding Reality
"Treat the provided context as the absolute source of truth. If a function signature isn't shown, don't assume it exists — search for it."

### Breaking Down Complexity
- One concern per prompt section
- Chain sequentially: types → services → queries → UI
- Aggregate: if same pattern repeats 3+ times, define it once and reference

---

## 5. Anti-Hallucination Patterns

### ICE Method (Instructions, Constraints, Escalation)
```
INSTRUCTIONS: Implement the TLX form with 6 sliders (0-100)
CONSTRAINTS: Use only existing UI components from src/components/ui/
ESCALATION: If a component doesn't exist, create it in src/components/ui/ following the existing pattern — never inline styles in screens
```

### Investigate Before Answering
```
<investigate_before_answering>
Never assume a file, function, or type exists. Before using:
- A type: grep for its definition in src/types/
- A function: grep for its export in src/lib/ or src/services/
- A component: check it exists in src/components/
- A store: verify its shape in src/stores/
If it doesn't exist, create it following existing patterns.
</investigate_before_answering>
```

### Explicit Non-Goals
Always include what NOT to do:
```
<do_not>
- Do not modify files outside the listed scope
- Do not add npm dependencies
- Do not refactor existing code that works
- Do not create .web.tsx platform-specific files
- Do not hardcode colors — use design tokens
- Do not add comments to code you didn't write
</do_not>
```

### Grounding with Code Snippets
Paste exact signatures the agent must use:
```
// EXISTING — use this exact function signature:
export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<{ error: string | null }>

// EXISTING — store shape to hydrate:
interface HouseholdState {
  currentHousehold: Household | null;
  members: HouseholdMember[];
  setHousehold: (h: Household | null) => void;
  setMembers: (m: HouseholdMember[]) => void;
}
```

---

## 6. Complex Feature Patterns

### Multi-Screen Navigation
```
Navigation map:
  Dashboard → tap "TLX" card → TLX Form (modal)
  TLX Form → submit → Dashboard (toast "TLX enregistré")
  TLX Form → tap ← → Dashboard (no save, no toast)
  Dashboard → tap "Voir l'historique" → TLX History (push)
  TLX History → tap week → TLX Detail (push)
  TLX Detail → back → TLX History
```

### State Hydration Sequence
```
Login → useAuthInit() sets session/user/profile
     → useMyHousehold() fetches household + members → hydrates householdStore
     → Dashboard renders with store data
     → useTasks() fetches tasks → renders task list
     → useCurrentTlx() fetches this week's TLX → renders TLX card
```

### Decision Tables for Business Logic
```
| Members | Tasks this week | Time logged | Alert level   | Action              |
|---------|----------------|-------------|---------------|---------------------|
| 2       | < 4 each       | < 30min     | none          | No alert            |
| 2       | A:8, B:2       | -           | watch (60/40) | Yellow indicator    |
| 2       | A:12, B:1      | -           | unbalanced    | Red alert + message |
| 3+      | deviation >30% | -           | unbalanced    | Red alert + message |
```

### Formula Documentation
Never say "calculate the score". Always:
```
TLX Score formula:
  raw = mental_demand + physical_demand + temporal_demand
        + (100 - performance) + effort + frustration
  score = raw / 6

  Note: performance is INVERTED (100 - value) because higher
  performance = lower load, unlike the other 5 dimensions.

  Result: 0-100 where 0 = no load, 100 = maximum load
```

---

## 7. Example: TLX Analysis Feature

Below is a complete example prompt generated by this skill for the NASA-TLX mental load analysis feature in Keurzen.

```
<role>
You are a senior TypeScript/React Native developer working on Keurzen,
a household management app (Expo SDK 55, Expo Router 4, Zustand, TanStack Query, Supabase).
You write concise, type-safe code using StyleSheet.create() with design tokens.
</role>

<context>
Stack: Expo SDK 55 / React Native 0.83 / TypeScript strict
Styling: StyleSheet.create() with tokens from src/constants/tokens.ts
State: Zustand stores in src/stores/
Data: TanStack Query hooks in src/lib/queries/
Backend: Supabase (Auth, Postgres, RLS, Edge Functions)

Existing TLX table schema:
  tlx_entries(id, user_id, household_id, week_start,
              mental_demand, physical_demand, temporal_demand,
              performance, effort, frustration, score,
              created_at)

Design tokens available:
  Colors.mint (#88D4A9), Colors.coral (#FFA69E), Colors.lavender (#BCA7FF)
  Colors.navy (#212E44), Colors.background (#F7F9FC)
  Spacing: xs(4), sm(8), md(12), base(16), lg(20), xl(24)

Existing patterns to follow:
  - Query hook: see src/lib/queries/tasks.ts for pattern
  - Screen: see app/(app)/budget/create.tsx for form pattern
  - Store: see src/stores/household.store.ts for shape
</context>

<task>
Implement the complete NASA-TLX mental load assessment:
a weekly questionnaire (6 sliders 0-100), score computation,
history visualization, and delta tracking on the dashboard.
</task>

<requirements>
1. One TLX entry per user per household per ISO week (Monday-based)
2. Score = (mental + physical + temporal + (100-performance) + effort + frustration) / 6
3. Upsert: submitting again in the same week overwrites the previous entry
4. Dashboard card shows: current week score + delta vs previous week
5. Delta display: ↑ (higher load = coral), ↓ (lower load = mint), = (no change)
6. History screen: last 12 weeks as a list with score + colored indicator
7. Score color: 0-33 = mint (light), 34-66 = amber (medium), 67-100 = coral (heavy)
8. Form has 6 sliders with labels in French:
   - Exigence mentale, Exigence physique, Exigence temporelle
   - Performance, Effort, Frustration
9. Each slider shows its numeric value (0-100) updating in real-time
10. Submit button disabled until all sliders have been touched at least once
</requirements>

<implementation_plan>
1. src/types/index.ts — add TlxEntry + TlxFormValues types
2. src/lib/queries/tlx.ts — useCurrentTlx, useTlxHistory, useSubmitTlx, useTlxDelta
3. app/(app)/dashboard/tlx.tsx — TLX form screen (6 sliders + submit)
4. app/(app)/dashboard/index.tsx — add TLX card with score + delta
</implementation_plan>

<examples>
Example 1 — First submission:
  User opens TLX form → adjusts 6 sliders → taps "Enregistrer"
  → Score computed: (70+30+50+(100-80)+60+40)/6 = 45
  → Toast: "Charge mentale enregistrée"
  → Dashboard card: "45/100" with amber color, no delta (first week)

Example 2 — Second week:
  Previous week score: 45. This week: 62.
  Dashboard card: "62/100" with amber, delta "↑ +17" in coral

Example 3 — Re-submission same week:
  User already submitted score 45 this week.
  Opens form again → sliders pre-filled with previous values.
  Adjusts → submits → upserts. Dashboard updates immediately.
</examples>

<verification>
- npx tsc --noEmit → 0 errors
- npx expo export -p web → build succeeds
- Test: submit TLX → check tlx_entries table has 1 row for this week
- Test: submit again same week → still 1 row (upserted)
- Test: dashboard shows score + correct delta
- Edge: no TLX submitted → dashboard shows "Pas encore évalué" empty state
</verification>

<constraints>
- Do not modify any file not listed in the implementation plan
- Do not add npm dependencies
- Use StyleSheet.create() — never className
- All colors from Colors constant, all spacing from Spacing constant
- Slider component: use React Native's built-in Slider or a simple TouchableOpacity-based custom one
- Do not create separate .web.tsx files
</constraints>
```

This example demonstrates every technique in action: XML structure, explicit formulas, concrete examples with numbers, verification steps, and strict scope control.
