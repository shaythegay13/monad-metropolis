# M0.5 - New Monad Repository Bootstrap and Migration

Date: October 6, 2026 (America/New_York). Verdict: **Accepted**.
Implemented: selective migration, independent package/Git setup and workspace governance.
Verified: clean dependency install, new test baseline, type checking/build, live M1
resolution, offline consumer, no sibling dependencies and unchanged reference snapshots.
Accepted: all 14 requested M0.5 criteria reviewed. M2 has not started.

## Before / after

Workspace: `C:\Users\shayb\Downloads\Signal Passport` (not a Git repository).
Before: `signal-passport-monad/` existed but was empty, with no `.git`, branch, files,
commits or local remote. `signal-passport/` held accepted M0/M1 on `monad-metropolis` at
`fc79feb3eddff29439a3fe462e740ccdf3af3923`. LedgerLens HEAD was
`bd9b41ce31d1584059677456d2866afcf455786a`, clean on master.

After:

```text
Signal Passport/                  workspace routing only
  ledgerlens/                     READ ONLY prior hackathon project
  signal-passport/                READ ONLY prior hackathon project
  signal-passport-monad/          ONLY active project, own .git/history/install
    packages/schema/
    packages/identity/
    packages/verification/
    packages/consumer/
    scripts/
    tests/ and fixtures/
    docs/ and governing files
```

The new independent repository uses branch `monad-metropolis`. No old .git directory
was copied or moved. No reference history was rewritten or imported as ancestry.

Remote inspection found `https://github.com/shaythegay13/monad-metropolis.git` already
initialized: symbolic HEAD -> `refs/heads/monad-metropolis`, hash
`c653e44e78ba0e902013b807fef3ad3f603e797a` (old M0 lineage).
Configured that URL as origin for visibility but did not fetch, merge, push, force push
or replace its history. New lineage is committed locally only; publish via a separately
chosen branch/remote strategy. This is not a claim that GitHub already holds M0.5.

## Reference preservation

Read-only source snapshot was taken before copying. Final comparisons:

- Original Signal Passport: **136 tracked/untracked files**, **211 .git files** unchanged;
  HEAD unchanged. Existing unrelated `Google Stitch Frontend Development.txt` and
  `Signal-Passport-Weekend-PRD.md` remain untracked and were not copied.
- LedgerLens: **41 tracked/untracked files**, **190 .git files** unchanged; HEAD/status unchanged.
- File byte SHA-256 comparisons plus Git HEAD/status checks, with optional Git locks
  disabled during comparison. Ignored dependencies/build caches were not copied or run;
  the comparison covers tracked/untracked source and Git metadata, not every ignored cache.
- Evidence: `MONAD-M0.5-reference-check.json`. Local detailed pre-migration comparison
  snapshot is ignored and not committed. It contains hashes, no source/credential contents.

## Migration / reuse decisions

Exact 34-file source mapping, source revision and hashes:
`MIGRATION-MANIFEST.json`. Human rationale: `../REUSE.md`.

**REUSE:** all accepted M1 resolver/config/registration/schema/CLI code and 25 tests;
canonical serialization, SHA-256 logic, stable evidence ID builder, small v1 schema
closure, relevant deterministic tests, one historical Ethereum bundle/provenance pair
and public M1 snapshots. M1 implementation is byte-identical to the source checkout.

**ADAPT:** extract App Two validation/types into a library; internal alias imports become
relative paths so compiled Node ESM runs without any old repo/bundler. Adjust consumer
test import only. No validation, digest or schema semantics changed. Governance records
the new active root. Historical M0/M1 reports are copied with a context notice; their
original bodies remain verbatim, including old test counts/paths and then-current Git state.

**DO NOT MIGRATE:** either .git, node_modules, secrets/env files, Next.js/React UI/assets,
Blockscout ingestion, old analysis/metrics, AI execution/provider/validation code, old
application/screenshot scripts, unrelated user files, old PRD/prompts, full raw/extended
fixtures, analysis/AI/UI tests and the pre-Monad project status archive.
LedgerLens contributes architectural ideas only; no code copied.

New files: minimal package/lockfile, tsconfigs/build setup, ignore/env example,
README/current STATUS/reuse report/manifest, migration verification records and four
foundation-boundary tests. Workspace AGENTS/CLAUDE/STATUS now route agents explicitly
to the active project; parent docs/PRD-MONAD.md, HACKATHON_REQUIREMENTS.md and
ARCHITECTURE.md now point to the active canonical documents instead of stale copies.
Those parent routing files are outside the new Git repository and are not committed.

## Dependency and execution structure

One npm package, `signal-passport-monad`, using internal `packages/*/src` directories;
no npm workspace framework. Exact runtime versions: js-sha3 **0.13.0**, zod **4.6.2**.
Development: TypeScript **5.9.3**, tsx **4.23.13**, @types/node **24.13.4**.
Node **v24.19.0**, npm **11.17.0**, Windows NT **10.0.26200.0** / PowerShell.

New lockfile generated from selected exact dependencies, not copied wholesale.
`npm.cmd ci --no-audit --no-fund` installed 8 packages into this repository from a clean
state. npm emitted an esbuild install-script allowScripts warning; no approval/config
changes were made and actual tests, compilation and runtime checks succeeded.
`npm.cmd ls --depth=0` exited 0 with all five direct dependencies healthy.
No runtime imports, manifest links or tsconfig paths refer to either sibling repository.

## Exact verification

All commands executed from `signal-passport-monad`, not the reference project.

| Command/check | Result |
|---|---|
| `npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund` | Exit 0; generated independent lockfile |
| `npm.cmd ci --no-audit --no-fund` | Exit 0; 8 packages installed in 3 seconds |
| `npm.cmd ls --depth=0` | Exit 0; no invalid dependencies |
| `npm.cmd test` | Exit 0; **57 tests, 4 suites, 57 pass**, 0 fail/cancelled/skipped/todo; 706.2955 ms |
| `npm.cmd run typecheck` | Exit 0; packages, scripts and tests checked |
| `npm.cmd run build` | Exit 0; TypeScript emitted Node ESM/declarations |
| `node dist/scripts/verify-erc8004-agent.js monad-testnet 1` | Exit 0; actual live resolution and parsed registration |
| Compiled consumer imported via Node ESM and given historical fixture | `Bundle integrity matched`, isValid true |
| Import-boundary test | All local imports within new repository; consumer has no identity/analysis imports |
| Reference source/Git snapshot comparison | Unchanged, detailed counts above |

New independent count = **53 selected existing tests + 4 new boundary/evidence tests**.
Not the prior 93-test baseline. Coverage includes M1 ID/config/owner-wallet/error/URI
cases; canonical numeric/array/object behavior; cross-process digest reproduction;
tampering; v1 envelope validation; dangling evidence references; chain/log evidence IDs
and offline consumer independence. No old feature suite is claimed as run here.
No applications were migrated, so Next.js application production builds are **not
applicable**. The new library/CLI production compile and emitted runtime were checked.

## Live M1 result from the new repository

Network Monad Testnet, chain 10143; RPC `https://testnet-rpc.monad.xyz`.
Identity Registry `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
Agent **1**, registration name **Monad Demo Agent**.
Owner and separately queried registry agentWallet both
`0x133603465adde7c39fa0e6e34b264e1573e1fd08`; wallet state set.
Original agent URI is data:application/json;base64; registration **retrieved** and parsed.
Snapshot block 68753857, block hash `0xa1f39b5f074e6b76e27d648535123083c42009646c3bde5b2ba50fed9fdfd418`, time 2026-10-06T18:16:36.869Z.
Registry code hash `0xd0e45b1d89fa9b6cc7e97c1f155d64180e5c232aaccf9900ef9d4fd738c02b41`.
Full URI/card/provenance: `MONAD-M0.5-agent-1.json`.

This is a new live read from this project's compiled JavaScript with its own installed
dependencies. No old repo import, credential, transaction write or analysis was used.
Inherited card warnings remain: advertisements are unverified; no self-registration
entries. Identity registration does not establish successful economic activity.

## Security

Selective allowlist copy never included env files, API tokens, private keys or seed
phrases. Only `.env.example` was newly created with an empty RPC override placeholder.
`git check-ignore -v` verified .env.local/.env/nested env files and generated/local
artifacts are ignored. Pattern scan of deliverable files found no recognizable provider
tokens/private-key blocks. This is a bounded current-file check, not an exhaustive
security audit. Local reference snapshot is excluded from commit.
No production/test/build dependency points to old projects. No credential was used for
public Monad RPC. All copied live evidence contains public-chain fields only.

## Git and acceptance

Initial milestone commit: `chore: bootstrap Monad Signal Passport project`.
New root history is independent of both references. Commit ID and final status are
reported after creation; this report intentionally does not contain a self-referential
commit hash. Only the new repo files are staged; workspace pointers are outside its root.
No push or upstream configured, so existing remote history remains untouched.

All M0.5 acceptance criteria met within the selected infrastructure scope. No web app
was migrated or claimed. M2/Envio has NOT started. Ready for a separately requested M2
milestone in this new repository, preserving registry wallet semantics, provenance,
coverage and error distinctions. Economic observations remain M3.
