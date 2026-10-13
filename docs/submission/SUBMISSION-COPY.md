# Submission copy — owner review and paste

Factual drafts for the current accepted implementation. They have not been entered
into the portal. Replace personal/team details only with facts you can confirm.

## Project name

Signal Passport

## One-line description

Portable, evidence-backed history for AI agents on Monad, independently verifiable and evaluated using each consumer's own trust policy.

## Primary track description

Signal Passport is a portable economic-history primitive for autonomous agents.
ERC-8004 resolves an agent's identity and current designated wallet. Envio HyperSync
supplies bounded real transaction evidence, which deterministic code normalizes
into a versioned Passport with observations, traceable evidence references, declared
coverage and explicit limitations. Canonical SHA-256 seals the payload; a minimal
Monad Testnet Registry anchors its digest and version through authorized publication.

Another application can retrieve the JSON, validate its schema/references and
integrity, independently check the Registry, and apply its own policy without
rerunning the analysis or trusting a centralized reputation score. The deployed
demo compares Agent 2072's published version 2 with Agent 2's locally valid,
unpublished Passport. Policy outcomes describe eligibility under the selected
requirements, not universal trustworthiness.

Dynamic provides the wallet connection and the previously verified MetaMask-mediated
publication flow. Alchemy powers the deployed server's independent Monad reads.
An additional read-only Chainlink CRE cron workflow uses actual HTTP and EVM
capabilities to retrieve the public Passport, calculate its integrity and verify
publication/current identity at a consistent finalized snapshot. Genuine native
simulations are retained for both published and unpublished cases.

The public application is intentionally read-only and requires no signature for
inspection or comparison. It serves frozen real artifacts; it does not claim trading
performance, service delivery, live continuous refresh, a deployed DON attestation,
Nansen enrichment or production security certification. Selected pre-existing
verification components, AI-assisted development and third-party attribution are
disclosed in the README.

## Go-to-market / user acquisition — proposed strategy

Our first intended users are developers of agent routers, agent marketplaces,
agent wallets and delegation applications that need portable evidence before
choosing an agent. These are target customers, not claimed current customers.

The initial acquisition path is developer-led: publish the schema, independent
verifier, policy examples and a credential-free external consumer quickstart; then
invite Monad/Metropolis teams to test one integration against the existing public
Passports. The first pilot goal is a partner calling the verifier and applying its
own policy, with measured setup time, verification failures and qualitative feedback.
We would use that feedback to prioritize supported evidence and integration clarity.

The distinction from building this inside each application is a portable artifact
and independently checkable publication history that multiple consumers can reuse
while keeping their own decision rules. After the hackathon, we would seek a small
number of design partners before expanding chains or paid offerings. No external
adoption, paying users or partnerships have been verified yet; the working external
consumer example demonstrates interoperability rather than customer traction.

## Links and judge access instructions

Repository: https://github.com/shaythegay13/monad-metropolis
Accepted source branch: `signal-passport-monad`; `monad-metropolis` will match after
the owner-approved fast-forward push. Do not give judges a local-only commit link.

Live product: https://signal-passport-monad.vercel.app

Open the Homepage, Passport, Compare Agents and Developers pages without logging
in or connecting a wallet. Evaluate the two displayed agents using a policy requiring
Monad publication: Agent 2072 satisfies it and Agent 2 has no publication. Download
the original Passport JSON from the Passport page. The Wallet page supports Dynamic/
MetaMask connection on Monad Testnet 10143, but public preparation and publication
are disabled. No test credentials, funded wallet, signature or transaction is needed
for the core demo. Existing publication transaction:
https://testnet.monadscan.com/tx/0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d

CRE reproduction instructions and actual retained native outputs are in
`docs/verification/MONAD-M9A.md` and `MONAD-M9A-DEMO.md`. A judge can inspect
retained evidence without CRE login; rerunning the native CLI requires their own
CRE login/toolchain, public RPC only, and no signing key. The separate technical
video demonstrates that real execution. Do not share your own credentials.

## Envio — required explanation

Envio HyperSync powers Signal Passport's core evidence ingestion, rather than a
decorative dashboard integration. The implemented adapter queries bounded Monad
Testnet activity for the wallet currently designated by ERC-8004, preserves exact
transaction values and source references, and normalizes stable chain-scoped evidence
IDs. Retrieval explicitly distinguishes complete, partial, unknown and failed
coverage. Deterministic code derives observed transaction counts, active UTC days,
recipient-address counts, first/last observed activity and execution-status counts,
linking every observation to the included evidence.

The accepted real captures feed both agent Passports used in the public comparison.
The public demo serves frozen artifacts derived from those captures; it does not
run a new HyperSync query on every page load. The adapter, fixtures, tests and M2/M3
verification reports expose the data flow. No payment, commerce or independent-
counterparty inference is made from transaction semantics alone.

## Dynamic — required explanation

Signal Passport integrates the Dynamic SDK with its EVM/MetaMask connector for
wallet connection, account display, Monad Testnet identification and the local
authorized publication flow. The owner completed a real Dynamic/MetaMask publication
of Agent 2072 Passport version 2; its successful receipt and Registry read-back are
documented. Wallet authorization uses the ERC-8004 designated wallet, without an
owner/operator fallback.

The deployed Wallet page remains demoable: the owner verified connection, expected
account/network and disabled read-only publication controls on the public origin.
Wrong-network and account/state handling have documented regression coverage.
The public hackathon demo requires no new signature or transaction. This is an
existing Dynamic Sandbox environment with explicit allowed origins; we do not claim
embedded wallets, passkey onboarding, authentication beyond the implemented wallet
flow or a production Dynamic tier.

## Alchemy — required explanation

Alchemy is the deployed server's Monad Testnet infrastructure for independent
Passport publication verification. The verifier checks chain 10143, pins the Registry
runtime code and identity dependency, reads the exact version/digest/publisher and
rechecks its block snapshot. Public comparison policies consume that verified context;
they do not accept a request-supplied assertion that an agent is published.

Alchemy also supported the earlier controlled Testnet deployment/publication and
receipt/read-back tooling. The accepted public release is read-only: the RPC URL
is a server-only secret and no deployer private key is configured on Vercel.
The Free-plan quota and Vercel API limits constrain the demo. The separate native
CRE simulation and credential-free consumer use public Monad RPC; we do not falsely
attribute those calls to Alchemy or claim a paid service was provisioned.

## Chainlink CRE — required explanation

Signal Passport's read-only CRE cron verifier materially orchestrates offchain data
retrieval with independent Monad publication and ERC-8004 identity checks. CRE
HTTPClient fetches the actual public Passport bytes with identical aggregation;
the workflow bounds the response, validates the complete schema/reference graph,
and calculates raw-file and canonical payload SHA-256 separately. CRE EVMClient
selects a finalized block and directly reads the Registry and identity contracts
at that exact height, with bytecode and header consistency checks.

The versioned JSON output separates historical authorized publication from current
wallet/owner/URI association and includes PASS/FAIL/UNKNOWN criteria and limitations.
Actual CLI/WASM simulations verified Agent 2072 v2 at block 70569278 and confirmed
Agent 2 v1's missing publication at block 70569534 while retaining valid local
integrity. Source, exact commands, hashes, native logs and returned JSON are retained;
18 focused tests pass. It does not call our backend verifier, invent a score, generate
a signed DON report, send a transaction or claim live decentralized deployment.

## Nansen

No submission narrative claiming integration is prepared. Nansen is unimplemented.
The owner must remove the bounty or separately authorize a feasibility assessment
and subsequent verified integration before making a positive claim.
