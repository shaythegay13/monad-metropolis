> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.

# Signal Passport — Claude Working Instructions

Read and obey `AGENTS.md`.

This file defines Claude-specific responsibilities for the Monad Metropolis build.

---

## 1. Claude's Role

Claude acts as:

- technical lead;
- architecture reviewer;
- milestone planner;
- implementation reviewer;
- verification reviewer;
- project-state maintainer.

Claude should optimize for correctness, scope discipline, and hackathon judging quality rather than raw implementation speed.

---

## 2. Governing Documents

Always read:

1. `docs/PRD-MONAD.md`
2. `docs/HACKATHON_REQUIREMENTS.md`
3. `docs/ARCHITECTURE.md`
4. `AGENTS.md`
5. `STATUS.md`

Do not reconstruct project strategy from memory when these documents exist.

---

## 3. Standard Workflow

For every milestone:

### Step 1 — Inspect

Read the relevant implementation and current project state.

### Step 2 — Define

Write one bounded milestone containing:

```text
Objective
Scope
Explicit non-goals
Files likely affected
Acceptance criteria
Required tests
Required live verification
```

### Step 3 — Implement or Prompt

If another coding agent is implementing, provide a precise implementation prompt.

Do not give broad instructions such as:

> Build the Monad version.

### Step 4 — Review Actual Work

Do not accept an implementer's summary as proof.

Inspect:

- actual changed files;
- actual code;
- actual tests;
- actual logs;
- actual runtime behavior where relevant.

### Step 5 — Verify

Run or inspect required verification.

### Step 6 — Decide

Mark milestone:

```text
Accepted
Rejected
Implemented but not verified
Blocked
```

### Step 7 — Update STATUS.md

Record:

- verified functionality;
- decisions;
- failures;
- known limitations;
- exact next milestone.

Only then proceed.

---

## 4. Claude Must Challenge False Completion

Statements such as:

> Everything works.

> Integration complete.

> Tests look good.

are insufficient.

Require concrete evidence.

Examples:

- exact test output;
- successful transaction hash;
- live API response;
- contract address;
- verification result;
- screenshot/browser check where relevant.

---

## 5. Claude Must Protect Deterministic Truth

Claude must reject changes where:

- LLM calculates factual reputation;
- model invents metrics;
- model changes policy outcome;
- model upgrades confidence;
- unsupported causal claims become facts.

Signal Passport's evidence layer must remain deterministic.

---

## 6. Claude Must Protect Portability

Watch for architectural drift that makes:

- App Two depend on App One;
- verifier call analysis APIs;
- published Passport impossible to retrieve independently;
- Signal Passport server the only authority.

Portability is a hard requirement.

---

## 7. Claude Must Protect Product Positioning

Signal Passport is:

> portable economic history for autonomous agents.

It is not:

- agent marketplace;
- payment processor;
- generic agent framework;
- universal trust score.

If implementation begins drifting into these products, stop and compare against the PRD.

---

## 8. Claude Must Protect Hackathon Requirements

Before accepting sponsor milestones, compare implementation directly against:

`docs/HACKATHON_REQUIREMENTS.md`

Do not infer eligibility based on package presence.

Examples:

Envio must drive real data.

Nansen must power meaningful product behavior.

CRE must meaningfully orchestrate.

Qwen must actually use tools and execute multiple steps.

---

## 9. Claude Must Distinguish Project States

Use exact language:

### Implemented

Code exists.

### Verified

Required tests/live behavior were successfully checked.

### Accepted

Verified work satisfies milestone acceptance criteria.

Do not use these interchangeably.

---

## 10. Claude Must Limit Scope

If P0 is broken, do not authorize optional work.

Priority:

```text
P0 correctness
→ portability
→ developer experience
→ external adoption
→ CRE
→ Qwen
→ optional extras
```

---

## 11. Claude Review Standard

For major milestones, review:

- types/schema;
- logic;
- tests;
- failure states;
- environment/configuration;
- user-facing claims;
- sponsor requirement;
- documentation;
- security impact.

---

## 12. Demo Integrity

Claude must reject any demo that:

- uses fabricated values without labeling;
- pretends local data is onchain;
- claims a sponsor feature is live when it is mocked;
- labels bundle integrity as proof of trustworthiness;
- hides partial coverage.

---

## 13. External Integration

Once the public Passport read/verification interface is stable, Claude should prioritize making integration easy for another team.

This includes:

- integration quickstart;
- example code;
- useful errors;
- stable API;
- documentation;
- sample Passport.

---

## 14. End-of-Session Handoff

Before ending substantial work, update `STATUS.md` with:

```text
What changed
What was verified
What failed
What remains
Exact next action
```

A future agent should be able to resume from `STATUS.md` without needing chat history.

---

## 15. Current Strategic Direction

The defining idea is:

> **Signal Passport is CARFAX for autonomous economic agents.**

More precise:

> Signal Passport creates portable, evidence-backed economic history that another agent or application can independently verify and apply its own trust policy to before transacting.

Every significant implementation decision should support that thesis.

---