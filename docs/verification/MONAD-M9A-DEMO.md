# Chainlink sponsor demo — independent Signal Passport verifier

October 12, 2026. A recording of **no more than 2 minutes**, as required by the
owner-signed-in Chainlink bounty form, demonstrating the accepted read-only
native CRE integration. It is a simulation with real public HTTP/RPC reads,
not a live DON deployment or signed attestation.

## Setup once

Use this repository with Node >=22/npm >=10 (root manifest), CRE CLI login,
Bun >=1.2.21 and the x64 Bun/Javy setup required on Windows ARM64.
Verified versions: CRE 1.38.0, SDK 1.23.0, x64 Bun 1.4.3. Install dependencies
with `npm ci` at repository root, then `bun install --frozen-lockfile` and
`bunx cre-setup` in `cre-passport-verifier/passport-verifier/` if not already set up.
Root dependencies are needed only for the reused pure schema/reference validators.
No API key, wallet, signer, receiver or funded account is required for these runs.
Check `cre version`, `bun --version`, `cre whoami`; complete browser login privately
if needed. No upload, deployment or broadcast is part of this guide.

## Show the real workflow

Open `main.ts`, `passport.ts` and `schema.ts`. Briefly trace cron → CRE HTTPClient
→ raw bytes/full schema/references/SHA-256 → finalized CRE EVM reads → JSON.
Point out that no `/api/passport`, `/api/policy`, generator or analysis answer
is called. The source artifact is portable data; the independent Registry is
the publication anchor. Current identity and historical publication are separate.

From `cre-passport-verifier/`:

```text
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0
cre workflow simulate passport-verifier --target local-simulation --non-interactive --trigger-index 0 --config ./config.agent-2.json
```

The second config path is relative to the workflow directory. Keep default limits
and typechecking. The CLI compiles/runs WASM and uses actual hosted files and
configured public Monad RPC. Capture the complete `Workflow Simulation Result`,
not only the CLI success banner or truncated USER LOG.

1. **Published 2072 v2:** show raw hash versus canonical digest, actual snapshot
   number/hash, `localIntegrityValid: true`, `publication.status: verified`,
   matching publisher/current wallet and criterion PASS entries.
2. **Unpublished Agent 2:** show local integrity still true, latest version `0`,
   `publication.status: not_found`, publication FAIL and unavailable hash/provenance
   UNKNOWN. Say: “Unpublished is not fraudulent and does not invalidate local evidence.”
3. In `passport-verifier/`, run `bun test`. Show retained-digest tampering and
   coherently rehashed-but-mismatched publication tests. These are explicitly
   unit tests using cloned artifacts/synthetic chain records, not native chain reads.

For a compact visual of full outputs, open the retained JSON under
`docs/verification/m9a-simulations/`; these are actual CLI-returned results,
not manually composed examples. New runs will have newer snapshot/time values.

## Explain why CRE matters

“Signal Passport publishes portable evidence, but consumers should verify it
independently. CRE coordinates offchain retrieval, deterministic cryptographic
checks and onchain publication/identity reads into one reproducible result.
It does not ask our backend whether the agent is verified, and it does not
produce a reputation score. Future scheduled DON operation would be a separate
deployment step; this demonstration proves the real native orchestration today.”

Retain the recording, source link after an approved push, both command outputs
and [M9A verification report](MONAD-M9A.md) for the sponsor submission. No new
transaction, Passport, public-site change or Nansen implementation is needed.
