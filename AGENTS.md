> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.

# Signal Passport — Agent Engineering Instructions

This file governs all coding agents working in this repository.

Examples include:

- Codex;
- Claude Code;
- Antigravity;
- Kilo;
- other automated coding agents.

---

## 1. Read Order

Before modifying code, read:

1. `docs/PRD-MONAD.md`
2. `docs/HACKATHON_REQUIREMENTS.md`
3. `docs/ARCHITECTURE.md`
4. `STATUS.md`
5. this file

Do not begin implementation based only on a user prompt when these documents contain relevant authoritative decisions.

---

## 2. Source of Truth

Priority:

```text
PRD-MONAD.md
    ↓
HACKATHON_REQUIREMENTS.md
    ↓
ARCHITECTURE.md
    ↓
STATUS.md
    ↓
Current verified code
```

If documents conflict, flag the conflict rather than inventing a resolution.

---

## 3. Inspect Before Editing

Before implementing a milestone:

- inspect relevant existing files;
- understand current behavior;
- identify reusable components;
- avoid replacing verified code unnecessarily.

The original Signal Passport contains prior working functionality. This dedicated
repository contains only the selected foundation disclosed in `docs/REUSE.md`.
Do not assume the prior applications or analysis engine exist here.

Prefer extending existing systems over rewriting them.

---

## 4. LedgerLens Rule

LedgerLens is reference material only.

Do not:

- make Signal Passport depend on LedgerLens at runtime;
- copy LedgerLens accounting/domain logic;
- add Business Memory to reputation;
- modify LedgerLens unless explicitly instructed.

Reusable patterns include:

- deterministic truth before AI;
- evidence grounding;
- model validation;
- provider abstraction;
- milestone verification discipline.

---

## 5. Deterministic Truth Rule

All factual reputation/economic-history observations must come from deterministic code.

AI must not author factual values.

Required:

```text
evidence
→ deterministic calculations
→ observations
→ AI explanation
```

Forbidden:

```text
evidence
→ LLM
→ factual reputation
```

---

## 6. Evidence Rule

Every meaningful Passport observation must have traceable supporting evidence and/or metrics.

Never invent:

- evidence IDs;
- transaction hashes;
- addresses;
- protocols;
- settlement events;
- feedback events;
- metrics.

---

## 7. Trust Score Rule

Do not add a universal trust score.

Do not add:

```text
Trust Score: 82
Safety Score: 91
Agent Quality: A+
```

without an explicit PRD change.

Consumer-specific policy outcomes are permitted.

---

## 8. Coverage Rule

Provider failure is not zero activity.

Preserve:

- complete coverage;
- partial coverage;
- unknown coverage;
- provider failure;
- valid zero activity

as distinct states.

---

## 9. P0 Before P1

Priority is binding.

Do not begin optional:

- Chainlink CRE;
- Qwen;
- x402;
- EAS;
- advanced cross-chain work;
- decorative integrations

while required P0 flows remain broken.

---

## 10. Sponsor Integrity Rule

Do not claim a sponsor integration is complete merely because:

- SDK installed;
- API key exists;
- one test request worked;
- logo added.

A sponsor integration must power a meaningful product feature and satisfy `docs/HACKATHON_REQUIREMENTS.md`.

---

## 11. Secrets

Never commit:

- API keys;
- private keys;
- wallet seed phrases;
- tokens;
- credentials.

Use `.env.local` or documented secret management.

`.env.example` may contain variable names and placeholders only.

---

## 12. Small Milestones

Work one bounded milestone at a time.

Before implementation state:

```text
Milestone:
Goal:
Files expected to change:
Acceptance criteria:
Tests required:
Live verification required:
```

Do not implement future milestones unless necessary for the current milestone.

---

## 13. Verification Requirement

Code written does not mean feature complete.

Required distinction:

```text
Implemented
Verified
Accepted
```

A milestone may only become Accepted after required evidence has been reviewed.

---

## 14. Required Post-Implementation Report

After implementing a milestone report:

```text
Files changed:
Behavior added:
Tests run:
Exact test result:
Live verification performed:
Known limitations:
Documentation updated:
STATUS.md updated:
```

Do not hide failed tests.

---

## 15. STATUS.md

Update `STATUS.md` after meaningful milestones.

Only put something under `Working` if actually verified.

Otherwise use:

```text
Implemented, not yet verified
```

---

## 16. Tests

Every new deterministic metric should have tests covering:

- expected normal case;
- zero state where relevant;
- malformed/missing input where relevant;
- deduplication;
- boundary behavior;
- provider failure if applicable;
- partial coverage if applicable.

---

## 17. Existing Verification System

Do not weaken:

- stable evidence IDs;
- canonical serialization;
- digest verification;
- App Two independence;
- schema validation;
- evidence-reference validation.

Any modification requires explicit justification and regression tests.

---

## 18. Consumer Independence

App Two / consumer must remain capable of verifying a Passport without rerunning the original economic-history analysis.

Do not quietly import the analysis engine into the consumer.

---

## 19. No Fabricated Demo Claims

Synthetic fixtures are allowed if clearly labeled synthetic.

Do not label synthetic values as live real-agent history.

Do not fabricate:

- sponsor usage;
- external integrations;
- feedback;
- settlements;
- counterparties;
- traction.

---

## 20. User-Facing Language

Prefer descriptive language:

- observed;
- demonstrated;
- evidence;
- history;
- concentration;
- coverage;
- verified integrity.

Avoid unsupported judgmental language:

- safe;
- malicious;
- trustworthy;
- fraudulent;
- best;
- expert.

---

## 21. Preserve Scope

If a requested feature conflicts with the PRD or hackathon requirements:

1. stop;
2. identify the conflict;
3. explain it;
4. request/record an explicit governing-document change before proceeding.

---

## 22. Definition of Done

A milestone is not done until:

- implementation exists;
- tests pass;
- relevant real path is exercised;
- failure states are checked;
- docs are updated;
- `STATUS.md` is current;
- acceptance criteria are met.

---

## 23. Current Strategic Principle

When deciding between two implementation paths, prefer the one that strengthens:

> **Signal Passport as a portable, independently verifiable economic-history primitive for autonomous agents.**

Do not optimize for feature count.