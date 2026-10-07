# M3 real captured-evidence Passport

`agent-2-passport-v2.json` is generated from the unchanged accepted M2 capture
`../monad-m2/agent-2.json`. It is a deterministic derivative of real captured data,
not a fresh network retrieval or synthetic transaction history. `metadata.json`
records the source file hash, output file hash, explicit generation metadata and command.

Observed activity for the wallet currently designated as this agent's ERC-8004 agentWallet.

Agent 2, Monad testnet chain 10143, wallet
`0xf043b0d473a2edd7c5d6f4d931334096b77a7edc`.
Scope: direct outgoing transactions, all execution statuses, blocks
**[10830000, 68955393)**; coverage **complete_for_query**. Captured through Envio
HyperSync at `2026-10-07T11:19:48.882Z`; current association was resolved at
`2026-10-07T11:19:48.517Z`. This is not proof of historical association.

The two source records are successful EVM executions on February 5, 2026, with the
same non-null recipient address and zero native value. Hand-checking those records gives:

| Metric | Formula over deduplicated included evidence | Value |
|---|---|---|
| observed_transaction_count | Record count | 2 |
| active_utc_days | Distinct UTC calendar dates | 1 |
| unique_recipient_addresses | Distinct lowercase non-null recipient addresses | 1 |
| first_observed_activity_at | Minimum timestamp | 2026-02-05T13:17:09.000Z |
| last_observed_activity_at | Maximum timestamp | 2026-02-05T13:19:29.000Z |
| successful_execution_count | Records with success status | 2 |
| failed_execution_count | Records with failed status | 0 |
| unknown_execution_status_count | Records with unknown status | 0 |

All metrics and observations cite both source evidence IDs, including zero matching
status counts. Empty datasets instead have six zero counts, empty evidence references,
and no first/last timestamp metrics. No payment, service, business relationship,
independent counterparty, lifetime total or trust judgment follows from these values.
The artifact carries all four scope limitations, not just this documentation.

## Reproduce offline

After `npm.cmd run build`, use a new output path (the CLI refuses overwrites):

```powershell
node dist/scripts/generate-agent-passport.js fixtures/real/monad-m2/agent-2.json dist/m3-review.json 2026-10-07T12:47:03.588Z
node dist/scripts/verify-agent-passport.js dist/m3-review.json
```

Schema version: `2.0.0`; passport version: `1`; calculation version:
`wallet-observations/1.0.0`. The SHA-256 digest covers canonical payload bytes,
including the identity, scope, evidence, metrics, observations, coverage, provenance,
limitations and explicit generation metadata. Expected payload digest:

`9963102ba6b529b0c66c6a5a9cb655e3970f825ead27c0e07683492154cda760`

Identical captured inputs and generation metadata reproduce identical bytes.
Changing the generation timestamp deliberately changes the digest. Verification
checks structure, references and digest offline; it does not authenticate the author,
requery the chain or independently recalculate metrics. See
`../../../docs/verification/MONAD-M3.md` for acceptance evidence and boundaries.
