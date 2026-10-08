# M4 - Monad Passport Registry + Alchemy

Review date: October 8, 2026 (America/New_York). Verdict: **ACCEPTED** for the bounded
testnet milestone after implementation, executable tests and review of the real proof.
M4 remains uncommitted for owner review. No push, mainnet transaction or M5 work.

## M3 preservation and baseline

Accepted M3 was already committed on owner instruction before this milestone:
`60782f17cf40ef4f7fe707558c34bd0ca00221bc`,
`feat: add deterministic agent Passport v2`. The working tree was clean. No duplicate
commit or history rewrite was needed. Branch: `monad-metropolis`, tracking
`origin/signal-passport-monad`; two local commits ahead of the last fetched upstream.

The accepted baseline was rerun: **141 tests, 4 suites, 141 passed, 0 failed/cancelled/
skipped/todo; 1447.1089 ms**. Typecheck, build and dependency checks exited 0.
Exact output: `MONAD-M4-baseline.json`. The Agent-2 M3 fixture, its digest and the M1/M2/M3
implementations remain unchanged. Historical reports are preserved, including their
then-current Git-state statements. M3's proposed Nansen milestone was only a proposal;
the owner's explicit M4 registry/Alchemy instructions govern this work.

## Current official sources and live prerequisites

Sources were checked before coding and pinned/retrieved evidence recorded in
`MONAD-M4-sources.json`:

- [Monad Testnet network information](https://docs.monad.xyz/developer-essentials/testnet).
  Some web-extracted table values require client rendering; chain ID was independently
  checked on Alchemy and the public Monad RPC rather than inferred from an empty table.
- [Alchemy Monad quickstart](https://www.alchemy.com/docs/reference/monad-api-quickstart):
  Monad Testnet chain 10143, MON with 18 decimals, and the testnet Alchemy endpoint form.
- [ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004), currently Draft;
  latest file revision `503591a6e80e6e1affdd6403341e25269141f046`.
- [8004 team's deployment list](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/README.md),
  revision `b9e466c250744a7e06b13dff9d3c2844ed64f825`.
- [Identity Registry implementation](https://github.com/erc-8004/erc-8004-contracts/blob/44c0025fe70d081ebf3da21290e47496cc1acaf0/contracts/IdentityRegistryUpgradeable.sol),
  latest file revision `44c0025fe70d081ebf3da21290e47496cc1acaf0`; byte-identical to the
  implementation inspected at the pinned deployment-list revision.

Verified signatures: `register()`, `register(string)`, `setAgentURI(uint256,string)`,
`getAgentWallet(uint256)` and ERC-721 `ownerOf(uint256)`. Registration initializes
agentWallet to the registering address; a later ownership transfer clears it. Base64
JSON data URIs are permitted. The live owner/wallet reads, not the expectation alone,
were the hard gate for proceeding.

Official Identity Registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
Alchemy returned nonempty 130-byte runtime code; code hash:
`0xd0e45b1d89fa9b6cc7e97c1f155d64180e5c232aaccf9900ef9d4fd738c02b41`.
The deployed proxy's existence is verified; this is not a full audit of its upgrade authority.

All three required environment variables were present. The earlier misconfigured Alchemy
endpoint returned chain 1 and blocked all implementation/writes. After the owner corrected
it, Alchemy reported **10143** and **1 MON** for the dedicated wallet. Envio authenticated
height/query checks passed. No secret value was printed or copied. Public preflight proof:
`fixtures/real/monad-m4/preflight.json`.

## Controlled agent and real transactions

Agent ID: **2072**. Public owner and current registry-designated agentWallet:
`0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.
Agent registry: `eip155:10143:0x8004a818bfb912233c491871b3d84c89a494bd9e`.
The accepted M1 resolver verified agent ID, owner, wallet, URI, registration, chain and
registry through Alchemy. Both owner and wallet match the dedicated signer.

Registration name: **Signal Passport Demo Agent**. The description explicitly limits the
current demo to identity management. No service endpoints, x402, autonomous commerce,
trading or payment capability is advertised. `active:false`, `x402Support:false`,
`supportedTrust:[]`; real ID/registry binding is included. An image was omitted rather
than inventing hosting. The exact base64 data URI and decoded JSON are retained in
`fixtures/real/monad-m4/agent-identity.json` (`agentUri` and `registration` fields).

| Operation | Successful transaction | Block |
|---|---|---|
| register() | `0x40d355cd6ff4a6f4bae9d35944d89be5ed3fba0a51e333b9f1c7daf0ff1cf1e8` | 69126790 |
| setAgentURI | `0xf0472376cf99d0819a08f28e216c39019e96c3c081ec5a4415d3de6857d4140d` | 69126917 |
| Registry deployment | `0x8dcf060f88c31f71a4b675e5c2c2ca6476b8f17ee808d93998838c6f83c53320` | 69126980 |
| Passport version 1 publication | `0x77d5fb75278c92ff6f5a0900e06ea9f297099dddae6dd9bfad926490720a5f38` | 69127019 |

These are the only four live writes. All used Alchemy. Agent 2 was never published or
represented as controlled. Public recovery journals were saved before each broadcast;
receipts and transaction hashes are retained. No signed transaction or key is serialized.

## Controlled evidence and Passport

The unchanged M2 pipeline captured **2 normalized records**, complete_for_query, within
**[69126790,69126918)**. The evidence consists only of registration and URI update.
Later deployment/publication transactions are outside this deliberately frozen scope.
Raw/provider provenance and M1 identity are in
`fixtures/real/monad-m4/agent-2072-activity.json`.

The unchanged M3 generator produced
`fixtures/real/monad-m4/agent-2072-activity.json.passport.json`, schema **2.0.0**, version **1**,
explicit generatedAt `2026-10-08T01:37:40.868Z`.

| M3 observation | Real value |
|---|---|
| Observed transactions | 2 |
| Active UTC days within this dataset | 1 |
| Unique recipient addresses | 1 |
| First observed transaction within this dataset | 2026-10-08T01:36:53.000Z |
| Last observed transaction within this dataset | 2026-10-08T01:37:31.000Z |
| Successful EVM executions observed | 2 |
| Failed EVM executions observed | 0 |
| Unknown EVM execution statuses observed | 0 |

Canonical payload SHA-256 / onchain profileHash (only the prefix differs):

`6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a`

The original M3 semantics, limitations, evidence citations and formulas are preserved.
The fixture reproduces byte-for-byte in a regression test. Artifact file hashes are
recorded separately in `MONAD-M4-artifact-hashes.json`. No synthetic activity was added.

## Registry architecture and tooling

`SignalPassportRegistry.sol` is non-upgradeable, with an immutable Identity Registry.
Only its current nonzero `getAgentWallet(agentId)` may publish. Owner/operator fallback
is forbidden. The read uses Solidity's view/static call; dependency failure or malformed
return data reverts. There are no administrative replacement/deletion methods.

Each agent has immutable historical versions. Genesis is 1; subsequent versions must
equal latest + 1. Zero hashes, version 0, duplicates, replacements and skips reject.
Records store the existing SHA-256 digest directly as bytes32, optional content URI,
publisher, block number and timestamp. Agent/version are mapping keys. The event indexes
agent/version/digest. `getLatestPassport`, `getPassportVersion` and literal hash comparison
via `verifyPassport` provide reads. This is publication provenance, not a trust score.

Toolchain: **ethers 6.17.0**, **solc 0.8.37+commit.f401782d**, optimizer enabled / 200 runs,
**Paris** EVM target; **EthereumJS VM/tx/common/util 10.1.3** for executable in-process tests.
No native forge/anvil/solc installation was available. Direct compilation and an in-memory
EVM avoid a new framework/server while retaining real bytecode execution. The compiler's
transitive `tmp` is pinned to patched **0.2.7**; final npm audit reports zero vulnerabilities.

Primary runtime uses the exact Alchemy testnet host. The locally signing writer verifies
chain 10143 before signing and again before sending, reads nonce/gas/balance through
Alchemy, estimates gas with margins and caps each transaction's maximum fee at **0.2 MON**.
Existing output/submission files block accidental blind reruns. Uncertain sends require
inspection of the public journal and receipt, not automatic replacement transactions.

## Deployment and publication

Signal Passport Registry: **`0x7d9cc86196241485cf1efaf8a96c7819ea95b194`**.
Deployer/publisher: the public dedicated wallet above. Chain: **10143**.
Identity dependency: the official Registry above. Deployment block: **69126980**.

Runtime code hash:
`0x7a3b3ea5b702aa55c5bfae2cd57cac3598877192945f0d5558792024ca7baa43`.
Exact live runtime bytes matched solc output after substituting the immutable constructor
address. `deployment.json` records compiler/source hash and the separate registry trust
configuration. Bytecode existence/hash were independently checked via public Monad RPC.
No explorer source-verification claim is made; explorer verification was not performed.

Agent 2072 version 1 published at block **69127019** with profileHash
`0x6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a`.
This is the existing SHA-256, not a keccak rehash. `contentUri` is **empty** because there
is no hosted public artifact URL yet. Portable file import works. Publication metadata
stays in separate proof files; neither the payload nor strict v2 envelope was mutated.

## Meaningful Alchemy integration and independent consumer

Alchemy powered chain/balance checks, Identity Registry bytecode and M1 resolution,
nonce/gas estimation, both identity writes, deployment, publication, receipts, runtime
comparison, latest/history reads, read-only rejection simulation and consumer verification.
Envio remains the evidence provider. Public Monad RPC is used only for the explicit
independent cross-check, never as a silent primary fallback.

`verifyPublishedPassport` performs local schema/reference/digest verification, then checks
the independently trusted deployment's chain, runtime hash and immutable Identity Registry.
It reads the exact payload agent/version at a pinned block and rechecks the block hash.
It does not rerun economic analysis or request Envio. Results remain separate:

```text
localIntegrityValid: true
registryVerified: true
publicationFound: true
publishedHashMatches: true
publicationProvenanceVerified: true
publisherMatchesCurrentAgentWallet: true
version: "1"
status: "verified"
```

A missing publication is distinct from a provider failure (unknown); invalid local
data, wrong contract code/dependency, hash mismatch and changed snapshots fail separately.
The URI is returned only as a pointer and is never fetched. The caller must obtain
address/code-hash trust configuration independently of untrusted Passport data.

`verify-published-passport.ts` is a separate compiled consumer entry point. In an isolated
directory, generator/activity/writer/compiler files were absent and DEPLOYER_PRIVATE_KEY
and ENVIO_API_TOKEN were removed. With only Alchemy configured it verified the real
publication (exit 0). Evidence: `MONAD-M4-isolated-consumer.json`. A transitive import test
also excludes generation, activity, compilation and signing modules from this CLI.

The final read after resuming work again passed, at block **69157471**; evidence:
`MONAD-M4-final-read.json`. The consumer still does not claim economic truth or a universal
reputation judgment. Current-wallet equality is a separate snapshot: rotation need not
invalidate a historically authorized publication.

## Independent cross-check and tamper/rejection proof

`fixtures/real/monad-m4/cross-check.json` records the public Monad RPC's independent:
chain/runtime-hash/dependency checks; deployment and publication transaction/receipt
existence; stored hash/version/publisher; and M1 owner/agentWallet resolution. These agree
with Alchemy. No discrepancy found.

Additional read-only Alchemy checks (`MONAD-M4-live-checks.json`): latest version 1 and
expected hash; correct-hash verification true; wrong hash false; unauthorized caller
simulation reverted with decoded **UnauthorizedPublisher**. No extra transaction was sent.

A deliberately synthetic coherent edit to the real artifact plus a recomputed digest
passed local integrity but returned **hash_mismatch** against the published original.
This demonstrates the added M4 boundary without pretending onchain publication proves
truthful source data. Synthetic test data was not published or substituted into real fixtures.

## Tests, build and resolved issues

| Command | Exact final result |
|---|---|
| `npm.cmd test` | **173 tests, 4 suites, 173 pass, 0 fail/cancelled/skipped/todo; 2339.1922 ms; exit 0** |
| `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm.cmd run build` | exit 0 |
| `npm.cmd ls --depth=0` | exit 0; pinned direct dependencies healthy |
| `npm.cmd audit --json` | exit 0; zero vulnerabilities |

Full outputs: `MONAD-M4-checks.json`. 32 M4 tests supplement the preserved 141 baseline.
The 12 executable contract tests cover genesis/event, unauthorized caller, wrong agent,
unset wallet, zero digest, version zero, skip, duplicate/replacement, sequential version
2 with historical retention, correct/incorrect/absent hash reads, dependency failure,
wallet rotation and invalid constructor dependency (some tests cover multiple cases).
The other 20 cover independent verification, coherent tampering, provider/missing-state
distinction, code/dependency/chain/snapshot failures, rotation semantics, configuration,
metadata, signing/fee/balance/journal guards, unauthorized preparation, source independence,
real capture regeneration and non-fetching of content URIs.

Intermediate issues are disclosed:

- Initial writer-test typecheck rejected HDNodeWallet as Wallet; the signer parameter
  was narrowed to the address/signTransaction interface. Final typecheck and tests pass.
- Initial compiler dependencies produced tmp advisories; trying the prior solc version
  still had vulnerable tmp. Restored solc 0.8.37 with patched tmp override; final audit zero.
- URI update initially hit the conservative 0.05 MON fee guard **before broadcast**.
  Alchemy estimated 0.05176755 MON, 0.0776512944 with margins. The cap was adjusted to
  0.2 MON, writer tests rerun, and the intended update succeeded. No failed live write.

Recorded balance after all four successful writes: **0.7787053288 MON** at the live-check
snapshot. This is a recorded value, not a promise that a later balance cannot change.

## Reproduce

Read-only verification, after build and local Alchemy configuration:

```powershell
node --env-file=.env.local dist/scripts/verify-published-passport.js fixtures/real/monad-m4/agent-2072-activity.json.passport.json fixtures/real/monad-m4/deployment.json
node dist/scripts/generate-agent-passport.js fixtures/real/monad-m4/agent-2072-activity.json dist/m4-review.json 2026-10-08T01:37:40.868Z
```

The second command needs a new output path and reproduces the canonical artifact offline.
The bounded write/capture commands actually used (historical record, **do not rerun to verify**):

```powershell
node --env-file=.env.local dist/scripts/monad-registry.js register fixtures/real/monad-m4/registration.json
node --env-file=.env.local dist/scripts/monad-registry.js set-uri fixtures/real/monad-m4/agent-identity.json 2072
node --env-file=.env.local dist/scripts/monad-registry.js capture fixtures/real/monad-m4/agent-2072-activity.json 2072 69126790 69126918
node --env-file=.env.local dist/scripts/monad-registry.js deploy fixtures/real/monad-m4/deployment.json
node --env-file=.env.local dist/scripts/monad-registry.js publish fixtures/real/monad-m4/publication.json fixtures/real/monad-m4/agent-2072-activity.json.passport.json fixtures/real/monad-m4/deployment.json
```

For a fresh independent read, use `monad-registry.js cross-check <new-output.json>
<passport.json> <deployment.json> <publication.json>`. The original output files are
exclusive and cannot be silently overwritten. Environment files are explicitly loaded;
no reference-project credentials are read.

## Security, references and documentation

Final credential scanning compares actual configured secret values, private-key variants
and the Alchemy API-key component against deliverables, Git diff/index and generated
build/log artifacts without printing any of those values. No secret matches were found.
`.env.local` is ignored and untracked; `.env.example` contains blank placeholders only.
No files are staged and M4 is uncommitted. See `MONAD-M4-security.json` for scan counts.

`MONAD-M4-reference-check.json` compares pre-M4 and final source/Git hashes, HEADs and
status. Both references remain unchanged: original Signal Passport 135 non-environment
source files / 211 Git files; LedgerLens 40 / 190. Reference .env files were excluded
without reading. 24 historical report/fixture files also match committed bytes.
Neither reference is a runtime/build/test dependency. Unrelated untracked documents
remain untouched. Only parent STATUS routing/state is updated outside the active repo.

README, architecture, fixture documentation, active STATUS and workspace STATUS are
updated. Exact changed files are listed below; generated ignored builds are not deliverables.

## Known limitations and proposed M5

Public artifact hosting, explorer source verification, Dynamic wallet UX, Nansen,
consumer policies, final frontend and other sponsors remain deferred. This is a testnet
proof, not a production security audit. The trusted deployment configuration and RPC
observations are trust assumptions, not a light-client/consensus proof. External Identity
Registry upgrades and future wallet rotation remain relevant. Transaction journals aid
manual recovery; automated retry/replacement orchestration is not implemented.
Publication proves an authorized wallet anchored a digest under the verified contract;
it does not prove historical agent association, source accuracy, service delivery or
trustworthiness. Full deployed-application/demo sponsor completion is not claimed.

Proposed M5 only: a bounded Dynamic wallet connection/signing flow that uses this existing
registry and verifier, keeps current agentWallet authorization, and makes the real
publication result visible. Scope and acceptance should be separately agreed. No M5,
Dynamic, Nansen, AI, policy or final-UI implementation began.

## Exact files changed

```text
.env.example
README.md
STATUS.md
contracts/SignalPassportRegistry.sol
docs/ARCHITECTURE.md
docs/verification/MONAD-M4-artifact-hashes.json
docs/verification/MONAD-M4-baseline.json
docs/verification/MONAD-M4-checks.json
docs/verification/MONAD-M4-final-read.json
docs/verification/MONAD-M4-isolated-consumer.json
docs/verification/MONAD-M4-live-checks.json
docs/verification/MONAD-M4-reference-check.json
docs/verification/MONAD-M4-security.json
docs/verification/MONAD-M4-sources.json
docs/verification/MONAD-M4.md
fixtures/real/monad-m4/README.md
fixtures/real/monad-m4/agent-2072-activity.json
fixtures/real/monad-m4/agent-2072-activity.json.passport.json
fixtures/real/monad-m4/agent-identity.json
fixtures/real/monad-m4/agent-identity.json.submitted.json
fixtures/real/monad-m4/cross-check.json
fixtures/real/monad-m4/deployment.json
fixtures/real/monad-m4/deployment.json.submitted.json
fixtures/real/monad-m4/preflight.json
fixtures/real/monad-m4/publication.json
fixtures/real/monad-m4/publication.json.submitted.json
fixtures/real/monad-m4/registration.json
fixtures/real/monad-m4/registration.json.submitted.json
fixtures/real/monad-m4/verification-alchemy.json
package-lock.json
package.json
packages/publication/src/abi.ts
packages/publication/src/compile.ts
packages/publication/src/publish.ts
packages/publication/src/rpc.ts
packages/publication/src/verify.ts
packages/publication/src/writer.ts
scripts/monad-registry.ts
scripts/verify-published-passport.ts
tests/publication.test.ts
tests/registry.test.ts
```

Workspace routing/state only: `../STATUS.md` (outside the active Git repository).
