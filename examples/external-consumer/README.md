# Independent consumer quickstart

This example downloads genuine, unchanged Passport JSON from the web app and
evaluates a consumer policy without Envio, wallet connection, a deployer key or
the Passport generation pipeline. It uses the repository's compiled **consumer**
library as source code; no npm package has been published.

From the repository root:

```text
npm install
npm run build
node examples/external-consumer/evaluate.mjs https://YOUR-DEPLOYED-SITE.example/
```

For local testing, omit the URL (the default is `http://127.0.0.1:3051/`) and
start the production web server separately. An optional second argument supplies
a read-only Monad Testnet RPC URL; the default is the public Monad Testnet RPC.

The script checks the **raw file SHA-256** before parsing. It then validates the
Passport schema, evidence references and canonical payload digest, checks the
specified agent/version against the pinned Registry on chain 10143, and evaluates
both agents under one explicit policy. Agent 2072 version 2 is published; Agent 2
version 1 is an offline artifact and must never be described as published. A
`SATISFIED` result means only that the stated policy's criteria passed.

The trust root in `evaluate.mjs` is pinned separately from either Passport and
matches the accepted deployment record. Consumers must verify the Registry address,
Identity Registry and runtime code hash from a source they trust; accepting these
values from the downloaded Passport would defeat independent publication checking.
Raw file SHA-256 and the canonical payload digest are different measurements.

The immutable historical onchain records have empty content URIs. These public
download URLs make the accepted files accessible now; they do not retroactively
change those records.
