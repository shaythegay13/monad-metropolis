> Historical verification record. M0/M1 originally occurred on the Monad branch in
> the prior `signal-passport` repository. Migrated into `signal-passport-monad` during
> M0.5 before M2. The original report below is preserved verbatim after this notice;
> paths, test counts, Git-state statements and application builds are historical.
> Current independent baseline: [MONAD-M0.5.md](MONAD-M0.5.md).

# Monad M1 - ERC-8004 Agent Resolution

Date: October 6, 2026 (America/New_York). **Verdict: Accepted**.
Implemented: additive identity schema, bounded read-only resolver, registration retrieval,
internal verification CLI and deterministic tests. Verified: real Monad Testnet agent,
raw RPC observations, error cases, 93 tests, type checks and both production builds.
Acceptance evidence reviewed against all 17 user-requested M1 criteria. No M2 work.

## Baseline and scope

Started on `monad-metropolis` at committed/pushed M0 baseline
`c653e44e78ba0e902013b807fef3ad3f603e797a`. Tracked tree was clean; only the existing
`Google Stitch Frontend Development.txt` and `Signal-Passport-Weekend-PRD.md` were
untracked. Neither was touched. No additional baseline commit was needed. No Git
history rewriting, new dependencies, application UX changes or transaction writes.
LedgerLens remains untouched. No sponsor, reputation, policy or analysis functionality.

## Sources verified before implementation

- [Official Monad current network facts](https://docs.monad.xyz/ai/current-facts):
  testnet chain 10143, mainnet 143, native currency MON and official public endpoints.
- [Official Monad Testnet information](https://docs.monad.xyz/developer-essentials/testnet):
  10143 / MON / `https://testnet-rpc.monad.xyz`. Page copy-button values were missing
  from web text extraction; fetched the official HTML and verified the actual values.
- [Official Monad Mainnet information](https://docs.monad.xyz/developer-essentials/network-information):
  143 / `https://rpc.monad.xyz`; only testnet was needed for live acceptance.
- [Current ERC-8004 specification](https://eips.ethereum.org/EIPS/eip-8004):
  ERC-721 token identity, ownerOf/tokenURI, reserved agentWallet semantics, registration
  forms and off-chain advertisements. The specification is still marked Draft.
- [ERC-8004 team-curated deployments, pinned revision](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/README.md):
  Monad Testnet and Mainnet Identity Registry address entries independently checked.
  Revision was fetched through the repository commits API during M1.
- [Registry implementation at that revision](https://github.com/erc-8004/erc-8004-contracts/blob/b9e466c250744a7e06b13dff9d3c2844ed64f825/contracts/IdentityRegistryUpgradeable.sol):
  owner semantics, URI accessor inheritance, registry wallet default/clearing and accessor.

The provided candidate addresses were corroborated, not treated as authoritative just
because they were in the prompt. The selected testnet deployment also returned **130
bytes of nonempty code**, independently captured with `eth_getCode` at the proof block.
The code is a proxy-sized deployment; existence/hash is not a full implementation audit.
No Reputation Registry was read or implemented.

## Network and configuration

Selected: **Monad Testnet**, chain **10143**, currency **MON**.
RPC: `https://testnet-rpc.monad.xyz`.
Identity Registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.

`identityConfig()` defaults to this explicit network/address pair. A separate mainnet
profile uses chain 143 and `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432`; its deployment
address was source-checked, but its live agent resolution was not needed or verified.
The CLI accepts an optional trusted `MONAD_IDENTITY_RPC_URL` environment override and
never loads LedgerLens credentials or prints the configured URL on errors. No API key,
wallet or signing configuration is needed. No sponsor integration is claimed.

## Real agent and live evidence

Primary proof is an existing public testnet registration, not a fabricated local fixture.
Agent ID **1**; card name **Monad Demo Agent**.
Owner: `0x133603465adde7c39fa0e6e34b264e1573e1fd08`.
ERC-8004 agentWallet: `0x133603465adde7c39fa0e6e34b264e1573e1fd08` (set).
Owner and wallet happen to match for this agent, but were independently read and stored.
Tests additionally prove differing and unset wallet cases.
URI: `data:application/json;base64,...`; the **complete original URI** and parsed file
are retained in [MONAD-M1-agent-1.json](MONAD-M1-agent-1.json).
Registration retrieval: **retrieved**.

This registration advertises example.com services and has an empty registrations list.
The resolver warns about that missing self-registration list; no service operation,
trading activity, successful commerce, wallet-control signature or capability was inferred.
The returned agentWallet is the registry association, not a new independent signature check.

Snapshot: 68684783, hash `0x2176ebecc6bc457fb3f93b0fac2e5eb0d72eecf40926cd6cca4e1b14cb94d7a7`.
Resolution time: 2026-10-06T12:25:30.192Z.
Registry code keccak256: `0xd0e45b1d89fa9b6cc7e97c1f155d64180e5c232aaccf9900ef9d4fd738c02b41`.
[Raw RPC proof](MONAD-M1-rpc-proof.json) records request method/parameters and responses
for chain ID, block header fields, bytecode and all three registry calls at that same
block. It contains public-chain data only. The block response is reduced to
number/hash/timestamp, explicitly labeled; eth_call/code responses are preserved.

Secondary real-agent check: ID **2**, owner and agentWallet
`0xf043b0d473a2edd7c5d6f4d931334096b77a7edc`, URI
`ipfs://QmebSk2w69oBsPR2tkNFcqxX3Ug9b3QfpBrDqSfes1QbLb`.
Gateway returned HTTP **429**. Identity still resolved, registration status **unreachable**.
See [MONAD-M1-agent-2.json](MONAD-M1-agent-2.json). This is not reported as not-found.

Live nonexistent-agent check: maximum uint256 ID
`115792089237316195423570985008687907853269984665640564039457584007913129639935`.
CLI exited **1** with `agent_not_found` based on the exact token-specific custom revert.
This is an expected negative verification result, not a failed acceptance test.

### Reproduce

From the actual `signal-passport` repository, with dependencies installed:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/verify-erc8004-agent.ts monad-testnet 1
node node_modules/tsx/dist/cli.mjs scripts/verify-erc8004-agent.ts monad-testnet 2
node node_modules/tsx/dist/cli.mjs scripts/verify-erc8004-agent.ts monad-testnet 115792089237316195423570985008687907853269984665640564039457584007913129639935
```

The CLI resolves current state; block, ownership, wallet, URI and gateway results can
change. Replay the saved raw proof requests to inspect the exact historical block,
subject to the RPC's historical availability. No transaction, registration or deployment
is performed. All registry reads for a resolution use one block number and recheck its
hash before metadata retrieval; this is an observed RPC snapshot, not consensus proof.

## Schema decision / architecture

The prior conceptual `walletAddresses` list was too ambiguous. The smallest accurate
replacement uses separate `ownerAddress`, optional `agentWallet` plus set/unset state,
original `agentUri`, typed registration result and block provenance. Advertised wallet
strings remain in the off-chain document and are never promoted to registry associations.
No generic association list is needed. `registeredAt` remains absent rather than invented.

This is an additive standalone canonical identity model, **not a change to the existing
v1.0.0 Passport payload**. A future explicit schema/version integration is required before
agent identities are sealed into Passports. Existing evidence IDs, arrays/canonicalization,
digests, metrics and consumer verification code are unchanged. App Two imports no resolver.
Architecture section 3 documents this deliberate correction and the retrieval policy.

## Files changed

- `packages/schema/src/identity.ts`: canonical identity/registration schemas and uint256 validation.
- `packages/schema/src/index.ts`: additive schema exports only.
- `packages/identity/src/config.ts`: explicit network/address configuration.
- `packages/identity/src/resolver.ts`: bounded JSON-RPC, ABI checks, snapshot reads/error mapping.
- `packages/identity/src/registration.ts`: bounded data/HTTPS/IPFS registration parsing/retrieval.
- `scripts/verify-erc8004-agent.ts`: read-only internal proof CLI.
- `tests/identity.test.ts`: 25 deterministic tests using clearly synthetic inputs.
- `docs/ARCHITECTURE.md`: precise identity semantics and compatibility boundaries.
- `STATUS.md`: M1 state, verified facts, tests, limits and M2 handoff.
- `docs/verification/MONAD-M1.md`: this report.
- `docs/verification/MONAD-M1-agent-1.json`, `MONAD-M1-agent-2.json`,
  `MONAD-M1-rpc-proof.json`: public live evidence snapshots.

Workspace parent `STATUS.md` and `docs/ARCHITECTURE.md` mirrors synchronized. No changes
to inherited app source, analysis, verification, fixtures, manifests or lockfiles.
M1 work is left uncommitted for review; M0 remains the committed baseline.

## Tests / exact results

| Command | Result |
|---|---|
| `node node_modules/tsx/dist/cli.mjs --test tests/identity.test.ts` (initial) | 21 passed / 1 failed: decimal `1.5` reached BigInt inside Zod refinement. Fixed by guarding format before conversion. |
| Same focused command after fix | 22/22 passed; then added 3 further ABI/wallet/normalization tests. |
| `npm.cmd test` (final) | Exit 0: **93 tests**, 4 suites, **93 passed**, 0 failed/cancelled/skipped/todo; 1190.4391 ms. All 68 inherited tests and 25 new tests pass. |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0, no diagnostics. |
| `node node_modules/typescript/bin/tsc --noEmit -p apps/passport/tsconfig.json` | Exit 0, no diagnostics. |
| `node node_modules/typescript/bin/tsc --noEmit -p apps/consumer/tsconfig.json` | Exit 0, no diagnostics. |
| `node node_modules/typescript/bin/tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --esModuleInterop --strict --skipLibCheck scripts/verify-erc8004-agent.ts` | Exit 0; CLI checked separately because root tsconfig excludes scripts. |
| `npm.cmd run build:passport` | Exit 0; Next 15.5.25, compiled 2.1 s, 4/4 static pages generated. |
| `npm.cmd run build:consumer` | Exit 0; Next 15.5.25, compiled 1457 ms, 5/5 static pages generated. |
| Live CLI for IDs 1 and 2 | Exit 0; results above. |
| Live CLI for maximum uint256 ID | Expected exit 1, `agent_not_found`. |

Existing build configuration skips type validation/lint. Independent type checks above
passed; no lint script is defined. No UI changes were made; no browser recheck performed.

### Explicit failure/edge coverage

- Malformed, negative, fractional, hex, leading-zero, oversized/out-of-range IDs rejected
  before RPC; zero and uint256 maximum retain exact decimal representation.
- Wrong network, unknown network names, network/registry mismatch and empty bytecode.
- Owner vs different wallet, equal wallet, zero/unset wallet with no owner fallback.
- Exact nonexistent-token revert vs generic revert, wrong-token revert, outage and
  failure while reading agentWallet (must not mean unset or not-found).
- Invalid ABI address/string bounds/UTF-8; changed block hash during reads.
- Empty URI, malformed URI/JSON/base64/UTF-8/registration, missing display fields,
  unsupported schemes, blocked destinations and unreachable registration.
- HTTPS and IPFS parsing, original source retention, advertisements not promoted,
  mismatched self-registration warning, byte limit and private-address rejection.
- JSON-RPC HTTP failure, malformed JSON, mismatched request ID and error envelopes.

## Known limitations

- ERC-8004 is a draft; network deployments/specifications can change. Public RPC and
  gateway availability are external dependencies. No mainnet live acceptance claimed.
- Registration supports JSON only, no redirects, compressed bodies, IPv6-only hosts,
  arbitrary ports, secondary service/agent-card dereferencing or endpoint-domain proofs.
  DNS is public-IPv4 checked and pinned to the request socket; body/deadline limits apply.
- IPFS uses one explicit gateway and does not verify content against the CID. A gateway
  error remains a registration warning, never proof of agent absence.
- Additional arbitrary onchain metadata keys, registeredAt/history, independent wallet
  signature verification and proxy implementation auditing are deferred.
- Optional card fields are tolerated as missing with warnings; retrieved means parsed
  supported structure, not a full ERC-8004 conformance or capabilities certification.
- No reputation, economic activity, feedback, trust policy, enrichment, wallet connection,
  onchain publication, sponsor feature or user interface was added.

## Proposed M2 (not implemented)

Envio Monad Evidence Pipeline: research and verify a bounded Envio-supported Monad
activity source, ingest real evidence for an explicitly selected registry-designated
agentWallet, preserve chain/transaction provenance, deduplication and coverage/failure
states, and test normalization. No owner fallback or metadata-advertised wallet promotion.
Economic observations remain M3; M2 acceptance requires live provenance and regression proof.
