---
name: capture-decision
description: Capture decisions, corrections, and new rules that surface mid-chat into brain/awareness/decisions/. Auto-triggers on decision-language — "let's go with", "we decided", "from now on", "stop doing X", "instead of X do Y", "the rule is", corrections to prior guidance, new constraints, policy shifts. Write a dated decision file and confirm in one line. Do not trigger on idle chat, exploration, or code reading.
---

# Capture decision

Your job: notice when a decision surfaces in conversation and write it to `brain/awareness/decisions/` so it doesn't get lost. Confirm in one line. Move on.

## Trigger phrases

Fire when the user (or the conversation) produces language like:

- "Let's go with …"
- "We decided …"
- "From now on …" / "Whenever X, do Y"
- "Stop doing X" / "Never X"
- "Actually, do Y instead of X"
- "The rule is …"
- "We're NOT going to …"
- A correction to a prior recommendation
- A new constraint (deadline, compliance, stakeholder ask)
- A policy or scope change

**Do NOT fire on:** questions, exploration, code-reading, idle chat, hypotheticals the user hasn't landed on, or implementation details for the current task that don't outlive it.

## What to write

Create `brain/awareness/decisions/YYYY-MM-DD-<slug>.md` (today's date, short kebab-case slug):

```markdown
---
date: YYYY-MM-DD
topic: <short noun phrase>
status: proposed | accepted | superseded
related-session: sessions/YYYY-MM-DD-<slug>.md
---

## Decision
<one sentence — what was decided>

## Context
<what prompted it, constraints, who's affected>

## Alternatives considered
<optional — only if meaningful alternatives surfaced>

## Consequences
<what this enables, what it blocks, what breaks if we ignore it>
```

Default `status: proposed` unless the user explicitly accepted it in chat. If they said "yes let's do that" or equivalent, `status: accepted`.

If you're unsure whether a matching decision file already exists, grep `brain/awareness/decisions/` first. If one exists and the new info is a refinement, **update** rather than create.

## Confirming to the user

One line. Example:

> Captured decision: `brain/awareness/decisions/2026-04-15-pay-on-site-hotels-only.md` (status: proposed).

Don't elaborate. Don't ask follow-ups unless something is genuinely unclear (e.g., you don't know if it's accepted or just floated). Let the user move on.

## End-of-session

At `/wrap-up`, the user will triage every decision in `brain/awareness/decisions/` — accepted ones get promoted to the wiki via `/promote`. Your job is just to capture the raw material faithfully.

## Rules

- Never write to `brain/memory/wiki/` directly. Decisions land in `awareness/` first.
- Never write to `brain/memory/sources/` — human-owned.
- If the user is clearly still thinking out loud, don't fire. Wait for the decision to crystallise.
- If the user says "forget that" or reverses, update the existing file's `status: superseded` rather than deleting — the audit trail matters.
