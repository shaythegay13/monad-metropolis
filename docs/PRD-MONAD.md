> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.

# `docs/PRD-MONAD.md`

# Signal Passport — Monad Metropolis PRD

**Version:** 2.0 — Monad Agent Economy  
**Last Updated:** September 28, 2026  
**Hackathon:** Monad Metropolis  
**Primary Track:** Trust, Identity & AI Infrastructure  
**Submission Deadline:** October 13, 2026 at 11:59 PM EDT  
**Status:** Authoritative product specification

---

## 1. Product Summary

Signal Passport is a portable economic-history layer for autonomous agents and wallets.

It converts verifiable public economic activity into a structured, evidence-backed Passport that another application or agent can independently inspect and verify before transacting.

The simplest analogy is:

> **Signal Passport is CARFAX for autonomous economic agents.**

Agent identity, communication, and payments are increasingly being standardized through technologies such as ERC-8004, MCP/A2A, and x402.

Signal Passport does not replace those systems.

It answers a different question:

> **What has this economic agent demonstrably done?**

Signal Passport aggregates verifiable economic history, preserves the underlying evidence, derives deterministic observations, cryptographically seals the resulting Passport, and allows the Passport to be published and verified on Monad.

A consuming application may then apply its own trust policy.

Signal Passport does **not** assign a universal trust score.

---

## 2. Core Product Thesis

The agent economy already has emerging standards for:

- identity;
- communication;
- discovery;
- wallets;
- payments;
- reputation feedback.

What remains fragmented is **portable economic history**.

A new application should not have to independently:

1. retrieve an agent's activity;
2. resolve its wallets;
3. normalize transactions;
4. analyze counterparties;
5. inspect feedback;
6. interpret economic history;
7. determine data coverage;
8. build provenance infrastructure;
9. create its own verification format.

Signal Passport provides this reusable layer.

The protocol should become:

```text
Agent Identity
      ↓
Economic Evidence
      ↓
Deterministic Observations
      ↓
Signal Passport
      ↓
Consumer Trust Policy
      ↓
Commerce / Delegation / Interaction
```

---

## 3. Product Positioning

Signal Passport is **not** another agent-commerce system.

It does not attempt to replace:

- x402;
- agent marketplaces;
- ERC-8004;
- MCP;
- A2A;
- payment processors;
- wallets.

Instead, Signal Passport can sit immediately before a transaction or delegation.

Example:

```text
Agent A discovers Agent B
        ↓
Agent A retrieves Signal Passport
        ↓
Passport integrity is verified
        ↓
Agent A applies its own trust policy
        ↓
Policy passes
        ↓
Agent A transacts with Agent B
```

Core positioning:

> **Agent commerce is being solved. Agent trust evidence is not. Signal Passport gives economic agents a portable, evidence-backed history another agent can independently verify before money moves.**

---

## 4. Primary Subject

The Monad version of Signal Passport is **agent-first but wallet-evidence-backed**.

The primary subject may be:

- an ERC-8004 agent;
- an autonomous economic agent associated with one or more wallets;
- a wallet acting as an economic identity.

ERC-8004 provides agent identity where available.

Signal Passport provides evidence-backed economic history.

Conceptually:

```text
ERC-8004 Agent
      ↓
Associated Wallet(s)
      ↓
Observable Economic Activity
      ↓
Signal Passport
```

Signal Passport must remain capable of representing wallet-only subjects where no ERC-8004 identity exists.

---

## 5. Product Principles

### 5.1 Evidence, Not Scores

Signal Passport must provide verifiable observations.

It must not create a universal:

- trust score;
- credit score;
- safety score;
- worthiness score;
- quality score.

A consumer may apply its own policy to the same Passport.

---

### 5.2 Deterministic Truth Before AI

Facts are calculated in deterministic application code.

Required flow:

```text
Raw Data
   ↓
Normalized Evidence
   ↓
Deterministic Metrics
   ↓
Passport Observations
   ↓
AI Explanation
```

The LLM must never become the source of factual reputation.

---

### 5.3 Evidence-Backed

Every meaningful observation must point to the evidence and metrics supporting it.

A developer should be able to answer:

> Why does this observation exist?

---

### 5.4 Portable

A Passport must work outside the Signal Passport website.

Another application must be able to:

- retrieve it;
- inspect it;
- verify it;
- apply its own trust policy.

---

### 5.5 Independently Verifiable

The Signal Passport frontend must not be the trust authority.

A third party should be able to independently verify:

- schema validity;
- evidence references;
- cryptographic integrity;
- published Passport hash/version on Monad.

---

### 5.6 User/Agent Controlled Publication

Analyzing public history does not automatically publish a Passport.

Publication to Monad is explicit.

---

### 5.7 Versioned

Economic history changes.

New activity may create a new Passport version without destroying the history of previous published versions.

---

### 5.8 Transparent Coverage

Signal Passport must distinguish:

- complete coverage;
- partial coverage;
- unknown coverage;
- provider failure;
- zero qualifying activity.

Provider failure must never be presented as zero activity.

---

## 6. Existing Signal Passport Foundation

The existing Signal Passport repository already provides a technical foundation including:

- deterministic wallet analysis;
- normalized evidence;
- stable evidence IDs;
- deterministic metrics;
- coverage status;
- canonical JSON serialization;
- SHA-256 tamper-evident bundle sealing;
- App One Passport generation;
- App Two independent verification;
- AI grounding and validation;
- tests and verification discipline.

The dedicated `signal-passport-monad` project selectively reuses this foundation.
The original `signal-passport` repository is read-only; implementation happens only
in the dedicated Monad repository. See `REUSE.md` for the exact migrated subset.

---

## 7. Lessons Carried Forward From LedgerLens

LedgerLens provides architectural patterns only.

Carry forward:

- deterministic truth before AI;
- immutable fact ledger;
- explicit evidence references;
- structured model output;
- validation gates;
- rejection of unsupported claims;
- provider abstraction;
- fail-loudly configuration;
- reviewer verification before milestone acceptance;
- STATUS-based project handoff.

Do not carry forward:

- accounting-specific domain logic;
- revenue/expense variance calculations;
- Business Memory as editable reputation;
- vendor/customer classification;
- company-specific financial schema.

LedgerLens must remain reference material rather than part of Signal Passport's production runtime.

---

## 8. Initial Target Users

### Agent Marketplace

Needs better information before ranking, surfacing, or recommending agents.

### Agent Router / Orchestrator

Needs to select between multiple agents capable of performing the same task.

### Agent Wallet

May want transaction policies before allowing meaningful payments to unfamiliar counterparties.

### x402 / Machine-Commerce Application

Needs pre-transaction context before payment execution.

### Agent Discovery Product

Can complement ERC-8004 identity with deeper economic history.

### Developer

Wants a simple API rather than building custom wallet-history and reputation infrastructure.

---

## 9. Core User and Developer Flows

### Flow A — Create Passport

```text
Connect / identify subject
        ↓
Resolve ERC-8004 identity if available
        ↓
Resolve associated wallet(s)
        ↓
Retrieve supported economic activity
        ↓
Normalize evidence
        ↓
Calculate deterministic observations
        ↓
Create canonical Passport
        ↓
Review evidence
        ↓
Publish to Monad
```

---

### Flow B — Consume Passport

```text
Consumer has agent/wallet identifier
        ↓
Retrieve Passport
        ↓
Verify cryptographic integrity
        ↓
Verify published version on Monad
        ↓
Inspect observations/evidence
        ↓
Apply consumer-specific policy
```

No new analysis should be required.

---

### Flow C — Agent Selection

```text
Consumer discovers candidate agents
        ↓
Retrieve candidate Passports
        ↓
Verify them
        ↓
Apply trust policy
        ↓
Filter qualifying candidates
        ↓
Commerce or delegation occurs elsewhere
```

---

## 10. P0 Evidence Universe

P0 should remain deliberately narrow and trustworthy.

Supported evidence may include:

- ERC-8004 identity information;
- public wallet transactions;
- contract interactions;
- economic settlement activity where reliably identifiable;
- counterparties;
- timestamps;
- transaction hashes;
- chain IDs;
- protocol/address labels where enrichment is reliable;
- ERC-8004 reputation/feedback information where available.

Do not attempt to understand every protocol, chain, marketplace, or payment system before submission.

Correct narrow evidence is more valuable than broad unreliable intelligence.

---

## 11. Core P0 Observations

Initial observations should include approximately 5–7 high-value deterministic facts.

### 11.1 Economic History Duration

Example:

```text
Observable economic history: 124 days
```

---

### 11.2 Observed Activity

Example:

```text
Observed qualifying interactions: 164
```

---

### 11.3 Unique Economic Counterparties

Example:

```text
Unique observed counterparties: 37
```

Do not describe recipient addresses as independent counterparties unless the methodology actually supports that interpretation.

---

### 11.4 Counterparty Concentration

Example:

```text
Top 3 counterparties represent 28% of observed qualifying interactions.
```

---

### 11.5 ERC-8004 Feedback Activity

Where available:

```text
Feedback records: 87
Unique feedback providers: 34
```

---

### 11.6 Feedback Concentration

Where calculable:

```text
Top 3 feedback providers represent 17% of observed feedback.
```

---

### 11.7 Settlement / Economic Corroboration

Where reliable evidence exists:

```text
Observed settlement-backed interactions: 61
```

Do not claim settlement corroboration if the underlying evidence cannot support it.

---

## 12. Claim and Observation Language

Signal Passport may describe:

- observed;
- demonstrated;
- repeated;
- concentrated;
- distributed;
- recent;
- sustained;
- limited evidence;
- supported by;
- not observed within the declared scope.

Signal Passport should avoid unsupported claims such as:

- trustworthy;
- safe;
- malicious;
- fraudulent;
- good agent;
- bad agent;
- expert;
- financially reliable;
- creditworthy.

---

## 13. Trust Policy Engine

Trust decisions belong to the consumer.

Signal Passport should support deterministic consumer-defined policy evaluation.

Example:

```typescript
const policy = {
  minimumHistoryDays: 30,
  minimumObservedCounterparties: 10,
  maximumTopCounterpartyConcentration: 0.50,
  requirePublishedPassport: true
}
```

Possible result:

```text
Economic history >= 30 days       PASS
Counterparties >= 10              PASS
Concentration <= 50%              FAIL
Passport verified on Monad        PASS

Policy requirements not satisfied.
```

This does **not** mean:

> Agent is bad.

It means:

> This Passport does not satisfy this consumer's stated policy.

Different applications may apply different policies to the same Passport.

---

## 14. Core Data Types

Expected canonical domain types include:

```text
AgentIdentity
SubjectWallet
OnchainActivity
EvidenceRecord
EnrichmentRecord
Metric
PassportObservation
PassportPayload
PassportBundle
PassportVersion
PolicyDefinition
PolicyResult
```

Exact schemas belong in `docs/ARCHITECTURE.md` and production code.

---

## 15. Monad Role

Monad is the public portability/integrity anchor.

P0 Monad functionality should allow Signal Passport to publish:

- subject;
- Passport identifier;
- Passport version;
- profile hash;
- content reference/URI;
- timestamp;
- optional provenance root.

The blockchain should not store the entire evidence dataset.

---

## 16. Passport Registry

Target conceptual interface:

```text
publishPassport(...)
getLatestPassport(...)
getPassportVersion(...)
verifyPassport(...)
```

A published record conceptually maps:

```text
subject
→ passportId
→ version
→ profileHash
→ contentReference
→ timestamp
```

Only the subject wallet or explicitly authorized mechanism may publish/update its Passport.

---

## 17. Dynamic Role

Dynamic is the wallet and signing layer.

Target flow:

```text
Connect wallet
      ↓
Establish wallet control
      ↓
Generate Passport
      ↓
Sign publication
      ↓
Publish to Monad
```

Do not add another overlapping wallet provider without a clear product requirement.

---

## 18. Envio Role

Envio should power real onchain activity used by core Passport observations.

Target:

```text
Blockchain Activity
       ↓
Envio
       ↓
Normalized Evidence
       ↓
Deterministic Metrics
       ↓
Passport Observations
```

Envio must not be a superficial sponsor integration.

---

## 19. Nansen Role

Nansen provides enrichment.

Possible uses:

- address labels;
- counterparties;
- wallet relationships;
- protocol context;
- token context;
- transaction enrichment;
- supported performance information where reliable.

Signal Passport must distinguish:

```text
Chain-Verifiable Evidence
vs.
Nansen Enrichment
vs.
Signal Passport Derivation
vs.
AI Interpretation
```

---

## 20. Alchemy Role

Alchemy should be used as meaningful Monad infrastructure.

Potential P0 uses:

- Monad RPC;
- registry contract reads;
- registry writes;
- transaction receipt retrieval;
- onchain verification.

---

## 21. AI Role

AI may:

- explain observations;
- summarize Passport history;
- answer grounded questions;
- compare verified Passport data;
- explain policy results;
- identify evidence limitations.

AI may not:

- invent observations;
- invent evidence;
- perform authoritative metric calculations;
- change deterministic confidence;
- modify policy outcomes;
- claim trustworthiness.

---

## 22. Qwen Agent — Conditional P1

Qwen should only be pursued after the P0 system is stable.

For bounty eligibility, Qwen must perform genuine:

- planning;
- tool use;
- multi-step execution.

Target tools:

```text
discoverAgents()
getPassport()
getClaims()
getEvidence()
verifyPassport()
evaluatePolicy()
comparePassports()
```

Example:

```text
User:
Find a provider under $0.10 that satisfies my trust policy.

Qwen:
1. discovers candidates;
2. retrieves Passports;
3. verifies them;
4. applies the trust policy;
5. compares qualifying candidates;
6. explains the result.
```

Qwen must not establish factual reputation itself.

---

## 23. Chainlink CRE — P1

CRE may orchestrate Passport refresh/update.

Target:

```text
Refresh Trigger
      ↓
CRE
      ↓
Retrieve Onchain Data
      ↓
Retrieve Enrichment
      ↓
Run Deterministic Analysis
      ↓
Create New Passport Version
      ↓
Publish/Anchor on Monad
```

P0 must remain functional without CRE.

---

## 24. Non-Goals

Signal Passport is not:

- a payment rail;
- an agent marketplace;
- a universal trust score;
- KYC;
- proof of personhood;
- a credit score;
- a fraud accusation engine;
- an autonomous trading system;
- investment advice;
- a generic AI-agent framework;
- a replacement for ERC-8004;
- a replacement for x402;
- PlayMind technology.

---

## 25. P0 Acceptance Criteria

P0 is complete only when:

1. A real subject can be identified.
2. ERC-8004 identity can be resolved where available.
3. Associated wallet activity can be analyzed.
4. Envio powers real core onchain evidence.
5. Nansen powers meaningful enrichment.
6. Deterministic observations are generated.
7. Every observation traces to evidence/metrics.
8. Coverage is explicit.
9. Canonical Passport generation is deterministic.
10. Bundle integrity verification works.
11. Dynamic is used in the wallet/signing flow.
12. Passport can be published to Monad.
13. Alchemy meaningfully participates in Monad interaction.
14. Published Passport can be retrieved.
15. Hash/integrity can be checked against Monad.
16. App Two/consumer can verify without rerunning analysis.
17. Consumer trust policy works deterministically.
18. Public developer interface exists.
19. Documentation exists.
20. Live deployment works.
21. Test suite passes.

---

## 26. P1

After P0 is stable:

- Chainlink CRE;
- external developer/team integration;
- richer ERC-8004 feedback analysis;
- stronger cross-chain evidence;
- Qwen tool-using agent;
- additional policy templates;
- optional EAS attestations.

---

## 27. P2

Only after P0/P1 are stable:

- x402 integration;
- ERC-8004 advanced interoperability;
- paid Passport queries;
- advanced sybil heuristics;
- broad multichain expansion;
- historical performance analytics;
- additional agent marketplaces.

---

## 28. Demo Story

The flagship demo should compare two economic agents.

Agent A appears impressive based on raw feedback quantity.

Agent B appears less impressive based on raw feedback quantity.

Signal Passport reveals deeper economic evidence.

Example:

```text
AGENT A
Feedback records: 1,200
Economic history: 6 days
Observed counterparties: 3
Feedback concentration: extreme

AGENT B
Feedback records: 87
Economic history: 124 days
Observed counterparties: 54
Feedback concentration: distributed
```

A consumer trust policy then evaluates both.

Signal Passport does not declare which agent is universally better.

The consumer policy determines which agent meets its requirements.

The Passport evidence remains inspectable.

---

## 29. Core Pitch

> **Agent commerce is being solved. Agent trust evidence isn't. Signal Passport is CARFAX for autonomous economic agents: a portable, evidence-backed economic history another agent or application can independently verify before money moves.**

Short version:

> **Signal Passport is CARFAX for AI agents.**

---

## 30. Success Definition

Signal Passport succeeds when another developer can:

1. identify an economic agent;
2. retrieve its Passport;
3. verify its integrity independently;
4. understand the evidence behind its observations;
5. apply their own trust policy;
6. use the result without rebuilding the original analysis stack.

---