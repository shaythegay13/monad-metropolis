# Signal Passport Monad

Signal Passport is a portable economic-history layer for autonomous agents.
It provides evidence-backed history; the consuming application supplies trust policy.
No universal trust score.

**Active project:** `signal-passport-monad/`. Sibling `signal-passport/` and
`ledgerlens/` are READ ONLY prior projects. This repository runs independently.

## Current scope

M0.5 preserves accepted M1 identity resolution and verification foundations. M2 adds
bounded Envio HyperSync ingestion for registry-designated agent wallets. M3 adds
explicit agent Passport v2 with eight deterministic dataset metrics, literal observations,
scope, coverage, provenance and limitations. The independent offline consumer supports
both v1 and v2. M4 adds authorized onchain publication and independent Alchemy-backed verification.
M5 adds a Next.js web application with Dynamic/MetaMask connection, existing Passport
inspection and wallet-mediated version 2 publication. The owner completed the successful wallet flow; v2 publication/read-back are verified.
M5 and M6 functional scopes are accepted with documented limitations. M7's frontend
redesign is accepted after owner visual and read-only wallet review; see
`docs/verification/MONAD-M7.md`. This does not grant production security approval.

## Explore the M7 web experience

After starting the local app, visit `/` for the product overview, `/passport` for the
published Agent 2072 version 2 artifact and independent read-only checks, `/compare`
for real Agent 2072 versus Agent 2 policies, and `/developers` for the consumer path.
These routes do not need a wallet. `/wallet` retains the Dynamic/MetaMask publication
workspace; current onchain version 2 disables its version 2-only preparation action.
The Passport page downloads the exact accepted version 2 JSON. Its historical link
downloads immutable version 1. No new transaction is part of M7.

## Run the web application (M5)

From this repository, use Node >=22 and npm >=10:

```powershell
npm.cmd ci
npm.cmd run web:dev -- --hostname 127.0.0.1 --port 3050
```

Open **http://127.0.0.1:3050** in your MetaMask-enabled browser. The launcher loads
only `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`, `ENVIO_API_TOKEN` and
`ALCHEMY_MONAD_TESTNET_RPC_URL` from ignored root `.env.local` (existing process
values take priority). Only the Dynamic project ID is public. `DEPLOYER_PRIVATE_KEY`
is explicitly removed from the web child process and is never used for web signing.
Enable MetaMask and your local app origin in the Dynamic project as needed; do not
disable Dynamic origin restrictions to work around a configuration problem.

The accepted v1 Passport is accessible without a wallet at `/api/passport?download=1`.
Connect MetaMask through Dynamic, switch to Monad Testnet **10143**, and use the
current registry-designated Agent 2072 wallet. Prepare version 2, download its exact
artifact, and review the hash, evidence scope, publisher, contract and fee.
**The owner must approve the first live test before clicking Publish.** The wallet
then asks for the signature. At most one live M5 publication is authorized. Do not
blindly retry a wallet timeout: inspect MetaMask activity and the Registry first.

The application only supports Agent 2072 / version 2 in M5. Existing v1 is immutable;
both v1 and proposed v2 have empty content URIs because public artifact hosting has
not been authorized. A localhost URL is not presented as a publicly hosted artifact.
The public pending hash and submitted bundle are retained in browser localStorage
for receipt/read-back recovery after a disconnect or reload. No credentials are stored
there. A reverted or unresolved submission remains blocked from automatic retries.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run web:typecheck
npm.cmd run web:build
npm.cmd run web:start -- --hostname 127.0.0.1 --port 3050
```

`build` continues to compile the library/CLI; `web:build` builds the web application.
For a later authorized Vercel deployment, configure Next.js with project root
`apps/web`, install from the repository root (`cd ../.. && npm ci`), build with
`cd ../.. && npm run web:build`, and use the default `.next` output. Enable inclusion
of files outside the root directory. Configure the three web variables in that
deployment; never add the deployer key. This configuration has not been deployed or
verified on Vercel. Public API rate limits/abuse controls and the remaining SDK
dependency advisories must be reviewed before external deployment.

## Install and verify

Node >=22 and npm >=10; verified environment is recorded in STATUS.md.
From this repository (use `npm.cmd` instead of `npm` if PowerShell blocks npm.ps1):

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run verify:agent -- monad-testnet 1
```

The CLI is read-only and requires no key or wallet. An optional process environment
variable `MONAD_IDENTITY_RPC_URL` overrides the configured HTTPS RPC. `.env` files are
not automatically loaded. The accepted M1 retrieval restrictions still apply.

Compiled CLI after build:

```powershell
node dist/scripts/verify-erc8004-agent.js monad-testnet 1
```

The offline consumer is `packages/consumer/src/validate-bundle.ts`; emitted form is
`dist/packages/consumer/src/validate-bundle.js`. It verifies schema/evidence references
and digest without rerunning analysis. Local digest matching does not prove ownership,
authenticity or onchain publication. The inherited publication labels merely reflect
supplied metadata; v1 does not verify registry publication. M4 adds explicit v2 onchain verification below.

## Governance and provenance

Read `docs/PRD-MONAD.md`, `docs/HACKATHON_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`,
`STATUS.md`, `AGENTS.md` and `CLAUDE.md`. `docs/REUSE.md` lists exact migration choices.
`docs/verification/MONAD-M4.md` records current publication verification.
`docs/verification/MONAD-M3.md` preserves deterministic Passport verification.
`docs/verification/MONAD-M2.md` preserves the accepted evidence pipeline verification.
Historical M0/M1 reports retain their original context and test counts.

## Git boundary

This project has newly initialized history, not a copy/clone of either reference `.git`.
The GitHub remote preserves the old M0 lineage on `monad-metropolis`. The independent
bootstrap `ea30c95` is published on `signal-passport-monad`; the local `monad-metropolis`
branch tracks that remote branch. Accepted M2 is committed locally as
`9dfc4e7e595175dc9d6397a8aa05296da038014d`; it has not been pushed.
M3 is committed at `60782f17cf40ef4f7fe707558c34bd0ca00221bc`.
M4 changes remain uncommitted for owner review. No M4 push was performed.

## M2 evidence verification

Set `ENVIO_API_TOKEN` in this repository's ignored `.env.local`. Never commit its value.
This CLI reads public data only. Windows must explicitly use `json`: official client
1.4.1 has Linux/macOS native binaries, not Windows. On a supported platform `native`
selects the official SDK; native live execution is not verified in this Windows baseline.
No automatic fallback occurs. After building, reproduce the frozen agent-2 query:

```powershell
node --env-file=.env.local dist/scripts/verify-envio-agent-activity.js monad-testnet 2 10830000 68955393 json
```

Both block arguments are mandatory; the end block is **exclusive**. An optional final
output path creates a new complete JSON proof (it refuses to overwrite existing files).
The command exits 1 for errors, partial or unknown coverage. Public identity association
is resolved afresh, so a changed registry wallet can change later results. Stored real
captures replay deterministically in the tests.

Independent RPC sample verification, writing a new report:

```powershell
node dist/scripts/cross-check-envio-activity.js dist/m2-cross-check.json fixtures/real/monad-m2/agent-2.json fixtures/real/monad-m2/agent-1.json
```

The two primary records are historical direct transactions, not evidence of payments,
service delivery or recent economic activity. Coverage applies only to the declared query.

## M3 offline Passport generation and verification

Use the accepted captured evidence and explicit generation metadata; no API token or
network connection is needed. The output path must not exist:

```powershell
node dist/scripts/generate-agent-passport.js fixtures/real/monad-m2/agent-2.json dist/m3-review.json 2026-10-07T12:47:03.588Z
node dist/scripts/verify-agent-passport.js dist/m3-review.json
```

The retained real artifact and reproducibility metadata are in `fixtures/real/monad-m3/`.
The consumer verifies schema, reference/scope coherence and the canonical payload digest.
It does not rerun the generator, authenticate the author or independently recalculate
metric accuracy. Current registry association does not prove historical association;
observations describe only the wallet's included dataset within its declared scope.
Partial/unknown coverage remains explicit; provider errors cannot become zero activity.

## M4 published Passport verification

The controlled demo is agent **2072**, published on chain **10143** at registry
`0x7d9cc86196241485cf1efaf8a96c7819ea95b194`. Its evidence contains two real
identity-management transactions; no commerce or service activity is inferred.

Set `ALCHEMY_MONAD_TESTNET_RPC_URL` in ignored `.env.local`, then:

```powershell
node --env-file=.env.local dist/scripts/verify-published-passport.js fixtures/real/monad-m4/agent-2072-activity.json.passport.json fixtures/real/monad-m4/deployment.json
```

This standalone reader requires neither DEPLOYER_PRIVATE_KEY nor ENVIO_API_TOKEN.
Trust the deployment configuration independently of imported Passport data. Local
integrity and onchain publication matching are separate results. A current wallet may
rotate after publication; historical provenance remains. The content URI is empty:
public artifact hosting is deferred, while portable file import and onchain hashing work.

The bounded `monad-registry.ts` tool also supports authorized testnet writes. See the M4
report for exact commands and public transaction recovery journals. Do not rerun writes
merely to verify the published fixture. No mainnet, Dynamic, Nansen or M5 work is included.


## M6 consumer policies

Open `/compare` in the local web app. Inspect the two real Passports, select an example
policy or edit thresholds, then click Run policy evaluation. Changing settings clears
old results. No wallet connection or signature is needed for comparison.

Agent 2072 is Passport version 2; Agent 2 is Passport version 1 under schema 2.0.0.
The historical Agent-2 filename is not a claim that it has published version 2.
The interface shows local integrity separately from fresh read-only Monad publication,
query coverage, activity dates and limitations. Example policies are not recommendations.

Developer use after `npm.cmd run build`:

```javascript
import { verifyCandidate, evaluatePolicy, compareCandidates }
  from './dist/packages/policy/src/index.js';
// Supply your existing Passport JSON. No generator or Envio access is needed.
const policy = { policyVersion: '1.0.0', minimumObservedTransactions: 2 };
const verified = await verifyCandidate('my-agent', passport);
const result = evaluatePolicy(verified, policy);
// For chain verification, pass { trust, rpc } from your consuming application.
// Obtain Registry trust independently; never trust configuration inside a Passport.
// compareCandidates([resultA, resultB]) compares distinct agents under one policy.
```

`node dist/scripts/evaluate-policy.js request.json [trusted-deployment.json]` accepts
`{policy,candidates:[{candidateId,passport}]}`. Without the second argument it is offline:
publication is not_checked, not absent. With the independently trusted deployment file,
configure ALCHEMY_MONAD_TESTNET_RPC_URL; the command performs reads only. It needs neither
Envio nor a deployer key. The deployment file has the same {trust: ...} shape as the M4
trusted deployment record. The policy schema and decision table are documented in
`docs/verification/MONAD-M6.md` and `packages/policy/src/schema.ts`.

Local HTTP: GET `/api/policy` returns real candidate artifacts. POST the same request
shape as the CLI using same-origin application/json (maximum 2 MB, 1-10 candidates).
The server computes verification itself; supplied verification assertions are rejected.
Responses include structured candidates and equally eligible candidate IDs. Errors:
400 malformed JSON, 403 origin, 413 size, 415 media type, 422 invalid policy/candidates,
429 process rate/concurrency limits. This local route is not public deployment clearance.
M5's 19 dependency findings and production-security limitations remain documented.
