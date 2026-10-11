# M8 — Public deployment and developer readiness

## October 11 Git branch update (deployment still pending)

At the owner's explicit instruction, `git fetch origin` reconfirmed remote
`monad-metropolis` at `c653e44e78ba0e902013b807fef3ad3f603e797a` and
`signal-passport-monad` at `9587f964baabe9b23da691e0afaef537a14e81ac`.
The old default tip was preserved locally as `backup-monad-metropolis`. An
explicit force-with-lease updated **only** remote `monad-metropolis` to
`9587f96`; a fresh remote read shows both branches now at that commit. The
working tree's existing uncommitted M8 and CRE files were not pushed. Vercel
still tracks `monad-metropolis` for Production; no deployment appeared after
the push and the public homepage still returns HTTP 404. M8 remains open.

## October 10 release re-audit (deployment still pending)

The owner selected the Envio, Dynamic, Alchemy, Chainlink CRE and Nansen sponsor
bounties and removed the Community Team bounty. This M8 re-audit does not claim
CRE or Nansen integration acceptance and does not begin M9. No new push,
deployment, paid configuration or blockchain transaction was performed.

- At this checkpoint, GitHub reported `shaythegay13/monad-metropolis` as public, with older default
  branch `monad-metropolis`. A fresh `git ls-remote` places the intended
  `signal-passport-monad` branch at the reviewed `9587f964baabe9b23da691e0afaef537a14e81ac`;
  the default branch then remained at `c653e44e78ba0e902013b807fef3ad3f603e797a`.
- `https://signal-passport-monad.vercel.app/` returned HTTP 404 during this
  re-audit. No public pages or hosted artifacts can be claimed live. The Vercel
  connector returned 403, but device sign-in restored scoped CLI access.
  Project `prj_RzlhqAIUsAveqyRPUTVfSUh51n3P` has **no deployments** and is
  connected to the correct GitHub repository with the **wrong Production branch**:
  `monad-metropolis`. This must be changed to `signal-passport-monad` before
  deployment; no branch change or deployment was made in this re-audit.
- Production now lists `ALCHEMY_MONAD_TESTNET_RPC_URL` as a Secret,
  `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` as Config and
  `SIGNAL_PASSPORT_PUBLIC_READ_ONLY` as Config. The first two were missing at
  the start of this re-audit and were populated from the ignored local file under
  the earlier M8 authorization. The read-only flag was overwritten with literal
  `1` after the previous stored value could not be confirmed. Direct per-variable
  read-back confirms the Dynamic Config matches the local public ID and the
  read-only Config equals `1`. The Alchemy Secret is intentionally not readable
  through that API, so its exact remote value cannot be independently compared
  until a deployment exercises it. `DEPLOYER_PRIVATE_KEY`, `ENVIO_API_TOKEN`,
  `ALCHEMY_API_TOKEN` and a Nansen key are absent from Vercel Production.
- The active Firewall configuration contains one valid rate-limit rule,
  `rule_limit_public_api_requests_0PhN8l`: `/api/` prefix, 30 requests per IP
  per fixed 60-second window. It covers both required routes; live 429 behavior
  remains untested. A fresh Alchemy dashboard inspection shows Active Plan:
  Free, 32,026 / 30,000,000 CUs this month, a 300-CU/s throughput ceiling and
  no listed payment method or invoices. There is no configurable $10 per-app cap
  on this Free plan; the bounded demo relies on the Free-plan $0 spending
  exposure and finite account-wide CU quota, with possible service interruption.
- Fresh checks on the unchanged release: 239/239 tests; both typechecks,
  library build, web production build and `npm ls --all` pass. The web build
  emits five static pages and the two dynamic API routes. `npm audit` still
  reports 15 moderate, 4 high and 0 critical findings. The four high package
  names occur only in Webpack build-cache files, not emitted static/server
  output; this is a reachability observation, not a patch or security approval.
- `.env.local` remains ignored. The local Envio token, Alchemy RPC URL and
  deployer key have zero exact-value matches across tracked files and the
  fresh `.next` tree. The intentional public Dynamic environment ID appears
  in build assets. No forbidden variable-name markers were found in client
  static files. The three local Passport artifacts retain their documented
  raw SHA-256 hashes.
- The existing independent read-only verifier again returned `verified` at
  Monad Testnet block `69999529`: Agent 2072 version 2, digest
  `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`,
  publisher/current agent wallet `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`,
  matching Registry record and publication provenance. No transaction was sent.
- Reference repositories remain unchanged: `signal-passport/` at `fc79feb3`
  retains its two pre-existing untracked documents; `ledgerlens/` at
  `bd9b41ce` is clean. The separate CRE setup prototype is source-only for
  this milestone and is not imported by the M8 web build or deployed to CRE.

M8 remains **not accepted**. Before any public exposure, reverify the Vercel
Production variable names and types, read-only flag, active Firewall rule and
Alchemy Free-plan spending ceiling; confirm the intended Git connection and
production branch. Obtain fresh owner approval before connecting/pushing or
deploying. Then check the actual Vercel build and every live path listed below.

October 10, 2026 (America/New_York). **State: authorized release in progress;
M8 is not accepted.** The verified release was pushed to the intended GitHub branch,
and a Vercel project and pre-exposure Firewall rule exist. No public deployment,
wallet signature or blockchain transaction has occurred. Live-hosted behavior
remains unverified.

## Authorized release checkpoint (October 10)

- The owner authorized the bounded public demo, with effective API rate limiting
  and enforceable Alchemy cost protection before public exposure. The exact local
  release `9587f964baabe9b23da691e0afaef537a14e81ac` passed 239/239 tests,
  both typechecks, library build, web production build, and `npm ls --all`.
- After fetching and confirming that `origin/signal-passport-monad` at `ea30c95`
  was an ancestor of local HEAD, `git push origin HEAD:signal-passport-monad`
  advanced **only** that remote branch to `9587f96`. The older default branch
  was not targeted. The branch root contains `apps/`, `packages/`, `package.json`
  and `vercel.json`, and an unauthenticated GitHub request returned HTTP 200.
  A final M8 report commit remains to be made.
- Vercel project `signal-passport-monad` was created under Hobby team
  `saved-by-the-plates-projects`, ID `prj_RzlhqAIUsAveqyRPUTVfSUh51n3P`,
  without a deployment or Git connection. The Next.js preset and Node 24.x are
  selected; repository root directory is blank (repository root). The no-cost
  `signal-passport-monad.vercel.app` domain was assigned to Production and
  currently reports **No Deployment**. The actual Vercel build and output
  have not yet been tested.
- Published Vercel Firewall rule `rule_limit_public_api_requests_0PhN8l` matches
  request paths starting `/api/`, counting by IP in a fixed 60-second window.
  After 30 requests it returns HTTP 429. This single Hobby-plan rule covers
  both `/api/passport` and `/api/policy`; the shared quota differs from the
  earlier separate 30/10 proposal. Counters may be regional, so this is abuse
  mitigation rather than a global absolute request cap. No live 429 test yet.
- Alchemy dashboard shows the current **Free** plan, a 30M-CU monthly
  account-wide usage limit, 31,888 CUs used at inspection, and no payment method
  listed. Its custom/per-app `Set limit` control led to a Pay As You Go upgrade
  with a temporary card hold; no upgrade was authorized or made. The current
  free plan's $0 spend exposure and monthly CU ceiling are the equivalent cost
  protection for this bounded demo, with service interruption possible at the
  free quota. There is no configurable $10 per-app cap on this plan.
- `SIGNAL_PASSPORT_PUBLIC_READ_ONLY=1` is saved for Production. The owner was
  asked to enter only `ALCHEMY_MONAD_TESTNET_RPC_URL` (Secret) and
  `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` (Config) directly in Vercel. Browser
  file upload was blocked by the extension; the temporary two-variable import
  file was removed. Neither forbidden credential was configured.
- Exact-value scan of three local secret values found zero matches in tracked
  files or 428 emitted release files; `.env.local` is ignored. The audit still
  reports 15 moderate, 4 high, 0 critical; all four high Solana package names
  have zero matches in the fresh emitted static/server files. No production
  security certification is implied.
- The official portal's Google sign-in callback was blocked by the browser,
  so its current submission checklist and track terms remain unverified.

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
`GET /api/passport` and fixed-demo policy checks. The shared Vercel Firewall
rate limit and Alchemy Free-plan cost ceiling described above are in place before
deployment. Their live effect remains to be checked. Dynamic must allow the
eventual public origin for optional wallet connection.

The original separate 30/10 Firewall proposal cannot fit the Hobby plan's
one-rate-rule allowance; the published 30/minute/IP `/api/` rule is shared by
both routes. Inspect live 429 behavior and Firewall traffic after deployment.
The proposed $10 Alchemy per-app cap is unavailable without a paid plan change;
the existing Free plan instead has a $0 spending ceiling and 30M account-wide
monthly CU quota. See [Vercel WAF rate limits](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting),
[Vercel Hobby usage](https://vercel.com/docs/plans) and
[Alchemy Free tier](https://support.alchemy.com/articles/5827006872-what-is-included-in-the-free-tier).

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

## Git and deployment state

The active local Git branch is `monad-metropolis`, with accepted M7 commit
`45cdca947618a339f1d45d87ce10180507d6c3a2` and M8 predeployment commit
`9587f964baabe9b23da691e0afaef537a14e81ac`, now pushed to the intended
remote branch.
`origin` fetch/push is `https://github.com/shaythegay13/monad-metropolis.git`.
The local branch tracks `origin/signal-passport-monad` (now `9587f96`);
`origin/monad-metropolis` is a **different**, older default branch at `c653e44`.
The push targeted **local `monad-metropolis` to remote
`signal-passport-monad`**, keeping the default branch untouched. The Vercel
project must explicitly select `signal-passport-monad` as its production Git
branch before serving a deployment.

Vercel project: **`signal-passport-monad`** under team
`team_EPiftAcVZBFtFR2mosmh66pS`; no deployment or assigned live URL yet.
The intended public target is its Vercel-generated domain, to be confirmed
after deployment. Repository root directory is blank; Framework Next.js and
Node 24 are selected. The checked-in config requests install `npm ci --include=dev`;
build `npm run web:build`; output
`apps/web/.next`, as in `vercel.json`. The exact hosted build behavior of this
monorepo config remains unverified until a Vercel build completes. Set Vercel
environment variable names `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`,
`ALCHEMY_MONAD_TESTNET_RPC_URL` and `SIGNAL_PASSPORT_PUBLIC_READ_ONLY=1` for
production. The latter is defense in depth; Vercel's automatic `VERCEL=1` also
locks writes. Never add deployer or Envio credentials.

After the two remaining Production variables are configured: connect the correct
GitHub repository and production branch, deploy without changing the Registry or Passport, confirm the
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
Next: verify both Production variable names, connect the correct Git branch,
complete the actual hosted build and live checks, then record the outcome. No M9
or optional sponsor work.
