# Compatibility fixture provenance

`real/passport-bundle.json` and `real/metadata.json` are copied unchanged from the
original Signal Passport commit `fc79feb3eddff29439a3fe462e740ccdf3af3923`.
They describe historical Ethereum/Blockscout evidence, NOT Monad agent economic history.
Only the sealed bundle and its provenance are needed for offline compatibility tests;
raw transaction pages, extended examples and fixture-generation scripts were not migrated.

Synthetic structures embedded in unit tests are test-only examples. Live Monad identity
snapshots are stored separately under `docs/verification/` and are labeled by milestone.
No historical fixture is silently relabeled as newly retrieved or as Monad activity.
