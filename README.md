# Signal Passport Monad

Signal Passport is a portable economic-history layer for autonomous agents.
It provides evidence-backed history; the consuming application supplies trust policy.
No universal trust score.

**Active project:** `signal-passport-monad/`. Sibling `signal-passport/` and
`ledgerlens/` are READ ONLY prior projects. This repository runs independently.

## Current scope

M0.5 migrated accepted M1 identity resolution and verification foundations. M2 adds
bounded Envio HyperSync ingestion for registry-designated agent wallets. Economic
observations, publication, other sponsor integrations and a web application are deferred. The retained v1 wallet bundle
format is a compatibility contract; agent identities are standalone domain objects.

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
supplied metadata; no registry publication verification exists yet.

## Governance and provenance

Read `docs/PRD-MONAD.md`, `docs/HACKATHON_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`,
`STATUS.md`, `AGENTS.md` and `CLAUDE.md`. `docs/REUSE.md` lists exact migration choices.
`docs/verification/MONAD-M2.md` records the current evidence pipeline verification.
Historical M0/M1 reports retain their original context and test counts.

## Git boundary

This project has newly initialized history, not a copy/clone of either reference `.git`.
The GitHub remote preserves the old M0 lineage on `monad-metropolis`. The independent
bootstrap `ea30c95` is published on `signal-passport-monad`; the local `monad-metropolis`
branch tracks that remote branch. M2 changes remain uncommitted for review.

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
