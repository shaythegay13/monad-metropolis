# Signal Passport Monad - STATUS

Last updated: October 11, 2026 (America/New_York).

ACTIVE PROJECT: `signal-passport-monad/`.
READ ONLY REFERENCES: `../signal-passport/`, `../ledgerlens/`.
Only this repository receives product work; neither reference is a runtime dependency.

## Governing documents

PRD-MONAD > HACKATHON_REQUIREMENTS > ARCHITECTURE > STATUS > verified code.
Obey AGENTS.md and CLAUDE.md. Consumer supplies trust policy; no universal trust score.

## Current milestone: M8 - Public Deployment & Developer Readiness

**PREDEPLOYMENT RE-AUDITED; NO LIVE DEPLOYMENT; NOT ACCEPTED.** Three original-byte Passport files
are served locally from static versioned URLs. The independent external consumer
example downloads both real agents, checks bytes, validates and verifies on Monad
using public RPC, then evaluates an explicit policy. Vercel-style local production
mode disables all Passport publication POSTs and wallet write controls; the public
comparison endpoint accepts only the two unchanged demo files with bounded reads.
Final predeployment tests: **239 passed**, both typechecks, library and instrumented
web builds, dependency tree, local HTTP/browser checks, independent onchain read-back,
secret scan and reference preservation pass. Audit remains 19 advisories (15 moderate,
4 high); the four high packages are absent from this exact emitted release build.
The verified source commit `9587f96` was first pushed to
`origin/signal-passport-monad`. On October 11, the owner explicitly directed a
force-with-lease update of remote `monad-metropolis` to the same commit; its old
tip `c653e44` is preserved locally as `backup-monad-metropolis`. Vercel
project `signal-passport-monad` exists without a deployment. Its published
Firewall rule covers both `/api/` routes at a shared 30 requests/minute/IP,
returning 429. Alchemy remains Free, with a 30M-CU monthly account quota and
no payment method shown; a custom $10 per-app cap would require a paid plan,
which was not authorized. The $0 Free-plan spending ceiling is the current
cost control, with possible interruption at its CU limit. Production read-only
flag now reads back as `1`; the Production Alchemy Secret and public Dynamic ID
are configured. The Vercel project is linked to the correct GitHub repository and
tracks `monad-metropolis` for Production; both remote branches now point to
the same release commit. The push did not produce a Vercel deployment. Any
explicit deployment still requires owner approval. Public origin, actual Vercel build and hosted verification
remain pending. M8
is **not ACCEPTED**. See `docs/verification/MONAD-M8.md`. No public deployment or
blockchain transaction has occurred.

**Owner-directed CRE setup prototype, separate from M8 acceptance:** the project-local
Chainlink CRE skill, CLI v1.38.0 and TypeScript toolchain are installed. A read-only
cron verifier for the real Agent 2072 Passport v2 passes native CRE simulations on
both `staging-settings` and `local-simulation`, confirming its canonical digest,
Monad Testnet Registry publication and ERC-8004 association. Its five focused tests,
TypeScript check and the existing 239-test repository baseline pass. A CRE Hackathon
Early Access request was submitted; deployment access is not yet enabled. No CRE
workflow was deployed, activated, uploaded or broadcast, and no transaction was sent.
This prototype does not satisfy the pending public M8 deployment or establish live
CRE sponsor completion. See `docs/verification/MONAD-CRE-SETUP.md`.

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
| M8 | Predeployment re-audited; both remote branches at release commit, public deployment pending |
| M9+ | Not started |

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

## Exact next action

Review the M8 predeployment report and change set. Obtain explicit owner approval
for the push from local `monad-metropolis` to remote `signal-passport-monad` and a
new Vercel project. Configure Firewall limits and Alchemy budget before exposing
the URL; verify the actual hosted app, files, APIs and browser before M8 acceptance.
No blockchain transaction is authorized; never repeat completed v2 publication.
