# Signal Passport Monad - STATUS

Last updated: October 6, 2026 (America/New_York).

## Active project and reference boundary

ACTIVE PROJECT: `signal-passport-monad/`.
Absolute path: `C:\Users\shayb\Downloads\Signal Passport\signal-passport-monad`.
READ ONLY REFERENCES: `../signal-passport/` and `../ledgerlens/`.
All new product implementation happens here. No runtime/build/test dependency on either
prior repository. The two references and their Git histories remain unchanged.

Signal Passport is a portable economic-history layer for autonomous agents.
Signal Passport provides evidence-backed economic history; the consuming application
supplies the trust policy. No universal trust score.

## Governing documents

`docs/PRD-MONAD.md` > `docs/HACKATHON_REQUIREMENTS.md` > `docs/ARCHITECTURE.md`
> this STATUS > verified code. Also obey local `AGENTS.md` and `CLAUDE.md`.
The user-authorized M0.5 correction replaces the old decision to develop in the original
Signal Passport repository. Target product scope and priority remain unchanged.

## Current milestone: M0.5 - New Monad Repository Bootstrap and Migration

**State: Accepted.** Implemented, Verified and acceptance evidence reviewed locally.
Report: `docs/verification/MONAD-M0.5.md`.

| Milestone | State | Evidence |
|---|---|---|
| M0 | Accepted historically; migrated | Original report retained with context notice |
| M1 | Accepted historically; reverified in dedicated project | M1 report plus new M0.5 live snapshot |
| M0.5 | Accepted | Independent install, 57 tests, types/build/runtime, unchanged references |
| M2 | Not started | Requires a separate instruction |

## Working - verified in this dedicated repository

- Accepted read-only ERC-8004 resolver, distinct owner vs agentWallet, explicit metadata
  retrieval/error states and no reputation inference.
- Canonical JSON serialization, SHA-256 payload-only digest and v1 wallet schema contracts.
- Extracted offline consumer schema/reference/digest validation; no analysis/provider access.
- 57 tests (53 selected migrated tests + 4 new foundation/boundary tests), 4 suites,
  57 pass, 0 fail/cancelled/skipped/todo. This repository does not claim the old 93 count.
- `npm.cmd run typecheck` passes for packages, CLI and tests.
- `npm.cmd run build` emits Node ESM and declarations; compiled CLI and offline consumer run.
- Real Monad Testnet agent 1 resolves from this repository's compiled CLI with parsed card.

## Current live identity proof

Network: Monad Testnet; chain 10143; RPC `https://testnet-rpc.monad.xyz`.
Registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
Agent ID: 1; registration name: Monad Demo Agent.
Owner: `0x133603465adde7c39fa0e6e34b264e1573e1fd08`.
Registry agentWallet: `0x133603465adde7c39fa0e6e34b264e1573e1fd08` (independently read).
Registration: original data URI preserved; retrieved and parsed.
Snapshot block: 68753857; at 2026-10-06T18:16:36.869Z.
Full proof: `docs/verification/MONAD-M0.5-agent-1.json`.
No claims about successful service operation or economic history follow from identity.

## Environment and dependency baseline

Windows NT 10.0.26200.0 / PowerShell; Node v24.19.0; npm 11.17.0.
Runtime: zod 4.6.2, js-sha3 0.13.0.
Development: TypeScript 5.9.3, tsx 4.23.13, @types/node 24.13.4.
Clean `npm.cmd ci --no-audit --no-fund` passed; `npm.cmd ls --depth=0` healthy.
No Next.js, React, workspace orchestrator or database is installed.
No apps migrated: application production builds are not applicable.

No credentials copied. `.env.local` and nested variants ignored; `.env.example` has
only an empty optional RPC placeholder. CLI reads process environment, not env files.
Hackathon wallet/account/sponsor credential configuration remains unestablished.

## Git

New independent repository initialized on `monad-metropolis`; no old `.git` copied.
M0.5 initial commit message: `chore: bootstrap Monad Signal Passport project`.
The source of migrated work was original Signal Passport commit
`fc79feb3eddff29439a3fe462e740ccdf3af3923`; it is provenance, not an ancestor here.

Origin is `https://github.com/shaythegay13/monad-metropolis.git`. That remote already
contains the old M0 lineage at `c653e44`; it is NOT empty. No fetch/merge/force push or
remote rewrite is part of M0.5. This independent initial commit is local only, without
an upstream. A deliberate publication branch/remote decision is needed before pushing.

## Known limitations / not migrated

- No web Generator or Consumer UI; only CLI and offline consumer library.
- No Blockscout provider, analysis engine, old wallet metrics or AI execution. Their
  architectural patterns remain reference material; future work is bounded by the PRD.
- The v1 wallet envelope is retained for compatibility, not relabeled as a Monad agent
  Passport. Integrating AgentIdentity into a sealed payload needs an explicit version plan.
- Inherited publication labels reflect supplied metadata, not verified onchain state.
- M1 restrictions remain: no IPv6-only metadata/redirects/CID verification, registration
  history, arbitrary metadata enumeration, new wallet signature or capability proof.
- The real card advertises example.com services and omits self-registration entries;
  resolver warnings preserve these limitations.
- No Envio, Nansen, Dynamic, Alchemy sponsor feature, policy, contracts, CRE, Qwen or M2.

## Next action

M0.5 is Accepted. M2 is ready for a separately authorized bounded planning/implementation
step **in signal-passport-monad only**. Proposed scope remains Envio Monad Evidence
Pipeline with provenance, normalization, deduplication and explicit coverage/error states.
Do not substitute owner or advertised wallet for the registry agentWallet. Metrics remain M3.
