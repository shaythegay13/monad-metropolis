# Signal Passport CRE verifier

This read-only TypeScript workflow checks the real Agent 2072 Passport v2 on Monad Testnet. A cron trigger fetches the published Passport bytes from a commit-pinned public GitHub URL, recomputes the canonical payload SHA-256 digest, checks the configured Registry's runtime bytecode, reads its publication through CRE's EVM capability, and confirms the ERC-8004 owner, agent wallet, and URI association. It logs a structured verification result. It creates no Passport, score, signature, report, or transaction.

The source URL is pinned to commit `9587f964baabe9b23da691e0afaef537a14e81ac` while the M8 Vercel deployment is pending. The schedule `0 0 * * * *` is a sample hourly cron setting; simulation fires once immediately. The Registry address and expected runtime code hash come from the accepted M4 deployment record. The public Monad Testnet RPC is used for the chain-ID and bytecode check, and CRE's Monad Testnet EVM capability is used for finalized contract reads. No API token or private key is needed.

From the CRE project root, after `bun install` and `bunx cre-setup` in this workflow directory:

```text
cre workflow simulate passport-verifier --target staging-settings --non-interactive --trigger-index 0
```

`local-simulation` is also a private, receiver-free target. Neither target should be broadcast, deployed, or activated as part of this prototype. The configured `production-settings` target is a configuration example, not evidence of a live CRE deployment. On Windows ARM64, CRE's Javy setup currently requires an x64 Bun binary; see the verification report for the tested setup.

The digest check detects payload changes relative to the onchain hash. The workflow validates the fields required for these checks, not the complete Passport schema or every evidence reference. It does not prove the underlying activity was truthful or that an agent is universally trustworthy. A newer Passport version makes v2 historical; the result reports `isLatest` separately. Reads use CRE finalized contract state, but the public RPC bytecode read and multiple contract reads are not pinned to one identical block. No owner policy is evaluated here.
