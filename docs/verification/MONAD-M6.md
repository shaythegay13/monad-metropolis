# M6 - Consumer Trust Policies + Agent Comparison

October 8, 2026. Verdict: **ACCEPTED - bounded M6 functional scope**. The owner confirmed
the remaining Dynamic/MetaMask regression checks on the M6 working tree. Comparison
browser behavior is agent-observed; wallet regression results are owner-reported.
No M7 implementation, new blockchain transaction, push or M6 commit occurred.

## Accepted M5 commit

Reviewed the accepted M5 changes, reran all 193 tests (193 passed, 0 failed, 4 suites,
2764.9141 ms), and ran the existing actual-value secret scan before and after staging.
Zero secret matches; `.env.local` ignored. Normalized two text files' CRLF whitespace
before committing only this independent active repository:

`3a427c1634ed0feae8c529fd9c1a8550e60e6e96`

`feat: add Dynamic wallet integration and web app`

Branch: `monad-metropolis`. Clean immediately after commit. No push or history rewrite.
M6 changes remain unstaged/uncommitted for owner review. Workspace STATUS is outside Git.

## Policy contract and verification preconditions

Files: `packages/policy/src/{schema,evaluate,compare,index,http}.ts`.
Strict schema (unknown fields reject):

```typescript
interface ConsumerPolicy {
  policyVersion: "1.0.0";
  minimumObservedTransactions?: number;
  minimumActiveUtcDays?: number;
  minimumUniqueRecipientAddresses?: number;
  requireCompleteCoverage?: boolean;
  requireLocalIntegrity?: boolean;
  requireMonadPublication?: boolean;
}
```

Numbers must be nonnegative safe integers; numeric strings, negative/fractional/nonfinite
or unsafe values reject. Production metric IDs are `observed_transaction_count`,
`active_utc_days`, and `unique_recipient_addresses`. No unsupported economic metric or
universal score/ranking is accepted. Omitted/false requirements are inactive except local
integrity, which is an unconditional safety precondition and cannot be disabled.
An otherwise empty policy means only that this local-integrity precondition is satisfied.

`verifyCandidate(id, raw, chain?)` snapshots data, invokes existing independent local
validation, and optionally existing independent Monad verification. Frozen runtime-bound
contexts cannot be forged by passing JSON claiming `verified:true`; deserialized data
must be verified again. Policy evaluation consumes only these contexts. RPC and Registry
trust remain consumer-controlled dependencies; HTTP clients cannot override them.
No analysis, evidence acquisition, signing or new metric calculation occurs.

| Check | PASS | FAIL | INSUFFICIENT_EVIDENCE |
|---|---|---|---|
| Local integrity (mandatory) | Schema/references/digest valid | Invalid schema/references/digest | Not used: invalid data fails this prerequisite |
| Numeric minimum | Complete query and actual >= minimum | Complete query and actual < minimum | Partial/unknown query or no validated metric |
| Complete coverage | complete_for_query | Known partial | Unknown/unvalidated coverage |
| Monad publication | Independently matching record/provenance | Confirmed missing record or hash mismatch | RPC failure, unverified Registry or not checked |

No partial-lower-bound semantics in policy v1: even a sufficient observed partial count
remains indeterminate for numeric requirements. Missing required metrics or wrong types
invalidate the existing strict Passport; their numeric checks remain insufficient, and
the mandatory integrity failure prevents eligibility. No missing value becomes zero.

Overall precedence: **any FAIL => NOT_SATISFIED; otherwise any INSUFFICIENT_EVIDENCE =>
INDETERMINATE; otherwise SATISFIED**. All checks remain visible even when another fails.
A failed policy is not an adverse judgment about the agent.

Results retain agent ID, Passport version/digest, local integrity, publication snapshot,
coverage, scope, limitations, generation/retrieval/activity dates, individual checks,
metric IDs, evidence IDs and explanations. Invalid artifact identity/scope is null rather
than presented as verified. Integrity is not source-data truth or metric recalculation.

## Comparison methodology and real results

`compareCandidates` accepts 2-10 independently evaluated candidates using the same policy.
Duplicate IDs, duplicate subject agents (including different versions) and mixed policies
reject. Lexical candidate-ID output order is reproducible and does not express preference.
Multiple satisfying candidates stay equally eligible. Results do not normalize different
query scopes or imply that transaction counts establish commerce.

**Important schema/version distinction:** Agent 2's existing `agent-2-passport-v2.json`
uses schema 2.0.0 but its actual Passport version is **1**. It is preserved byte-for-byte.
Agent 2072's published artifact is schema 2.0.0, Passport version **2**.

| Real agent | Observed transactions / UTC days / recipient addresses | Observed activity | Publication |
|---|---|---|---|
| 2072 | 4 / 1 / 2 | 2026-10-08 01:36:53 to 01:38:02 UTC | Version 2 independently verified |
| 2 | 2 / 1 / 1 | 2026-02-05 13:17:09 to 13:19:29 UTC | Version 1 confirmed absent at checked Registry snapshot |

Both artifacts have valid local integrity and complete_for_query coverage, but query
scopes and evidence age differ. These are frozen history, not live activity or lifetime
coverage. Agent 2072's observations concern identity management, deployment/publication;
Agent 2's history is not embellished. Recipient addresses are not independent counterparties.

`MONAD-M6-live.json` records fresh read-only API outcomes:
- Modest example (2 transactions, 1 UTC day, 1 recipient, complete coverage, publication):
  Agent 2072 SATISFIED; Agent 2 NOT_SATISFIED because publication is absent.
- Strict example (10 transactions + publication): both NOT_SATISFIED. Agent 2072's
  published Passport does not override a failed numeric requirement.
- Local example (2 transactions + mandatory integrity): both SATISFIED, equally eligible;
  Agent 2's absent publication remains explicitly visible.

The published digest remains
`0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`;
publisher `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`, Registry
`0x7d9cc86196241485cf1efaf8a96c7819ea95b194`, chain 10143. No transaction was sent.
Each verifier pins its own read snapshot; candidates can have different checked blocks.
Determinism means fixed verified inputs/policy give the same result, not that fresh chain
reads return the same block forever.

## Acceptance fixtures and developer portability

`fixtures/policy/examples.json` lists real input paths, exact example policies and labeled
synthetic cases. Tests derive synthetic partial/unknown/zero datasets with recomputed
local digests; none are presented as real captures or live publications. Synthetic RPC
transports cover missing/mismatch/outage and never send transactions. Real publication
absence/presence is separately established in live evidence.

`MONAD-M6-offline.json` and the compiled `scripts/evaluate-policy.ts` demonstrate reuse
without web UI, Envio, generation or wallet connection. CLI input is
`{policy,candidates:[{candidateId,passport}]}`; optional trusted deployment file enables
read-only Alchemy verification. Offline publication is not_checked, never false absence.
README includes direct library usage. Existing consumer/publication/schema libraries and
historical fixture bytes remain unchanged.

## Frontend and API

`/compare` has two inspectable real artifacts, example policies, editable numeric and
coverage/publication controls, explicit local/publication/coverage states, activity dates,
criterion explanations, evidence references and structured results. Any setting change
clears prior results; controls disable during verification. Existing light UI is retained.
M5 changes only by addition of a navigation link; its publication logic is unchanged.

GET `/api/policy`: unchanged real candidate artifacts. POST: strict request envelope,
1-10 candidates, unique IDs, supported policy only, same-origin JSON, streamed 2 MB limit,
5-second body deadline, 20 requests/minute/process, 2 active requests/process. Fixed trust
record and read-only RPC allowlist; 80-call cap and 20-second budget for starting calls,
plus the existing per-RPC timeout for a final in-flight request. No provider error details,
URLs, tokens or stacks are serialized. No arbitrary fetch or RPC proxy. Errors use
400/403/413/415/422/429. Limits are local per-process protection, not distributed security.

## Browser verification

Agent-observed via Codex in-app browser on http://127.0.0.1:3050/compare:
- Page and two real candidate inspection controls render.
- Modest policy shows Agent 2072 eligible, Agent 2 ineligible due to absent publication.
- Strict preset changes threshold to 10 and clears old results; both then fail.
- Local preset makes both eligible without hiding publication differences.
- Custom numeric input 5 and publication checkbox update results; both fail count.
- Scope/limitations disclosure expands and preserves all four required limitations.
- Light-background layout visually inspected; controls disable during read-only requests.
- No wallet/signature request during comparison. API transport permits only read methods.

Initial in-app navigation timed out while compilation completed; the same tab subsequently
loaded successfully. One exact-label selector did not match; role-based control selection
worked. These were tooling/compilation conditions, not claimed app failures.
Connected Edge automation returned browser unavailable. The owner subsequently confirmed
the requested M6 completion checks: Dynamic connects wallet ending B51DD on Monad Testnet
10143, version 1 remains labeled historical, and latest version 2 prevents another
publication. Owner response: "i can confirm the checks for finishing m6". These are fresh
owner-reported results, not agent-observed wallet testing or reused M5 confirmations.
No live rejection/publication was attempted. Automated M5 tests remain intact.

## Verification results

Final tests: **224 tests, 4 suites, 224 passed, 0 failed/cancelled/skipped/todo;
3177.4648 ms**, `npm.cmd test`, exit 0. All 193 inherited tests preserved; 31 M6 tests.
`npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run web:typecheck`: exit 0.
`npm.cmd ls --all --json`: exit 0. `npm.cmd audit --json`: exit 1, 19 findings
(15 moderate, 4 high, 0 critical). No dependency manifest/lock changes in M6.
Final production build, secret/reference and bundle audit evidence recorded separately.
HTTP /, /compare, /api/passport return 200; foreign-origin policy POST returns 403.
M5 API still reads latest version 2 and independently verifies historical v1.

Tests cover schema rejection, thresholds/zero, missing/wrong metric types, partial/unknown
coverage, absent publication/RPC outage/hash mismatch, tampering/forged assertions,
immutable verification contexts, deterministic outcomes, input-order independence,
duplicate subjects/IDs, unequal policies, honest distinct-agent comparison, ties,
limitations, API validation/body/rate/concurrency limits and client/server boundaries.
Browser interaction supplies actual frontend policy-state integration evidence.

## Security disposition and limitations

M5's documented 19 findings remain: no new dependency installed or forced upgrade.
The four high affected-package entries share the existing optional Solana/bigint-buffer
root finding. This is not a clean audit or production security approval. Renewed M6
instrumented module/trace checks determine reachability for this build; historical M5
reports are not overwritten. Public deployment requires release-specific origin, abuse,
rate-limit and dependency-risk review. No deployment was authorized or performed.

Coverage and metrics are publisher-supplied deterministic observations validated for
integrity/references; the consumer does not rerun analysis or prove source truth. No
freshness, economic-counterparty, settlement, commerce or quality policy is supported.
Only schema 2.0.0 agent Passports enter M6; existing v1 compatibility remains elsewhere.
No content-URI hosting, new provider, AI, Nansen, CRE, x402 or contract changes.

## Verdict and next action

**ACCEPTED - bounded M6 functional scope.** The recorded automated/build, independent
read-only, agent-observed comparison and owner-reported wallet regression evidence satisfy
the M6 functional acceptance requirements. The existing dependency-risk disposition and
public-release limitations remain explicit; this is not production security approval.
M6 is uncommitted for owner review; no push or M7 implementation.

Proposed M7 only: define a bounded developer integration/demo-readiness milestone around
the verified consumer flow, including artifact retrieval and release security controls,
subject to owner direction and remaining P0 sponsor requirements. No M7 work has begun.


## Final build and preservation evidence

Final instrumented `npm.cmd run web:build` exited 0: compilation 118 seconds,
TypeScript 11.6 seconds, 4/4 static pages; routes /, /_not-found, /compare, /api/passport,
/api/policy. `MONAD-M6-checks.json` records exact commands/results. The four existing high
entries each have zero emitted browser/Node/Edge modules and zero deployment-trace
matches in this build (`MONAD-M6-bundle-audit.json`). No new compatible fix is claimed.
The M5 bounded testnet disposition remains applicable to this inspected artifact;
production approval and public release review remain outstanding.

`MONAD-M6-security-checks.json`: ignored environment file, zero staged files, zero actual
secret-value matches, zero forbidden browser-secret markers. Both reference repositories'
HEAD, status, 175 source files and 401 Git metadata files match the prior snapshot
(`MONAD-M6-reference-checks.json`). Existing real fixtures, validators, publication logic,
dependency manifests and inherited tests have no diff against accepted M5.
An initial ignored verification-helper copy used the wrong Windows text encoding and
failed to parse; regenerated helpers with explicit UTF-8, then all three scans passed.
This did not change product code or conceal a failing test.


Final production runtime on http://127.0.0.1:3051 also passes HTTP /, /compare and
/api/passport checks and all three live policy examples; foreign-origin POST is 403.
`MONAD-M6-production-http.json` records these independent production-path observations.
The existing development app remains at http://127.0.0.1:3050 for the owner's wallet QA.
The production comparison page renders and runs the modest example in the agent browser.

## Complete M6 changed-file list

```text
README.md
STATUS.md
apps/web/app/api/policy/route.ts
apps/web/app/compare/compare-app.tsx
apps/web/app/compare/page.tsx
apps/web/app/passport-app.tsx
apps/web/lib/policy-server.ts
docs/ARCHITECTURE.md
docs/verification/MONAD-M6-audit.json
docs/verification/MONAD-M6-bundle-audit.json
docs/verification/MONAD-M6-checks.json
docs/verification/MONAD-M6-live.json
docs/verification/MONAD-M6-offline.json
docs/verification/MONAD-M6-production-http.json
docs/verification/MONAD-M6-reference-checks.json
docs/verification/MONAD-M6-security-checks.json
docs/verification/MONAD-M6.md
fixtures/policy/examples.json
packages/policy/src/compare.ts
packages/policy/src/evaluate.ts
packages/policy/src/http.ts
packages/policy/src/index.ts
packages/policy/src/schema.ts
scripts/evaluate-policy.ts
tests/policy.test.ts
```

Workspace routing only: `../STATUS.md`. Ignored runtime/build helpers are not deliverables.
