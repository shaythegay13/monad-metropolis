# Signal Passport Monad - STATUS

Last updated: October 8, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives product work; neither reference is a runtime dependency.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Consumer supplies trust policy; no universal trust score.

## Current milestone: M6 - Consumer Trust Policies + Agent Comparison

**ACCEPTED - bounded M6 functional scope.** Reusable strict versioned consumer policy engine,
independent verification contexts, deterministic three-state results and unranked comparison
are implemented. The real Agent 2072 published version 2 and Agent 2 offline version 1
(schema 2.0.0) compare honestly. Browser policy interactions and live read-only API checks
pass. 224 tests pass; library/web typechecks, library build and dependency tree pass.
Final build/security evidence is in `docs/verification/MONAD-M6.md` and companion files.
The owner confirmed fresh Dynamic/MetaMask connection, B51DD account, chain 10143,
historical v1 labeling and latest-v2 publication blocking. No new transaction,
publication, contract, provider or M7 work. Functional acceptance is not production
security approval.

M5 is accepted and now committed: `3a427c1634ed0feae8c529fd9c1a8550e60e6e96`.
M6 changes remain uncommitted/unpushed. Existing audit: 19 (15 moderate, 4 high), with
M5 security disposition preserved; production security is not approved.

| Milestone | State |
|---|---|
| M0 / M1 / M0.5 | Accepted |
| M2 / M3 / M4 | Accepted and committed |
| M5 | Accepted for bounded functionality; committed 3a427c1 |
| M6 | Accepted; browser/API/core verified and owner wallet regression confirmed |
| M7+ | Not started |

## Working - verified

- Existing ERC-8004 identity resolution, bounded Envio pipeline, M3 deterministic
  observations, v1/v2 schema compatibility and canonical SHA-256 are unchanged.
- Alchemy is the primary RPC for chain/balance/code, identity, nonce/gas, writes,
  receipts and publication verification. No silent public-RPC fallback.
- Real controlled ERC-8004 demo agent **2072**, owner/current agentWallet
  `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.
- M1 resolved honest base64 registration with no advertised autonomous services.
- M2 captured two genuine identity-management transactions in [69126790,69126918),
  complete_for_query. M3 produced 2 transactions, 1 UTC day, 1 recipient,
  2 successful / 0 failed / 0 unknown EVM executions.
- Non-upgradeable Passport Registry deployed on Monad Testnet **10143**:
  `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`.
- Authorization requires current nonzero getAgentWallet; owner is never a fallback.
  Versions are append-only/sequential; invalid hashes/versions/callers reject.
- Agent 2072 Passport version 1 published at block **69127019**. SHA-256:
  `6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a`.
- Runtime code exactly matches compiled source plus immutable identity address.
- Independent public Monad RPC corroborated runtime code, deployment/publication
  transactions/receipts, stored digest and controlled identity.
- Isolated compiled consumer verified with no generator, activity, compiler or signing
  files, and without deployer/Envio credentials. Only Alchemy is needed for reads.
- Coherent edited/rehashed artifact fails onchain comparison; unauthorized live eth_call
  reverts. Current-wallet equality remains separate from historical publication.
- Accepted M4 baseline: 173 tests and no audit findings before web dependencies.
- M5 final checks: **193 tests, 4 suites, 193 passed, 0 failed/cancelled/skipped/todo**;
  library/web typechecks and builds pass. Root dependency tree passes. The M5 dependency
  audit reports 19 transitive findings (15 moderate, 4 high); it is not a clean audit.
- Live local API verifies Agent 2072 v1's local integrity, deployed Registry and hash.
  Download preserves the accepted artifact. Server preparation produces valid linked
  v2 with four genuine observed transactions. One owner-approved live publication is now
  confirmed at block 69236935; exact downloaded artifact and proof are retained.
- Wrong-wallet, wrong-chain, cross-origin and tampered-Passport API requests reject.
- Generated client assets contain no private credentials or server-secret markers.
- Closeout read-only verification reconfirms version 2 at checked block 69242070.
- V1 is now explicitly labeled historical, alongside the current onchain version.

## Remaining limitations

Wrong-wallet behavior is automation-only because the owner has no second account.
Transaction rejection was not retested with a live publication. The owner personally
confirmed the other A-H checks; no agent-observed browser testing is claimed.
Warnings' visual prominence is deferred to later frontend work by owner instruction.
Public hosting, release-specific API/origin controls and production security approval
remain outside completed M5 scope. Dependency findings remain explicitly documented.

## Real proof

`fixtures/real/monad-m4/` holds registration, M1 identity, Envio evidence, canonical
Passport, deployment/publication receipts, public recovery journals and cross-checks.
`docs/verification/MONAD-M4-checks.json` retains exact test output.
Final independent consumer read through Alchemy passed at block 69157471; see
`docs/verification/MONAD-M4-final-read.json`. No new writes were needed on resumption.

## Security and tooling

Node v24.19.0 / npm 11.17.0 / Windows. ethers 6.17.0; solc 0.8.37, optimizer 200,
Paris EVM; EthereumJS VM/tx/common/util 10.1.3. Patched tmp 0.2.7 override.
Secrets remain only in ignored/untracked .env.local; blank placeholders in .env.example.
Final scans found no secret in deliverables, Git diff/index or generated logs/builds.
The writer bounds each fee to 0.2 MON, checks balance and chain, and records only public
recovery data before broadcast. Four successful testnet writes; no mainnet transactions.
Recorded remaining balance after writes: 0.7787053288 MON (snapshot, not a live promise).

## Git and reference state

Branch `monad-metropolis`; HEAD `3a427c1634ed0feae8c529fd9c1a8550e60e6e96`.
M2 through M5 are committed locally; no automatic push. M6 files are unstaged/uncommitted.
Both reference HEADs, status, source files and Git metadata remain unchanged.
Historical reports and M2/M3 fixtures match committed bytes. Parent STATUS changes
only routing/state. Exact changed-file list and audit results are in the M4 report.

## Resolved issues and limitations

The earlier Alchemy mainnet URL blocked progress until corrected; no mainnet write.
Initial URI fee estimate exceeded the first conservative cap and stopped before
broadcast; a 0.2 MON bound allowed the intended update. Initial signer-test type
mismatch and compiler transitive vulnerability were fixed; final checks all pass.

Content URI is empty: public artifact hosting remains deferred. No fake URL or explorer
source-verification claim. Portable file import plus onchain comparison works now.
Publication provenance is not source-data truth, historical wallet-association proof,
commerce evidence or trustworthiness. Trust configuration must come independently from
a trusted deployment record, not from arbitrary imported data. RPC and external
Identity Registry assumptions remain; this is not a consensus proof or security audit.
No Dynamic, Nansen, policies, AI, other sponsors, mainnet or final frontend work in M4.
Full deployed-app/demo sponsor completion is not claimed.

## Exact next action

Owner reviews accepted M6 changes and verification evidence. Leave M6 uncommitted until
explicitly instructed to commit. No push, external deployment, M7 or new transaction is
authorized; never repeat completed v2 publication.
