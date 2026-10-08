# M4 controlled-agent live evidence

These are real Monad Testnet captures (chain 10143), not synthetic service history.
Primary RPC: Alchemy. `cross-check.json` uses the independent public Monad RPC.
No secret endpoint, key or token belongs in these artifacts.

Controlled agent: **2072**, owner and registry-designated agentWallet:
`0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD`.
Official Identity Registry: `0x8004a818bfb912233c491871b3d84c89a494bd9e`.
The registration uses a real base64 JSON data URI, no service endpoints, `active:false`,
`x402Support:false` and no advertised trust mechanisms. The exact URI and decoded
document are retained in `agent-identity.json`, along with the accepted M1 resolution.

| Artifact | Meaning |
|---|---|
| preflight.json | Alchemy chain/balance/code proof and authenticated Envio query |
| registration.json | Successful register() receipt, agent ID and public submission data |
| agent-identity.json | setAgentURI receipt, registration JSON/URI and M1 identity |
| agent-2072-activity.json | Accepted M2 pipeline capture; frozen [69126790,69126918) |
| agent-2072-activity.json.passport.json | Canonical unmodified M3 v2 format generated from that capture |
| deployment.json | Successful deployment, build settings and independently supplied registry trust config |
| publication.json | Successful version-1 publication and separate verification result |
| verification-alchemy.json | Independent compiled consumer read through Alchemy |
| cross-check.json | Public RPC code/hash, receipts and controlled-identity cross-check |
| *.submitted.json | Public recovery journal written before each broadcast; contains no signed transaction/key |

The two included transactions are registration and URI update. Deployment/publication
occur after the frozen range and are intentionally not included in this Passport.
Coverage is `complete_for_query`; this is not a lifetime history claim.

| Observation | Value |
|---|---|
| Observed transactions | 2 |
| Active UTC days within this dataset | 1 |
| Unique recipient addresses | 1 |
| First observed transaction within this dataset | 2026-10-08T01:36:53.000Z |
| Last observed transaction within this dataset | 2026-10-08T01:37:31.000Z |
| Successful EVM executions observed | 2 |
| Failed EVM executions observed | 0 |
| Unknown EVM execution statuses observed | 0 |

Payload SHA-256: `6fdcb7be70fc8717cdb75937606f26ce6b02268ea4f3fd3ebaf0392c006c874a`.
GeneratedAt: `2026-10-08T01:37:40.868Z`; schema 2.0.0; passport version 1.
The contract stores this digest with a `0x` prefix as bytes32; it is not keccak-rehashed.

Signal Passport Registry: `0x7d9cc86196241485cf1efaf8a96c7819ea95b194`.
Version 1 publication block: **69127019**.
Content URI is empty: public artifact hosting is deferred. The file can be shared and
independently imported; no public URL is fabricated. Publication records stay outside
the canonical payload and are not inserted into the strict v2 envelope.

## Reproduce without writes

From the repository root after build, with a new output path:

```powershell
node dist/scripts/generate-agent-passport.js fixtures/real/monad-m4/agent-2072-activity.json dist/m4-reproduced.json 2026-10-08T01:37:40.868Z
node --env-file=.env.local dist/scripts/verify-published-passport.js dist/m4-reproduced.json fixtures/real/monad-m4/deployment.json
```

The verifier requires only Alchemy RPC configuration, not a signing key or Envio token.
Supply registry trust configuration independently of an imported Passport. An attacker
must not get to choose both the contract and the purported trusted runtime code hash.
Current-wallet equality is a separate snapshot result; wallet rotation does not erase
historical authorized publication. Onchain provenance is not proof of economic meaning,
source-data truth or trustworthiness. See `docs/verification/MONAD-M4.md` for full evidence.
