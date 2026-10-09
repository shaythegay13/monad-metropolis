# M7 — Frontend redesign and user experience

October 9, 2026 (America/New_York). **Verdict: ACCEPTED for M7 functionality and
visual design.** The owner approved the final forest-green color balance and
personally confirmed the four read-only Dynamic/MetaMask checks below. This is
not production security approval.

## Final color-balance correction — current review set

The design now uses deep forest `#102E25`, forest `#194735`, emerald `#2F7554`,
sage `#96B69D`, soft sage `#CBDDC9`, mist `#E5EEE3`, warm neutral `#F4F6F0` and
ink `#192820`. The homepage first viewport has a substantial solid deep-forest
hero with warm-white type and a light-sage italic highlight, contrasted by a
warm-neutral Passport preview and light/outline CTAs. The shared navigation and
footer are deep forest; a second substantial forest section appears lower on Home.
The Passport credential has a dark forest identity/header area over a warm-neutral
evidence body. Compare has a forest introduction and results frame, sage policy
editor and neutral agent result cards. Developers has a soft-sage introduction,
forest documentation navigation and dark code blocks. No gradients or glow effects
were introduced. Only `redesign.css` and two page-title class names changed in the
application for this correction; data, verification, policies, API and signing logic
did not change.

These are actual **settled production-browser** viewport captures from the rebuilt
local app. Passport waited for live version 2 and five passing checks. Compare was
evaluated with the modest policy before its results screenshots were saved.

| Page | Desktop 1440px | Mobile 390px |
| --- | --- | --- |
| Home | [green-forward first viewport](screenshots/m7/home-desktop-balance.jpg), [second green section and footer](screenshots/m7/home-footer-balance.jpg) | [green-forward first viewport](screenshots/m7/home-mobile-balance.jpg) |
| Passport | [verified credential and five checks](screenshots/m7/passport-desktop-balance.jpg) | [verified credential](screenshots/m7/passport-mobile-balance.jpg), [readable checks](screenshots/m7/passport-mobile-checks-balance.jpg) |
| Compare | [forest introduction and policy editor](screenshots/m7/compare-desktop-intro-balance.jpg), [evaluated policy results](screenshots/m7/compare-desktop-balance.jpg) | [forest introduction](screenshots/m7/compare-mobile-intro-balance.jpg), [evaluated outcomes](screenshots/m7/compare-mobile-balance.jpg) |
| Developers | [documentation and dark sidebar](screenshots/m7/developers-desktop-balance.jpg) | — |
| Tablet | [Home at 768px](screenshots/m7/home-tablet-balance.jpg) | — |

At 390px, Home, Passport and evaluated Compare had document width 375px within
the 390px viewport. At 768px, the same pages had document width 753px within
the tablet viewport. The mobile navigation remained visible and usable. Rendered
text-contrast samples: warm-white/deep-forest **13.4:1**, soft-sage/deep-forest
**10.23:1**, dark-ink/warm-neutral credential **14.12:1**, and white/forest in
the lower Home section **10.53:1**. The desktop and mobile screenshots show the
real verified labels and the explicit Agent 2072 `SATISFIED` / Agent 2
`NOT_SATISFIED` outcomes; green brand areas do not stand in for a trust judgment.
The comparison summary again received keyboard focus after evaluation. These are
targeted contrast and layout checks, not a full WCAG audit.

Final automated run: `npm.cmd test` **237 passed, 4 suites, zero failed,
cancelled, skipped or todo** (2876.1496 ms). `npm.cmd run typecheck`, `npm.cmd
run web:typecheck`, `npm.cmd run build` and `npm.cmd ls --all` exited 0. The
instrumented `npm.cmd run web:build` exited 0 (compile 71s, TypeScript 10.2s,
7 static pages); the rebuilt production server served all five UI routes and the
Passport API with HTTP 200. Foreign-origin policy POST remained 403. Live
read-only API checks retained verified version 2 and unchanged modest, strict
and local policy results. `npm.cmd audit --json` still reports **19 advisories:
15 moderate, 4 high**. The four optional Solana high packages remained absent
from the emitted browser/Node/Edge modules and server traces. This is a bounded
local/testnet disposition, not public-deployment security approval. The actual-value
scan found `.env.local` ignored, zero staged files, zero secret matches in 232
project and 121 browser files, and no forbidden browser secret marker. Both
reference repositories retained HEAD, status, source bytes and Git metadata.
The owner subsequently confirmed the Dynamic/MetaMask checks below. No signing,
transaction, public deployment or M8/M9 work was performed for M7.

## Final forest-green and sage revision

The existing UI structure and behavior were preserved. Shared theme tokens now use
forest `#123E32`, emerald `#1B654E`, botanical `#347D60`, sage `#8EAD98`, light
sage `#E6F0E8`, warm ivory `#FAFAF7` and charcoal `#232B25`. The flat pale-sage
credential treatment replaces the old lavender gradient. The logo, headings,
navigation, buttons, focus rings, document accents, comparison editor/results,
developer code card and disconnected wallet workspace use the same palette. Decorative
`violet` badge variants were renamed `brand`; neutral, uncertainty, error and
verified-status treatments retain their distinct meanings. `SATISFIED` and verified
states carry explicit text and check/dot indicators; green branding alone conveys
no agent-quality judgment. No schema, data, policy, wallet authorization or API
logic changed.

These are **actual settled production-browser screenshots** after the palette change.
The Passport captures waited for the live **Version 2 · latest published** state and
five passing independent checks. Comparison captures were taken after the modest
policy returned Agent 2072 `SATISFIED` and Agent 2 `NOT_SATISFIED`.

| Page | Desktop 1440px | Mobile 390px |
| --- | --- | --- |
| Home | [green Home](screenshots/m7/home-desktop-green.jpg) | [green Home](screenshots/m7/home-mobile-green.jpg) |
| Passport | [verified credential](screenshots/m7/passport-desktop-green.jpg) | [credential](screenshots/m7/passport-mobile-green.jpg), [five checks](screenshots/m7/passport-mobile-verified-green.jpg) |
| Compare | [evaluated results](screenshots/m7/compare-desktop-green.jpg) | [evaluated results](screenshots/m7/compare-mobile-green.jpg) |
| Developers | [green documentation](screenshots/m7/developers-desktop-green.jpg) | — |
| Wallet | [disconnected workspace](screenshots/m7/wallet-disconnected-green.jpg) | — |
| Tablet | [Home at 768px](screenshots/m7/home-tablet-green.jpg) | — |

At 390px, Home, Passport and evaluated Compare each had document width **375px**
within a 390px viewport; at 768px, Home, Passport and evaluated Compare each had
document width **753px** within a 768px viewport. Desktop screenshots used 1440px.
The reviewed captures show legible text, preserved spacing and distinct neutral vs
verified result panels. The comparison summary received keyboard focus and scrolled
to roughly 16px from the viewport top. Representative rendered contrast ratios:
forest text/ivory **11.4:1**, navigation/ivory **6.7:1**, brand badge/sage **10.2:1**,
verified badge/pale green **6.3:1**, and white/primary button **11.9:1**. Static
inspection found no remaining purple/indigo/lavender/violet references or gradients
in the active frontend styling/components. Hover rules were source-inspected; the
browser tool did not expose a hover action. Focus treatment was observed on the
evaluated comparison summary. This is targeted contrast evidence, not a full WCAG
audit.

Final regression after the color change: `npm.cmd test` **237 passed / 4 suites, 0
failed/cancelled/skipped/todo** (3032.2475 ms); `npm.cmd run typecheck`, `npm.cmd
run web:typecheck`, `npm.cmd run build`, and `npm.cmd ls --all` exited 0. The
instrumented `npm.cmd run web:build` exited 0 (compile 48s, TypeScript 8.1s,
7 static pages generated). Production HTTP/API checks passed, including live
version 2 verification and unchanged modest/strict/local policy outcomes.
`npm.cmd audit --json` still reports **19 advisories: 15 moderate, 4 high**. The
four high optional Solana packages remained absent from emitted browser/Node/Edge
modules and server traces. This bounded local/testnet disposition is not public
deployment security approval. The final actual-value scan found `.env.local`
ignored, zero staged files, zero credential matches across 220 project files and
121 browser files, and no forbidden browser secret marker. Both read-only reference
repositories retain their HEAD, status, source bytes and Git metadata bytes.

Files changed for this revision: `apps/web/app/redesign.css`,
`apps/web/app/style.css`, `apps/web/components/site.tsx`,
`apps/web/app/passport/passport-view.tsx`,
`apps/web/app/compare/compare-app.tsx`, `apps/web/app/developers/page.tsx`, this
report, companion check JSON/screenshots, and active/workspace `STATUS.md`.
The untracked helper scripts under ignored `dist/` are verification aids and not
part of the proposed M7 source change. Connected Dynamic/MetaMask and wrong-network
visual checks were **owner-side pending at that stage**; only the disconnected
wallet state was agent-observed. No preparation, signature, transaction, push,
public deploy, or M8/M9 work was performed.

## October 9 focused polish and final review evidence

- Passport distinguishes a pending latest-publication read ("checking latest
  publication") from a failed read. Its wallet, onchain hash and independent check
  labels also show progress during requests. A failed live read produces an explicit
  error; it does not label v1 as latest. In the production browser, the transient
  loading state settled to **Version 2 · latest published**, five passing integrity,
  chain, publication, provenance and coverage checks, and the real current wallet.
- Evaluating both agents scrolls and moves keyboard focus to a concise, accessible
  summary of the selected policy's actual outcomes. The production browser's modest
  policy showed Agent 2072 `SATISFIED` and Agent 2 `NOT_SATISFIED` because the latter
  lacks the required Monad publication. The detailed cards remain immediately below;
  no rank or universal score was added. The focus target was `results-summary` and
  scrolled to about 16 CSS pixels from the viewport top on desktop and mobile.
- Supporting labels and muted text gained size/contrast. Expanded transaction details
  now use a compact two-column desktop grid and one mobile column; the source URL,
  transaction hash, timestamp, recipient and limitations remain available. One
  repeated caveat was shortened in the primary view while full limitations remain.
- The following are new **settled production-browser captures**, from a 1440px
  desktop viewport and an actual 390px mobile viewport. The 390px pages had no
  horizontal document overflow. The comparison captures were taken *after* live
  evaluation; the Passport captures were taken *after* independent live verification.

| Page | Desktop | 390px mobile |
| --- | --- | --- |
| Home | [settled Home](screenshots/m7/home-desktop-polish.jpg) | [settled Home](screenshots/m7/home-mobile-polish.jpg) |
| Passport | [verified Passport](screenshots/m7/passport-desktop-polish.jpg), [expanded evidence](screenshots/m7/passport-desktop-evidence-polish.jpg) | [verified Passport](screenshots/m7/passport-mobile-polish.jpg), [checks](screenshots/m7/passport-mobile-verified-polish.jpg), [expanded evidence](screenshots/m7/passport-mobile-evidence-polish.jpg) |
| Compare | [evaluated outcomes and cards](screenshots/m7/compare-desktop-polish.jpg) | [evaluated outcomes](screenshots/m7/compare-mobile-polish.jpg), [result detail](screenshots/m7/compare-mobile-results-polish.jpg) |

Final `npm.cmd test` result: **237 passed, 4 suites, zero failed/cancelled/skipped/todo**
(2795.7602 ms). `npm.cmd run typecheck`, `npm.cmd run web:typecheck`,
`npm.cmd run build`, `npm.cmd ls --all` all exited 0. The final instrumented
`npm.cmd run web:build` compiled successfully in 56 seconds, completed TypeScript
in 15.4 seconds and generated all 7 static pages; production routes include the
five UI pages and two API routes. `MONAD-M7-checks.json` holds the exact final
command results; `dist/m7-polish-web-build.log` holds the production build log.
Production HTTP and policy checks passed again (`MONAD-M7-live.json`).

The fresh independent, read-only verifier checked Monad 10143, Agent 2072 version
2, matching digest `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`,
publisher `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`, matching current agent
wallet, valid Registry/provenance and successful publication at block 69236935.
The new check completed at block **69513055** (`MONAD-M7-polish-onchain.json`). No
transaction or wallet signature was sent.

The fresh audit remains **19 advisories (15 moderate, 4 high)**. The four high
entries are the optional Solana chain packages detailed below. The final build
inspection again found zero emitted modules or server trace matches for all four.
There is no safe compatible root update; the high advisories remain open and require
a release-specific security review before public deployment. The actual-value scan
found `.env.local` ignored, zero staged files, zero secret value matches in 209
project files and 121 browser files, and zero forbidden browser secret markers.
Both reference repositories retained their HEAD, status and source/Git file bytes.

The owner-side Dynamic/MetaMask regression on `/wallet` was pending at this
focused-polish checkpoint and was subsequently confirmed below.
The agent did not claim connected-wallet or wrong-network browser testing in this
pass. The requested check is read-only: authorized account B51DD, chain 10143,
latest version 2 and disabled preparation; then wrong-network warning and disabled
preparation after a network switch, with no signing or transaction. Owner visual
approval of these new captures was also pending at that stage. No M7 push was made.

## Baseline and boundaries

Accepted M6 was reviewed and committed before M7 work on `monad-metropolis`:
`91ca52470e6a4b3a878c6dc0c03a1a63a4ce3518`, message
`feat: add consumer trust policies and agent comparison`. Baseline 224/224 tests
passed; the actual-value credential scan passed before/after staging. No M6 push.
At this pre-acceptance checkpoint M7 was uncommitted. No new transaction,
contract deployment, Passport version 3,
provider, public deployment, or M8/M9 implementation was performed.

## Design and route structure

The site uses a warm off-white background (`#fafaf7`), charcoal (`#232b25`),
restrained forest green (`#123e32`), subtle sage document treatment, and Segoe UI
with a Georgia emphasis in page headlines. The hand-drawn SVG mark represents an inspectable record;
the home preview uses the accepted real Agent 2072 values. Green only marks confirmed
verification or a satisfied local policy, neutral marks absent/unchecked publication,
amber marks uncertainty and red marks invalid integrity/hash. Badges avoid universal
trust judgments. Focus rings are visible; reduced-motion preference is honored.

The wallet-free journey is `/` → `/passport` → the independent verification and
evidence sections → `/compare` → `/developers`. The separate `/wallet` route retains
Dynamic/MetaMask and the M5 signing handlers. Every primary navigation destination
resolves in both development and production modes. The Passport shows identity,
current Registry wallet from a fresh read, version 2, real metrics, five distinct
checks, four expandable source records, exact published hash, publisher/Registry,
scope and limitations. It downloads the immutable accepted v2 JSON; a separate link
downloads historical v1. An unavailable live latest read is labeled unknown rather
than historical. Raw JSON is available behind an expandable control.

Comparison uses the unchanged two real fixtures and policy endpoint. Agent 2's schema
is 2.0.0 but its Passport **version is 1**. Publication is checked independently;
unpublished is distinct from RPC failure. Modest, strict and local examples remain
semantically unchanged. Changing a control clears prior outcomes. Detailed criteria,
source references, scope and raw structured results remain available on expansion.
The developer page documents the actual library methods and same-origin API; its
example's local-only path was executed (valid integrity, `not_checked` publication,
`INDETERMINATE` when publication is required).

## Actual rendered screenshots

These JPEGs were captured from the running production build on `127.0.0.1:3051` in
the Codex in-app browser. Viewport captures show the real page, not mockups. Browser
capture resolution excludes its scrollbar (1425×990 for the 1440 desktop viewport;
375×812 for the 390 mobile viewport). The Passport mobile capture is 390×844. The
comparison mobile result image shows the stacked evaluated card below the form.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Home | [home-desktop.jpg](screenshots/m7/home-desktop.jpg) | [home-mobile.jpg](screenshots/m7/home-mobile.jpg) |
| Passport | [passport-desktop.jpg](screenshots/m7/passport-desktop.jpg) | [passport-mobile.jpg](screenshots/m7/passport-mobile.jpg) |
| Comparison | [compare-desktop.jpg](screenshots/m7/compare-desktop.jpg) | [compare-mobile.jpg](screenshots/m7/compare-mobile.jpg), [evaluated cards](screenshots/m7/compare-mobile-results.jpg) |
| Developers | [developers-desktop.jpg](screenshots/m7/developers-desktop.jpg) | [developers-mobile.jpg](screenshots/m7/developers-mobile.jpg) |
| Wallet workspace | — | [wallet-mobile.jpg](screenshots/m7/wallet-mobile.jpg) |

Actual browser layout was reviewed at 1440, 768 and 390 CSS pixels. Measured document
width never exceeded viewport width in the inspected Home, Passport, Compare and
Developers states; cards stack, navigation wraps and form controls remain usable at
mobile width. Small supporting typography was enlarged after the first visual pass.
The mobile wallet workspace was also viewed in its disconnected state. Its brand,
network, account fields, historical v1 panel and disabled version 2-only preparation
control rendered. The browser session has no MetaMask extension, so M7 connected-wallet
and wrong-network states remain a **manual owner regression check**; M6 owner results
and unchanged handlers are not represented as new agent-observed wallet QA.

## Functional verification

- Production browser Passport: latest **2**, valid local integrity, matching live
  onchain hash, authorized publisher provenance and complete declared query coverage.
  Evidence expansion displayed a real transaction hash, UTC timestamp, recipient and
  authenticated Envio source link. Browser Download Passport produced JSON equal to
  the accepted fixture (version 2 and expected digest).
- Production browser Compare: modest → Agent 2072 `SATISFIED`, Agent 2
  `NOT_SATISFIED`; strict → both `NOT_SATISFIED`; local → both `SATISFIED`.
  A custom minimum of 3 transactions → Agent 2072 `SATISFIED`, Agent 2
  `NOT_SATISFIED`. Changing presets or threshold cleared stale results first.
- Independent CLI read-only verifier: chain trust 10143, Agent 2072 version 2,
  digest `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`,
  publisher `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`, publication block
  69236935, local integrity/hash/Registry/provenance all true; fresh check block
  **69404541**. Full result: `MONAD-M7-onchain.json`.
- Production HTTP: Home, Passport, Compare, Developers, Wallet and `/api/passport`
  returned 200; foreign-origin policy POST returned 403. Live policy details and
  version read-back: `MONAD-M7-live.json`.

## Automated, build and security evidence

`npm.cmd test`: **236 tests, 4 suites, 236 passed, 0 failed/cancelled/skipped/todo**
(3063.8702 ms in the final test run). Twelve new frontend tests cover destination
existence, honest version/status labels, UTC/missing dates, immutable real fixtures,
policy controls, wallet handler preservation and basic accessibility. `npm.cmd run
typecheck`, `npm.cmd run web:typecheck`, `npm.cmd run build`, and `npm.cmd ls --all`
exited 0. The instrumented `npm.cmd run web:build` succeeded with Home, Passport,
Compare, Developers and Wallet static routes plus the two dynamic API routes; its
final rerun after the last CSS change is recorded in `MONAD-M7-checks.json`.

`npm.cmd audit --json` exited 1 with **19 findings: 15 moderate, 4 high**, identical
to the accepted M5/M6 count. The four high package entries are
`@dynamic-labs/solana-core@4.100.3`, `@solana/spl-token@0.4.14`,
`@solana/buffer-layout-utils@0.2.0`, `bigint-buffer@1.1.5`. They are optional
Solana dependencies of the installed Dynamic EVM stack. No compatible root fix is
available without a potentially breaking connector/SDK change. The final instrumented
build has **zero emitted browser, Node or Edge modules** for all four and zero server
trace matches (`MONAD-M7-bundle-audit.json`). The prior detailed dependency-path and
reachability disposition is in `MONAD-M5-security-review.md`. This permits bounded
local/testnet functional review of this exact build; it is not production security
clearance. A public release needs its own security and deployed-artifact review.

The actual-value scan found the root `.env.local` ignored, zero staged files,
zero secret matches in 199 repository files and 121 browser build files, and zero
forbidden browser secret markers (`MONAD-M7-security-checks.json`). The Dynamic ID is
the only intentionally public web environment value. Dependency versions did not
change. Both read-only reference repositories retained the same HEAD, status, 175
source files and 401 Git metadata files (`MONAD-M7-reference-checks.json`).

## Owner visual and wallet acceptance

The owner approved the final forest-green design shown in the balance screenshots.
On the local `/wallet` page, the owner personally confirmed, one check at a time:

1. Dynamic/MetaMask connected the authorized account ending `B51DD`.
2. The wallet network displayed `Monad Testnet · 10143`.
3. Agent 2072's latest Passport version 2 appeared published and verified.
4. On a different MetaMask network, the page explained the wrong network and
   blocked Passport preparation/publication; the owner then returned to Monad Testnet.

These are **owner-reported** browser observations, not agent-observed MetaMask
testing. No preparation, signature, publication or other blockchain transaction
was part of acceptance. A second unauthorized wallet account is unavailable;
wrong-wallet denial remains automation-only. The application is still local/testnet
only, with no public artifact hosting and no production security approval.

M7 changed files: `README.md`, `STATUS.md`, `docs/ARCHITECTURE.md`, this report and
companion JSON/screenshots; `apps/web/app/{layout,page,passport-app,wallet-app}.tsx`
and `apps/web/app/redesign.css`; new `apps/web/app/{passport,wallet,developers}`
routes; redesigned `apps/web/app/compare/compare-app.tsx`; new
`apps/web/components/{site,copy-value}.tsx`, `apps/web/lib/presentation.ts`, and
`tests/frontend.test.ts`. Workspace `../STATUS.md` receives milestone routing only.

Proposed M8, after M7 visual acceptance: public deployment, stable Passport artifact
hosting, release-specific security checks and a documented external consumer path.

## Exact M7 active-repository file list

```text
README.md
STATUS.md
apps/web/app/compare/compare-app.tsx
apps/web/app/developers/page.tsx
apps/web/app/layout.tsx
apps/web/app/page.tsx
apps/web/app/passport-app.tsx
apps/web/app/passport/page.tsx
apps/web/app/passport/passport-view.tsx
apps/web/app/redesign.css
apps/web/app/wallet-app.tsx
apps/web/app/wallet/page.tsx
apps/web/components/copy-value.tsx
apps/web/components/site.tsx
apps/web/lib/presentation.ts
docs/ARCHITECTURE.md
docs/verification/MONAD-M7-audit.json
docs/verification/MONAD-M7-bundle-audit.json
docs/verification/MONAD-M7-checks.json
docs/verification/MONAD-M7-live.json
docs/verification/MONAD-M7-onchain.json
docs/verification/MONAD-M7-reference-checks.json
docs/verification/MONAD-M7-security-checks.json
docs/verification/MONAD-M7.md
docs/verification/screenshots/m7/compare-desktop.jpg
docs/verification/screenshots/m7/compare-mobile-results.jpg
docs/verification/screenshots/m7/compare-mobile.jpg
docs/verification/screenshots/m7/developers-desktop.jpg
docs/verification/screenshots/m7/developers-mobile.jpg
docs/verification/screenshots/m7/home-desktop.jpg
docs/verification/screenshots/m7/home-mobile.jpg
docs/verification/screenshots/m7/passport-desktop.jpg
docs/verification/screenshots/m7/passport-mobile.jpg
docs/verification/screenshots/m7/wallet-mobile.jpg
tests/frontend.test.ts
```

Workspace routing file outside Git: `../STATUS.md`.
