# Signal Passport Monad - STATUS

Last updated: October 7, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives new product work. No runtime dependency on references.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Signal Passport provides portable evidence-backed history;
the consumer supplies trust policy. No universal trust score.

## Current milestone: M2 - Envio Monad Evidence Pipeline

**ACCEPTED** for the bounded evidence ingestion scope using explicitly selected Envio
JSON transport on Windows. Implemented, verified and evidence reviewed locally. Changes
are uncommitted for owner review. Full report: `docs/verification/MONAD-M2.md`.

| Milestone | State |
|---|---|
| M0 / M1 | Accepted; historical verification preserved |
| M0.5 | Accepted; independent foundation at ea30c95 |
| M2 | Accepted; 89 tests, live Envio evidence and independent RPC cross-check |
| M3 | Not started; requires separate instruction |

## Working - verified

- M1 read-only ERC-8004 resolution with separate owner/registry-wallet semantics.
- Envio HyperSync direct outgoing transactions for the current registry-designated
  wallet; unset wallet fails explicitly with no owner/metadata fallback.
- Validated normalization, stable chain:hash IDs, exact decimal block/value strings,
  block-header timestamps, nullable recipient, observed status and deduplication.
- Provenance, frozen half-open bounds, continuation/guard metadata; complete/partial/
  unknown coverage separate from errors and valid empty results.
- Official client adapter plus explicit documented Envio JSON transport. JSON live
  verified; native SDK cannot load on Windows (published binaries are Linux/macOS only).
- Existing v1 schemas, canonical serialization, digest and offline consumer unchanged.
- **89 tests / 4 suites / 89 passed / 0 failed, cancelled, skipped or todo**;
  includes 57 inherited tests and 32 new M2 tests. Type checking and build pass.
- Compiled M2 CLI and independent RPC cross-check pass. npm dependency tree healthy.

## Live proof

Primary agent 2, chain 10143; registry `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
Registry agentWallet `0xf043b0d473a2edd7c5d6f4d931334096b77a7edc`.
Envio endpoint `https://monad-testnet.hypersync.xyz`.
Frozen [10830000, 68955393): 2 raw / 2 normalized / complete_for_query.
Captured October 7, 2026; final compiled rerun 2026-10-07T11:24:43.783Z matched.
Additional agent-1 sample 1 / 1; recent agent-2 window valid zero / complete_for_query.
Both primary transactions plus secondary sample independently matched official Monad RPC
on hash, block, from/to, value, timestamp and status: **3 / 3 matched**.
Evidence: `fixtures/real/monad-m2/`; cross-check and selection in `docs/verification/`.
These are sparse historical direct transactions, not evidence of recent commerce.

## Environment and security

Node v24.19.0, npm 11.17.0, Windows/PowerShell.
Runtime: @envio-dev/hypersync-client 1.4.1, zod 4.6.2, js-sha3 0.13.0.
Development: TypeScript 5.9.3, tsx 4.23.13, @types/node 24.13.4.
ENVIO_API_TOKEN is present in ignored/untracked .env.local; never printed or copied.
Use explicit `node --env-file=.env.local ...` for the M2 CLI. .env.example is blank.
Exact token scan found no occurrence in deliverables. Reference credentials not read.
No Next.js/React apps, no application builds or servers; library/CLI build verified.

## Git and reference state

Local branch `monad-metropolis`, starting/current HEAD
`ea30c95de8a496f6ff774bc67c7e3c2bb7ce48b5`.
Bootstrap is published to `origin/signal-passport-monad`; older remote
`origin/monad-metropolis` remains preserved. M2 changes are uncommitted/unpushed.
Both reference source trees, Git metadata, HEAD and status remain unchanged.
Workspace STATUS updated; historical M0/M1/M0.5 reports preserved.

## Known limitations

Native SDK execution is not verified on this Windows host; explicit JSON is used without
fallback. Coverage means provider query exhaustion, not lifetime/finality/consensus.
Current registry association is not proof of historical wallet ownership. Reorg guards
and conflicting rows are checked, but no continuous rollback/reindex service exists.
Only outgoing direct transactions; no internal/log/token-transfer/business interpretation.
Old v1 wallet envelope remains a compatibility contract; future agent Passport integration
needs a deliberate version plan. Inherited publication labels reflect metadata only.
M1 metadata/registration restrictions remain unchanged. Envio's full sponsor requirement
for Passport observations/demo is not yet complete. No M3/reputation/metrics, Nansen,
Dynamic, Alchemy sponsor feature, contracts, policies, publication, CRE, Qwen or UI work.

## Exact next action

Review the uncommitted M2 changes and evidence. M3 is ready for a separately requested,
bounded deterministic-observation design/implementation, with evidence references and
coverage preserved. Do not start it or commit/push M2 without instruction.
