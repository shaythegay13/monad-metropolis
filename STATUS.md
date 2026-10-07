# Signal Passport Monad - STATUS

Last updated: October 7, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives new product work; no reference runtime dependencies.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Consumer supplies trust policy; no universal trust score.

## Current milestone: M3 - Deterministic Agent Passport Observations

**ACCEPTED** within the bounded captured-evidence scope after local verification and
review of the acceptance evidence. M3 changes remain uncommitted for owner review.
Full report: `docs/verification/MONAD-M3.md`.

| Milestone | State |
|---|---|
| M0 / M1 | Accepted; historical verification preserved |
| M0.5 | Accepted; independent foundation at ea30c95 |
| M2 | Accepted; committed locally at 9dfc4e7; live evidence and RPC proof retained |
| M3 | Accepted; 141 tests pass, real captured-evidence v2 artifact and isolated offline verification |
| M4 | Not started; requires separate instruction |

## Working - verified

- M1 ERC-8004 identity resolution with separate owner/current registry-wallet semantics.
- M2 bounded Envio direct outgoing activity, stable evidence IDs, exact chain values,
  normalization/deduplication, provenance, coverage and explicit error states preserved.
- Explicit Passport schema 2.0.0 alongside unchanged v1 schema and canonical/hash algorithms.
- Eight deterministic dataset metrics and literal observations, each with evidence and
  metric references, calculation version, scope, coverage and structured limitations.
- Empty evidence has six zero counts and no invented first/last activity timestamps.
- Retrieved partial/unknown coverage propagates; provider errors reject generation.
- Real agent-2 captured evidence produces 2 transactions, 1 UTC day, 1 recipient,
  2 successful / 0 failed / 0 unknown EVM executions. First/last:
  2026-02-05T13:17:09.000Z / 2026-02-05T13:19:29.000Z.
- Scope: chain 10143, direct outgoing transactions, blocks [10830000,68955393),
  complete_for_query. Current association is not historical association proof.
- Payload digest: `9963102ba6b529b0c66c6a5a9cb655e3970f825ead27c0e07683492154cda760`.
- Cross-process and compiled reproduction is byte-identical with fixed generation metadata.
- Independent v1/v2 consumer passes with network blocked and generator/providers absent.
- Tamper and dangling evidence/metric/observation reference tests pass.
- **141 tests / 4 suites / 141 pass / 0 fail, cancelled, skipped or todo**;
  typecheck, build and dependency tree exit 0. No M3 dependencies added.

## Real-path verification

M3 replays immutable accepted M2 live captures; no new network retrieval is required or
claimed. M2 retained three successful independent Monad RPC transaction cross-checks.
M3 generated fixture, provenance and exact values: `fixtures/real/monad-m3/`.
Exact checks and runtime outputs: `docs/verification/MONAD-M3-checks.json` and
`docs/verification/MONAD-M3-runtime.json`.

## Environment and security

Node v24.19.0, npm 11.17.0, Windows/PowerShell. Dependencies unchanged from accepted M2.
ENVIO_API_TOKEN remains in ignored/untracked .env.local; never printed or copied.
Final exact-token and recognizable-secret scans found no deliverable matches.
Reference credentials were not read. No application server or UI was introduced.

## Git and reference state

Local branch `monad-metropolis`, HEAD `9dfc4e7e595175dc9d6397a8aa05296da038014d`.
M2 commit: `feat: add Envio Monad activity evidence pipeline`. Not pushed.
Bootstrap ea30c95 remains the published independent foundation on origin/signal-passport-monad.
The older origin/monad-metropolis history remains preserved. M3 is uncommitted/unstaged.
Reference source files, Git metadata, HEAD and status remain unchanged; see
`docs/verification/MONAD-M3-reference-check.json`. Historical reports and M2 captures preserved.
Parent STATUS changes only milestone routing/state.

## Known limitations

Integrity verification establishes structure/references/digest, not authentic origin,
truthful source data, wallet ownership, metric accuracy or onchain publication. A coherent
edited and rehashed payload can pass; the consumer intentionally does not rerun analysis.
Only current wallet association is known. Direct transactions do not prove commerce,
payments or service delivery; recipient addresses are not independent counterparties.
Coverage applies to the declared dataset, not lifetime/finality/consensus. Sparse historical
records support only literal observations. M2 native SDK execution remains unverified on
Windows; explicit JSON transport was used. No full sponsor/demo completion is claimed.
No economic_history_days, concentration, trust score, AI, Nansen, policies, publication,
other sponsor features or final UI have been implemented in M3.

## Exact next action

Owner reviews uncommitted M3 changes and verification evidence. Do not commit or push M3
or begin M4 without instruction. Proposed M4 scope is defined only in the M3 report.
