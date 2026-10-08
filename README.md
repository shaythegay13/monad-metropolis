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
Other sponsor integrations and a web application are deferred.

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
