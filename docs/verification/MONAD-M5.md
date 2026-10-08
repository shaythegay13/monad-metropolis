# M5 — Dynamic Wallet Integration + First Working Web App

Date: October 8, 2026. Active repository: `signal-passport-monad`.

## Verdict: ACCEPTED - bounded M5 functional scope

The owner confirmed manual checks A-E, G and H individually. F is automation-only
because no second MetaMask account is available, as permitted by the conditional
check. Transaction rejection also remains automation-only. The successful live v2
publication and exact downloaded artifact were independently verified. All 193 tests,
typechecks, builds and dependency-tree checks pass. The remaining audit findings have
an explicit, build-evidence-backed disposition in `MONAD-M5-security-review.md`.

This is functional acceptance, not production security approval. No new transaction,
M6 implementation, external deployment, M5 commit or push occurred during closeout.

## Closeout results - complete

The closeout permits **zero new blockchain transactions**. Agent 2072 remains at
version 2; no repeated v2, version 3, deployment or registration was attempted.

- **Manual QA:** owner-confirmed PASS for A (account/authorization), B (10143), C
  (agent/Registry), D (v2 success), E (wrong-network block and restoration), G
  (disconnect/reconnect) and H (connection cancellation). F was unavailable because
  the owner has one account; automated wrong-wallet/contract/API coverage is retained.
  `MONAD-M5-manual-QA.md` records each result. No agent-observed browser testing is
  claimed. Transaction rejection remains automation-only; no new transaction was sent.
- **Usability fix:** the preserved v1 card now says **Historical Passport**, displays
  the latest onchain version, and labels its verification **Historical version 1
  verification**. This avoids implying that v1 is latest after the successful v2.
  This is a presentation-only correction; no payload/calculation/publication changed.
- **Fresh read-only verification:** `MONAD-M5-closeout-read.json` confirms chain 10143,
  Agent 2072, latest version 2, the approved `0x8dde…adef6` digest, publisher
  `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`, successful receipt and publication
  provenance. The independent read checked block **69242070**. An RPC method allowlist
  prohibited signing/broadcast methods during this check.
- **Exact checks:** **193 tests, 4 suites, 193 pass, 0 fail/cancelled/skipped/todo;
  3043.5816 ms**. Library typecheck/build, web typecheck, full dependency tree and
  instrumented web production build all exit 0. Web compilation took 3.4 minutes;
  its TypeScript phase took 10.7 seconds. `MONAD-M5-closeout-checks.json` records results.
- **Audit:** fresh npm audit exits 1 with **19 affected-package findings: 15 moderate,
  4 high, 0 critical**. No safe compatible new fix was found; no forced downgrade,
  major override or advisory suppression was applied. Package versions were unchanged
  in closeout. The four high entries share the bigint-buffer root advisory. All four
  have zero emitted modules in browser/Node/Edge and no server deployment-trace matches.
  `MONAD-M5-security-review.md` gives each package/version/path, reachability, available
  update, compatibility risk and explicit local/public/production disposition;
  `MONAD-M5-closeout-bundle-audit.json` contains the build evidence.
- **Security disposition:** these inactive high dependencies do not by themselves
  block functional acceptance of this exact M5 build after QA. They remain unpatched
  installed dependencies. Public deployment requires actual release-artifact review,
  renewed reachability checks, completed QA and API/origin controls. Production security
  clearance is not claimed. No external deployment is authorized or performed.
- **Preservation:** reference HEAD/status, 175 source files and 401 Git metadata files
  remain unchanged. `.env.local` is ignored; no M5 files are staged; scans find no
  secret values or server-secret markers in the generated browser assets.

Closeout changed only `apps/web/app/passport-app.tsx`, optional webpack-audit wiring in
`apps/web/next.config.mjs`, new `scripts/webpack-audit.mjs`, verification reports and
milestone status/routing. No dependency change or deterministic-library change.
**Verdict: ACCEPTED for bounded M5 functionality.** Check F's conditional unavailability
and the audit disposition are explicit limitations, not hidden passes. Do not commit,
push, deploy or begin M6 without further instruction. Recommended M6 starting point:
independent consumer-policy comparison over verified Passports.

The following sections retain the implementation/publication history; the closeout
results above supersede earlier audit reachability uncertainty and test timings.

## M4 preserved

Reviewed the accepted M4 diff and actual-secret scan, reran its 173-test baseline,
typecheck/build/dependency check and committed exactly the accepted M4 files:

- Commit: `8d9ce8de74f8239f5cdabc1b1a1ca20152edddd2`
- Message: `feat: add Monad Passport Registry and Alchemy verification`
- Branch: `monad-metropolis`
- Registry: `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`, chain 10143
- Agent: 2072; wallet `0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`
- Immutable v1 hash: `0x6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a`
- V1 publication transaction: `0x77d5fb75278c92ff6f5a0900e06ea9f297099dddae6dd9bfad926490720a5f38`
- V1 content URI remains empty. No redeployment, re-registration or v1 republication.

Historical M4 artifacts and deterministic libraries were not changed by M5. The two
unrelated untracked files remain in the read-only prior project and were not committed.

## SDK and network

Pinned packages:

| Package | Version | Purpose |
|---|---|---|
| `@dynamic-labs/sdk-react-core` | 4.100.3 | Dynamic context and connection UI |
| `@dynamic-labs/ethereum-core` | 4.100.3 | EVM wallet type and wallet client |
| `@dynamic-labs/ethereum` | 4.100.3 | Required peer for Dynamic MetaMask connector |
| `@dynamic-labs-connectors/metamask-evm` | 4.7.1 | Actual MetaMask connector passed to Dynamic |
| `viem` | 2.57.4 | Dynamic wallet-client transaction interface and formatting |
| `next` | 16.4.0 | App Router web/server application |
| `react` / `react-dom` | 19.3.0 | UI |

Current npm package metadata and installed type declarations were checked. The newer
5.9.6 aggregate Ethereum package had an incompatible Base Account peer; the compatible
4.100.3 line was selected. No peer dependency override or `--legacy-peer-deps` is used.
Only the Dynamic MetaMask connector is enabled, with `connect-only` authentication.
The actual transaction call uses `primaryWallet.getWalletClient().sendTransaction`.
No private-key writer or alternative wallet-authentication SDK powers this path.

The provider explicitly overrides EVM networks with Monad Testnet: chain/network
10143, MON, 18 decimals, public wallet RPC `https://testnet-rpc.monad.xyz`, explorer
`https://testnet.monadscan.com`. Private Alchemy is used only server-side. Network
validation in Dynamic is set to `never` so the app can explain/switch wrong networks;
server preparation and the click handler still reject anything other than 10143.
The Dynamic environment ID is present, valid UUID form, and is the sole public env
setting. Its value was not printed in this report.

Research references: [Dynamic provider settings](https://docs.dynamic.xyz/react-sdk/providers/dynamiccontextprovider),
[Dynamic EVM network object](https://docs.dynamic.xyz/react-sdk/objects/evmNetwork),
[Dynamic documentation index](https://www.dynamic.xyz/docs/llms.txt),
[Next.js installation](https://nextjs.org/docs/app/getting-started/installation).
Some newly linked Dynamic JavaScript SDK guides returned 404; the published React
SDK types were used to check actual method signatures. Installed Next.js route-handler
documentation was also read. This is package compatibility evidence, not live wallet proof.

## Frontend and behavior

New `apps/web` has a light-background interface with identity, connected wallet/network,
the accepted Passport's metrics/coverage/limitations, independent verification, JSON
view/download, preparation review and pending/receipt/read-back states. The contract
and publication explorer links use the existing deployment. Missing provider data is
unknown, never zero activity; no universal trust score is displayed.

The server-only `/api/passport` supports GET/download and three bounded POST actions:
prepare, preflight and confirm. It uses the existing M1/M2/M3/M4 libraries without
rewriting calculations. POSTs require same-origin JSON, a 2 MB body limit, fixed agent/
Registry/version and typed input. The localhost host-normalization bug discovered in
the initial API check was fixed; valid requests now pass and foreign origins reject.

Preparation checks the actual v1 record/hash, current agentWallet and latest version;
Envio JSON freezes an honest range with an exclusive upper bound behind both providers.
Version 2 uses that actual previous hash and retains all M3 limitations. Preflight
rechecks wallet, chain, Registry, version, balance and fee; the unsigned transaction
has zero value, 125% gas margin, 120% gas-price margin and a 0.2 MON cap.

Only the explicit Publish click can request a wallet transaction. Account/chain are
checked immediately before signing; increased fees require review again. Wrong wallet,
non-EVM wallet, disconnected wallet and wrong chain disable publication. Rejection,
insufficient funds, pending, reverted, provider failure and stale version are handled.
There is no owner fallback. Current frontend equality is only a safeguard: the existing
contract is the actual authorization boundary.

After a hash is returned, the public bundle/hash remain in localStorage for read-only
recovery. Receipt success alone is insufficient: transaction input, addresses, chain,
value, canonical block and the independent onchain verifier must all match. Disconnecting
does not stop read-only recovery. No automatic retry or success before read-back.

V1 download is `/api/passport?download=1`; proposed v2 can be downloaded before signing.
No publicly hosted v2 URL exists, so content URI is explicitly empty. No localhost or
invented URL is submitted as public hosting.

## Live API evidence

Full public results: `MONAD-M5-server-checks.json`.

| Check | Observed result |
|---|---|
| V1 state | HTTP 200; Agent 2072; latest version 1 |
| Independent Alchemy verification | `verified`; local integrity, Registry, publication and hash match |
| V1 checked block | 69166508 (recorded snapshot) |
| Current agentWallet | `0xbc63bf8dba3aeca97801b85c600f8d0208fb51dd` |
| Wrong chain preparation | HTTP 422, `wrong_network` |
| Wrong wallet preparation | HTTP 422, `wrong_wallet` |
| Foreign-origin request | HTTP 403 |
| Version 2 preparation / preflight | HTTP 200 / 200; unsigned only |
| Tampered bundle preflight | HTTP 422, `invalid_passport` |
| V1 download | HTTP 200, original digest preserved |

Real unpublished candidate: `fixtures/real/monad-m5/server-prepared-v2.json`.
Scope `[69126790,69232744)`, `complete_for_query`, four observed outgoing transactions,
one UTC day, two recipient addresses, four successful EVM executions. This includes
identity management, deployment and publication; it does not establish commerce.
SHA-256: `4ee5c86d3cf08c2bb3b67d4efe8f7a85c12c973487d70030f68aa3cb8ed339f4`.
Anticipated maximum fee at preparation: **0.0238921128 MON**, not a current quote.
Generation/resolution times and scope change on a fresh preparation, so its digest changes.
The saved candidate is not evidence of Dynamic signing or v2 onchain publication.

## Browser and wallet verification

The local Next.js server starts successfully at **http://127.0.0.1:3050**.
Connected Edge inventory failed: `failed to start codex app-server ... path specified
(os error 3)`. The in-app browser could open a blank tab, but navigation to the app
was denied: `The admin-enforced policy could not be verified, so access was not granted`.
No workaround was attempted. No agent-observed rendering, modal, MetaMask session,
screenshot, actual signer or browser transaction is claimed. API proof is not browser proof.

The owner subsequently reported that localhost would not load. Investigation confirmed
the listener on 127.0.0.1:3050, HTTP 200 from both the numeric-loopback and localhost
URLs, HTTP 200 from the Passport API, and HTTP 200 for all six scripts referenced by
the HTML. No server-side page error was returned. The owner then confirmed:
"nevermind it loaded fine and worked". The page-loading issue is resolved by owner
confirmation. The owner subsequently confirmed wallet connection and the version 2
review panel, approved the exact hash/fee, executed one transaction, and supplied the
public receipt status and downloaded file. See the live publication evidence below.
`MONAD-M5-local-health.json` preserves the earlier HTTP-only snapshot.

Original manual verification checklist (successful path subsequently completed by owner):

1. Open the local URL in a MetaMask-enabled browser. Verify page and Dynamic modal.
2. Connect the intended wallet; verify the complete address and Monad Testnet 10143.
3. Verify Agent 2072, accepted v1 metrics and independent publication/hash checks.
4. Switch to a different wallet/network; confirm clear disabled publication states.
5. Restore the authorized wallet, prepare v2 and retain the exact downloadable artifact.
6. Review digest, previous hash, wallet, Registry, chain and fee with the owner. Obtain
   explicit approval before the first live transaction. The user clicks Publish.
7. Confirm receipt and independent v2 read-back; retain the public hash and receipt.
   Do not authorize more than one live publication without additional approval.

If a wallet request times out ambiguously, inspect its activity and onchain latest
version before any retry. Never substitute the deployer private key for this flow.

## Independently verified live publication

The owner provided `C:/Users/shayb/Downloads/agent-2072-passport-v2.json` after the
approved Dynamic/MetaMask transaction. This file was treated as data, validated with
the existing consumer/schema/digest checks, matched against the approved profile hash,
and copied byte-for-byte to `fixtures/real/monad-m5/agent-2072-passport-v2.json`.
The original download was not modified. Public evidence: `MONAD-M5-publication.json`.

- Agent 2072; schema 2.0.0; Passport version 2; previous hash matches accepted v1.
- Profile hash: `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`.
- Transaction: `0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d`.
- Chain 10143; existing Registry `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`.
- Actual signer: `0xbc63bf8dba3aeca97801b85c600f8d0208fb51dd`.
- Successful receipt and canonical publication block: **69236935**.
- Approved maximum and actual fee: **0.0238939488 MON**; zero native transfer value.
- Independent read-back at block **69237883**: `verified`, local integrity valid,
  publication found, published hash matches, Registry/provenance verified, publisher
  matches the current agentWallet; latest version is **2**. Content URI remains empty.

Verification also matched transaction calldata, sender, target, chain, zero value,
receipt block/hash and the unchanged M4 runtime-code trust record. No private-key
signer was used by this verification; it performed read-only RPC calls. The Dynamic
interaction is owner-reported, while the actual sender, receipt and publication are
independently observed onchain. This transaction consumes the one-publication approval;
no further live publication is authorized. The earlier server-prepared candidate is
retained separately and was not the published artifact.

## Tests and builds

Exact command output and exit codes: `MONAD-M5-checks.json`.

- **193 tests, 4 suites, 193 pass, 0 fail/cancelled/skipped/todo; 2828.2429 ms**.
- All accepted 173 tests preserved; 20 new M5 tests cover network configuration,
  wallet matching and rejection states, version/hash linkage, unsigned ABI/fees,
  insufficient balance, stale versions, receipt/read-back/reorg/mismatch behavior,
  wallet rejection/error messages, original fixture integrity and client import isolation.
- Library typecheck and build: exit 0.
- Web typecheck and production build: exit 0; routes `/`, `/_not-found`, `/api/passport`.
- `npm ls --depth=0` and full dependency-tree traversal: exit 0.
- `npm audit`: **19 findings: 15 moderate, 4 high, 0 critical**. This check is not clean.

Axios 1.20.0, Sharp 0.35.5 and uuid 11.1.1 (for the 11.1.0 dependency) are pinned via
overrides to address compatible fixes. Remaining advisories arise from bigint-buffer
in the aggregate SDK's Solana dependency path, stream-json and older uuid paths in
MetaMask/Solana dependencies. Only MetaMask is enabled, but that does not establish
that all advisory paths are unreachable. Do not present this as a full security audit
or production deployment approval. Full dependency details are in
`MONAD-M5-dependency-audit.json`. No blanket forced downgrade/major override was applied.

## Security and preservation

`MONAD-M5-security-checks.json` records actual-value scans without printing values.
`.env.local` is ignored and no M5 files are staged. Generated browser assets contain
no private key, Envio token, private Alchemy URL/key or their server-variable markers.
The web child process explicitly excludes `DEPLOYER_PRIVATE_KEY`; server-only imports
and the browser import-graph test prevent accidental provider/signer inclusion.
No additional secret was written to source, fixtures, reports or browser storage.

`MONAD-M5-reference-checks.json` confirms both reference HEADs/status, all 175 source
files and 401 Git metadata files remain byte-for-byte unchanged. M4 fixtures, schemas,
metric calculation, canonicalization and independent consumer code are unchanged.

## Files changed / documentation

- `.env.example`, `.gitignore`, `package.json`, `package-lock.json`: web configuration,
  pinned dependencies, root scripts and build-output exclusions.
- `apps/web/`: generated Next.js agent guidance, Next/TypeScript config, layout/page/
  error/loading boundary, Dynamic UI, stylesheet, server adapter and API route.
- `packages/web/src/{config,wallet,publication}.ts`: public config, wallet-state helpers,
  unsigned preparation and independent receipt/read-back orchestration.
- `scripts/web.mjs`: allowlisted local env launcher with no deployer key.
- `tests/web.test.ts`: 20 M5 regression and failure-path checks.
- `fixtures/real/monad-m5/`: unpublished real server-prepared candidate and explanation.
- `README.md`, `docs/ARCHITECTURE.md`, `STATUS.md`: startup, boundaries, current state.
- This report and `MONAD-M5-*.json`: exact tests, API/security/reference/dependency evidence.
- Workspace `../STATUS.md`: routing only.

All M5 changes remain uncommitted/unpushed for owner review. Remaining limitations:
automated browser access is blocked (manual results are owner-reported); F is
not manually exercised; public artifact hosting is deferred; dependency advisories
remain; externally deployed API abuse controls have not been verified. Wrong-network
warning prominence is deferred to later frontend work at the owner's request.

## Proposed M6 scope only

After M5 acceptance: bounded consumer-policy comparison over independently verified
Passports, preserving evidence/coverage distinctions and consumer independence. No
universal score, new fabricated metrics, Nansen or other later integrations. M6 has not begun.
