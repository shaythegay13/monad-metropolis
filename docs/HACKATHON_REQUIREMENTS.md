> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.

# Signal Passport — Monad Metropolis Requirements

**Hackathon:** Monad Metropolis  
**Primary Track:** Trust, Identity & AI Infrastructure  
**Deadline:** October 13, 2026 at 11:59 PM EDT  
**Purpose:** Authoritative internal record of track requirements, bounty requirements, submission requirements, and judging criteria.

---

## 1. Usage Rule

Before building or accepting any major feature, check:

1. Does it advance the PRD?
2. Does it improve our primary-track submission?
3. Does it satisfy a selected bounty requirement?
4. Can we prove the integration is meaningful?
5. Can we demonstrate it live?
6. Is it higher priority than unfinished P0 work?

Do not add sponsor technology solely to display a sponsor logo.

---

## 2. Primary Track

### Trust, Identity & AI Infrastructure

Signal Passport should be presented primarily as:

- protocol infrastructure;
- trust infrastructure;
- provenance infrastructure;
- user/agent-owned data;
- a reusable primitive other applications can consume.

It should not be presented primarily as a standalone analytics dashboard.

---

## 3. Primary Track Judging

### Technical Execution — 20%

Check:

- contracts are correct;
- cryptographic verification is correct;
- ownership/signing is secure;
- secrets are protected;
- deterministic calculations are tested;
- failures are visible;
- AI cannot modify factual reputation.

---

### Design & Craft — 20%

Check:

- API is understandable;
- developer integration is simple;
- documentation is clear;
- repository is readable;
- interfaces are clean;
- verifier UX is understandable;
- another developer can integrate without reading internal analysis code.

---

### Originality & Track Insight — 15%

Check:

- Signal Passport solves a genuine trust/provenance problem;
- portability is real;
- users/agents control publication;
- evidence is independently verifiable;
- the system does not simply recreate a centralized trust database;
- we differentiate from generic reputation scores.

---

### Founder & Market Readiness — 25%

Check:

- specific first customers are identified;
- agent marketplaces are named;
- agent wallets are named;
- x402/commerce systems are understood;
- we can explain why they should integrate instead of building internally;
- post-hackathon adoption path is credible.

---

### Traction & Path Forward — 20%

Check:

- developers have tested the API;
- another team has provided feedback;
- ideally another Metropolis team integrates Signal Passport;
- external integration friction has been documented;
- post-hackathon integration targets exist.

---

## 4. Primary Track Deliverables

Before submission:

- [ ] Project logo/graphic
- [ ] Graphic is JPG/JPEG/PNG/WEBP
- [ ] Graphic is under 3 MB
- [ ] Public GitHub repository
- [ ] Repository accessible publicly
- [ ] Technical demo video <= 3 minutes
- [ ] Technical demo shows live working product
- [ ] Technical demo is not just slides/code walkthrough
- [ ] Pitch video <= 2 minutes
- [ ] Pitch covers team/problem/why
- [ ] Live product deployed
- [ ] Product uses Monad Mainnet or Testnet
- [ ] Access instructions provided
- [ ] Test credentials provided if required
- [ ] Optional <= 30-second promotional clip only if time permits

---

## 5. Envio — Best Use of Envio

### Requirement

Meaningfully use:

- HyperIndex;
- HyperSync;
- and/or HyperRPC

to power real onchain data used by a core feature.

Installing Envio without using its data does not qualify.

### Judges Reward

- depth of use;
- non-trivial schema;
- derived/aggregated entities;
- analytics;
- live/correct data;
- originality;
- readable implementation.

### Required Evidence

- [ ] Working Envio data/indexing pipeline
- [ ] Envio Cloud or self-hosted pipeline where required
- [ ] Public Envio config/schema/handlers or HyperSync code
- [ ] Signal Passport consumes Envio output
- [ ] Envio drives Passport observations
- [ ] Demo shows end-to-end data flow

### Signal Passport Role

```text
Onchain Activity
      ↓
Envio
      ↓
Normalized Evidence
      ↓
Deterministic Agent Metrics
      ↓
Passport
```

---

## 6. Dynamic — Best Use of Dynamic

### Requirement

Use Dynamic SDK meaningfully for one or more of:

- authentication;
- wallets;
- signing;
- embedded/server/agent wallets.

Application must be deployed and demoable.

### Signal Passport Role

Preferred P0 flow:

```text
Connect Wallet
      ↓
Establish Control
      ↓
Generate Passport
      ↓
Sign Publication
      ↓
Publish to Monad
```

### Required Evidence

- [ ] Dynamic SDK integrated
- [ ] Real wallet flow works
- [ ] Signing/authorization works
- [ ] Deployed application demonstrates it
- [ ] Integration documented

---

## 7. Alchemy — Best Projects Using Alchemy

### Requirement

A functional project deployed on Monad must meaningfully integrate at least one Alchemy service/tool supporting Monad.

### Signal Passport Role

Use Alchemy for real runtime infrastructure such as:

- Monad RPC;
- contract reads;
- contract writes;
- transaction receipts;
- Passport verification.

### Required Evidence

- [ ] Alchemy runtime integration exists
- [ ] Product actually depends on it
- [ ] Monad interaction works
- [ ] Integration documented

---

## 8. Nansen — Best Use of Nansen

### Requirement

Meaningfully integrate at least one:

- Nansen API endpoint;
- MCP tool;
- Nansen CLI capability.

Nansen data must contribute to a core product feature.

### Signal Passport Role

Use Nansen for enrichment, not raw-data display.

For every Nansen feature document:

```text
Endpoint/tool:
Data returned:
Transformation:
Passport field/observation affected:
User/developer value:
```

### Required Evidence

- [ ] At least one real Nansen endpoint/tool used
- [ ] Data affects core product behavior
- [ ] Not just a Nansen-data dashboard
- [ ] Integration clearly documented
- [ ] Demo visibly uses Nansen-powered information

---

## 9. Chainlink CRE — Best Workflow with CRE

### Requirement

CRE must act as a meaningful orchestration layer.

Must integrate a blockchain with at least one external:

- API;
- data source;
- system;
- LLM;
- AI agent.

Must demonstrate:

- CRE CLI simulation;
- or live deployment.

### Target Signal Passport Workflow

```text
Passport Refresh
      ↓
CRE
      ↓
Envio / Data Source
      ↓
Nansen
      ↓
Deterministic Engine
      ↓
New Passport Version
      ↓
Monad
```

### Required Evidence

- [ ] Workflow code exists
- [ ] CRE meaningfully orchestrates components
- [ ] Successful simulation OR deployment
- [ ] Output/logs retained
- [ ] Demo shown

Do not pursue before P0 is stable.

---

## 10. Qwen 3.8 Max — Conditional Bounty

### Requirement

Qwen must demonstrate genuine agentic behavior:

- planning;
- tool use;
- multi-step execution;
- depth beyond one prompt/response.

### Target Tools

```text
discoverAgents
getPassport
getEvidence
verifyPassport
evaluatePolicy
comparePassports
```

### Required Evidence

- [ ] Qwen 3.8 Max actually used
- [ ] Agent chooses tools
- [ ] Multi-step task executed
- [ ] Monad-connected product works
- [ ] Integration depth is demonstrable
- [ ] Required article/blog post published

### Kill Rule

Drop Qwen work if it threatens:

- P0 reliability;
- Monad publication;
- portability;
- developer API;
- external integration;
- submission readiness.

---

## 11. Community Team Project

Keep selected.

Do not change product architecture to qualify.

Portal/profile information should be completed honestly.

Let organizers/judges determine eligibility.

---

## 12. Non-Bounty / Optional Technology

### EAS

May be used for claim-level attestations if helpful.

Not required for P0.

### ERC-8004

Core ecosystem interoperability for agent identity.

Signal Passport should complement it rather than replace it.

### x402

Potential future transaction integration.

Not required for core P0.

---

## 13. Sponsor Completion Record

For every selected sponsor maintain:

```text
Sponsor:
Exact SDK/API/tool:
Code location:
Product feature powered:
Test performed:
Live verification:
Demo moment:
Documentation:
Requirement satisfied: YES / NO
Known limitation:
```

A sponsor integration is not complete merely because:

- package installed;
- API key created;
- test request succeeded;
- logo appears in UI.

---

## 14. Portability Test

Before P0 acceptance:

1. Generate Passport.
2. Publish Passport.
3. Stop/bypass generator.
4. Open independent consumer.
5. Retrieve/import Passport.
6. Recompute integrity.
7. Verify against Monad.
8. Display evidence.
9. Apply policy.
10. Confirm no analysis reran.

Failure means portability is incomplete.

---

## 15. Deterministic Truth Gate

Before merging reputation logic:

- [ ] Calculation implemented in deterministic code
- [ ] Formula documented
- [ ] Evidence inputs explicit
- [ ] Tests reproduce expected result
- [ ] AI cannot change value
- [ ] Coverage limitations preserved
- [ ] Unsupported inference avoided

If AI determines the factual metric:

**FAIL**

---

## 16. Developer Experience Gate

Before submission:

- [ ] API documented
- [ ] Passport schema documented
- [ ] Contract address documented
- [ ] Network documented
- [ ] Verification flow documented
- [ ] Quickstart works
- [ ] Example integration works
- [ ] Errors are understandable

Goal:

> A new developer should be able to retrieve/verify a Passport without understanding the internal scoring pipeline.

---

## 17. External Adoption Objective

Before final submission attempt:

- [ ] Identify at least 3 relevant agent builders
- [ ] Show Signal Passport to them
- [ ] Request product feedback
- [ ] Offer API/SDK integration
- [ ] Record feedback
- [ ] Attempt at least one external integration

Ideal outcome:

> Another Metropolis team uses Signal Passport.

---

## 18. Security Rules

Never commit:

- wallet private keys;
- seed phrases;
- API secrets;
- Envio tokens;
- Nansen keys;
- Alchemy secrets;
- Dynamic secrets;
- Chainlink secrets;
- Qwen/API credentials.

Use environment variables.

Review entire public repo before final submission.

---

## 19. P0 Before P1 Rule

Priority:

1. evidence ingestion;
2. normalization;
3. deterministic observations;
4. Passport generation;
5. Monad publication;
6. verification;
7. portability;
8. trust policy;
9. developer API/docs;
10. sponsor P0 integrations;
11. external integration;
12. CRE;
13. Qwen;
14. optional extras.

Never sacrifice core reliability for sponsor count.

---

## 20. Final Judging Audit

Before submission score internally:

```text
Technical Execution          /20
Design & Craft               /20
Originality & Track Insight  /15
Founder & Market Readiness   /25
Traction & Path Forward      /20
---------------------------------
TOTAL                       /100
```

Target internal score:

**85+/100**

---

## 21. Final Decision Test

Before prioritizing any feature ask:

> Does this make Signal Passport a more credible portable economic-history primitive that another developer would actually integrate?

If not, do not prioritize it.