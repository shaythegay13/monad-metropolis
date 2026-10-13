# M9A — Independent Chainlink CRE verification plan

October 12, 2026. **Approved planning record.** The owner subsequently authorized
implementation; actual completed results are in [MONAD-M9A.md](MONAD-M9A.md).
The remaining text records the preimplementation plan, not current milestone status.
M8 acceptance was reported before this prototype inspection. This document
plans a bounded read-only implementation and native simulation, not a CRE
deployment, blockchain transaction or change to the accepted public app.

## Objective and existing evidence

Demonstrate CRE orchestrating raw Passport retrieval, deterministic integrity
validation, direct Monad Registry/ERC-8004 reads and a structured result.
The workflow must not call `/api/passport`, `/api/policy`, an existing backend
verification endpoint, or the economic-history generator for its answer.

The existing `cre-passport-verifier/passport-verifier/` is reusable:

- A six-field cron trigger (`0 0 * * * *`) invokes CRE `HTTPClient` with
  identical aggregation to retrieve a commit-pinned raw Passport.
- It independently canonicalizes the payload and computes SHA-256 with
  `viem`, checks RPC chain 10143 and Registry bytecode, then uses CRE
  `EVMClient.callContract` for Registry and ERC-8004 contract reads.
- It returns/logs JSON. It contains no report-write, signing or transaction path.
- October 12 inspection: **5 tests passed, 0 failed; TypeScript check passed**.
  Prior October 10 native simulations passed for staging and local targets,
  as recorded in `MONAD-CRE-SETUP.md`; those historical runs are not proof
  of the proposed M9A changes or a deployed DON execution.

Current gaps: the configured URL predates M8 public hosting; validation covers
only a schema subset, not all references; HTTP bytecode and multiple finalized
contract reads are not pinned to one block; most failures throw without a
structured domain result; current wallet/owner/URI equality is conflated with
historical publication validity; native proof/logs need an acceptance package.
The package name still describes a template and should be corrected.

## Boundaries and authoritative sources

Use the project-local `.agents/skills/chainlink-cre-skill/SKILL.md` and its
HTTP, EVM, simulation, concepts and CLI references. Consult the official
[CRE templates](https://github.com/smartcontractkit/cre-templates) and
[TypeScript EVM read guide](https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-read-ts)
for capability patterns; installed SDK types and CLI help are the final
source for version-specific signatures and flags.

The governing PRD describes a broader optional refresh/publish CRE flow and
still lists Nansen as P0. The owner's explicit M9A direction authorizes a
read-only independent verifier after M8, with Nansen assessment later.
This plan records that bounded exception; it does not silently mark overall
P0 complete or authorize refresh, enrichment, publishing or new contracts.

Preserve the public app, registry, Passport bytes/hashes, policy semantics,
security configuration and both read-only sibling repositories. No Nansen,
LLM, signed CRE report, receiver contract, new trigger type or UI feature is
needed. A logged JSON verification result is not a signed DON attestation.

## Implementation sequence — one timeboxed 4–5 hour session

| Order | Work | Acceptance / evidence |
|---|---|---|
| 1 — 20 minutes | Reconfirm toolchain, login, supported Monad Testnet and existing artifact; use existing scaffold/lockfile | No install or re-scaffold unless a demonstrated missing prerequisite exists |
| 2 — 60 minutes | Switch demo target to the canonical raw artifact; enforce bounded bytes and full schema/reference integrity checks | Raw data retrieved through CRE; accepted canonical digest independently recomputed |
| 3 — 75 minutes | Select one finalized block with CRE header capability; pin all reads and bytecode checks to that exact positive bigint block | Result contains real snapshot block/hash; inconsistent snapshot is unavailable, never verified |
| 4 — 60 minutes | Structured outcomes and failure tests, including historical/current-association separation | No fabricated zero activity, absence or successful verification on a provider failure |
| 5 — 45 minutes | Native local/staging simulation and real Agent 2 unpublished case; retain logs/results | CRE CLI WASM execution with real HTTP and EVM reads, no broadcast |
| 6 — 30 minutes | Regression, dependency/secret/source review, concise sponsor demo and verification report | Existing 239-test core baseline preserved; no public-app or blockchain write |

Stop feature expansion at the timebox. If native capability/snapshot behavior
blocks execution, report the exact failure and retain partial evidence rather
than disguising it as a successful integration.

### Retrieval and integrity

Primary URL:
`https://signal-passport-monad.vercel.app/passports/agent-2072-v2-published.json`.
Retain the existing immutable GitHub URL only as an explicitly selected
reproducibility target, not a silent fallback on a failed public fetch.

Use the existing CRE HTTP callback and identical aggregation. Check HTTP
status and `response.body.length` before decoding; cap at the existing
100,000-byte bound. Preserve and report the independently computed raw-file
SHA-256 separately from the canonical payload digest. Expected raw bytes:
`eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c`.

Reuse the existing pure `agentPassportBundleV2Schema` and
`validateAgentPassportReferences` from the active project's schema package
through a CRE-local adapter. Their import graph must remain QuickJS compatible;
verify bundling in native simulation. Do not import the existing consumer
digest implementation, which uses Node crypto, or the analysis/generator.
Use the original supplied payload for hashing, never a schema projection that
could remove fields. Keep the current `viem` SHA-256/canonical path and test
parity with accepted source behavior. Reject malformed references and unsafe
numbers before requesting chain data.

### Independent chain verification

Resolve `monad-testnet` through SDK `getNetwork`; do not invent or hardcode
a selector from a JavaScript-parsed CLI integer. Confirm RPC chain **10143**.
Use `EVMClient.headerByNumber` with `LAST_FINALIZED_BLOCK_NUMBER`, then
the actual header number as a positive bigint for every `callContract`.
The installed SDK supports that header method and exact-block reads. Use its
documented typed BigInt conversion rather than converting Solidity values
through a JavaScript number.

Use HTTP RPC `eth_getCode` at the same exact block number and compare the
header hash with the CRE header. Re-read the exact header after the reads;
disagreement/reorg/provider failure is a structured unavailable result.
Do not silently substitute latest for unavailable finalized data.

Independently pinned M4 trust:

- Registry: `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`.
- Runtime code hash: `0x7a3b3ea5b702aa55c5bfae2cd57cac3598877192945f0d5558792024ca7baa43`.
- ERC-8004 registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
- Agent `2072`, Passport version `2`; expected canonical digest
  `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`.

Read `identityRegistry`, `latestVersion`, `getPassportVersion`, `ownerOf`,
`getAgentWallet` and `tokenURI` through CRE's EVM capability. Check the pinned
identity dependency, version record, digest, nonzero publisher/timestamp,
and publication block no later than the snapshot. Provenance means the
matching record from the independently pinned authorization-enforcing
Registry; do not claim a newly signed report or independently audited source truth.

Report `isLatest` and current ERC-8004 association separately from historical
publication. A wallet rotation or metadata change must not falsely erase a
valid historical publication. The real v2 fixture should show the expected
publisher/current wallet `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.

### Structured output and failure semantics

Define a versioned result schema in the CRE module: artifact URL/raw hash,
agent/Passport version, canonical digest, chain/Registry trust, actual snapshot
block/hash, publication record, current wallet/owner/URI checks, `isLatest`,
per-check PASS/FAIL/UNKNOWN, limitations and overall status. Use decimal strings
for onchain integers and `runtime.now()` for execution time. No score/ranking.

Align publication outcomes with the accepted consumer semantics:
`verified`, `invalid_local`, `invalid_registry`, `not_found`, `hash_mismatch`,
`provider_error`; represent changed/current association independently.
Provider/network uncertainty must never become `not_found` or false success.
Log bounded non-sensitive JSON and return its serialization. Unexpected
capability/consensus failures must remain visibly failed execution, not a
fabricated domain result. Retain real logs and actual returned results.

## Files expected to change in implementation

Only the existing CRE subtree and verification documentation:
`main.ts`, `passport.ts`, `main.test.ts`, the three target JSON configs,
prototype `README.md`, and package metadata. Change `canonical.ts` only if
parity tests identify a genuine issue; retain the locked dependencies unless
a demonstrated compatibility problem requires a justified correction.
Add a real Agent 2 negative-case config and focused tests as needed.

Evidence files: `docs/verification/MONAD-M9A.md`, a structured simulation
result JSON and sanitized native logs. No accepted root application source,
contract, Passport fixture or Vercel/security configuration change is planned.

## Tests and native simulation commands

Current inspection confirmed CRE CLI **v1.38.0**, x64 Bun **1.4.3**, installed
CRE SDK **1.23.0** (manifest range `^1.22.0`, resolved by `bun.lock`). The local
skill requires Bun **1.2.21+**. The current shell lacks CRE/Bun on PATH;
verified binaries exist at the paths below. No reinstall/update was performed.
Tenant `supported-chains` output currently includes `monad-testnet`.

After implementation authorization, use this process-local PowerShell setup:

```powershell
$env:PATH = 'C:\Users\shayb\AppData\Local\Programs\cre;C:\Users\shayb\AppData\Local\Programs\bun-x64\bun-windows-x64;' + $env:PATH
Set-Location 'C:\Users\shayb\Downloads\Signal Passport\signal-passport-monad\cre-passport-verifier'
cre version
bun --version
cre whoami
cre workflow supported-chains --target staging-settings --output json --non-interactive
Push-Location passport-verifier
bun test
bun run typecheck
Pop-Location
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0
cre workflow simulate passport-verifier --target staging-settings --non-interactive --trigger-index 0
```

Then, after creating the planned real Agent 2 configuration:

```powershell
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0 --config ./config.agent-2.json
```

Implementation verification established that `--config` is workflow-relative;
the command above is corrected from the original project-relative assumption.
All flags above were checked against installed CLI help. Keep default
production limits/typechecking. Neither target includes `--broadcast`, a
receiver, a signer or a write capability. Cron fires once during simulation.
Native simulation exercises real configured HTTP/RPC; it does not prove
deployed DON consensus or scheduled production operation. Early Access is
not required for this local simulation acceptance and is not deployment permission.

Add tests for valid fixture, tamper, coherent rehash versus published hash,
malformed schema/references, wrong agent/version/chain/Registry/code hash,
confirmed absence, HTTP/RPC error, snapshot change, latest versus historical,
wallet rotation, integer boundaries and structured result schema. Unit mocks
must be labeled as such. At least happy-path native simulation and the real
Agent 2 unpublished case must have retained output.

## Sponsor evidence and done criteria

Produce a compact demo showing cron invocation, raw artifact GET, locally
computed digest, direct CRE EVM reads at a named block and the structured
result. Show one failing/unpublished case. Include an import/call-path check
that no backend verification answer, generator or analysis engine is called.
Use the existing deployment record and URLs, not fabricated activity.

Acceptance requires full-schema/reference integrity, independent matching
publication/current identity checks, honest failures, passing focused/core
tests, native WASM simulation output, a reproducible README and owner-reviewable
sponsor evidence. It may then be accepted as a **simulated CRE integration**;
deployment, signed DON attestation and Nansen completion remain unclaimed.

This turn inspected/tested the existing prototype only. No M9A source/config
implementation or new native simulation was performed. Await the owner's
instruction to implement this plan.
