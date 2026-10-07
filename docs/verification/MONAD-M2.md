# M2 - Envio Monad Evidence Pipeline

Date: October 7, 2026 (America/New_York). Verdict: **ACCEPTED** for the bounded M2
scope, using the explicitly justified Envio JSON transport on Windows. Implemented,
verified and acceptance evidence reviewed. Native SDK execution remains unverified on
this machine; no full Envio bounty completion or M3 implementation is claimed.
Changes are intentionally uncommitted and unpushed for owner review.

## Baseline

Active repository `signal-passport-monad`; branch `monad-metropolis`;
HEAD `ea30c95de8a496f6ff774bc67c7e3c2bb7ce48b5`,
`chore: bootstrap Monad Signal Passport project`. Initial Git status: clean, up to date
with `origin/signal-passport-monad`. The independent bootstrap was already pushed;
existing `origin/monad-metropolis` remains the older M0 lineage. No history changed.

Read workspace AGENTS/CLAUDE/STATUS and active PRD, requirements, architecture,
AGENTS/CLAUDE/STATUS, REUSE and M0/M1/M0.5 reports before coding.
Initial verification: `npm.cmd test` 57 tests / 4 suites / 57 pass / 0 fail, skipped,
cancelled or todo; 506.8125 ms. `node node_modules/typescript/bin/tsc --noEmit` and
`npm.cmd run build` passed. Node v24.19.0, npm 11.17.0, Windows/PowerShell.

## Current official sources checked

Checked October 7, 2026, rather than relying on old project constants:

- [Envio supported networks](https://docs.envio.dev/docs/HyperSync/hypersync-supported-networks):
  Monad Testnet chain 10143; HyperSync `https://monad-testnet.hypersync.xyz`;
  HyperRPC `https://monad-testnet.rpc.hypersync.xyz`. HyperRPC is not used for ingestion.
- [Official clients](https://docs.envio.dev/docs/HyperSync/hypersync-clients):
  official Node package `@envio-dev/hypersync-client`, authenticated client access.
- [Query/response reference](https://docs.envio.dev/docs/HyperSync/hypersync-query):
  sender selection, exclusive upper bound, nextBlock continuation, archive and rollback
  metadata. An empty response is not itself proof of exhaustion.
- [Official HTTP examples](https://docs.envio.dev/docs/HyperSync/hypersync-curl-examples):
  authenticated POST `/query`, snake_case JSON request fields, sender filters and `/height`.
- [Official client source, pinned revision](https://github.com/enviodev/hypersync-client-node/tree/4352acccf629834e9267fb685d6487be83b1a66c):
  package.json and index.d.ts inspected, alongside the installed 1.4.1 files. Current
  constructor is `new HypersyncClient(config)`, with `get` / `getHeight`.
- [Official Monad testnet information](https://docs.monad.xyz/developer-essentials/testnet):
  official page fetched directly after browser extraction failed; confirmed chain 10143,
  MON and `https://testnet-rpc.monad.xyz`. RPC chainId independently matched 10143.

## Dependency and explicit Windows transport decision

Installed exactly `@envio-dev/hypersync-client@1.4.1` in the active repo using
`npm.cmd install --save-exact @envio-dev/hypersync-client@1.4.1 --no-audit --no-fund`.
No additional decoding/HTTP/environment library. Dependency tree is healthy.

The published native targets cover macOS/Linux ARM64 and x64, not Windows. Native import
actually failed with `Cannot find native binding`. Reinstalling would not supply a
Windows binary absent from the package. The official adapter remains available via
explicit `native`; on this machine `json` deliberately selects Envio's documented HTTP
API. This is an explicitly justified alternative under acceptance criterion 4, not
silent fallback or a different provider. The native adapter is type-checked and its
response normalization tested, but no Linux/macOS live execution is claimed.

npm emitted an existing esbuild install-script allowScripts warning; no approval/config
change was made. The real compiled CLI and test runner work. No reference dependencies
or credentials were used.

## Agent selection and evidence universe

M1 freshly resolved both accepted real agents. Agent 1 registry wallet:
`0x133603465adde7c39fa0e6e34b264e1573e1fd08`.
Agent 2 registry wallet: `0xf043b0d473a2edd7c5d6f4d931334096b77a7edc`.
Owner happens to match each wallet but the fields were independently read. Unit tests
cover different owners, unset wallet and invalid identity. Advertisements are not subjects.

Envio height snapshot: **68955493**. Freeze `toBlock = 68955393` (height minus 100),
exclusive. Initial [66955493, 68955393) probes returned zero for both wallets and exhausted
the range. Expanded bounded [0, 68955393) probes found one transaction for agent 1 and
two for agent 2. Agent 2 was selected because it provides two real records; no fabrication
or extra agent search was needed. These wallets have sparse historical activity, not
recent active commerce. Selection requests/responses and identities are preserved in
`MONAD-M2-selection.json`.

Universe: **direct EVM transactions whose sender equals the current registry-designated
agentWallet, all observed statuses, within [fromBlock, toBlock)**. Filtering is performed
server-side and enforced again locally. No incoming transfers, logs, internal transactions,
traces, payments, settlements, completed jobs, reputation or observations are inferred.
Current registry association is not proof of historical association at transaction time.

## Frozen primary acceptance proof

| Field | Value |
|---|---|
| Agent ID | 2 |
| agentWallet | `0xf043b0d473a2edd7c5d6f4d931334096b77a7edc` |
| Chain | Monad Testnet / 10143 |
| HyperSync | `https://monad-testnet.hypersync.xyz` |
| fromBlock inclusive | 10830000 |
| toBlock exclusive | 68955393 (last included block 68955392) |
| Retrieved at | 2026-10-07T11:19:48.882Z |
| Raw rows / normalized records | 2 / 2 |
| Coverage | complete_for_query |
| Continuation / archive height | 68955393 / 68956591 |
| Pages / rollback guard | 1 / null |

The start precedes the first observed agent-2 transaction; the end was frozen before
acceptance retrieval. This range is bounded and does not claim lifetime coverage.
Full captured proof: `../../fixtures/real/monad-m2/agent-2.json`.

Primary public transaction hashes:

- `0x3b16b6493f3bfa522d050a288cb2663b492ea8d9cb570bc871f5ed0f038c83fd`, block 10830286.
- `0x64ddb546e7906959043647ef745b24961260f86a3b3614224d09164ccbe9a2a3`, block 10830621.

Secondary agent-1 proof uses [10827000, 10830000), 1 raw / 1 normalized, complete_for_query:
`0xe8f7f87d50d954daa3dcbc51796afbc76afb23245fd88162d35bbb67d3dc517d`, block 10827961.
All three are successful, zero-native-value direct transactions to the identity registry.
That description is limited to fields; no business purpose/success is inferred.

A separate final CLI capture for agent 2 over [66955493, 68955393) preserves real valid
zero activity in `agent-2-empty.json`. Primary final-code rerun at
2026-10-07T11:24:43.783Z again yielded 2 / 2, complete_for_query and identical evidence.
Real fixtures are immutable captures; replay tests validate them without editing raw rows.

## Architecture and behavior added

M1 AgentIdentity -> require agentWallet -> Envio adapter -> provider-specific page ->
validation/normalization -> standalone ActivityEvidence and retrieval provenance.

- `envio.ts`: pinned endpoint, required token, official native adapter and explicit JSON
  adapter; sender-only query, minimal selected fields, auth/operational/parse errors.
- `normalize.ts`: validates rows and header joins; canonical addresses/hashes; exact
  decimal strings for block/value; UTC timestamps; nullable recipient; optional value;
  success/failed/unknown status; stable chain-scoped IDs; conflict-aware deduplication.
- `index.ts`: bounded continuation loop, atomic page acceptance, subject checks, fixed
  range, raw captures, counts and provenance. Rejects unexpected subjects and cursor
  contradictions. Does not silently filter malformed rows and claim full coverage.
- `coverage.ts`: exhausted -> complete_for_query, intentional limits/later errors ->
  partial, absent completeness metadata/first error -> unknown. Error state is separate.
- `schema/activity.ts`: additive evidence schema, reusing existing ID and evidence schema;
  existing v1 payload/digest/canonical serialization/consumer behavior unchanged.
- CLI resolves M1 live, requires explicit frozen bounds and transport, prints a small
  public sample and can write a new proof. No credential, raw provider error or owner fallback.
- Independent cross-check utility uses Monad RPC only to verify the Envio sample.

Limits: 30-second requests, 16 MiB JSON response cap, no redirects, default 100 pages
(maximum 1000), maximum 100000 normalized records. Limit/error states are explicit.
No hidden retries, other-provider fallback, UI logic, M3 metrics or new publication schema.

## Independent cross-check

`MONAD-M2-cross-check.json` records **3 / 3 matching samples**: both primary agent-2
transactions and the secondary agent-1 transaction. Source is official Monad RPC,
`https://testnet-rpc.monad.xyz`; chain ID independently read as 10143. Checked transaction
hash, block number/hash, from, nullable to, native value, timestamp and receipt status.
No discrepancies. Compiled cross-check repeated after final build: 3 / 3 matched.
This sample verifies correspondence, not cryptographic consensus or exhaustive completeness.

## Failure states and deterministic tests

32 new tests plus 57 inherited tests. Synthetic generated rows/addresses/hashes are
explicitly labeled in tests/activity.test.ts; real fixture replay is separate.

Covered: missing/blank token; HTTP 401/403 authentication; network failure/429/503;
malformed JSON/tables/rows/hash/address/status/header/timestamp/metadata; unsafe or
out-of-range integers; unset wallet/no owner fallback; wrong chain/identity/registry;
wrong sender; nullable/missing recipient and absent value; exact zero/uint256 maximum;
exclusive range boundaries; pagination including empty intermediate pages; duplicate
rows across/in pages and repeated retrieval; conflicting duplicates; valid exhausted
zero; max-page partial; mid-retrieval error plus partial evidence; missing continuation
unknown; stalled/backward/overshooting cursors; impossible archive height; adjacent
rollback mismatches and preserved guards; real capture replay with network forbidden.
Auth failures are controlled unit tests, not deliberate live misuse of the owner's token.

## Exact verification commands/results

| Command | Final result |
|---|---|
| `npm.cmd test` | Exit 0; **89 tests, 4 suites, 89 pass, 0 fail/cancelled/skipped/todo; 566.8754 ms** |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0; packages, tests and both CLIs included |
| `npm.cmd run build` | Exit 0; Node ESM/declarations emitted |
| `npm.cmd ls --depth=0` | Exit 0; all six direct dependencies healthy |
| Compiled primary CLI, explicit json transport | Exit 0; 2 records, complete_for_query |
| Compiled independent cross-check | Exit 0; 3 samples, allMatched true |

Full non-secret command output is in `MONAD-M2-checks.json`. No migrated web applications
exist; application build is not applicable. Library and CLI compilation/runtime were checked.

Intermediate issues, resolved: initial type check found two errors from the obsolete SDK
`.new` form; changed to the installed 1.4.1 constructor. Initial 27 focused tests passed;
expanded focused suite passed 32/32. A verification wrapper hit Windows console encoding
while printing test symbols; tests had passed, but the wrapper stopped before build.
An immediately attempted compiled cross-check consequently lacked emitted output. Fixed
the wrapper output encoding, reran all four final checks, rebuilt, and reran both compiled
live utilities successfully. No final failures are omitted or marked as passing earlier.
The unsupported Windows native SDK remains a disclosed platform limitation.

## Reproduce

From this active repository after `npm.cmd ci` and `npm.cmd run build`:

```powershell
node --env-file=.env.local dist/scripts/verify-envio-agent-activity.js monad-testnet 2 10830000 68955393 json
node --env-file=.env.local dist/scripts/verify-envio-agent-activity.js monad-testnet 1 10827000 10830000 json
node --env-file=.env.local dist/scripts/verify-envio-agent-activity.js monad-testnet 2 66955493 68955393 json
node dist/scripts/cross-check-envio-activity.js dist/new-cross-check.json fixtures/real/monad-m2/agent-2.json fixtures/real/monad-m2/agent-1.json
```

Optional final CLI argument creates a new JSON artifact (existing files refused).
Live identities may change; frozen provider fixtures replay in tests without network.
`native` explicitly selects the official SDK on a supported OS; there is no auto fallback.

## Security and reference preservation

ENVIO_API_TOKEN presence verified without printing it. `.env.local` is ignored by
`.gitignore:4` (`.env.*`) and untracked. `.env.example` contains only the new blank variable
name. Exact configured-token scanning of all tracked/untracked deliverables found zero
matches, including real fixtures, reports, STATUS, source and retained test logs. The CLI
also refuses to serialize an artifact containing its token. No credentials were printed,
committed, pushed, copied from references or persisted in provider errors.

Both reference HEADs, Git status, source hashes and all `.git` file hashes match the
pre-M2 snapshot. Original Signal Passport: 135 non-environment tracked/untracked files
and 211 Git files; LedgerLens: 40 and 190. Reference environment files were deliberately
not read; ignored caches were neither copied nor executed. Two unrelated untracked old
Signal Passport documents remain untouched. See `MONAD-M2-reference-check.json`.
No runtime/build/test path points to either reference. No M0/M1/M0.5 report was rewritten.

## Known limitations and exact M3 readiness

- Evidence is sparse historical registry-directed transactions, not proof of payments,
  ongoing commerce, independent counterparties or successful service delivery.
- Current wallet association does not establish historical agent ownership/control.
- Complete_for_query means the declared provider scan was exhausted; it is not lifetime
  coverage, a consensus proof, an exhaustive RPC audit or guaranteed finality.
- Guard/duplicate consistency checks reject observable conflicts; a general live reorg
  rollback/reindex service is not implemented. Live historical pages had null guards.
- Native SDK path not live verified on Windows; explicit Envio JSON transport is verified.
- No incoming/token/log/trace interpretation, metrics, feedback, enrichment, scores,
  policy, UI, contracts, publication or additional sponsor work.
- Full Envio sponsor completion still requires core Passport observations and demo flow;
  M2 supplies their real evidence foundation only.

Proposed M3, **definition only**: specify and test deterministic, scope-aware descriptive
observations from this normalized evidence, with supporting evidence IDs and explicit
coverage. Use literal address/transaction semantics; do not infer independent counterparties
or business settlements. Establish any Passport schema/version integration deliberately.
M3 requires a separate instruction and has not started.

## Files changed

- `.env.example`
- `README.md`
- `STATUS.md`
- `docs/ARCHITECTURE.md`
- `docs/verification/MONAD-M2-checks.json`
- `docs/verification/MONAD-M2-cross-check.json`
- `docs/verification/MONAD-M2-reference-check.json`
- `docs/verification/MONAD-M2-selection.json`
- `docs/verification/MONAD-M2.md`
- `fixtures/real/monad-m2/README.md`
- `fixtures/real/monad-m2/agent-1.json`
- `fixtures/real/monad-m2/agent-2-empty.json`
- `fixtures/real/monad-m2/agent-2.json`
- `package-lock.json`
- `package.json`
- `packages/activity/src/coverage.ts`
- `packages/activity/src/envio.ts`
- `packages/activity/src/errors.ts`
- `packages/activity/src/index.ts`
- `packages/activity/src/normalize.ts`
- `packages/schema/src/activity.ts`
- `packages/schema/src/index.ts`
- `scripts/cross-check-envio-activity.ts`
- `scripts/verify-envio-agent-activity.ts`
- `tests/activity.test.ts`

Workspace-level `../STATUS.md` is also updated solely for project/milestone routing.
All product changes remain within the active repo; no commit, staging or push performed.
