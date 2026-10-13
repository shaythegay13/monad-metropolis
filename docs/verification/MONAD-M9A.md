# M9A — Independent Chainlink CRE verification

October 12, 2026 (America/New_York). **ACCEPTED for the bounded read-only,
native-simulated CRE integration.** This is not a deployed DON workflow,
signed Chainlink report, production attestation or guarantee of a sponsor award.

M8 remains accepted at https://signal-passport-monad.vercel.app. Its owner-reported
MetaMask connection/account/network/read-only checks remain distinguished from
the independently observed deployment checks in [MONAD-M8.md](MONAD-M8.md).
There was no outstanding M8 blocker and no production change in M9A.
The approved design was saved as [MONAD-M9A-PLAN.md](MONAD-M9A-PLAN.md);
this file records its implementation and verification.

## Implemented behavior

The existing TypeScript cron workflow was extended rather than re-scaffolded.
Its hourly six-field schedule remains `0 0 * * * *`; simulation fires once.

1. CRE `HTTPClient.sendRequest` retrieves the actual hosted Passport, checks
   HTTP success and a 100,000-byte body bound, computes raw-byte SHA-256 and
   aggregates the response identically. Independently pinned raw hashes are
   checked separately from the canonical payload digest.
2. The complete existing Passport v2 schema and evidence/metric/observation
   reference validator run in the workflow. Canonical SHA-256 uses the original
   raw payload, preserving fields that a schema projection might strip.
   There is no generation, analysis, Envio retrieval or backend verification call.
3. CRE `EVMClient.headerByNumber` selects a finalized block. All six contract
   reads use its exact positive bigint height. CRE HTTP RPC checks chain ID,
   the same header/hash and Registry runtime bytecode at that height.
   An exact-block CRE header is rechecked after all reads. There is no latest
   fallback on finality/snapshot failure.
4. Direct CRE EVM reads verify `identityRegistry`, `latestVersion`,
   `getPassportVersion`, `ownerOf`, `getAgentWallet` and `tokenURI`.
   Registry address/runtime hash/identity dependency are independent trust pins.
5. A versioned, schema-validated JSON result separates local integrity,
   authorized historical publication, latest-version status and current identity.
   Each criterion is PASS, FAIL or UNKNOWN. An absent record is `not_found`;
   provider uncertainty is `provider_error`/`unavailable`, never confirmed absence.
   Wallet rotation does not invalidate an otherwise matching historical publication.

The result includes workflow time from `runtime.now()`, artifact URL, byte count,
both hashes, chain/agent/version, snapshot number/hash/finality, publication record,
current identity association, criterion details, limitations and overall outcome.
No universal score, signing, report creation, receiver or write capability exists.

## Verified toolchain and environment

| Item | Actual value |
|---|---|
| CRE CLI | `1.38.0`, checked with `cre version` |
| Installed CRE SDK | `1.23.0`; manifest `^1.22.0`, existing lockfile |
| Bun | x64 `1.4.3`; skill minimum `1.2.21` |
| Login | Existing Signal Passport organization confirmed with `cre whoami` |
| Deployment access | Not enabled; no lifecycle operation attempted |
| Network support | Current tenant supported-chains includes `monad-testnet` |
| Native execution | CRE CLI compilation to WASM, default production limits, private `local-simulation` target |
| RPC | Configured public `https://testnet-rpc.monad.xyz`; no API token/key required |

The project-local Chainlink skill, installed SDK declarations, installed CLI help,
[official EVM read documentation](https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-read-ts)
and [official templates](https://github.com/smartcontractkit/cre-templates) guided
the implementation. No chain selector/address/flag was invented. Network lookup
uses `getNetwork`, and Solidity integers stay bigint until decimal-string output.

## Genuine native simulation results

Both commands ran from `cre-passport-verifier/` with CRE and x64 Bun on PATH:

```text
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0 --config ./config.agent-2.json
```

`--config` resolves relative to the workflow directory in this installed CLI.
Neither command used `--broadcast`, disabled limits or skipped typechecking.

| Result | Simulation A — Agent 2072 v2 | Simulation B — Agent 2 v1 |
|---|---|---|
| Actual execution time UTC | `2026-10-13T02:56:33.460Z` | `2026-10-13T02:57:51.955Z` |
| Chain | `10143` | `10143` |
| Local integrity | Valid | Valid |
| Publication status | `verified` | `not_found` |
| Overall outcome | `verified` | `unpublished` |
| Latest Registry version | `2` | `0` |
| Current wallet/owner/URI match | All true | All true |
| Snapshot height | `70569278` | `70569534` |
| Finality / consistency | finalized / true | finalized / true |
| Downloaded bytes | `19508` | `10199` |
| CLI exit | `0`, outcome separately asserted | `0`, outcome separately asserted |

Snapshot A hash:
`0x6475f4f282326ec28cad6c0f9c01459b5eb2292d8b5138d87075cec04fd3e1fb`.
Snapshot B hash:
`0x23f32fb8991334132c886190091d4ded8fe800e4bbdf6cdba16014321f88ab6d`.

Agent 2072 raw-file hash:
`eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c`.
Canonical digest:
`0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`.
Registry: `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`.
ERC-8004 Registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
Publisher/current wallet: `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.
Existing publication block `69236935`, timestamp `1791457045`, empty content URI.
All 15 criteria pass in A.

Agent 2 raw-file hash:
`d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d`.
Canonical digest:
`0x9963102ba6b529b0c66c6a5a9cb655e3970f825ead27c0e07683492154cda760`.
The exact Registry record is empty. In B, the publication criterion is FAIL;
hash/provenance are UNKNOWN because no publication exists. Local integrity,
reference, chain, Registry and current identity checks pass. Absence is not
fraud, invalid evidence or a universal trust judgment.

Full returned JSON and native logs are retained:
[published result](m9a-simulations/agent-2072-local.json),
[published log](m9a-simulations/agent-2072-local.log),
[unpublished result](m9a-simulations/agent-2-local.json),
[unpublished log](m9a-simulations/agent-2-local.log).
[Simulation manifest](MONAD-M9A-simulation-evidence.json) records exact commands,
binary/config/source/result hashes, environment, tests and initial failures.
The runtime ISO timestamp is UTC; the CLI log prefixes displayed local wall time
with `Z`. Preserve the original logs; use returned `executionTime` as UTC.

## Tests and failure evidence

| Check | Actual result |
|---|---|
| `bun test` in workflow directory | 18 pass, 0 fail; 46 assertions |
| `bun run typecheck` | exit 0 |
| Both native CRE commands above | exit 0 and expected JSON outcomes asserted |
| `npm.cmd test` at repository root | 239 pass, 4 suites, 0 fail/cancel/skip/todo |
| `npm.cmd run typecheck` | exit 0 |
| Credential/diff checks | No credential-pattern matches; no environment files tracked; both diff checks pass |
| Accepted product preservation | No changes under apps/packages/contracts/scripts/tests/fixtures or root dependency/configuration files |
| Reference repositories | HEAD/status/tracked source/Git metadata unchanged in both siblings |

Test logs are retained under `m9a-simulations/`. Focused tests cover retained-digest
tampering, coherently rehashed data versus a different onchain hash, malformed full
schema/reference graph, mismatched subject/version/Registry, integer limits,
byte versus character bounds, failed HTTP, missing/inconsistent publication,
historical/current wallet separation and provider/snapshot failure. Synthetic chain
records and HTTP stubs are unit tests only; the native runs contain no injected
artifact or blockchain fixtures. Invalid evidence/tampering is automated test
evidence, not a claimed third native simulation.

Initial native full-schema validation failed because Zod `.url()` uses the WHATWG
URL constructor, absent in QuickJS. `schema.ts` adapts only `sourceReference` to
the exact URL already required by the accepted reference validator. This is
stricter than generic URL validation, retains all other checks, and changes no
root schema. It uses the same root Zod instance for schema composition; root
`npm ci` is therefore an explicit setup prerequisite. Both final native runs prove
the full adapter and reused pure validators work in WASM.

An initial Agent 2 invocation also failed due to the config override's path base.
Corrected usage is documented above. Initial failure logs are retained, and neither
failed run was counted as successful verification. CLI exit 0 alone was insufficient.

## Changes, security and remaining scope

Implementation changes are confined to `cre-passport-verifier/passport-verifier/`:
`main.ts`, `passport.ts`, new `schema.ts`, `main.test.ts`, three existing target
configs, new `config.agent-2.json`, package name metadata/lockfile and README.
No dependency version was changed or newly installed. Verification documentation,
evidence and active/workspace STATUS were updated; M8 staged closeout files are
preserved separately for owner review.

[Credential/source checks](MONAD-M9A-security-checks.json) and
[reference preservation](MONAD-M9A-reference-checks.json) contain actual results.
No credential file/value was opened for CRE work or copied into configuration,
logs or deliverables. Public RPC/artifact URLs and public contract data are intended.

M8's documented 19 dependency advisories (15 moderate, 4 high) remain unresolved;
this milestone changed no dependency versions and grants no production security
clearance. No website rebuild/redeploy, Git push/commit, paid setting, blockchain
transaction, Passport version, contract deployment or CRE DON lifecycle occurred.
The CLI's default simulation-key notice does not authorize or indicate a broadcast;
the workflow contains no signing/report/write path.

CRE materially serves an external verifier: one trigger coordinates retrieval of
portable offchain evidence, deterministic integrity checks, independently pinned
onchain publication/current identity reads, and a machine-readable outcome without
trusting the website's backend verification answer. It does not recalculate economic
history or replace consumer policy decisions. This is meaningful HTTP+blockchain
orchestration exercised by native CRE CLI, matching the bounded sponsor evidence
requirement in the governing checklist and the owner's approved read-only exception
to its broader optional refresh/publish design. Nansen P0 is not silently completed.

The [judge demo guide](MONAD-M9A-DEMO.md) is ready to reproduce both cases and
the focused tamper tests. The owner still needs to record/present the demo and
complete the official submission; no final bounty award/eligibility guarantee is
claimed. Live DON deployment/attestation is outside this accepted simulation scope.

The owner subsequently reviewed and accepted M9A. Submission preparation adds
the owner-authorized MIT license, confirms reuse rights, and aligns the CRE package's
license metadata. The original simulation manifest preserves its executed metadata
snapshot; only that later license field differs, with runtime/config/schema hashes
unchanged. No new CRE feature or native simulation is claimed for this metadata change.
Git closeout also removes terminal padding/blank EOF from the initial config-path
failure log and root typecheck log. Successful native logs and returned JSON bytes
remain unchanged; no execution value or outcome is edited.

**Next:** the owner-authorized local combined M8/M9A commit, then a separately
approved two-branch push. Submission copy, official portal requirements and recording
outlines are in `docs/submission/`. Do not start M9B automatically, publish another
Passport or alter the accepted public site.
