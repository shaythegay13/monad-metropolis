# Signal Passport Monad - STATUS

Last updated: October 12, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives product work; neither reference is a runtime dependency.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Consumer supplies trust policy; no universal trust score.

## Current focus: submission readiness after accepted M8/M9A

The owner has reviewed and accepted M9A. The signed-in official portal was inspected
read-only: deadline October 13 at 23:59 EDT, main demo <=3 minutes, pitch <=2 minutes,
required CRE clip <=2 minutes. Its form's logo constraint is 2 MB/500–2000 px.
Prepared copy replaces stale trading-reputation claims; required go-to-market, links,
videos and sponsor narratives are still blank in the saved entry. No portal edits
or submission occurred. Nansen remains selected but unimplemented; Community Team
is unselected. MIT and reuse rights were explicitly authorized by the owner;
LICENSE, attribution and AI-assisted development disclosure are prepared.

The live site's five pages/APIs, three hashes, public read-only restriction, policy
verification and external consumer were rechecked. Vercel still serves the accepted
deployment and has Git link null. 239 core/18 CRE tests and both typechecks pass.
See `docs/submission/READINESS.md` for prioritized owner actions, truthful copy,
recording outlines and the <=60-minute Nansen assessment proposal (not started).

The owner authorizes a clean local combined M8/M9A/submission commit. Both remote
branches were observed at 584a2abf11b673f16e26ad321b0d9ae42000640a; a normal atomic
fast-forward push is planned only after approval of the final commit hash.
No Git push, redeployment, blockchain write, paid setting or M9B implementation.

## Accepted M9A - Independent Chainlink CRE Verification

**M9A ACCEPTED — bounded read-only native CRE simulation integration.** The existing
cron verifier retrieves actual hosted artifacts through CRE HTTPClient, validates
full schema/references and both hashes, and reads the Registry/ERC-8004 through
CRE EVMClient at one finalized snapshot. Agent 2072 v2 is verified at block
70569278; Agent 2 v1 has valid local integrity and a confirmed `not_found` publication
at block 70569534. Both actual CLI/WASM runs pass with consistent snapshot hashes.
18 CRE tests and CRE typechecking pass; the 239-test core suite and root typecheck
pass. Credential-pattern, accepted-product-source and both reference preservation
checks pass. Native outputs/logs and exact commands are retained in
`docs/verification/MONAD-M9A.md`; sponsor reproduction is in `MONAD-M9A-DEMO.md`.
This is unsigned simulated orchestration, not a DON deployment/attestation or
final bounty award approval. No public site, contract, Passport, paid service,
blockchain transaction or dependency version changed during M9A.

The owner reviewed the M8 closeout and M9A source/evidence. Combined local commit
is authorized; a push remains approval-gated. M9B has not started and is not automatic.

## Accepted public release: M8 - Public Deployment & Developer Readiness

**M8 ACCEPTED — bounded public, read-only Monad Testnet demo.**
https://signal-passport-monad.vercel.app is anonymously accessible. The exact
Ready deployment `dpl_FqH7PT5vNASPuaBsmi2y3prq5ERY`, source commit
`584a2abf11b673f16e26ad321b0d9ae42000640a`, was promoted without rebuilding.
Both remote branches retain that commit. Standard Protection stays enabled
for Preview/deployment URLs while the canonical production domain is public.
All five pages, both GET APIs, three exact-byte Passport files, onchain v2
verification, all policy presets and the credential-free external consumer pass.
Desktop and 390px mobile browser checks pass; evaluation makes results visible.
Public preparation/publication POSTs return 403. Cross-origin/malformed/altered
policy requests reject. The Firewall returns 429 on request 31 after 30 accepted
fixed-data GETs, and normal API/evaluation behavior recovered afterward.
Production variables and secret isolation pass; Dynamic permits the canonical
origin and the two prior local demo origins. Alchemy remains Free with no payment
method listed and a 30M-CU monthly account quota. No paid setting changed.
October 12: 239 tests pass. Recorded typechecks and dependency-tree checks pass; the accepted
library/local/Vercel builds remain valid. Audit remains 19 (15 moderate, 4 high),
with the disclosed unpatched Solana disposition, not production security clearance.
Reference source/Git bytes and statuses remain unchanged. Git integration is
disconnected; automatic deployments are a later authorized maintenance task.
On October 12 the owner confirmed public MetaMask connection as B51DD on
Monad Testnet 10143, read-only mode and unavailable preparation/publication
controls. These are owner-reported, not agent-observed wallet checks. All M8
functional gates are satisfied, and the site is ready for an unauthenticated
judge. The disclosed dependency disposition remains; acceptance is not production
security certification or completed sponsor/submission eligibility. See
`docs/verification/MONAD-M8.md`. Closeout files await review; no commit, Git push,
blockchain transaction or new deployment/build occurred during M8 closeout.
M8 acceptance was reported before the owner-authorized M9A implementation.
Its public release stays unchanged. M9A results are recorded above; timeboxed
M9B Nansen assessment follows only on a separate owner instruction.

**Historical October 10 CRE setup prototype, separate from M8 acceptance:** the project-local
Chainlink CRE skill, CLI v1.38.0 and TypeScript toolchain are installed. A read-only
cron verifier for the real Agent 2072 Passport v2 passes native CRE simulations on
both `staging-settings` and `local-simulation`, confirming its canonical digest,
Monad Testnet Registry publication and ERC-8004 association. Its five focused tests,
TypeScript check and the existing 239-test repository baseline pass. A CRE Hackathon
Early Access request was submitted; deployment access is not yet enabled. No CRE
workflow was deployed, activated, uploaded or broadcast, and no transaction was sent.
This prototype does not establish accepted M9 or live CRE sponsor completion.
See `docs/verification/MONAD-CRE-SETUP.md`.

## Earlier accepted milestones — historical checkpoints

The earlier Git/push/deployment statements below describe those milestone dates;
the current release and acceptance state is the M8 closeout above.

**M7 ACCEPTED for functionality and visual design.** The owner approved the M7 layout, typography, navigation
and functionality, then requested more green depth after the first palette review.
The corrected distribution uses a substantial deep-forest Home hero, navigation and
footer, forest Passport identity header, forest Compare introduction/results,
sage policy editor and stronger forest Developers navigation. The disconnected
wallet workspace retains the approved green theme.
Focused polish still distinguishes Passport loading from genuine live-read failure,
brings evaluated comparison outcomes into view with keyboard focus, improves
supporting text and compacts expanded evidence. New settled production-browser
captures of this corrected balance at 1440px desktop, actual 390px mobile and 768px tablet are in
`docs/verification/MONAD-M7.md`. Independent v2 publication read-back passed.
237 tests pass; library/web typechecks, library build, production web build and
dependency tree pass. Audit remains 19 findings (15 moderate, 4 high) with a bounded
local/testnet build disposition, not production security clearance. Secret and both
reference-repository checks pass. The owner approved the final color balance and
personally confirmed the Dynamic/MetaMask account ending B51DD, Monad Testnet 10143,
Agent 2072's published/verified version 2 and wrong-network warning/blocking.
These are owner-reported checks; the agent did not observe MetaMask testing. No new
transaction or public deployment. M7 was committed locally before M8 work and not pushed.
M8 begins with public hosting and release-specific security review; deployment and
GitHub push require the owner's later approval checkpoint.

M6 accepted commit: `91ca52470e6a4b3a878c6dc0c03a1a63a4ce3518` on
`monad-metropolis`; accepted M5 commit:
`3a427c1634ed0feae8c529fd9c1a8550e60e6e96`.

## Previous milestone: M6 - Consumer Trust Policies + Agent Comparison

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
M6 changes were committed locally and not pushed. Existing audit: 19 (15 moderate, 4 high), with
M5 security disposition preserved; production security is not approved.

| Milestone | State |
|---|---|
| M0 / M1 / M0.5 | Accepted |
| M2 / M3 / M4 | Accepted and committed |
| M5 | Accepted for bounded functionality; committed 3a427c1 |
| M6 | Accepted; browser/API/core verified and owner wallet regression confirmed |
| M7 | Accepted; final visual direction and four owner wallet checks confirmed |
| M8 | Accepted for bounded public demo; anonymous checks and owner wallet regression verified |
| M9A | Accepted for real-data native CRE simulation; 18 tests, positive/unpublished paths verified |
| M9B / later | Not started |

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
M7 made wrong-network and unauthorized-account warnings more prominent; the owner
confirmed the fresh account, chain, version 2 and wrong-network display after the redesign.
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

Branch `monad-metropolis`; M2 through M7 are committed locally; no automatic push.
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

## Current next action

Return the owner-authorized combined local commit's exact hash and safe two-branch
push plan, and wait for push approval. Owner completes videos and saved
portal fields, resolves Nansen selection and submits. The approved public application
stays unchanged. Never repeat the completed v2 publication.
