# M8 — Public Deployment and Developer Readiness

**ACCEPTED — October 12, 2026 (America/New_York), for the bounded public,
read-only Monad Testnet demo.** All documented M8 deployment gates pass.
Functional acceptance does not constitute production security clearance or
completed hackathon submission/sponsor eligibility.

This final record replaces the earlier predeployment and pending-wallet
checkpoints. Their implementation history remains in Git; dated verification
JSONs retain the actual observations. Stale branch-change instructions and
stray report text have been removed.

## Production release

| Item | Verified value |
|---|---|
| Canonical public URL | https://signal-passport-monad.vercel.app |
| Project / team | `signal-passport-monad` / `saved-by-the-plates-projects` |
| Project ID | `prj_RzlhqAIUsAveqyRPUTVfSUh51n3P` |
| Ready deployment ID | `dpl_FqH7PT5vNASPuaBsmi2y3prq5ERY` |
| Deployed source commit | `584a2abf11b673f16e26ad321b0d9ae42000640a` |
| GitHub repository | https://github.com/shaythegay13/monad-metropolis |
| Remote branches at closeout | Both `monad-metropolis` and `signal-passport-monad` at the deployed commit |
| Deployment method | Explicit CLI build from the previously verified clean detached checkout; existing Ready build promoted |
| Build settings | Repository root; Next.js; Node 24; `npm ci --include=dev`; `npm run web:build`; `apps/web/.next` |
| Real Vercel build | Ready; 3m11s, `iad1`, two cores / 8 GiB; five static pages and two API routes |

Fresh October 12 inspection reconfirmed Ready and the canonical alias mapping.
Anonymous HTTPS access works without cookies, authentication headers or bypass
tokens. Standard Protection (`all_except_custom_domains`) remains enabled:
the canonical Production domain is public; generated deployment and Preview
URLs retain Vercel Authentication. Promotion resolved access without turning
off project-wide authentication, purchasing a feature, or rebuilding.

## Acceptance gates and provenance

| Gate | Result and evidence | Provenance |
|---|---|---|
| Anonymous Home, Passport, Compare, Developers, Wallet | All five routes HTTP 200; no Vercel sign-in or 404 | Agent HTTP checks |
| Read APIs | GET `/api/passport` and `/api/policy` HTTP 200; available network, latest version 2, public read-only mode | Agent HTTP checks |
| Hosted artifacts | All three exact raw SHA-256 hashes match the table below | Agent independent byte checks |
| Agent 2072 publication | Version 2, accepted digest, publisher/current wallet, Registry trust, local integrity and publication provenance verified | Agent deployed verifier and independent consumer |
| Consumer policies | All three presets and changed-requirement behavior match the table below | Agent API and rendered browser checks |
| External consumer | Downloads authentic bytes, validates integrity, independently checks public Monad RPC, evaluates policy; exit 0 without credentials | Agent CLI check |
| Public write restrictions | Preparation and confirmation/publication POSTs 403; preparation disabled; no usable publication control | Agent HTTP/browser checks, owner connected-wallet check |
| Failure handling | Cross-origin policy 403; malformed JSON 400; unsupported policy 422; altered artifact 422 | Agent HTTP checks |
| Rate limit and recovery | 30 fixed-data GETs accepted; request 31 Vercel 429; shared Passport route blocked; normal reads/evaluation subsequently recover | Agent controlled anonymous HTTP test |
| Secret isolation and spending | Only intended application variables; private values absent from public responses/assets; Alchemy Free; no paid upgrade | Agent configuration, asset and account checks |
| Responsive presentation | Desktop and 390 x 844 viewport checks of all five pages; visible/focused results summary; no page-level horizontal overflow | Agent Edge browser checks |
| Public Dynamic/MetaMask | Connected account B51DD, Monad Testnet 10143, read-only state and disabled preparation/publication all passed; no signature/transaction required | **Owner-reported on October 12, not agent-observed** |
| Regression and references | 239 tests pass; recorded typechecks/builds/dependency validation pass; reference bytes/HEAD/status unchanged | Agent automated checks |

Evidence: [public HTTP/policy/security/Firewall checks](MONAD-M8-public-checks.json),
[browser checks and owner wallet confirmation](MONAD-M8-browser-checks.json),
[reference preservation](MONAD-M8-closeout-reference-checks.json),
[secret checks](MONAD-M8-closeout-secret-checks.json), and
[final closeout recheck](MONAD-M8-final-closeout.json).

Browser checks used Edge without clearing its account cookies. Anonymous
access is established independently by cookie-free HTTP requests, rather
than inferred from the browser session. Desktop/mobile screenshots of all
five pages and Dynamic origins are in [m8-public-screenshots](m8-public-screenshots/).

## Artifact bytes and Monad publication

| Hosted artifact | Raw SHA-256 |
|---|---|
| [Agent 2072 v2, published](https://signal-passport-monad.vercel.app/passports/agent-2072-v2-published.json) | `eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c` |
| [Agent 2072 v1, historical](https://signal-passport-monad.vercel.app/passports/agent-2072-v1-historical.json) | `e5000c87c18182c6e4c2f18690ccff82942a695915d04e649c71e39eab02dde1` |
| [Agent 2 v1, unpublished](https://signal-passport-monad.vercel.app/passports/agent-2-v1-unpublished.json) | `d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d` |

The responses use JSON content type, `nosniff`, and immutable caching.
The v2 page settles from loading to latest published / publication verified;
v1 is explicitly Historical. Agent 2 retains valid local integrity and a
confirmed absent publication. Hosting these bytes does not update the
historical empty onchain content URIs.

The deployed independent verifier observed block `70246552` on chain **10143**:
Agent **2072**, Passport version **2**, Registry
`0x7d9cc86196241485cf1efaf8a96c7819ea95b194`, canonical profile hash
`0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`,
publisher/current agentWallet `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.
Local integrity, hash match, Registry verification and publication provenance
all passed. Existing publication transaction:
`0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d`,
publication block `69236935`. No new transaction, agent or Passport was created.

## Consumer results

| Policy | Agent 2072 | Agent 2 |
|---|---|---|
| Modest | SATISFIED | NOT_SATISFIED |
| Strict | NOT_SATISFIED | NOT_SATISFIED |
| Local integrity | SATISFIED | SATISFIED |

Raising the local transaction minimum from 2 to 3 changes Agent 2 to
NOT_SATISFIED. Controls clear stale results before reevaluation; results
receive focus and are scrolled into view. These are contextual outcomes,
not rankings or a universal trust score.

`node examples/external-consumer/evaluate.mjs https://signal-passport-monad.vercel.app/`
exited 0 using public Monad RPC: Agent 2072 valid/verified/SATISFIED, Agent 2
valid/not_found/NOT_SATISFIED, only Agent 2072 eligible. It requires no
MetaMask, Envio credential, private signing key or analysis service.

## Security and spending disposition

Production has exactly the intended three application variables:
`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` (Config),
`ALCHEMY_MONAD_TESTNET_RPC_URL` (Secret), and
`SIGNAL_PASSPORT_PUBLIC_READ_ONLY` (Config, confirmed literal `1`).
The Dynamic ID matches the accepted local environment. The Alchemy Secret
is intentionally unreadable and was exercised by the deployed verifier.
Deployer, Envio and Nansen credentials are absent from Vercel application
configuration. Private credentials are never included in this report.

Public preparation and confirmation/publication requests return 403 before
evidence generation. The API accepts only the two unchanged demo candidates.
Cross-origin enforcement is CSRF protection, not authentication; non-browser
clients can forge Origin. External developers use the independent library.

Enabled rule `rule_limit_public_api_requests_0PhN8l` covers `/api/`, shared
**30 requests per IP per fixed 60 seconds**. The October 11 controlled
GET-only policy test made zero RPC calls: 30 x 200, then 429 with
`X-Vercel-Mitigated: deny`. The shared Passport route also returned 429.
Afterward both read routes and ordinary policy evaluation returned 200.
October 12 CLI inspection reconfirmed the rule. This is per-IP abuse
mitigation; it is not a global absolute request/cost ceiling.

The inspected Alchemy account remains Free with a 30M-CU monthly account
allowance, $0 monthly cost, no invoices and no listed payment method.
No paid upgrade or card entry occurred. The accepted cost control is the
Free-plan $0 spending exposure; no custom $10 per-app cap is configured.
Exhaustion can interrupt RPC verification and must remain an unavailable
state, rather than a false result or zero activity.

Public response/client scans found no exact private values or forbidden
private-variable markers, including 29 observed wallet scripts
(6,324,359 bytes). The public Dynamic environment ID is intentional.
`.env.local` remains ignored and untracked. Final closeout scans cover
the exact staged documentation/evidence; no unrelated source change is included.

October 12 `npm audit --json` still exits **1** with **19 findings:
15 moderate, 4 high, 0 critical**. No advisory was suppressed or package
force-upgraded. The four high installed transitive packages remain unpatched:
`@dynamic-labs/solana-core@4.100.3`, `@solana/spl-token@0.4.14`,
`@solana/buffer-layout-utils@0.2.0`, `bigint-buffer@1.1.5`.
The exact-release instrumented web graph and server traces emitted none
of these packages; no Solana connector is registered. This supports the
previously accepted bounded read-only/testnet demo disposition and is not
production security certification. The 15 moderate findings remain open.
See [M5 dependency review](MONAD-M5-security-review.md) and
[M8 bundle audit](MONAD-M8-bundle-audit.json).

Dynamic's existing Sandbox environment explicitly permits the canonical
public origin and prior local demo origins `http://127.0.0.1:3050` and
`http://127.0.0.1:3051`; no wildcard, paid tier or new environment was added.
Sandbox usage and quotas remain a limitation for broader production use.

## Tests, builds and preservation

| Check | Exact result / timing |
|---|---|
| `npm.cmd test` | October 12: 239 passed, 4 suites; 0 failed/cancelled/skipped/todo; exit 0 |
| Library and web typechecks | Recorded October 11: both exit 0 |
| `npm.cmd run build` | Recorded October 11: exit 0 |
| `npm.cmd run web:build` | Recorded October 11: exit 0; all five pages and two API routes |
| Vercel production build | Existing reviewed build Ready; 3m11s; no closeout rebuild |
| `npm.cmd ls --all` | Recorded October 11: exit 0 |
| `npm.cmd audit --json` | October 12: exit 1, 19 disclosed advisories |
| External consumer | Recorded public run: exit 0, exact bytes and expected outcomes |
| Final documentation validation | JSON parse, acceptance-gate assertions, staged scope/secret scan and `git diff --check` pass |
| Read-only references | Source/Git bytes, HEAD/status unchanged; no edits to either reference |

Product source has not changed since the reviewed release. Rebuilding
or rerunning live publication is unnecessary for documentation closeout.

## Remaining legitimate limitations and submission work

- This is a Testnet, read-only public demo of two frozen real artifacts,
  not arbitrary-agent generation or a new public publishing service.
- Integrity/publication does not prove source-data truth, service delivery
  or universal agent trustworthiness. Coverage remains explicitly scoped.
- Dependency advisories, provider quotas, per-IP rate-limit limitations,
  Dynamic Sandbox use and empty historical content URIs remain as described.
- Vercel Git integration remains `link: null`. Automatic deploys are a later
  maintenance task requiring approval; this explicit reviewed release is live
  and GitHub source is publicly accessible. No reconnect or history rewrite occurred.
- The owner must review the signed-in official submission form, videos,
  eligibility and track rules. Internal checklist: technical demo <=3 minutes,
  pitch <=2 minutes, public repository; target submission October 13.
- Track: Trust, Identity & AI Infrastructure. Selected sponsors: Envio,
  Dynamic, Alchemy, Chainlink CRE, Nansen; Community Team was removed.
  Envio/Dynamic/Alchemy have product evidence. At this M8 checkpoint CRE was
  a simulated prototype. M9A was subsequently owner-reviewed and accepted as
  a genuine native-simulated integration; see [MONAD-M9A.md](MONAD-M9A.md).
  Nansen remains unimplemented.
  Nansen remains P0 in the PRD pending the explicit owner decision and
  timeboxed M9B assessment. No silent governing-document change was made.

No remaining limitation blocks the accepted **bounded M8 functional scope**.
Closeout changes are documentation and evidence only, prepared for owner review
and commit. No commit, push, redeployment, security configuration change,
blockchain write, Passport mutation or M9A implementation is part of this closeout.

M8 acceptance was reported before M9A implementation. The subsequent owner-
authorized M9A work has 18 passing tests and genuine published/unpublished-agent
native simulation evidence; the owner has reviewed and accepted it. The combined
Git closeout preserves the exact production URL, deployment/source commit,
artifact hashes, historical proof blocks and advisory disposition in this report.
No new Vercel release or blockchain write is part of that Git closeout.
