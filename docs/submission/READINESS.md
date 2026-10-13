# Signal Passport submission readiness

Prepared October 12, 2026 EDT, after owner acceptance of M8 and M9A.
**The implementation is ready for submission; the portal entry is not yet complete.**
Deadline confirmed in the signed-in official portal: **October 13, 2026,
23:59 EDT** (`2026-10-14T03:59:00Z`). Target submission well before the cutoff.

## Prioritized owner actions

1. **Approve the reviewed two-branch push.** Accepted M8 documentation and M9A
   code/evidence must reach public GitHub before judges use the repository.
   [Exact plan](GIT-PUSH-PLAN.md); no push or deployment is performed automatically.
2. **Record and host three mandatory videos:** main live-product demo <=3 minutes,
   pitch <=2 minutes, separate Chainlink CRE simulation demo <=2 minutes.
   [Practical outlines](RECORDING-OUTLINES.md). Open every video anonymously to
   confirm judge access. Optional sponsor clips must not delay these.
3. **Complete the saved portal entry.** Replace the outdated trading-reputation
   one-liner/description with [prepared copy](SUBMISSION-COPY.md), add the required
   go-to-market answer, repository URL and live URL, upload the prepared logo,
   paste the four completed sponsor explanations and video links.
4. **Resolve the selected Nansen bounty.** It is still selected in the portal but
   unimplemented. Recommended default: remove it for this submission unless a
   separately authorized [60-minute feasibility test](NANSEN-GO-NO-GO.md) passes
   every gate and leaves enough time to implement/verify/demo a meaningful feature.
   No API calls or implementation were started. Community Team is already unselected.
5. **Review eligibility/rights and submit.** Confirm team/contact, age/geography/
   affiliation eligibility, single-project entry, build-window representations and
   third-party rights. Save progress, inspect every required field, then perform
   final submission yourself and retain the portal confirmation/timestamp.

No public-site update, contract write, new Passport, DON deployment or purchase is
needed to complete the four supported sponsor entries.

## Exact portal fields and limits

Observed read-only in the owner's authenticated Edge session; no form value was
edited, uploaded, saved or submitted. Source: [submission form](https://hackathon.monad.xyz/project?tab=submission),
[primary track](https://hackathon.monad.xyz/tracks/trust-identity-ai), and dashboard
Rules modal v3.0, updated September 3. [Structured record](PORTAL-REQUIREMENTS.json).

| Required item | Exact observed constraint / readiness |
|---|---|
| Primary track | Trust, Identity & AI Infrastructure selected |
| Project name | <=120 characters; Signal Passport already present |
| One-line introduction | <=200 characters; replace stale trading positioning |
| Description | <=8,000 characters; prepared agent-infrastructure copy |
| Go-to-market / acquisition | Required, <=8,000 characters; currently blank |
| Logo | Form: PNG/JPG/WEBP, <=2 MB, at least 500 px, at most 2000x2000 |
| Repository | Blank in portal; public source required by Rules; intended GitHub URL below |
| Live product | Blank in portal; actual Monad Testnet deployment works |
| Main technical video | Required, <=3 minutes; working product rather than slides/code |
| Pitch | Required, <=2 minutes; team/problem/motivation |
| Sponsor answers | Required for each selected bounty, <=8,000 characters each |
| Chainlink video | Required, <=2 minutes; successful native simulation or deployment |

Judge access notes are optional (<=8,000 characters) but strongly useful. Envio,
Dynamic, Alchemy and Nansen clips are optional, each <=2 minutes. Optional promotion
is <=30 seconds and does not affect judging. Public-display consent for the main
and pitch videos is optional; do not confuse it with judge access.

The form showed **1/6 checklist groups complete** and all sponsor narratives blank.
Its current description promises trading performance/expertise that this application
does not implement. Owner replacement is necessary for an accurate submission.

**Official inconsistencies:** the track page says a 3 MB logo, while the actual upload
form says 2 MB; use the stricter form. The track's judging weights are 20/20/15/25/20
(technical, developer craft, originality, market readiness, traction). General Rules
show five equal 20% categories. Cover both and let organizers determine scoring.
The dashboard and older Rules differ on later judging dates; the submission deadline
agrees. None of these discrepancies requires a product change.

## Source and product evidence checklist

- [x] Accepted forest-green public app: https://signal-passport-monad.vercel.app
- [x] Five pages and both GET APIs rechecked anonymously with HTTP 200.
- [x] Three hosted original-byte Passport hashes match accepted artifacts.
- [x] Agent 2072 v2 matches published hash/publisher; Agent 2 is unpublished.
- [x] Live policy evaluation gives eligible Agent 2072 and ineligible Agent 2
  under the documented publication-required policy; no ranking.
- [x] Public read-only mode true and preparation endpoint returns 403.
- [x] Credential-free external developer example exits 0 against the live site.
- [x] Vercel remains deployment `dpl_FqH7PT5vNASPuaBsmi2y3prq5ERY`, source
  `584a2abf11b673f16e26ad321b0d9ae42000640a`; Git link rechecked `null`.
- [x] M8 Firewall 429/recovery and Alchemy Free-plan protection retained in report;
  no configuration change. This turn does not repeat the flood test.
- [x] Owner-reported public MetaMask account/network/read-only testing preserved.
- [x] 239 core tests +18 CRE tests, zero failures; both typechecks pass.
- [x] Actual native CRE JSON/logs retained for published and unpublished cases;
  runtime/config/schema hashes match the execution evidence.
- [x] Owner-authorized MIT and reuse rights; LICENSE and third-party notices added.
- [x] README discloses pre-existing foundation and AI-assisted development.
- [x] Prepared [logo PNG](SIGNAL-PASSPORT-LOGO.png): 1000x1000, 29,183 bytes;
  derived from approved application mark, visually inspected.
- [ ] Publish accepted source/evidence to both approved GitHub branches.
- [ ] Owner records/hosts videos, completes portal and submits.

Live recheck and developer output: [LIVE-RECHECK.json](LIVE-RECHECK.json),
[EXTERNAL-CONSUMER.log](EXTERNAL-CONSUMER.log). Detailed accepted reports:
[M8](../verification/MONAD-M8.md), [M9A](../verification/MONAD-M9A.md).

## Sponsor evidence map

| Entry | Demonstrated integration | Evidence / owner remaining task |
|---|---|---|
| Primary track | Portable agent credential + independent publication verification + consumer-owned policies | Main demo, pitch, developer example and README; owner confirms eligibility/rights |
| Envio | HyperSync transaction ingestion powers normalized evidence and deterministic observations | `packages/activity/src/envio.ts`, M2/M3 reports and real captured datasets; explain frozen public demo scope |
| Dynamic | Deployed SDK/MetaMask connection; prior real wallet-mediated v2 publication | M5 tx/read-back plus owner-confirmed M8 public connection; show current read-only wallet without signing |
| Alchemy | Server-only Monad RPC drives independent live Registry verification | M4/M8 reports plus fresh live-policy read-back; API secret stays server-side |
| Chainlink CRE | Actual HTTP/EVM native orchestration, full integrity and finalized publication/identity reads | M9A manifest/logs/results; **required separate <=2-minute video** |

## Honest release limitations

Bounded read-only Testnet demo with two frozen real artifacts; no arbitrary-agent
refresh service, universal score, source-truth proof or real service-delivery claim.
Existing onchain content URIs are empty; artifacts are hosted separately and verified
by hash. CRE is native-simulated, unsigned and not scheduled on a live DON. Dynamic
uses the existing Sandbox environment. Nansen is unimplemented and no external team
adoption/production traction is claimed. The 19 documented dependency advisories
(15 moderate, 4 high) remain disclosed; passing checks are not security certification.

Licensing approval resolves that specific Rules gate. The owner must still attest
to build-window/eligibility/IP facts; the agent cannot certify those personal facts
or guarantee final track/bounty eligibility. Anonymous visitors cannot access the
submission form; the owner's login was required and is now available for completion.
