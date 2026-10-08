# Signal Passport Monad - STATUS

Last updated: October 8, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives product work; neither reference is a runtime dependency.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Consumer supplies trust policy; no universal trust score.

## Current milestone: M4 - Monad Passport Registry + Alchemy

**ACCEPTED** within the bounded testnet scope after implementation, tests and review of
live evidence. M4 remains uncommitted for owner review. Full report:
`docs/verification/MONAD-M4.md`. No push or M5 implementation.

| Milestone | State |
|---|---|
| M0 / M1 / M0.5 | Accepted; historical evidence preserved |
| M2 | Accepted; committed 9dfc4e7 |
| M3 | Accepted; committed 60782f1; immutable Agent-2 fixture preserved |
| M4 | Accepted; controlled agent, real publication, independent verification; 173 tests pass |
| M5 | Not started; separate instruction required |

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
- **173 tests, 4 suites, 173 passed, 0 failed/cancelled/skipped/todo**;
  typecheck, build, dependency tree and npm audit all exit 0. Zero npm vulnerabilities.

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

Branch `monad-metropolis`; HEAD `60782f17cf40ef4f7fe707558c34bd0ca00221bc`.
M2 and M3 are committed locally; no automatic push. M4 files are unstaged/uncommitted.
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

Owner reviews M4 code and evidence. Await explicit instruction before committing/pushing
M4 or beginning M5. Proposed M5: bounded Dynamic wallet/signing integration with the
existing contract and verifier; definition only in the M4 report.
