# M5 closeout dependency security review

October 8, 2026. Scope: the pinned M5 MetaMask-only Next.js production build.
This is a dependency/reachability review, not production security certification.

## Findings and evidence

The fresh audit still reports **19 affected-package entries: 15 moderate, 4 high,
0 critical** (`MONAD-M5-closeout-audit.json`). The four high entries are propagated
through one underlying advisory, not four independent high-severity bugs:
[GHSA-3gc7-fjrx-p6mg / CVE-2025-3194](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg).
The advisory affects bigint-buffer through 1.1.5, concerns a buffer overflow in
`toBigIntLE`, and lists no patched release.

All four are installed **production/transitive dependencies**, not development-only
dependencies. They are brought in by the aggregate Ethereum SDK's optional wallet
support, despite this app registering only Dynamic's MetaMask connector.

Dependency path (versions in the installed lockfile):

```text
@dynamic-labs/ethereum 4.100.3
  -> @dynamic-labs/waas-evm 4.100.3
  -> @dynamic-labs/waas 4.100.3
  -> @dynamic-labs/solana-core 4.100.3
  -> @solana/spl-token 0.4.14
  -> @solana/buffer-layout-utils 0.2.0
  -> bigint-buffer 1.1.5
```

`@dynamic-labs-connectors/metamask-evm@4.7.1` also requires the Ethereum package as a
peer (`^4.88.7 || ^5.0.0`). Simply removing that direct package installs it again as
a peer and does not eliminate this dependency path.

| High entry | Browser/server use in this build | Vulnerable functionality reachability | Compatible fix and breaking risk |
|---|---|---|---|
| `bigint-buffer@1.1.5` | Installed; zero emitted browser/Node/Edge modules and no server trace entries | No call path found in emitted app. Native Node binding contains the affected conversion path; browser entry uses JS, but neither entry is emitted here. | Latest published version remains 1.1.5; no patched release. A fork/replacement is not an established drop-in fix and would require conversion/API validation. |
| `@solana/buffer-layout-utils@0.2.0` | Installed; zero emitted modules and no server trace entries | Inactive Solana conversion dependency; inherited bigint-buffer finding | Latest 0.3.0 still depends on bigint-buffer `^1.1.5`; changing the pre-1.0 minor line adds compatibility risk without eliminating this finding. |
| `@solana/spl-token@0.4.14` | Installed; zero emitted modules and no server trace entries | Inactive SPL-token path through buffer-layout-utils | Latest 0.4.15 uses buffer-layout-utils `^0.3.0`, which still carries bigint-buffer. Upgrading would not fix this root issue and changes upstream transitive APIs. |
| `@dynamic-labs/solana-core@4.100.3` | Installed; zero emitted modules and no server trace entries | No Solana connector/analysis route is registered; inherited high finding | Audit suggests Ethereum 4.85.0, below the MetaMask connector's supported peer range. That downgrade would violate compatibility. Moving SDK major lines previously introduced another incompatible wallet peer; no compatible fix established. |

Evidence is in `MONAD-M5-closeout-bundle-audit.json`: an instrumented webpack build
records module/chunk membership for browser, Node and Edge, including concatenated
modules; the four server `.nft.json` deployment traces are checked separately. For
every high entry, all three emitted-module counts and server trace matches are zero.
This is stronger than inferring non-use merely because Solana is not enabled.

The instrumentation is reproducible with:

```powershell
$env:SIGNAL_PASSPORT_BUILD_AUDIT='1'
npm.cmd run web:build
Remove-Item Env:SIGNAL_PASSPORT_BUILD_AUDIT
```

It writes dependency identifiers/chunk membership to ignored `dist/m5-build-audit/`;
it does not collect module source, credentials, or environment values. The plugin is
inactive unless explicitly enabled. No aliases, dependency exclusions, or audit
suppression were used to make these findings disappear.

## Changes and unresolved moderate findings

No new dependency upgrade was applied in closeout: none of the inspected compatible
updates resolves the high root issue. Existing compatible overrides remain Axios
1.20.0, Sharp 0.35.5, and uuid 11.1.1 for the SDK's uuid 11.1.0 requirement. Those
fixes predate closeout; they are not counted as newly resolved findings.

Moderate entries propagate older `uuid` and `stream-json` advisories through MetaMask/
Solana dependencies. The latest uuid 9 release is still 9.0.1; even current MetaMask
utils 12.0.0 declares uuid `^9.0.1`. The latest stream-json 1.x is 1.9.1. Forcing uuid
11+ or stream-json 3+ across those callers would cross major API/runtime boundaries.
These remain recorded, not suppressed. The emitted UUID modules observed in this
build come from the root patched uuid package; this alone is not blanket clearance
of all transitive SDK behavior.

## Explicit disposition

**Bounded local/testnet M5 functional acceptance:** the remaining high entries are
documented inactive dependencies, supported by the build and trace evidence. They
are not, by themselves, a blocker to accepting this exact functional M5 build after
manual QA passes. No claim is made that vulnerable installed code has been patched.

**Public demo:** these high entries do not expose an identified runtime path in this
exact production build. That disposition does not cover exposing the development
server, executing the SDK in a new server route, enabling Solana/embedded wallets,
changing imports, or deploying a different build. A public release must repeat the
bundle/trace checks against the actual deployable artifact, explicitly retain the
dependency-risk disposition, and complete the outstanding manual QA. API abuse/rate
controls and Dynamic allowed-origin configuration also need release-specific review.
External deployment is not authorized by this closeout and has not been performed.

**Production:** not approved. Tests/build success and absence of these modules do not
constitute comprehensive security review. Track upstream fixes; rerun audit and
reachability checks whenever dependencies, connectors or server boundaries change.

No new blockchain transaction was used for this review.
