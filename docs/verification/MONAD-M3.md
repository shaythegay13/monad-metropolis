# M3 - Deterministic Agent Passport Observations

Date: October 7, 2026. Verdict: **ACCEPTED** for this bounded milestone after
implementation, local verification and review of the evidence below. M3 remains
uncommitted for owner review. No push and no M4 implementation occurred.

## Accepted M2 preservation

Reviewed the M2 diff, ran its baseline checks and scanned the explicitly staged files
before committing `feat: add Envio Monad activity evidence pipeline`:

`9dfc4e7e595175dc9d6397a8aa05296da038014d`

The commit is local and unpushed on `monad-metropolis`, which tracks
`origin/signal-passport-monad`. No history rewrite. Baseline: 89 tests, 4 suites,
89 passed, zero failed/cancelled/skipped/todo, 574.8738 ms. Typecheck, build and
dependency checks exited 0. No secrets were staged. Historical reports retain their
original context; accepted M2 captures and historical report bytes remain unchanged.

## Schema and deterministic behavior

Explicit `schemaVersion: "2.0.0"` appears in both the strict agent envelope and hashed
payload. Historical `schema_version: "1.0.0"` schemas and verification remain supported;
unknown or ambiguous version envelopes reject. No publication or explanation fields
are added to v2. Existing canonical serialization, digest and evidence ID rules remain.

Payload includes AgentIdentity, current-wallet observation scope, normalized activity
evidence, metrics, observations, observation ordering, coverage, provenance, structured
limitations and explicit generation/version metadata. Stable passport identity derives
from registry and agent ID. Genesis has passportVersion 1; later versions require a
previousVersionHash. Generation timestamp is an explicit input, never a hidden clock.

The pure calculator operates on validated, deduplicated evidence. Identical duplicates
collapse; conflicting duplicates reject. Addresses normalize to lowercase; null
recipients are excluded from distinct-address counts. All metrics use calculation
version `wallet-observations/1.0.0`. No AI, concentration, economic_history_days,
native-value metric or trust score was added.

| Metric ID | Exact formula over included normalized evidence | Exact observation wording | Agent-2 value |
|---|---|---|---|
| observed_transaction_count | Number of records | Observed transactions | 2 |
| active_utc_days | Cardinality of UTC calendar dates from timestamps | Active UTC days within this dataset | 1 |
| unique_recipient_addresses | Cardinality of lowercase non-null recipient values | Unique recipient addresses | 1 |
| first_observed_activity_at | Minimum timestamp | First observed transaction within this dataset | 2026-02-05T13:17:09.000Z |
| last_observed_activity_at | Maximum timestamp | Last observed transaction within this dataset | 2026-02-05T13:19:29.000Z |
| successful_execution_count | Number of records with success status | Successful EVM executions observed | 2 |
| failed_execution_count | Number of records with failed status | Failed EVM executions observed | 0 |
| unknown_execution_status_count | Number of records with unknown status | Unknown EVM execution statuses observed | 0 |

Each observation references its metric and that metric's full dataset evidence IDs,
carries evidenceCount and coverageStatus, and states interpretation as
`Observed dataset within the declared query scope`. Citing the included dataset also
grounds zero matching execution-status counts. On valid empty evidence there are six
zero count metrics, no first/last timestamp metrics and empty evidence references.
No invented evidence IDs or temporal facts. Partial/unknown empty datasets retain
their coverage status instead of becoming complete zero-activity claims.

## Scope, coverage and limitations

The artifact explicitly says:

> Observed activity for the wallet currently designated as this agent's ERC-8004 agentWallet.

Scope carries chainId, subjectWallet, current_erc8004_registry_designation association
basis, associationAsOf, direct_outgoing_transactions_all_statuses activity scope and
decimal-string inclusive/exclusive block bounds. Provenance includes Envio HyperSync
provider/product/network/endpoint/transport and retrieval times inside the digest.
Coverage includes status, stop reason, next block, raw/normalized counts and page count.

Retrieved complete_for_query, partial and unknown states propagate into every
observation. Provider errors reject generation, including error results that retain
partial evidence. Coverage means only the declared dataset/query; it is not a lifetime
total, finality or consensus guarantee. Subject, wallet, chain, bounds, pagination,
source URL and same-block header consistency are validated before generation.

Four required limitation codes and descriptions travel in the portable payload:

- `current_association_only`: Current ERC-8004 wallet association does not prove historical association at the time of every observed transaction.
- `transaction_semantics_only`: Direct transactions and successful EVM executions do not establish payments, commerce, service delivery, trading, or business relationships.
- `address_semantics_only`: Recipient addresses are not automatically independent counterparties.
- `query_scope_only`: Coverage applies only to the declared query scope; observations describe the included dataset, not lifetime totals.

## Real fixture and canonical integrity

Unmodified input: `fixtures/real/monad-m2/agent-2.json`.
Source SHA-256: `95a210b0f66f4e1ebe1678877fa6facedcc3aa5601dcef53ec7601bc6b18a3a5`.
Generated artifact: `fixtures/real/monad-m3/agent-2-passport-v2.json`.
Companion `metadata.json` records hashes, generation inputs and exact command; README
documents the hand-checked values. It is a derivative of real captured evidence, not
synthetic history and not a new live retrieval.

Agent 2; chain 10143; registry `0x8004a818bfb912233c491871b3d84c89a494bd9e`;
wallet `0xf043b0d473a2edd7c5d6f4d931334096b77a7edc`.
Bounds **[10830000,68955393)**, complete_for_query, two records.
Identity resolved at `2026-10-07T11:19:48.517Z`; evidence retrieved at
`2026-10-07T11:19:48.882Z`. Both records are successful EVM executions with zero native
value and the same recipient. The metric values above were checked against those rows.

Explicit generatedAt: `2026-10-07T12:47:03.588Z`; passportVersion 1.
Canonical payload SHA-256:

`9963102ba6b529b0c66c6a5a9cb655e3970f825ead27c0e07683492154cda760`

Artifact file SHA-256 (including envelope and newline):
`d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d`.

The digest covers identity, scope, evidence, metrics, observations/order, coverage,
provenance, limitations and explicit generation metadata. The envelope integrity field
is outside the payload. Object key ordering and evidence input ordering do not change
generated bytes; sorted metric/evidence references and explicit observation order are
deterministic. Different generation timestamps deliberately change the digest.
Cross-process tests and compiled regeneration produce byte-identical artifacts.

## Independent verification and tamper evidence

The consumer imports schema and verification code only; it never imports the calculator,
generator, identity resolver or activity providers. It checks schema, scope/reference
coherence and the digest of the original raw payload, so fields stripped by inherited
nested schema parsing cannot silently escape hash coverage.

For a stronger runtime check, copied only compiled schema/verification/consumer packages,
Zod and v1/v2 fixtures into an isolated directory. Generator/provider packages were
absent, ENVIO_API_TOKEN removed, and fetch, HTTP/HTTPS requests, sockets, TLS and DNS
entry points replaced with throwing functions. Both fixtures verified successfully:
v1 `Bundle integrity matched`; v2 `Passport integrity verified`. Exit 0.

Passing integrity does **not** authenticate the author, establish truthful source data,
prove wallet ownership, prove metric accuracy or establish onchain publication. The
consumer intentionally does not recalculate the original analysis. A coherent edited
metric plus matching observation and recomputed digest can pass; an explicit regression
test demonstrates this boundary. No authentication claim is made.

Tamper tests reject unrehashed changes to metric, observation, evidence, subject, scope,
coverage, limitations, provenance, generation metadata, observation order and inherited
nested extra fields. Rehashed dangling metric/evidence/observation references and duplicate
evidence still reject. Compiled verification of a modified metric exits 1 as expected.

## Tests and reproducible commands

| Command | Exact result |
|---|---|
| `npm.cmd test` | 141 tests, 4 suites, 141 pass, 0 fail/cancelled/skipped/todo; 1273.9259 ms; exit 0 |
| `node node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm.cmd run build` | exit 0 |
| `npm.cmd ls --depth=0` | exit 0; six dependencies healthy, unchanged |

52 new M3 tests supplement 89 accepted tests. Coverage includes real values, empty
evidence, malformed/missing input, UTC midnight, address case variants, null recipients,
deduplication/conflicts, literal statuses, uint256 boundary/overflow, provider errors,
partial/unknown coverage, deterministic bytes, explicit metadata, all reference graphs,
v1 compatibility and offline independence. No failing test was hidden or left unresolved.
Full outputs: `MONAD-M3-checks.json`; compiled runtime proofs: `MONAD-M3-runtime.json`.

Reproduce after building with a new output path:

```powershell
node dist/scripts/generate-agent-passport.js fixtures/real/monad-m2/agent-2.json dist/m3-review.json 2026-10-07T12:47:03.588Z
node dist/scripts/verify-agent-passport.js dist/m3-review.json
```

The generator refuses to overwrite files. Both commands exit 0 for the real fixture.
No new Envio/RPC request was made for M3. The relevant real path is the compiled pipeline
over accepted live captures; M2's independent three-transaction RPC proof is preserved.

## Security, wording and repository boundaries

Final exact-token scan reads only this project's .env.local into memory and reports
counts, never values. No token occurrence or recognizable credential was found in tracked
or untracked deliverables. `.env.local` is Git-ignored and untracked. No new dependencies,
credentials, network integrations or external publication. M2 staging was scanned before
its commit; M3 remains unstaged and uncommitted.

Product wording audit searched source, scripts, fixtures and docs for the requested
judgmental/relationship terms. Matches in inherited governance, operational provider
fields and explanatory limitations were reviewed. No generated observation label uses
those terms. Observations are literal; there is no independent-counterparty inference.

`MONAD-M3-reference-check.json` records comparison to the pre-M3 snapshot: both reference
HEADs, Git status, source files and Git metadata are unchanged. Signal Passport:
135 source files and 211 Git files; LedgerLens: 40 source files and 190 Git files.
Reference .env credentials were excluded without reading. The two unrelated untracked
reference documents remain untouched. Historical milestone reports and M2 fixtures
match committed bytes. Parent STATUS changes only routing/state.

## Exact changed files

Within the active repository:

```text
README.md
STATUS.md
docs/ARCHITECTURE.md
docs/verification/MONAD-M3.md
docs/verification/MONAD-M3-checks.json
docs/verification/MONAD-M3-runtime.json
docs/verification/MONAD-M3-reference-check.json
fixtures/real/monad-m3/README.md
fixtures/real/monad-m3/agent-2-passport-v2.json
fixtures/real/monad-m3/metadata.json
packages/schema/src/index.ts
packages/schema/src/agent-passport.ts
packages/passport/src/metrics.ts
packages/passport/src/generate.ts
packages/consumer/src/types.ts
packages/consumer/src/validate-bundle.ts
packages/consumer/src/validate-agent-bundle.ts
scripts/generate-agent-passport.ts
scripts/verify-agent-passport.ts
tests/agent-passport.test.ts
```

Workspace routing only: `../STATUS.md`. Ignored build/runtime verification outputs are
not deliverables. README, architecture, fixture documentation and both STATUS files are
updated. Historical reports are not rewritten.

## Known limitations and proposed M4

Sparse historical direct transactions support only these scoped wallet observations.
Historical agent association, commerce, service delivery and counterparties remain
unproven. Digest integrity is not authenticity or independent metric recalculation.
M2 native SDK remains unverified on Windows; accepted explicit JSON transport is preserved.
Full sponsor requirements and final demo are not claimed complete. No policies, AI,
publication, contracts, other sponsor integrations or final UI were added.

Proposed M4 only: bounded Nansen enrichment under the governing requirements, with explicit
provider provenance, coverage/error handling, and provider labels distinguished from
deterministic chain facts. Define and verify the minimal meaningful product feature in
a separately authorized milestone. No M4 research, API calls or implementation started.
