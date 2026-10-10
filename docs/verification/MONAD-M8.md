# M8 — Public deployment and developer readiness

October 9, 2026 (America/New_York). **State: predeployment implementation verified
locally; deployment approval pending. M8 is not accepted.** No GitHub push, Vercel
project creation, public deployment, wallet signature or blockchain transaction was
performed for M8. Live-hosted behavior remains unverified.

## Scope and authoritative gap

M7 was accepted and committed locally as
`45cdca947618a339f1d45d87ce10180507d6c3a2`; its four MetaMask checks are
owner-reported. M8 preserves that design and the existing Registry, Passport data,
publisher, policy semantics and signing handlers. The intended submission is the
Trust, Identity & AI Infrastructure track. Internal
`docs/HACKATHON_REQUIREMENTS.md` lists main-track deliverables separately from
sponsor-bounty sections. The [official submission portal](https://hackathon.monad.xyz/)
requires sign-in to inspect its current detailed terms, so current mandatory
track-specific rules could not be independently confirmed from the public portal.
No claim is made that all sponsors are mandatory. The owner should check the live
portal's track and submission checklist before submission.

There is a governing-document gap: `docs/PRD-MONAD.md` lists meaningful Nansen
enrichment as P0, while the owner's M8 instruction explicitly forbids implementing
Nansen in this milestone. This report does not mark PRD P0 or the Nansen bounty
complete. Resolve the PRD scope before any overall P0-complete claim.

## Public artifacts and independent consumer

The production web app serves three static, read-only files. Each is a byte-for-byte
copy of its accepted fixture, verified by `tests/public-release.test.ts` and a
running production-server HTTP read. These are **raw file** SHA-256 hashes; the
published canonical payload digest is a separate value.

| Public path | State | Raw file SHA-256 |
| --- | --- | --- |
| `/passports/agent-2072-v2-published.json` | Agent 2072 v2, published | `eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c` |
| `/passports/agent-2072-v1-historical.json` | Agent 2072 v1, historical published version | `e5000c87c18182c6e4c2f18690ccff82942a695915d04e649c71e39eab02dde1` |
| `/passports/agent-2-v1-unpublished.json` | Agent 2 v1, offline/unpublished | `d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d` |

The historical onchain content URIs are empty; these hosted paths do **not**
retroactively update onchain records. The Passport page's main and historical
download links now point to original-byte static files. The separate
`examples/external-consumer/evaluate.mjs` downloads Agent 2072 and Agent 2,
checks raw bytes, verifies schema/references/canonical digest and the Monad record
under a separately pinned Registry trust root, applies a consumer policy, and
compares criterion-level outcomes. It uses the compiled consumer library source;
no published npm package or third-party integration is claimed. Its default public
Monad RPC requires no wallet, Envio token or Alchemy credential. Local production
run returned Agent 2072 `SATISFIED` with publication `verified`, Agent 2
`NOT_SATISFIED` with publication `not_found`; the latter is not labeled published.
See `examples/external-consumer/README.md` and the `/developers` page.

An independent Alchemy read-only verification of the hosted-file source reconfirmed
chain 10143, Agent 2072 version 2, published canonical digest
`0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`,
publisher `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`, publication block
69236935 and matching Registry/provenance at checked block **69658868**.
`MONAD-M8-onchain.json` records the full result; no write was made.

## Public API boundary and production security

`VERCEL=1` automatically makes `/api/passport` POST return 403 before any prepare,
preflight or confirm action. `SIGNAL_PASSPORT_PUBLIC_READ_ONLY=1` enables the same
mode elsewhere and is recommended as an explicit production setting. The wallet
page displays the read-only state and disables preparation/publication; connecting
a wallet remains optional for viewing account status. The local non-Vercel owner
workflow is preserved. The public app exposes no generic RPC proxy, signer,
arbitrary agent analysis or automatic publication.

`/api/policy` retains same-origin JSON checks, 2 MB streamed-body limit, 5-second
body deadline and per-instance 20/minute plus two-active-request gate. In public
mode it accepts only exact copies of the two displayed real candidate artifacts;
altered or other candidate files receive 422. It bounds read-only RPC methods,
calls and deadline, and reuses verified demo contexts for 60 seconds per instance.
The local production-mode smoke check returned five UI HTTP 200s, three exact-file
HTTP 200s, Passport latest `2` and read-only true, publication POST 403, modest
policy Agent 2072 `SATISFIED` / Agent 2 `NOT_SATISFIED`, altered candidate 422 and
foreign-origin policy 403. A fresh in-app browser saw the settled Passport's five
checks, the visible comparison outcomes with focus at the results summary, the
developer guide and wallet controls disabled. This is local production-browser
verification, **not** a live Vercel test or agent-observed MetaMask test.

Same-origin checking is CSRF protection, **not authentication**: non-browser clients
can forge an Origin header. The gate/cache are **per serverless instance**, not a
distributed limit. An anonymous caller can still cause billable Alchemy reads via
`GET /api/passport` and fixed-demo policy checks. Before enabling a public URL,
configure a Vercel Firewall rate limit for `/api/passport` and `/api/policy` and an
Alchemy account budget/spend alert or cap. Validate the resulting abuse budget on
the actual deployment. Until then, public spending control is an explicit release
blocker; tests alone do not clear it. Dynamic must allow the eventual public origin
for optional wallet connection. No Vercel project exists yet, so platform rules
and Dynamic origin cannot be verified now.

Proposed initial Firewall limits are **30 GET `/api/passport` requests per minute
per IP** and **10 POST `/api/policy` requests per minute per IP**, returning a rate
limit response when exceeded. They should be reviewed in Vercel's live traffic
view and adjusted only with observed use. Propose a dedicated Alchemy app with a
**$10 current-billing-period per-app spending limit** before public exposure;
verify the owner has billing-admin access and that existing usage will not already
exhaust that cap. This is a proposed ceiling, not a current configuration or an
authorization to spend it. See [Vercel WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules)
and [Alchemy per-app limits](https://support.alchemy.com/articles/6014629910-how-to-set-a-per-app-spending-limit).

Only `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` may enter client assets. Configure
`ALCHEMY_MONAD_TESTNET_RPC_URL` as a Vercel server-side Secret; it is never printed
in this report. Do **not** configure `DEPLOYER_PRIVATE_KEY` or `ENVIO_API_TOKEN`
on Vercel. The web launcher strips the deployer key locally. Secret-value scan
found `.env.local` ignored and zero matches in 247 repository files
and 121 browser files, and zero forbidden browser markers
(`MONAD-M8-security-checks.json`). Scan again after any release edits and staging.

## Dependency disposition

`npm.cmd audit --json` exits 1: **19 findings, 15 moderate, 4 high, zero critical**.
The four high affected installed production packages are
`@dynamic-labs/solana-core@4.100.3`, `@solana/spl-token@0.4.14`,
`@solana/buffer-layout-utils@0.2.0`, `bigint-buffer@1.1.5`. Their transitive
path, reachability and compatibility constraints are detailed in
`MONAD-M5-security-review.md`; all four propagate one bigint-buffer advisory.
The instrumented **M8** build finds zero emitted browser, Node and Edge modules
and zero server trace matches for each (`MONAD-M8-bundle-audit.json`). No Solana
connector is registered. There is no established compatible fix for the root
advisory; downgrading Dynamic to the audit-suggested release would break the
MetaMask connector peer range. The 15 moderate findings remain open. This exact
build has no identified high-severity runtime path, which supports a bounded
testnet demo disposition after the platform controls above are set. It is not a
production security certification or a claim that installed packages are patched.

## Predeployment verification

- `npm.cmd test`: **239 passed, four suites; 0 failed, cancelled, skipped, todo**.
  The 237-test M7 baseline is preserved. An initial post-edit run failed M7's
  byte-identical signing-handler regression after a guard was placed inside the
  handler; the guard was removed, the server/API gate retained, and final tests
  passed. `dist/m8-final-tests.log` has the exact final output.
- `npm.cmd run typecheck`, `npm.cmd run web:typecheck`, `npm.cmd run build`:
  all exit 0.
- Instrumented `npm.cmd run web:build`: exit 0; Home, Passport, Compare,
  Developers and Wallet are static routes and the two API routes are dynamic.
  `dist/m8-final-web-build.log` records the build.
- `npm.cmd ls --all`: exit 0. `npm.cmd audit --json`: exit 1 with the 19 findings
  above; no advisories were suppressed or force-upgraded.
- Production-mode HTTP/browser checks and the independent consumer example:
  passed as described above. The read-only verifier result is in
  `MONAD-M8-onchain.json`.
- Reference repositories `../signal-passport/` and `../ledgerlens/`: HEAD,
  status, source bytes and Git metadata bytes unchanged
  (`MONAD-M8-reference-checks.json`).

## Deployment approval checkpoint

The active local Git branch is `monad-metropolis`, with accepted M7 commit
`45cdca947618a339f1d45d87ce10180507d6c3a2` and a locally prepared M8
predeployment change set. No M8 work has been pushed.
`origin` fetch/push is `https://github.com/shaythegay13/monad-metropolis.git`.
The local branch tracks `origin/signal-passport-monad` (currently `ea30c95`);
`origin/monad-metropolis` is a **different**, older default branch at `c653e44`.
The intended push after approval is **local `monad-metropolis` to remote
`signal-passport-monad`**, keeping the default branch untouched. A Vercel project
must explicitly select `signal-passport-monad` as its production Git branch.
The exact push command is `git push origin HEAD:signal-passport-monad`; do not use
an unqualified push that could target the older default branch.

Proposed Vercel project: **new `signal-passport-monad`** under the connected account
(`team_EPiftAcVZBFtFR2mosmh66pS`); read-only lookup returned 404, so no project
or assigned URL exists yet. The intended public target is its Vercel-generated
`signal-passport-monad.vercel.app` domain **if available**; the assigned URL must
be confirmed after project creation. Configure repository root directory `.`;
Framework Next.js; Node 24; install `npm ci --include=dev`; build `npm run web:build`; output
`apps/web/.next`, as in `vercel.json`. The exact hosted build behavior of this
monorepo config remains unverified until a Vercel build completes. Set Vercel
environment variable names `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`,
`ALCHEMY_MONAD_TESTNET_RPC_URL` and `SIGNAL_PASSPORT_PUBLIC_READ_ONLY=1` for
production. The latter is defense in depth; Vercel's automatic `VERCEL=1` also
locks writes. Never add deployer or Envio credentials.

After owner approval: configure project, provider budget and Firewall, push the
specified branch, deploy without changing the Registry or Passport, confirm the
assigned URL, configure Dynamic's allowed origin, and verify all five live pages,
both APIs, the three hosted raw file hashes, the external consumer and fresh
browser behavior. Record the actual deployment ID/URL/commit, protection settings,
onchain read-back and errors here. **Do not mark M8 ACCEPTED before that happens.**

## Files changed and next action

M8 changes: `apps/web/app/api/{passport,policy}/route.ts`,
`apps/web/app/{developers/page,passport-app,passport/passport-view}.tsx`,
`apps/web/lib/{policy-server,server}.ts`,
`apps/web/public/passports/*.json`, `packages/web/src/deployment.ts`,
`examples/external-consumer/{README.md,evaluate.mjs}`,
`tests/public-release.test.ts`, `vercel.json`, this report and companion M8 JSONs,
`README.md`, `.env.example`, repository `STATUS.md` and workspace `../STATUS.md`.
Next: obtain explicit owner approval for the specified Git push and Vercel public
deployment, with the platform spending/rate controls and portal-rule check called
out as unresolved prerequisites. No M9 or optional sponsor work.
