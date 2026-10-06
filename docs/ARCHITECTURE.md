> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.



# Signal Passport — Technical Architecture

**Version:** Monad Metropolis v1  
**Last Updated:** October 6, 2026

**Purpose:** Defines how Signal Passport is technically structured. Product scope belongs in `PRD-MONAD.md`.

---

## 1. Architecture Goal

Signal Passport must transform fragmented economic-agent data into a portable artifact that can be independently verified and consumed without rerunning the entire analysis pipeline.

Core architecture:

```text
ERC-8004 Agent
      │
      ├── Identity / Metadata
      │
      ▼
Associated Wallet(s)
      │
      ├──────────────┐
      ▼              ▼
    Envio          Nansen
 Onchain Data     Enrichment
      │              │
      └──────┬───────┘
             ▼
     Normalization Layer
             ▼
   Deterministic Analysis
             ▼
       Metrics + Evidence
             ▼
   Passport Observations
             ▼
    Canonical Passport
             ▼
    Cryptographic Digest
             ▼
      Monad Registry
             │
             ▼
     External Consumer
             │
             ▼
       Trust Policy
```

---

## 2. Dedicated Repository Foundation (M0.5)

Active root: `signal-passport-monad/`; independent Git history and npm install.
Both sibling prior projects are immutable references, never runtime dependencies.

```text
packages/schema        additive AgentIdentity + inherited v1 compatibility schemas
packages/identity      accepted M1 read-only resolver, copied without behavior changes
packages/verification  canonical JSON + payload-only SHA-256
packages/consumer      extracted offline validator; no analysis or identity dependency
scripts                read-only developer CLI
 tests / fixtures      selected compatibility and identity regression evidence
```

No Next.js apps, React, Ethereum/Blockscout ingestion or AI execution were migrated.
Later sections describe the target architecture unless explicitly marked implemented.
The v1 wallet bundle is retained as a compatibility fixture/verification contract, not
as a completed Monad agent Passport. A future schema/version decision is still required.
All modules use in-repository relative imports; tsc emits independently runnable Node ESM.
Only zod and js-sha3 are runtime npm dependencies. No workspace orchestrator required.
See `REUSE.md`, `verification/MONAD-M0.5.md` and `STATUS.md` for the current baseline.

---

## 3. Layer 1 — Subject and Identity

Primary subject types:

```typescript
type SubjectType = "erc8004_agent" | "wallet"
```

M1 identity model (October 6, 2026):

The initial `walletAddresses` sketch was insufficient: it mixed identity ownership,
registry-designated payment wallet and arbitrary off-chain wallet advertisements.
M1 replaces that conceptual sketch with an additive standalone domain object:

```typescript
interface AgentIdentity {
  subjectType: "erc8004_agent"
  agentId: string // canonical decimal uint256, no JavaScript number conversion
  agentRegistry: string // eip155:<chainId>:<lowercase registry address>
  network: "monad-testnet" | "monad-mainnet"
  registryAddress: string
  chainId: number
  ownerAddress: string // ownerOf: ERC-721 control only
  agentWallet?: string // getAgentWallet: registry-designated economic wallet only
  agentWalletStatus: "set" | "unset" // zero address -> absent, never owner fallback
  agentUri: string // original tokenURI, including empty string
  registration: RegistrationResult
  resolution: {
    blockNumber: string
    blockHash: string
    registryCodeHash: string // keccak256 of deployed code, not Passport digest
    resolvedAt: string
  }
}
```

Authoritative implementation: `packages/schema/src/identity.ts`.
`RegistrationResult` records the original source URI, retrieval URL/source where
applicable, warnings and one of `retrieved`, `missing_uri`, `unsupported_uri`,
`blocked_uri`, `unreachable`, `malformed`, `too_large`. Parsed registration preserves
unknown JSON fields but treats all off-chain claims, wallet-like fields, services and
capabilities as advertisements. They never populate `agentWallet` or owner fields.
Optional missing display fields remain missing with warnings; incorrect types fail
parsing. `registeredAt` is omitted: M1 does not scan historical registration events.
Arbitrary onchain metadata keys are not enumerable and are deferred; the reserved
agentWallet key is read via its standard accessor.

`packages/identity/src` is independent of analysis, AI and the consumer. Configuration
binds each network explicitly to its registry and HTTPS RPC endpoint. The resolver
checks the live chain ID and nonempty bytecode, pins all identity reads to one block
number, then checks the block hash again to reject a changed snapshot. Provenance is
an RPC observation, not a consensus proof or a bytecode audit of the implementation.
Only an exact `ERC721NonexistentToken(agentId)` revert during ownerOf means not found;
transport errors, generic reverts, missing bytecode and invalid ABI remain distinct
operational/configuration failures. Metadata failure returns the valid identity plus
its registration result. Failure to read a registry field remains an error, never unset.

Registration retrieval supports bounded JSON data URIs (base64 or percent-encoded),
HTTPS, and IPFS through the explicit `https://ipfs.io/ipfs/` gateway. It accepts at most
256 KiB; HTTPS retrieval has a 10-second deadline, public IPv4 DNS/address checks and
socket address pinning. Redirects, private/reserved destinations, credentials, alternate
ports, compressed bodies and secondary service fetches are not followed. IPv6-only
hosts and other URI schemes are deliberately unsupported. Gateway content is not
independently verified against its CID. RPC calls have 15-second deadlines and 2 MiB
response caps. The RPC override is trusted operator configuration, not agent metadata.

Compatibility: **PassportBundle v1.0.0, its payload, evidence IDs, canonical bytes and
SHA-256 digest scope are unchanged.** AgentIdentity is not inserted into an existing
wallet Passport. A future bundle version/integration decision is required before doing
so. The extracted consumer library imports schema/verification only; it never imports
the resolver. The prior App Two interface remains in the read-only reference repo.
M1 adds no economics, feedback, policy, sponsor functionality, transaction writes or UI.

Sources and reproducible live proof: `docs/verification/MONAD-M1.md`.

Wallet-only fallback:

```typescript
interface WalletSubject {
  subjectType: "wallet"
  walletAddress: string
  chainId: number
}
```

ERC-8004 identity establishes which agent is being referenced.

It does not establish economic quality.

---

## 4. Layer 2 — Wallet Control

Dynamic should provide the production wallet/signing experience.

Responsibilities:

- connect wallet;
- authenticate/control proof where appropriate;
- expose subject wallet address;
- sign Passport publication;
- support Monad transaction flow.

Dynamic must not become responsible for reputation calculations.

---

## 5. Layer 3 — Raw Evidence Acquisition

### Envio

Envio is the primary onchain-data pipeline.

Responsibilities may include:

- historical transactions/events;
- contract interactions;
- ERC-8004 registry events;
- economic activity;
- derived indexed entities.

Output must be transformed into Signal Passport's canonical evidence model.

---

### Nansen

Nansen provides enrichment.

Possible fields:

- address labels;
- counterparty information;
- related wallets;
- protocol context;
- token/asset information;
- supported historical information.

Enrichment records must preserve provider provenance.

---

### Alchemy

Alchemy provides Monad runtime infrastructure.

Responsibilities:

- RPC;
- registry reads;
- registry writes;
- transaction receipts;
- block/transaction lookup where required.

---

## 6. Layer 4 — Normalization

Provider-specific responses must not leak through the system.

Create canonical normalized types.

Suggested:

```typescript
interface NormalizedActivity {
  activityId: string
  subjectAddress: string
  chainId: number
  transactionHash: string
  blockNumber?: string
  timestamp: string
  actionType: string
  counterparty?: string
  contractAddress?: string
  protocol?: string
  asset?: string
  source: EvidenceSource
}
```

Evidence source:

```typescript
interface EvidenceSource {
  provider: "envio" | "nansen" | "alchemy" | "erc8004" | "other"
  sourceType: string
  reference: string
  retrievedAt: string
}
```

---

## 7. Evidence IDs

Evidence IDs must be stable.

Transaction-level:

```text
${chainId}:${transactionHash.toLowerCase()}
```

Log-level:

```text
${chainId}:${transactionHash.toLowerCase()}:${logIndex}
```

Non-transaction evidence should use an explicitly documented deterministic identifier format.

IDs must not depend on:

- array order;
- page number;
- retrieval time;
- UI state.

---

## 8. Metrics Layer

All factual analysis happens here.

Suggested structure:

```typescript
interface Metric {
  metricId: string
  subjectId: string
  metricType: string
  value: string | number
  evidenceIds: string[]
  calculationVersion: string
  calculatedAt: string
}
```

Metric code must be pure/deterministic where possible.

UI code should never become the authoritative place where a metric is calculated.

---

## 9. Initial Metrics

Potential P0 metrics:

```text
economic_history_days
observed_activity_count
unique_counterparty_count
top_counterparty_concentration
erc8004_feedback_count
unique_feedback_provider_count
top_feedback_provider_concentration
settlement_backed_interaction_count
```

Only enable a metric when underlying data supports it.

---

## 10. Observations Layer

Observations are human/developer-readable facts derived from metrics.

Suggested:

```typescript
interface PassportObservation {
  observationId: string
  category: string
  attribute: string
  value: string | number | boolean
  metricIds: string[]
  evidenceIds: string[]
  evidenceCount: number
  coverageStatus: CoverageStatus
  generatedAt: string
}
```

Observations should remain descriptive.

Avoid universal judgments.

---

## 11. Coverage

Supported:

```typescript
type CoverageStatus =
  | "complete_for_query"
  | "partial"
  | "unknown"
```

Operational failures must remain separate.

Never translate:

```text
provider failure
```

into:

```text
zero activity
```

---

## 12. Passport Payload

Suggested:

```typescript
interface PassportPayload {
  schemaVersion: string
  passportId: string
  subject: AgentIdentity | WalletSubject
  observationScope: ObservationScope
  observations: PassportObservation[]
  metrics: Metric[]
  evidence: EvidenceRecord[]
  enrichments: EnrichmentRecord[]
  coverage: CoverageSummary
  generatedAt: string
  version: number
  previousVersionHash?: string
}
```

---

## 13. Passport Bundle

Conceptual:

```typescript
interface PassportBundle {
  schemaVersion: string
  payload: PassportPayload
  integrity: {
    algorithm: "sha256"
    payloadDigest: string
  }
  publication?: {
    chainId: number
    registryAddress: string
    transactionHash: string
    version: number
  }
}
```

The canonical digest should cover deterministic Passport payload content.

Transport/UI metadata should not unexpectedly alter the digest.

---

## 14. Canonical Serialization

Existing canonical JSON behavior should be preserved unless deliberately versioned.

Requirements:

- recursive key ordering;
- deterministic arrays where ordering semantics permit;
- no ambiguous numeric representation;
- stable serialization;
- identical payload produces identical digest across processes.

Any schema-changing serialization update requires a version bump.

---

## 15. Monad Registry

P0 registry should remain minimal.

Conceptual contract behavior:

```solidity
publishPassport(
  bytes32 profileHash,
  string calldata contentUri,
  uint256 version
)
```

Read methods:

```text
getLatestPassport(subject)
getPassportVersion(subject, version)
```

Event:

```text
PassportPublished(
  subject,
  version,
  profileHash,
  contentUri,
  timestamp
)
```

Exact Solidity interface may evolve after implementation research.

---

## 16. Onchain Storage Philosophy

Do not store complete evidence onchain.

Store only what improves:

- ownership;
- versioning;
- integrity;
- public verification;
- portability.

Detailed evidence remains in the portable Passport document.

---

## 17. Independent Verification Flow

Consumer should:

```text
Receive/retrieve Passport
        ↓
Validate schema
        ↓
Validate evidence references
        ↓
Canonicalize payload
        ↓
Recompute digest
        ↓
Compare embedded digest
        ↓
Read Monad publication
        ↓
Compare published profile hash
        ↓
Return verification result
```

Analysis providers must not be required for verification.

---

## 18. Verification Result

Suggested:

```typescript
interface VerificationResult {
  schemaValid: boolean
  evidenceReferencesValid: boolean
  localIntegrityValid: boolean
  monadPublicationFound: boolean
  monadHashMatches: boolean
  versionCurrent: boolean
  errors: string[]
  warnings: string[]
}
```

Never label this as:

> Verified reputation.

Better:

> Passport integrity verified.

---

## 19. Trust Policy Engine

Suggested:

```typescript
interface TrustPolicy {
  policyId: string
  minimumHistoryDays?: number
  minimumObservedCounterparties?: number
  maximumTopCounterpartyConcentration?: number
  minimumFeedbackProviders?: number
  requireMonadVerification?: boolean
}
```

Evaluation:

```typescript
interface PolicyCheck {
  requirement: string
  passed: boolean
  observedValue?: string | number | boolean
  requiredValue?: string | number | boolean
  evidenceIds?: string[]
}
```

Result:

```typescript
interface PolicyResult {
  policyId: string
  satisfied: boolean
  checks: PolicyCheck[]
}
```

Policy evaluation must be deterministic.

---

## 20. AI Layer

Architecture:

```text
Passport
   ↓
Immutable Fact Ledger
   ↓
LLM
   ↓
Structured Response
   ↓
Validation Gate
   ↓
Display
```

AI may explain.

AI may not mutate:

- evidence;
- metrics;
- observations;
- coverage;
- policy results;
- hashes.

---

## 21. Qwen Tool Layer

Conditional tools:

```text
discoverAgents
getAgentIdentity
getPassport
getObservations
getEvidence
verifyPassport
evaluatePolicy
comparePassports
```

Tool output should be structured.

Qwen decisions must be auditable from tool-call history.

---

## 22. CRE Layer

Conditional P1 workflow:

```text
Refresh Request / Trigger
       ↓
CRE
       ↓
Data Acquisition
       ↓
Signal Passport API
       ↓
Generate Version
       ↓
Monad Publish
```

CRE orchestrates.

It does not replace deterministic application logic.

---

## 23. API

Minimum target endpoints:

```text
GET  /agent/{id}
GET  /passport/{subject}
GET  /passport/{subject}/observations
GET  /passport/{subject}/evidence
GET  /passport/{subject}/verify

POST /passport/generate
POST /passport/{subject}/policy/evaluate
POST /passport/{subject}/ask
```

Exact REST paths may evolve, but developer concepts should remain stable.

---

## 24. Consumer App

App Two remains structurally independent.

It may:

- retrieve/import Passport;
- validate schema;
- verify integrity;
- verify Monad publication;
- inspect evidence;
- evaluate trust policy;
- compare Passports.

It must not silently import the main analysis engine and recompute history.

---

## 25. Security Invariants

- Never expose private keys.
- Never commit secrets.
- Never let AI establish factual reputation.
- Never hide partial coverage.
- Never convert provider errors into zero activity.
- Never label bundle integrity as proof that observations are universally “true.”
- Never claim wallet ownership based only on address syntax.
- Never claim independent counterparties unless methodology supports independence.
- Never silently alter canonical serialization.

---

## 26. Architectural Change Rule

Any change affecting:

- subject model;
- evidence IDs;
- metric definitions;
- canonical serialization;
- digest scope;
- Monad registry;
- policy semantics

must update this document before or with implementation.

---

