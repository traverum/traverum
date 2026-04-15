# Need-First UI/UX Planning Framework

Use this framework **before** reaching for design specs or code. It ensures we build the right thing — not just a well-styled wrong thing.

**Companion to:** [Dashboard Design Specs](./dashboard-design.md) (visual implementation comes *after* this framework clears a feature)

---

## 1. Define the Job-To-Be-Done (JTBD)

What is the user actually trying to accomplish?

Define this using **verb-driven, behavior-focused language**.

> *"When [situation], I want to [motivation], so I can [outcome]."*

**Rule:** Strictly avoid mentioning features, UI elements, or solutions at this stage. Stay in problem-space.

---

## 2. Extract the Core Need (The "Why")

What is the underlying motivation behind this job?

Identify the dominant needs:

- **Functional Need** — e.g., Relevance, Conversion, Clarity, Iteration, Speed
- **Psychological Need** — e.g., Trust, Confidence, Control, Calm

**Rule:** Express these as abstract nouns to crystallize the essence of the problem.

---

## 3. Solution Mapping: AI vs. Traditional UI

What is the absolute best way to solve this specific need?

Evaluate if this workflow benefits from **AI-First Shifts**:

- Clicking → Asking
- Menus → Prompts
- Manual actions → Agents

### The UI Decision

| Path | When to use |
|------|-------------|
| **Conversational Flow** (Intent → Strategy Cards → Output Cards → Agent Loop) | User needs a "thinking partner" — exploratory, ambiguous, or creative tasks |
| **Traditional UI** (forms, tables, dashboards, actions) | Clarity and speed dictate — structured, repeatable, or high-frequency tasks |

**Choose the path of least friction.** If the user knows exactly what they want, don't make them explain it to an AI. If the problem is fuzzy, don't make them click through 14 dropdowns.

---

## 4. RICE Validation

Before writing code, score the chosen solution to ensure it's worth the build effort.

| Factor | Question | Score (1–5) |
|--------|----------|-------------|
| **Reach** | How many users/interactions will this impact? | |
| **Impact** | How much does it move the needle toward the goal? | |
| **Confidence** | How sure are we about these estimates? | |
| **Effort** | How much work will this take to build? | |

**RICE Score = (Reach × Impact × Confidence) / Effort**

High score → build it. Low score → park it or simplify scope.

---

**Version:** 1.0
**Last Updated:** 2026-03-26
