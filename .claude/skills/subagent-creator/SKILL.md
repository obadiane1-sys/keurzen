---
name: subagent-creator
description: Create, modify, or improve custom Claude Code subagents (.claude/agents/*.md). Use this skill when the user asks to "create an agent", "add a subagent", "modify an agent", "improve an agent", or wants to set up a specialized autonomous agent for their project. Also triggers when the user references creating agents for specific tasks like reviewing, testing, deploying, or analyzing code.
---

# Subagent Creator

Create production-quality Claude Code subagent definitions that are focused, well-scoped, and immediately useful. A great subagent does one job extremely well.

## When to use

- User wants to create a new custom agent
- User wants to modify or improve an existing agent
- User says "create an agent for X" or "I need an agent that does Y"
- User wants to split responsibilities across specialized agents

## Subagent file format

Subagents are Markdown files stored in:
- `.claude/agents/` — project-scoped (shared with team via git)
- `~/.claude/agents/` — user-scoped (personal, all projects)

### Structure

```markdown
---
name: kebab-case-name                        # REQUIRED: unique identifier
description: One-line description of when     # REQUIRED: Claude uses this to decide delegation
tools: Read, Glob, Grep                      # Optional: tool allowlist (restrictive)
disallowedTools: Write, Edit                 # Optional: tool denylist (permissive)
model: sonnet                                # Optional: sonnet, opus, haiku
maxTurns: 10                                 # Optional: max agentic turns
---

System prompt body in Markdown...
```

### Available tools

| Tool | Purpose | Give to agents that... |
|------|---------|----------------------|
| `Read` | Read files | need to analyze code (almost always) |
| `Write` | Create new files | need to generate new files |
| `Edit` | Modify existing files | need to fix/change code |
| `Glob` | Find files by pattern | need to explore the codebase |
| `Grep` | Search file contents | need to find patterns/usages |
| `Bash` | Run shell commands | need to execute builds, tests, deploys |
| `WebFetch` | Fetch web content | need to access documentation/APIs |
| `WebSearch` | Search the web | need to research external info |
| `Agent` | Spawn other subagents | orchestrate multi-agent workflows |

**Principle of least privilege**: only give tools the agent actually needs. Read-only agents (reviewers, auditors) should NOT have Write/Edit/Bash.

## Workflow

### Step 1 — Understand the need

Before creating an agent, clarify:

1. **What job does it do?** — One clear responsibility
2. **When should it be invoked?** — Triggers in the description
3. **What can it touch?** — Files, commands, external systems
4. **What must it NOT do?** — Scope boundaries
5. **What output does it produce?** — Format, structure, actionable items

### Step 2 — Research the project

Before writing the agent definition:

1. Read `CLAUDE.md` for project conventions, stack, and rules
2. Read existing agents in `.claude/agents/` to avoid overlap and maintain consistency
3. Read relevant code areas the agent will work with
4. Identify patterns, types, and conventions the agent should follow

### Step 3 — Write the agent definition

Apply these principles:

**Frontmatter:**
- `name`: kebab-case, descriptive, short (2-3 words max)
- `description`: Write from Claude's perspective — "when should I delegate to this agent?" Include trigger phrases. Be specific enough that Claude picks the right agent but broad enough to catch variations.
- `tools`: Start restrictive (Read, Glob, Grep) and only add Write/Edit/Bash if the agent needs to modify things.
- `model`: Use `sonnet` for fast, focused tasks. Use `opus` for complex reasoning. Omit to inherit parent model.

**System prompt body:**
- Open with a one-line identity statement: "Tu es le X de Y. Tu fais Z."
- Include a clear **Role** section with numbered responsibilities
- List **References** — exact file paths the agent should read
- Define **Rules** — hard constraints and non-goals
- Specify **Output format** — what the agent's response should look like
- Keep it under 80 lines — longer prompts dilute focus

**Quality checklist:**
- [ ] Agent has ONE clear job (not two jobs stapled together)
- [ ] Description matches actual triggers (test: "would Claude pick this agent for X?")
- [ ] Tools are minimal — no Write/Edit for read-only agents
- [ ] System prompt references real project paths (not generic examples)
- [ ] Rules explicitly state what NOT to do
- [ ] Output format is concrete (not "provide useful feedback")
- [ ] No overlap with existing agents

### Step 4 — Validate

After creating the agent file:

1. List existing agents to confirm no name collision
2. Verify all referenced file paths exist in the project
3. Check that the tool set matches the agent's responsibilities
4. Ensure the description is distinctive from other agents

## Anti-patterns to avoid

- **Swiss army knife agent**: Does everything. Should be split into focused agents.
- **Vague description**: "Helps with code" — too broad. Be specific: "Reviews TypeScript code for type safety issues and missing error handling."
- **Over-privileged agent**: A reviewer with Write/Edit/Bash access. Reviewers should be read-only.
- **Generic system prompt**: "You are a helpful assistant." Useless. Ground it in the project.
- **Missing boundaries**: No rules about what NOT to do. Agent will scope-creep.
- **Duplicate agent**: Overlaps 80% with an existing agent. Merge or differentiate.

## Agent archetypes

Common patterns for well-designed agents:

### Reviewer (read-only)
```
tools: Read, Glob, Grep
Role: Analyze code and report findings
Output: List of issues with file, line, severity, fix suggestion
```

### Builder (read-write)
```
tools: Read, Write, Edit, Glob, Grep
Role: Implement features following project conventions
Output: Modified/created files
```

### Validator (read + execute)
```
tools: Read, Glob, Grep, Bash
Role: Run checks and report pass/fail
Output: Checklist with status, blockers, actions
```

### Researcher (read + web)
```
tools: Read, Glob, Grep, WebFetch, WebSearch
Role: Investigate issues, find solutions
Output: Analysis with evidence and recommendations
```

### Orchestrator (delegates)
```
tools: Read, Glob, Grep, Agent(worker-a, worker-b)
Role: Plan work and delegate to specialized subagents
Output: Coordinated results from multiple agents
```

## Delivering the agent

When presenting the created agent to the user:

1. Show the full agent file content
2. Explain why each tool was included/excluded
3. List which existing agents it complements (not overlaps with)
4. Suggest how to invoke it: natural language, @mention, or `claude --agent`
5. Offer to adjust scope, tools, or rules based on feedback
