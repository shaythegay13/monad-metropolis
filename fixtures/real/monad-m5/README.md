# M5 artifacts: published download and earlier unpublished candidate

`server-prepared-v2.json` is a genuine Envio-backed candidate prepared through the
local web API on October 8, 2026. It is not a Dynamic-signed or published Passport.
No wallet signature or broadcast was performed for this earlier candidate. A later preparation will have a
different frozen upper bound/resolution/generation time and therefore a different hash.

Agent 2072, Passport version 2, schema 2.0.0; previous version hash is the accepted
M4 onchain digest. Frozen scope: `[69126790, 69232744)`, complete for query, four
direct outgoing transactions, one UTC day, two recipient addresses. These include
identity management, Registry deployment and v1 publication, not fabricated commerce.
Contract creation has no recipient address and is not counted as a recipient.

Profile hash: `0x4ee5c86d3cf08c2bb3b67d4efe8f7a85c12c973487d70030f68aa3cb8ed339f4`.
Content URI would be empty because no public artifact hosting was established.
The API proof and unsigned transaction are in `docs/verification/MONAD-M5-server-checks.json`.

## Published version 2 download

`agent-2072-passport-v2.json` is the exact owner-supplied download, preserved byte-for-byte.
Its profile hash is `0x8dde9e22c9bfb0cf0940923de193f4a9f997156b2035232004d73ce2e1cadef6`.
It was published in transaction
`0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d`,
block 69236935. Receipt, calldata, sender and independent onchain hash verification pass.
See `docs/verification/MONAD-M5-publication.json`. This artifact differs from the earlier
unpublished candidate because its frozen scope and generation/resolution times differ.
