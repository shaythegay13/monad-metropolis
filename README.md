# Signal Passport Monad

Signal Passport is portable, evidence-backed history for AI agents on Monad.
The consuming application supplies trust policy. No universal trust score.

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
M8 is accepted for the bounded public, read-only Monad Testnet demo at
**https://signal-passport-monad.vercel.app**. Anonymous pages/APIs, exact hosted
artifacts, independent onchain verification, policies and the external consumer
pass; the owner confirmed the real public MetaMask/read-only check. The 19
dependency advisories remain disclosed; see `docs/verification/MONAD-M8.md`.

M9A is owner-reviewed and accepted as a genuine native-simulated Chainlink CRE
integration. The existing cron workflow retrieves raw public artifacts through CRE
HTTPClient, validates schema/references and hashes, and directly reads Monad Registry
and ERC-8004 state through CRE EVMClient at a consistent finalized block. Real runs
verified Agent 2072 v2 and confirmed Agent 2 v1's missing publication with valid local
integrity. See `docs/verification/MONAD-M9A.md` and `MONAD-M9A-DEMO.md`; this is
unsigned simulation evidence, not a deployed DON or signed report.

The October 13 self-service release is live at the public URL and supersedes the
earlier read-only public mode. Without a wallet, anyone can look up any Monad Testnet
ERC-8004 agent and verify an uploaded Passport file. With their own wallet, connected
through Dynamic, a user can register an agent, sign a gas-free challenge to generate the
agent's next Passport from bounded Envio evidence, download it, and publish its digest
from the agent's designated wallet. The server holds no signing key and never sends a
transaction. Shared Upstash Redis enforces single-use challenges, cooldowns and budgets;
generation and transaction preparation fail closed without it. Agent 2316 ("Bob") is the
owner's test agent, created end to end through this flow; its only evidence is its own
registration transaction, so it demonstrates the workflow, not agent performance.

Submission requirements, field-ready descriptions, recording outlines and the
approval-gated two-branch push plan are in `docs/submission/`.

## License, reuse and AI-assisted development

Original project code is licensed under [MIT](LICENSE). The owner authorized this
license and confirmed rights to the reused foundation. Third-party components
retain their licenses; see [third-party notices](docs/THIRD-PARTY-NOTICES.md).

The pre-existing Signal Passport foundation contributed selected schemas, stable
evidence identifiers, canonical SHA-256 verification, identity and consumer code.
[REUSE.md](docs/REUSE.md) and its migration manifest identify the exact files and
source hashes. The Monad submission adds bounded HyperSync ingestion, deterministic
agent Passports, the authorized Registry, Dynamic wallet flow, independent Alchemy
verification, consumer policies, the public frontend, independent CRE orchestration and
self-service verification, generation and wallet publication.
No percentage-originality claim is made. LedgerLens supplies reference patterns,
and neither prior repository is a runtime/build/test dependency.

Codex and Claude Code were used to assist implementation, testing and documentation. The owner
reviewed and accepted milestone results. Observations and verification outcomes
come from deterministic code and declared evidence, with explicit coverage limits.

## Explore the public application

At the public URL, or after starting the local app:

- `/` is the product overview; `/passport` shows the published Agent 2072 version 2
  artifact with independent checks re-run on load; `/compare` evaluates real Agent 2072
  and Agent 2 Passports under one policy; `/developers` documents the API, the consumer
  path and the CRE results. No wallet is needed.
- `/verify` looks up any agent ID (owner, designated wallet, publication history) and
  verifies an uploaded Passport file against your requirements. No wallet is needed and
  nothing is stored.
- `/wallet` (labelled Create) is the self-service workspace: optional ERC-8004
  registration, signed-challenge generation of the next version, download, and
  publication from the agent's designated wallet. Every transaction is reviewed and
  signed in the user's own wallet.

Self-service APIs: GET `/api/agents/{id}`, POST `/api/verify`, and POST
`/api/self/generate`, `/api/self/prepare` and `/api/self/confirm` (same-origin JSON).
The server prepares the unsigned publication transaction and confirms its receipt with a
Registry read-back, but never signs. Passport files are not hosted: users keep the downloaded
JSON, and the Registry stores only its digest. The Passport page downloads the exact
accepted version 2 JSON; its historical link downloads immutable version 1. The original
Agent 2072 demo publication endpoint (`/api/passport`) still rejects preparation with 403.

## M8 artifact and developer quickstart

The production app serves original-byte files at
`/passports/agent-2072-v2-published.json`,
`/passports/agent-2072-v1-historical.json`, and
`/passports/agent-2-v1-unpublished.json`. All three paths are publicly verified
at https://signal-passport-monad.vercel.app. The existing onchain content URIs remain
empty. After `npm.cmd run build`, run
`node examples/external-consumer/evaluate.mjs https://signal-passport-monad.vercel.app/` to download, validate,
check Monad publication and compare the two agents without a wallet or Envio.
See `examples/external-consumer/README.md` for the pinned trust root and exact-byte
checks.

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
Self-service generation and transaction preparation also need `KV_REST_API_URL` and
`KV_REST_API_TOKEN` (Upstash Redis REST) in the process environment; the launcher does
not read them from `.env.local`. Without them those two routes return 503, while agent
lookup and file verification keep working.

The accepted v1 Passport is accessible without a wallet at `/api/passport?download=1`.
Agent 2072 version 2 has already been published and independently verified. Do not
prepare, sign or repeat that transaction. MetaMask is optional for Passport
inspection, lookup, verification and policy comparison.

The historical M5 Agent 2072-only wallet flow (`apps/web/app/passport-app.tsx`) is kept
for its tests but is no longer mounted; `/wallet` renders the self-service workspace.
Existing published versions have empty onchain content URIs. M8's static files do not
modify those onchain records.

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run web:typecheck
npm.cmd run web:build
npm.cmd run web:start -- --hostname 127.0.0.1 --port 3050
```

`build` continues to compile the library/CLI; `web:build` builds the web application.
Production runs on Vercel with project root `apps/web`, installing from the repository
root (`cd ../.. && npm ci`), building with `cd ../.. && npm run web:build`, the default
`.next` output and inclusion of files outside the root directory. It is configured with
the three web variables plus the Upstash Redis REST variables; never add the deployer
key. The 19 dependency advisories remain disclosed; passing checks are not a security
audit.

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
Both GitHub branches, `monad-metropolis` (the default) and `signal-passport-monad`,
carry the same released history; releases are pushed to both by non-force fast-forward.

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
