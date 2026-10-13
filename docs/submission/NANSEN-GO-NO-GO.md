# Nansen — strict 60-minute feasibility gate (not started)

Recommendation: prioritize source publication, videos and the completed four-sponsor
entry. Nansen remains unimplemented but selected in the portal. Default **NO-GO**
unless the owner separately authorizes this assessment and every gate below passes.
A GO is a recommendation for separately authorized implementation, not completion
of the bounty and not permission to alter the public site or published Passports.

## Current verified documentation constraints

[Supported chains](https://docs.nansen.ai/reference/chains) and
[address-label endpoint](https://docs.nansen.ai/api/profiler/address-labels) list
`monad`, but do not establish support for this project's Monad **Testnet 10143**
artifacts. An identical address on another chain is not evidence of equivalent
identity/history. Verify exact endpoint coverage rather than relabeling mainnet
data as Testnet evidence.

[Credit guidance](https://docs.nansen.ai/getting-started/credits) makes label lookups
materially more expensive than basic profiler reads and limits Free-plan access.
Its label pricing differs from the endpoint overview's displayed cost. Verify the
actual account entitlement and per-call cost before any future request. Do not
purchase credits, change plan, enable automatic top-ups or assume a zero-cost API.

## Fixed clock and hard budget

| Minutes | Assessment only | Stop condition |
|---|---|---|
| 0–10 | Confirm one precise consumer question, same-chain subject/evidence, endpoint schema, account entitlement and credit cost | Unknown Testnet coverage, cost, permission or billing exposure → NO-GO |
| 10–25 | If all preflight checks pass, use an authorized CLI/API with credentials consumed privately; at most 2 bounded read calls, <=50 existing credits total | Paid upgrade/top-up needed, errors, no usable authorized data or excessive cost → NO-GO |
| 25–40 | Manually map real results to a concrete consumer interpretation beyond a raw dump; record source, network, time and limitations | Only unrelated-chain labels, empty data or a decorative logo/table → NO-GO |
| 40–55 | Estimate the smallest honest local-only companion integration, tests and demo that preserve existing schema/hashes/policies/site | Requires new publication, schema/contract change, public redeploy, or substantial feature work → NO-GO |
| 55–60 | Record a one-page verdict, actual evidence and remaining implementation effort | Any unmet gate at minute 60 → NO-GO; stop immediately |

If existing-credit cost exceeds this cap, do not switch to a meaningless cheaper
endpoint merely to tick a sponsor box. Never open, print or paste credentials;
only the authorized tool may consume configured secrets. No request has been run
as part of this preparation, and no balance/entitlement has been assumed.

## GO requires all conditions

1. Supported real data about the exact relevant subject/network, or an independently
   defensible explicitly separate chain context the owner approves.
2. Useful nonempty data from an accessible endpoint with verified cost and no
   additional charges/purchases.
3. A reproducible transformation/interpretation that materially aids a consumer,
   separates Nansen enrichment from chain-verifiable evidence, and handles
   empty/unknown/failure honestly.
4. A small local-only companion feature can be implemented, tested, documented
   and recorded before submission with sufficient buffer for mandatory tasks.
   It must not mutate published artifacts/hashes or the accepted production app.
5. The owner authorizes that implementation separately after reviewing the assessment.

On NO-GO: owner removes Nansen from the selected portal bounties and submits Envio,
Dynamic, Alchemy and CRE. Record an explicit milestone exception to the PRD's
remaining Nansen P0; do not silently rewrite the PRD or claim total P0 completion.
No Nansen response claiming integration should be entered while it is unimplemented.
