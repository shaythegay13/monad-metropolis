# Real captured Monad M2 evidence

These are unmodified captures of real Envio HyperSync selected-field responses, with
current M1 identity snapshots and normalized evidence. They are not synthetic test rows.
Each JSON records source, chain 10143, subject, exact half-open block range and retrieval
time. `captures[].raw` preserves the provider response for the selected fields.

- agent-2.json: primary proof; agent 2; [10830000, 68955393); 2 raw / 2 normalized.
- agent-1.json: secondary sample; agent 1; [10827000, 10830000); 1 raw / 1 normalized.
- agent-2-empty.json: genuine empty recent query; [66955493, 68955393); 0 / 0.

All three exhausted their declared range. Sender-only query; all observed statuses.
Values are native wei; no economic interpretation or lifetime claim. Current registry
association does not prove historical agent ownership. Source is Envio HyperSync at
https://monad-testnet.hypersync.xyz; retrieval date October 7, 2026 UTC.

Synthetic rows are generated and explicitly labeled in tests/activity.test.ts. Real
fixtures are replayed without altering their raw values to satisfy tests. Independent
RPC evidence: docs/verification/MONAD-M2-cross-check.json. Selection probes are separately
recorded in docs/verification/MONAD-M2-selection.json.
