# Reuse disclosure - dedicated Monad project

Active repository: `signal-passport-monad`. Both sibling prior hackathon repositories
are READ ONLY. No percentage-originality or sponsor eligibility claim is made.

## LedgerLens

Prior hackathon project; **no code copied**. Architectural ideas retained through the
Monad governance: deterministic truth before AI, immutable facts, grounding/validation,
provider abstraction and evidence-reviewed milestones. Accounting, variance, Business
Memory, financial schemas, provider credentials and UI are explicitly NOT reused.
No further LedgerLens source inspection was necessary for this migration.

## Original Signal Passport

Source: prior hackathon project, commit `fc79feb3eddff29439a3fe462e740ccdf3af3923`.
M0/M1 work was first authored on its Monad branch. This origin is disclosed even though
M1 is new Monad-specific functionality, rather than earlier wallet-prototype work.

### REUSE

- Accepted Monad M1 identity schema, network config, RPC/registration resolver, CLI
  and 25 tests: copied unchanged; no new identity semantics introduced by M0.5.
- Canonical serialization/digest invariants and selected regression tests preserve
  sorting/array order/numeric handling, cross-process determinism and payload-only hashing.
- Complete small v1 schema dependency closure (bundle, evidence, claim, coverage,
  explanation, exports) retained for compatibility. Explanation schema is data only;
  no AI calls or provider implementation migrated. This avoids silent format changes.
- One historical sealed Ethereum bundle and metadata retained solely for consumer tests.
- Original public M1 JSON proofs preserved; new M0.5 live proof is separate.

### ADAPT

- Extract consumer validation/types from prior App Two into `packages/consumer/src`;
  only location/imports and the location comment change, not validation semantics.
- Replace verification/consumer alias imports with relative in-repository imports so
  emitted Node ESM works without a bundler or reference-repository alias.
- Consumer test import targets the extracted library; assertions retained.
- Governance clarifies the dedicated active repository; M0/M1 reports gain historical
  notices while their original bodies are preserved. Current STATUS/README rebuilt
  around the selected baseline, not the old application feature list.
- New minimal npm manifest, lockfile, TS configurations, ignore rules and placeholder
  environment example. These are new setup files, not copied old app configuration.

### DO NOT MIGRATE

- Any `.git`, node_modules, generated builds, credentials or local environment files.
- Next.js/React apps, CSS/assets/screenshots/deployment configuration, UI prompts,
  old weekend PRD and unrelated user files: not required for the identity/verification baseline.
- Blockscout provider/normalizer, old wallet metrics and coverage evaluator: Ethereum
  query semantics would prematurely define M2/M3. Their deterministic/coverage patterns
  remain reference material; only existing schema contracts are retained.
- AI prompts/providers/execution/validation/context stats: no AI feature needed for M1.
- Old live-app proof/screenshot/fixture-generation scripts, raw/extended fixture datasets,
  and analysis/AI/UI tests: excluded because their subject code is not migrated.
- Prior pre-Monad status archive: old project-specific detail is unnecessary here.

## Exact file mapping

Source hashes and source commit are in `verification/MIGRATION-MANIFEST.json`.
REUSE means byte-identical at migration; ADAPT differences are explained above.

| Source path in original Signal Passport | New repository path | Decision |
|---|---|---|
| `AGENTS.md` | `AGENTS.md` | ADAPT |
| `CLAUDE.md` | `CLAUDE.md` | ADAPT |
| `docs/PRD-MONAD.md` | `docs/PRD-MONAD.md` | ADAPT |
| `docs/HACKATHON_REQUIREMENTS.md` | `docs/HACKATHON_REQUIREMENTS.md` | ADAPT |
| `docs/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | ADAPT |
| `docs/verification/MONAD-M0.md` | `docs/verification/MONAD-M0.md` | ADAPT |
| `docs/verification/MONAD-M1.md` | `docs/verification/MONAD-M1.md` | ADAPT |
| `docs/verification/MONAD-M1-agent-1.json` | `docs/verification/MONAD-M1-agent-1.json` | REUSE |
| `docs/verification/MONAD-M1-agent-2.json` | `docs/verification/MONAD-M1-agent-2.json` | REUSE |
| `docs/verification/MONAD-M1-rpc-proof.json` | `docs/verification/MONAD-M1-rpc-proof.json` | REUSE |
| `scripts/verify-erc8004-agent.ts` | `scripts/verify-erc8004-agent.ts` | REUSE |
| `tests/identity.test.ts` | `tests/identity.test.ts` | REUSE |
| `tests/canonical.test.ts` | `tests/canonical.test.ts` | REUSE |
| `tests/digest.test.ts` | `tests/digest.test.ts` | REUSE |
| `tests/envelope.test.ts` | `tests/envelope.test.ts` | REUSE |
| `tests/consumer-validation.test.ts` | `tests/consumer-validation.test.ts` | ADAPT |
| `tests/helpers/cross-process-worker.ts` | `tests/helpers/cross-process-worker.ts` | REUSE |
| `fixtures/real/passport-bundle.json` | `fixtures/real/passport-bundle.json` | REUSE |
| `fixtures/real/metadata.json` | `fixtures/real/metadata.json` | REUSE |
| `packages/schema/src/bundle.ts` | `packages/schema/src/bundle.ts` | REUSE |
| `packages/schema/src/claim.ts` | `packages/schema/src/claim.ts` | REUSE |
| `packages/schema/src/coverage.ts` | `packages/schema/src/coverage.ts` | REUSE |
| `packages/schema/src/evidence.ts` | `packages/schema/src/evidence.ts` | REUSE |
| `packages/schema/src/explanation.ts` | `packages/schema/src/explanation.ts` | REUSE |
| `packages/schema/src/identity.ts` | `packages/schema/src/identity.ts` | REUSE |
| `packages/schema/src/index.ts` | `packages/schema/src/index.ts` | REUSE |
| `packages/identity/src/config.ts` | `packages/identity/src/config.ts` | REUSE |
| `packages/identity/src/registration.ts` | `packages/identity/src/registration.ts` | REUSE |
| `packages/identity/src/resolver.ts` | `packages/identity/src/resolver.ts` | REUSE |
| `packages/verification/src/canonical.ts` | `packages/verification/src/canonical.ts` | REUSE |
| `packages/verification/src/digest.ts` | `packages/verification/src/digest.ts` | ADAPT |
| `packages/verification/src/index.ts` | `packages/verification/src/index.ts` | REUSE |
| `apps/consumer/app/lib/validate-bundle.ts` | `packages/consumer/src/validate-bundle.ts` | ADAPT |
| `apps/consumer/app/lib/types.ts` | `packages/consumer/src/types.ts` | ADAPT |

## New work in M0.5

Dedicated Git root, dependency boundary, setup/build configuration, governance routing,
reuse/verification records and explicit stable-evidence-ID/consumer-independence tests.
No economic metrics, Envio or other M2 functionality added. This is infrastructure
migration, not a claim that the future Monad product is already complete.
