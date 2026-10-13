# Signal Passport independent CRE verifier

Accepted M9A scope: read-only native CRE simulation with real public Passport HTTP retrieval and direct Monad Registry/ERC-8004 EVM reads. No backend verification answer, analysis, score, signature, report, transaction or DON deployment.

The existing six-field cron schedule is hourly. CRE HTTPClient downloads bounded raw bytes and calculates the raw-file hash. The workflow reuses full pure Passport schema/reference validation through a QuickJS-compatible adapter and independently calculates canonical SHA-256. CRE EVMClient selects a finalized header; all contract reads and HTTP RPC bytecode checks use that exact block, with header hash rechecked at the end. Registry runtime code and identity dependency are independently pinned.

Setup from repository root: npm ci. In this directory: bun install --frozen-lockfile, then bunx cre-setup if native tooling is missing. Root dependencies supply the reused pure schema; the CRE lockfile supplies its SDK/tooling. The schema adapter uses the root schema's Zod instance and replaces only URL parsing with its already-required stricter source URL literal. It does not weaken or modify the production application schema.

Verified toolchain: CRE CLI 1.38.0, SDK 1.23.0, x64 Bun 1.4.3 (skill minimum Bun 1.2.21). On Windows ARM64 use the x64 Bun/Javy installation. Check cre version, bun --version and cre whoami. No API token, signer or funded wallet is needed.

Run from the parent CRE project directory containing project.yaml:

```text
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0 --config ./config.agent-2.json
```

The config override is relative to this workflow directory, even when invoked from the project root. Keep default limits and typechecking; never broadcast, deploy or activate these targets. staging-settings and production-settings remain configuration targets, not deployment evidence.

Agent 2072 version 2 retrieves https://signal-passport-monad.vercel.app/passports/agent-2072-v2-published.json and returns verified publication/integrity/current association. Agent 2 version 1 retrieves https://signal-passport-monad.vercel.app/passports/agent-2-v1-unpublished.json and returns valid local integrity with not_found publication. CLI success alone does not establish the expected result; inspect the complete returned JSON.

In this workflow directory:

```text
bun test
bun run typecheck
```

18 focused tests pass. Test-only cloned artifacts, HTTP stubs and synthetic chain records are clearly separated from native real-data evidence. Invalid evidence, missing publication, mismatched digest and unavailable provider/snapshot are different results. Historical publication stays valid when current identity changes; isLatest and current wallet/owner/URI checks are separate. Provider uncertainty never becomes confirmed absence or verification.

The returned JSON includes runtime time, raw/canonical hashes, source URL, actual finalized block/hash, publication record, identity association, PASS/FAIL/UNKNOWN criteria and limitations. Integers remain bigint and become decimal strings in output. This unsigned result does not prove underlying economic truth or decentralized production execution. The CLI's default simulation-key notice does not indicate a transaction: there is no signing/report/write code path.

Actual native results, logs, binary/config/source hashes and core regression are in ../../docs/verification/MONAD-M9A.md and its companion evidence. The concise sponsor reproduction guide is ../../docs/verification/MONAD-M9A-DEMO.md. No deployment, public-site change, Nansen implementation or Git push is authorized by this milestone.
