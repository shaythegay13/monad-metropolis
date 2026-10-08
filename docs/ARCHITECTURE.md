> Active project: `signal-passport-monad/`. This repository has independent Git history.
> `../signal-passport/` and `../ledgerlens/` are prior hackathon projects and READ ONLY
> references. New product implementation belongs only in this repository. Neither is
> a runtime, build or test dependency. This M0.5 correction supersedes the earlier
> decision to develop Monad inside the original Signal Passport repository.



# Signal Passport — Technical Architecture

**Version:** Monad Metropolis v1  
**Last Updated:** October 8, 2026

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
as a Monad agent Passport. M3 now adds the separate explicit agent schema 2.0.0 below.
All modules use in-repository relative imports; tsc emits independently runnable Node ESM.
Runtime npm dependencies are zod, js-sha3 and @envio-dev/hypersync-client. No workspace orchestrator required.
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
wallet Passport. M3 adds a separate explicit 2.0.0 envelope, described below. The extracted consumer library imports schema/verification only; it never imports
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

### Implemented M2 - bounded Monad Testnet transaction ingestion

`packages/activity/src/envio.ts` owns HyperSync access, authentication, the fixed
`https://monad-testnet.hypersync.xyz` endpoint and provider-format decoding. The official
Node client is pinned to 1.4.1. Its published native binaries exclude Windows; the
explicit `json` transport uses Envio's documented POST `/query` API for Windows live
verification. `native` remains the adapter default on supported hosts. There is no
automatic transport/provider fallback. Native execution has not been live verified here.

Flow: accepted M1 resolution -> validated current registry `agentWallet` -> sender-only
HyperSync query -> provider validation -> normalized `ActivityEvidence` + provenance.
Unset wallet is `agent_wallet_unset`; neither owner nor advertised addresses are used.
M2 is chain 10143 only. Evidence describes transactions by the currently associated
wallet; it does not prove that historical activity occurred while that agent owned it.

Evidence universe: direct EVM transactions whose `from` equals that wallet, with all
observed statuses, within explicit **[fromBlock, toBlock)** bounds. `toBlock` is exclusive.
No logs, incoming transactions, traces, internal calls, token-transfer interpretation,
payments, jobs or settlements. Server-side sender selection is revalidated locally.

`packages/schema/src/activity.ts` extends the reusable evidence contract additively,
without changing the old v1 envelope. It retains timestamp/sender/nullable recipient,
uses the existing chain:lowercase-hash ID, and adds decimal-string block/value, block
hash, typed status and Envio/HyperSync source. Value is raw wei, never floating MON.
Absent value remains absent; absent status is unknown; absent recipient is null (not
proof of contract creation by itself). Unsafe numeric values and malformed data fail.
Block timestamps come from matching block headers, not retrieval time.

`normalize.ts` validates and deduplicates by the existing evidence ID. Conflicting rows
or block hashes fail; complete page acceptance is atomic. Output order is block then
transaction hash. Provider types never become canonical product schema.
`index.ts` loops with nextBlock, including empty intermediate pages, until the declared
range is exhausted. Repeated identical rows are deduplicated; new rows behind the cursor
or at/after the next cursor are rejected. Archive-height contradictions fail. Returned
rollback guards are retained and adjacent guard mismatches reject changed chain segments.
This is bounded historical scanning, not a general reorg-following indexer or finality proof.

Coverage is complete_for_query only on valid exhaustion; page/record limits or a later
failure preserve partial coverage. Missing continuation gives unknown. Errors have a
separate state/code even if some evidence exists. A first-request error is unknown
coverage, never a valid zero. A successful exhausted empty result is valid zero activity.
Provenance includes agent/identity snapshot, network/chain, wallet, fixed boundaries,
transport, endpoint, start/retrieval times, operational row counts, stop reason, cursors,
archive heights and rollback metadata. The CLI fixture retains selected raw responses.

JSON requests have a 30-second deadline, 16 MiB response cap and reject redirects.
The loop defaults to 100 pages (maximum 1000) and 100,000 normalized records. Limits/errors
are explicit. Native requests have a 30-second timeout and no retries. Error messages
omit raw provider/native exceptions, bodies, configured URLs and credentials.
`ENVIO_API_TOKEN` comes from the process environment; the documented CLI command explicitly
loads the active repo's ignored `.env.local`. No reference-project environment is read.

The verification CLI requires frozen bounds and an explicit transport. Artifacts are
created exclusively (existing files are not overwritten) and checked for the token before
writing. `scripts/cross-check-envio-activity.ts` independently checks a bounded sample
against official Monad RPC; it never replaces Envio ingestion. Real captures and synthetic
unit fixtures are separately labeled. The offline consumer still imports schema and
verification only, with no activity/provider dependency.

Acceptance evidence: `verification/MONAD-M2.md`. M2 adds no economic observations,
reputation, policy, Passport generation or publication. The Envio bounty's complete
observations/demo requirements remain future P0 work.

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

## Implemented M3 - Agent Passport schema 2.0.0

M3 deliberately introduces `packages/schema/src/agent-passport.ts`, additive to the
unchanged v1 wallet bundle. The v2 envelope uses `schemaVersion: "2.0.0"`; v1 continues
using its original `schema_version: "1.0.0"`. Dispatch is explicit; a relabeled v1 is
not a v2. Both versions use the original payload-only canonical SHA-256 implementation.
No new hashing algorithm, publication field, AI explanation or policy is introduced.

`packages/passport/src/generate.ts` accepts M1 AgentIdentity, the M2 ActivityRetrievalResult
and explicit generation metadata. It validates the subject/wallet/identity snapshot,
query scope, evidence, counts and continuation consistency before generation. Provider
error results are rejected even if they retain evidence; a successful partial/unknown
retrieval may produce a clearly labeled Passport. No owner fallback or network access.
The generator canonicalizes address case, deduplicates identical evidence, rejects
conflicting duplicates and sorts evidence/metrics/observations by stable identifiers.

`metrics.ts` contains eight pure reductions (six counts and two optional timestamps):
transaction count, distinct UTC dates, distinct non-null lowercased recipient addresses,
minimum/maximum included timestamp, and literal success/failed/unknown execution counts.
All metric evidenceIds identify the complete included dataset: even a zero matching
status is a reduction over that dataset. Empty data produces six zeros with empty evidence
references supported by explicit scope/coverage; no first/last observation is fabricated.
There is no economic_history_days, concentration, counterparty inference or value/payment
metric. `wallet-observations/1.0.0` is the explicit calculation version.

Every metric has one observation with its fixed neutral label, same value, metric ID,
evidence IDs, evidence count, coverage state and dataset-only interpretation. Payload
`observationOrder` explicitly references observation IDs for consumer presentation order;
it must resolve exactly once to each observation. This keeps presentation order separate
from canonical identifier sorting and supplies an independently checked observation graph.

The canonical payload includes version, stable agent passportId, complete M1 identity
snapshot, observation scope, metrics, observations/order, evidence, coverage, selected
retrieval provenance, structured limitations and explicit generation/version metadata.
Scope binds chain, wallet, current registry designation as of the identity snapshot,
activity universe and decimal-string [fromBlock,toBlockExclusive) bounds. The artifact
says: "Observed activity for the wallet currently designated as this agent's ERC-8004
agentWallet." Four mandatory coded limitations cover historical association, transaction
vs business semantics, address vs counterparty semantics and query-only coverage.
Retrieval provenance/time is deliberately inside the payload hash. Raw provider captures
are retained in M2 fixtures, not copied into the v2 artifact. No credential field exists.

Generation timestamp is passed by the caller; no hidden current-time reads occur in metric
calculation or generation. Version 1 has no previous hash; later versions require an
explicit previousVersionHash. That link is metadata, not an onchain or signature proof.
Canonical serializer and digest source are unchanged; array ordering is prepared by the
generator, never silently altered by the hashing implementation.

The consumer supports both versions. `validate-agent-bundle.ts` checks schema, identifier
uniqueness, subject/scope/count coherence, metric evidence membership, observation metric/
evidence/value/label/coverage links, observation-order references, mandatory limitations
and the original payload's digest. Hashing the original raw payload avoids silently
excluding fields stripped by inherited schema parsing. This consumer imports only schema
and verification; it neither invokes generation nor recalculates metric formulas.
"Passport integrity verified" is not authentication, chain truth or reputation verification.
An internally coherent altered metric/observation plus recomputed digest can pass; tests
explicitly preserve that boundary. Independent correctness can be reproduced through the
separate deterministic generator, not by making the consumer depend on it.

Offline scripts generate from a captured M2 fixture and independently verify the bundle.
M2 agent-2 evidence is immutable ground truth; the derived M3 fixture records its source
hash and explicit generation metadata. Publication, enrichment, policies, new providers
and later milestones are not part of M3. The following generic metric/Passport sketches
remain target architecture; only the explicit M3 schema and eight reductions are implemented.

---

## Implemented M4 - Monad publication and independent reads

`contracts/SignalPassportRegistry.sol` is a minimal non-upgradeable append-only registry.
The immutable Identity Registry is configured at deployment. Every publication requires
`msg.sender == getAgentWallet(agentId)` and a nonzero wallet. There is no owner/operator
fallback. Dependency failure reverts. Version 1 starts history; every later version must
be latest + 1. Zero digest, version zero, duplicates, replacements and skips reject.
The SHA-256 digest is stored directly as bytes32, not hashed again with keccak.

Each record contains digest, optional contentUri, publisher, block number and timestamp.
Agent ID and version are mapping keys; PassportPublished indexes agent/version/digest.
Latest and historical reads are available, as is literal digest equality verification.
No admin, upgrade, deletion, payment, delegate authorization or trust-scoring function.
An external ERC-8004 upgrade or wallet change remains part of the identity trust boundary.

`packages/publication/src` provides fixed-Alchemy testnet configuration, ABI definitions,
bounded RPC reuse, local signing, compilation, publication preparation and independent
verification. The testnet-only writer checks the actual chain before signing and again
before sending, estimates gas, checks balance, bounds maximum fee to 0.2 MON, and records
public transaction recovery metadata before broadcast. It never logs a key, signed
transaction, credential URL or provider error body. Read-only consumers need no signer.
If a submitted transaction is uncertain, inspect its journal/receipt before retrying;
no automatic resubmission exists. Only one bounded operation is performed per CLI call.

The signing key stays local in ethers; all nonce, gas, simulation, broadcast, receipt,
identity and registry reads use Alchemy. `monad-registry.ts` orchestrates preflight,
registration, URI update, capture, deployment and publication. Its explicit cross-check
mode uses public Monad RPC only for independent proof. The existing M1 resolver and M2
capture engine are reused with Alchemy for identity RPC, and existing M3 formulas and
canonical payload bytes are unchanged. Controlled demo agent 2072 replaces Agent 2 only
for the live M4 flow; the historical Agent-2 fixture is preserved.

Publication metadata is a separate artifact; no changes to the strict M3 payload or
bundle schema. Empty contentUri honestly defers public hosting. File import works now;
URI contents, if later hosted, must pass the canonical hash comparison and must not be
trusted merely because a URI was stored. The verifier never fetches contentUri.

`verifyPublishedPassport` accepts independently trusted deployment configuration, checks
chain ID, pins runtime bytecode hash and immutable Identity Registry, and reads the exact
agent/version from the validated bundle at a single checked block. It rechecks the block
hash to reject changed snapshots. It separates localIntegrityValid, publicationFound,
publishedHashMatches, registryVerified and publicationProvenanceVerified. Provider failure
is unknown, not absence. A missing version, wrong hash, wrong registry, invalid local
bundle and provider error remain different results. The publication timestamp/block
and publisher are returned; equality with the current agentWallet is a separate result.
The authorization claim is at publication time, not an assertion that a wallet can never
rotate. A caller must obtain the deployment address/code-hash trust configuration from a
trusted source; arbitrary imported metadata is not a trust root.

`verify-published-passport.ts` is an independent read-only entry point. Its import graph
excludes the generator, activity ingestion, compiler and signing modules. It works with
only Alchemy configured. Local digest matching still does not prove truthful evidence;
onchain matching adds proof of authorized publication under the pinned registry code,
subject to RPC/chain and ERC-8004 trust assumptions. No consensus/light-client proof or
universal reputation verification is claimed.

Toolchain: ethers 6.17.0; solc 0.8.37 standard JSON with optimizer 200 and Paris EVM target;
EthereumJS VM/tx/common/util 10.1.3 for isolated executable contract tests. `tmp` is
explicitly overridden to patched 0.2.7 for compiler tooling. No native Solidity framework
or background development node is required. Exact deployed runtime bytes (including
immutable constructor value) matched the compiler output. See `verification/MONAD-M4.md`.

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

