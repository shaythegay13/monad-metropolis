# M5 owner-run browser QA

October 8, 2026. URL: http://127.0.0.1:3050.
These are owner-confirmed results, not agent-observed browser tests.
No new blockchain transaction was authorized or sent during closeout.

| Check | Result and evidence source |
|---|---|
| A - Dynamic connection/account | PASS: owner confirmed full account 0xBC63Bf8DBa3aecA97801b85C600f8D0208fB51DD and matching-agentWallet message. |
| B - Network | PASS: owner confirmed Wallet network shows Monad Testnet / 10143. |
| C - Agent/Registry | PASS: owner confirmed Agent 2072 and Registry 0x7d9cc86196241485cf1efaf8a96c7819ea95b194. |
| D - Version status | PASS: owner sees "Version 2 confirmed and independently verified". |
| E - Wrong network | PASS: owner sees Wrong network, explanation and Switch to Monad Testnet 10143 button; Prepare next Passport is disabled and no Publish button is visible. Owner also confirmed switching back works. |
| F - Different account, if available | NOT MANUALLY EXERCISED: owner has only one account. Automated wrong-wallet matching/API rejection and contract authorization checks pass. No second account was created or funded. |
| G - Disconnect/reconnect | PASS: owner confirmed Not connected with preparation disabled, then correct B51DD account, network 10143 and authorization restored on reconnect. |
| H - Connection cancellation | PASS: owner disconnected, opened Connect Wallet, closed Dynamic without choosing MetaMask, and confirmed the app stayed disconnected with preparation disabled and no crash. |

Transaction rejection is automation-only; no new signing/publication was initiated.
Check F was conditional on another account being available. Its explicit manual-test
limitation is retained; automated coverage is not described as manual verification.

The owner noted that wrong-network warnings/actions do not stand out visually and
explicitly deferred their prominence to later frontend work. No redesign was added.

All required available manual checks are complete. Together with the independently
verified successful v2 publication, passing automated checks and documented security
disposition, this supports functional M5 acceptance. Production security is not approved.
