# Signal Passport Monad

Signal Passport is a portable economic-history layer for autonomous agents.
It provides evidence-backed history; the consuming application supplies trust policy.
No universal trust score.

**Active project:** `signal-passport-monad/`. Sibling `signal-passport/` and
`ledgerlens/` are READ ONLY prior projects. This repository runs independently.

## Current scope

M0.5 migrates accepted M1 ERC-8004 identity resolution and selected portable-verification
foundations into this dedicated repository. It does not implement M2, economic analysis,
publication, sponsor integrations or a web application. The retained v1 wallet bundle
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
`docs/verification/MONAD-M0.5.md` is the current independent verification report.
Historical M0/M1 reports retain their original context and test counts.

## Git boundary

This project has newly initialized history, not a copy/clone of either reference `.git`.
The configured GitHub remote already contains the old M0 lineage. M0.5 is committed
locally only; no force push, reset or remote replacement is performed. Publishing this
new lineage requires a deliberate branch/remote decision before any push.
