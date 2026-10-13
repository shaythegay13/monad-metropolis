import { Shell, Badge, Ext, REPO, repoPath, type Tone } from "../../components/site";
import cre2072 from "../../../../docs/verification/m9a-simulations/agent-2072-local.json";
import cre2 from "../../../../docs/verification/m9a-simulations/agent-2-local.json";
const example = `import { verifyCandidate, evaluatePolicy }
  from "../../dist/packages/policy/src/index.js";

// Pin the trust root yourself. Never read it from the Passport.
const trust = {
  chainId: 10143,
  address: "0x7d9cc86196241485cf1efaf8a96c7819ea95b194",
  identityRegistry: "0x8004a818bfb912233c491871b3d84c89a494bd9e",
  runtimeCodeHash:
    "0x7a3b3ea5b702aa55c5bfae2cd57cac3598877192945f0d5558792024ca7baa43"
};

// An existing Passport artifact. No analysis rerun.
const verified = await verifyCandidate("agent-2072", passport, { trust, rpc });
const result = evaluatePolicy(verified, {
  policyVersion: "1.0.0",
  minimumObservedTransactions: 2,
  requireMonadPublication: true
});

console.log(result.outcome); // SATISFIED | NOT_SATISFIED | INDETERMINATE
console.log(result.checks);  // one entry per criterion, with reasons`;
const components = [
  { name: "Envio HyperSync", role: "Evidence ingestion", what: <>Queries <code>monad-testnet.hypersync.xyz</code> for every transaction sent from the agent&rsquo;s designated wallet inside a frozen block range. Pages, stop reason and row counts become the Passport&rsquo;s declared coverage; each transaction becomes an evidence record with a source reference.</>,
    proof: "Agent 2072 v2: 4 rows, 1 page, stop reason exhausted, complete for query.", files: [["envio.ts", "packages/activity/src/envio.ts"], ["normalize.ts", "packages/activity/src/normalize.ts"], ["coverage.ts", "packages/activity/src/coverage.ts"]] },
  { name: "Dynamic", role: "Wallet connection and authorized publication", what: <>The Wallet page uses Dynamic&rsquo;s React SDK with the MetaMask EVM connector, in connect-only mode with a Monad Testnet network override. Publication requires the connected account to equal the current ERC-8004 <code>agentWallet</code>; ownership is never a fallback.</>,
    proof: "Agent 2072 version 2 was published through Dynamic and MetaMask at block 69236935. The public site is read-only: preparation and publication requests return 403.", files: [["passport-app.tsx", "apps/web/app/passport-app.tsx"], ["wallet.ts", "packages/web/src/wallet.ts"]] },
  { name: "Alchemy", role: "Server-side Monad RPC for verification", what: <>The deployed app reads Monad Testnet through Alchemy on the server. <code>verifyPublishedPassport</code> confirms the chain ID, compares Registry runtime bytecode with a pinned hash, reads the record for the exact agent and version, and checks digest equality and publisher provenance.</>,
    proof: "Powers the live checks on the Passport and Compare pages. The RPC URL is a server-only secret and never reaches the browser.", files: [["rpc.ts", "packages/publication/src/rpc.ts"], ["verify.ts", "packages/publication/src/verify.ts"]] },
  { name: "Chainlink CRE", role: "Independent verification workflow", what: <>A separate workflow fetches the hosted Passport with the CRE HTTP capability, validates it locally, and reads the Registry and ERC-8004 identity with the CRE EVM capability at one finalized block. It never calls the Signal Passport API.</>,
    proof: "Simulated natively with the CRE CLI. Not deployed to a DON; produces an unsigned workflow result.", files: [["main.ts", "cre-passport-verifier/passport-verifier/main.ts"], ["passport.ts", "cre-passport-verifier/passport-verifier/passport.ts"]] }
] as const;
const creCriteria = Object.keys(cre2072.criteria) as (keyof typeof cre2072.criteria)[];
const creTone: Record<string, Tone> = { PASS: "positive", FAIL: "neutral", UNKNOWN: "caution" };
const creLabel: Record<string, string> = { PASS: "Pass", FAIL: "Not found", UNKNOWN: "Unknown" };
const humanize = (s: string) => s.replaceAll("_", " ").replace(/^./, c => c.toUpperCase()).replace(/\buri\b/, "URI");
export default function Developers() { return <Shell active="developers">
  <div className="page-head"><div><h1>Verify a Passport in your own application</h1><p className="lede">Take an existing Passport, check it against Monad with a trust root you control, and apply your own policy. You do not need our evidence pipeline, our server or a wallet.</p></div>
    <div className="actions"><a className="button" href="#quickstart">Consumer quickstart</a><a className="button secondary" href="#cre">CRE simulation evidence</a><Ext className="text-link small" href={REPO}>Source on GitHub</Ext></div></div>
  <div className="developer-layout"><nav className="docs-navigation" aria-label="On this page"><p>On this page</p>
    <a href="#architecture">Architecture</a><a href="#quickstart">Consumer quickstart</a><a href="#lifecycle">Verification lifecycle</a><a href="#policies">Policy contract</a><a href="#api">API and CLI</a><a href="#outcomes">Outcomes</a><a href="#cre">Chainlink CRE evidence</a><a href="#sources">Source and evidence</a></nav>
  <div className="docs-body">
    <section id="architecture" className="docs-section"><h2>Architecture</h2><p>Four pieces of external infrastructure, each doing one job. The public demo serves Passports generated earlier from real Monad Testnet activity; page loads verify, they do not re-index.</p>
      <div className="arch"><p className="lane-label">Produce and publish</p>
        <ol className="arch-flow" aria-label="Produce and publish">
          <li><span>Monad Testnet activity</span><small>agent wallet transactions</small></li><li className="tech"><span>Envio HyperSync</span><small>evidence retrieval</small></li><li className="core"><span>Signal Passport</span><small>deterministic JSON, SHA-256</small></li>
          <li className="tech"><span>Dynamic + MetaMask</span><small>agent wallet signs</small></li><li><span>Passport Registry</span><small>digest on Monad</small></li></ol>
        <p className="lane-label">Verify and decide</p>
        <ol className="arch-flow" aria-label="Verify and decide">
          <li><span>Hosted Passport + Registry</span><small>public inputs</small></li><li className="fork"><span className="tech">Alchemy RPC<small>app server reads</small></span><span className="tech">Chainlink CRE<small>separate workflow, simulated</small></span></li>
          <li><span>Integrity + publication result</span><small>per agent and version</small></li><li className="core"><span>Your policy</span><small>three-state outcome</small></li></ol></div>
      <div className="component-list">{components.map(c => <article key={c.name} className="component"><header><h3>{c.name}</h3><p>{c.role}</p></header><p>{c.what}</p><p className="component-proof">{c.proof}</p>
        <p className="component-files">{c.files.map(([label, path]) => <Ext key={path} href={repoPath(path)}><code>{label}</code></Ext>)}</p></article>)}</div></section>

    <section id="quickstart" className="docs-section"><h2>Independent consumer quickstart</h2>
      <ol className="steps"><li><strong>Get the artifacts.</strong> Download the <a href="/passports/agent-2072-v2-published.json" download>published Agent 2072 version 2 Passport</a> or the <a href="/passports/agent-2-v1-unpublished.json" download>unpublished Agent 2 version 1 Passport</a>. The first file&rsquo;s raw SHA-256 is <code className="break">eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c</code>. Its canonical payload digest is a different value, and that one is checked against Monad.</li>
        <li><strong>Build the libraries.</strong><pre tabIndex={0} className="command"><code>npm ci{"\n"}npm run build</code></pre></li>
        <li><strong>Run the external consumer.</strong> It downloads both files, checks their exact bytes, verifies integrity and Monad publication, and evaluates one policy. No Envio token, wallet or deployer key.<pre tabIndex={0} className="command"><code>node examples/external-consumer/evaluate.mjs https://signal-passport-monad.vercel.app/</code></pre><Ext className="text-link small" href={repoPath("examples/external-consumer", "tree")}>examples/external-consumer</Ext></li></ol>
      <div className="code-block"><div className="code-head"><span>consumer.mjs</span><span>read-only</span></div><pre tabIndex={0} aria-label="consumer.mjs example"><code>{example}</code></pre></div>
      <p>The <code>rpc</code> function is your own read-only Monad transport with the signature <code>(method, params) =&gt; Promise&lt;unknown&gt;</code>. For local-only verification, omit the third argument: publication stays <code>not_checked</code>, so a publication requirement cannot pass. The onchain content URI is historically empty; these hosted URLs do not alter it.</p></section>

    <section id="lifecycle" className="docs-section"><h2>Verification lifecycle</h2>
      <ol className="lifecycle-list"><li><strong>Receive an existing artifact</strong><p>Keep its payload and integrity envelope intact.</p></li><li><strong>Check schema, references and canonical digest</strong><p><code>verifyCandidate</code> runs the independent consumer validator.</p></li><li><strong>Check the publication when required</strong><p>With your trusted Registry configuration and RPC, the verifier checks the exact agent, version, digest, bytecode and publication provenance.</p></li><li><strong>Apply your policy</strong><p><code>evaluatePolicy</code> reads validated observations. It never reruns Envio ingestion or the analysis engine.</p></li></ol>
      <p className="notice warning">Never take your trust root from an untrusted Passport. A matching digest proves integrity, not source-data truth or agent quality.</p></section>

    <section id="policies" className="docs-section"><h2>Policy contract</h2><div className="table-wrap" role="region" aria-label="Policy fields" tabIndex={0}><table><caption className="sr-only">Supported policy version 1.0.0 fields</caption><thead><tr><th scope="col">Field</th><th scope="col">What it checks</th></tr></thead><tbody>{[["minimumObservedTransactions", "Observed transaction count"], ["minimumActiveUtcDays", "Distinct active UTC dates in the dataset"], ["minimumUniqueRecipientAddresses", "Distinct recipient addresses, not independent counterparties"], ["requireCompleteCoverage", "Complete coverage for the declared query"], ["requireLocalIntegrity", "Integrity is mandatory, even if this flag is omitted or false"], ["requireMonadPublication", "Independent matching Monad publication"]].map(([field, text]) => <tr key={field}><td><code>{field}</code></td><td>{text}</td></tr>)}</tbody></table></div>
      <p>Set <code>policyVersion: &quot;1.0.0&quot;</code>. Numeric thresholds are nonnegative safe integers. Unknown fields are rejected. Partial or unknown coverage leaves numeric checks indeterminate, even when the observed count exceeds the threshold.</p><p><code>compareCandidates([resultA, resultB])</code> compares distinct agents under the same policy. It returns the equally eligible candidates, never a weighted ranking.</p></section>

    <section id="api" className="docs-section"><h2>API and CLI</h2>
      <dl className="endpoints"><div><dt><span className="method">GET</span><code>/api/policy</code></dt><dd>Returns the two unchanged real candidate artifacts.</dd></div>
        <div><dt><span className="method post">POST</span><code>/api/policy</code></dt><dd>Send <code>{"{ policy, candidates: [{ candidateId, passport }] }"}</code>. The server performs verification; supplied verification assertions are rejected.</dd></div>
        <div><dt><span className="method">GET</span><code>/passports/agent-2072-v2-published.json</code></dt><dd>Immutable, exact-byte artifact. Also <code>agent-2072-v1-historical.json</code> and <code>agent-2-v1-unpublished.json</code>.</dd></div></dl>
      <p>The public endpoint accepts only the two displayed, unchanged Passports and a caller-defined policy. It requires same-origin JSON and a body of at most 2 MB, with bounded per-instance concurrency and a short-lived read cache. It is not a general evaluation service; use the consumer library for other agents.</p>
      <pre tabIndex={0} className="command"><code>node dist/scripts/evaluate-policy.js request.json [trusted-deployment.json]</code></pre><p>The optional deployment file enables read-only onchain verification through your own RPC configuration.</p></section>

    <section id="outcomes" className="docs-section"><h2>Outcomes</h2><dl className="outcome-guide"><div><dt><Badge tone="positive">SATISFIED</Badge></dt><dd>Every applicable requirement passes.</dd></div><div><dt><Badge>NOT_SATISFIED</Badge></dt><dd>At least one requirement fails. This is not a general judgment about the agent.</dd></div><div><dt><Badge tone="caution">INDETERMINATE</Badge></dt><dd>Nothing fails, but at least one requirement lacks sufficient evidence.</dd></div></dl>
      <p>Every result keeps criterion-level reasons, metric and evidence references, verification state, coverage, dates and scope limitations. A known failure takes precedence over uncertainty, and both stay visible.</p><a className="button secondary" href="/compare">Try the real comparison</a></section>

    <section id="cre" className="docs-section cre"><div className="cre-head"><h2>Chainlink CRE native simulation</h2><p className="cre-flag">Simulated with CRE CLI {"1.38.0"} (WASM). Not deployed to a DON. No signed Chainlink attestation.</p></div>
      <p>The CRE workflow is a second, independent verifier. It does not trust our API: it downloads the public file itself and reads Monad itself, then returns one structured result.</p>
      <ol className="cre-pipeline"><li><strong>Cron trigger</strong><span>hourly schedule, run once by the simulator</span></li><li><strong>CRE HTTPClient</strong><span>bounded download of the hosted Passport; raw-file SHA-256</span></li><li><strong>Local integrity</strong><span>full schema, reference graph and canonical digest</span></li><li><strong>CRE EVMClient</strong><span>one finalized block: Registry bytecode, record, ERC-8004 identity</span></li><li><strong>Result</strong><span><code>{cre2072.outputType}</code></span></li></ol>
      <div className="cre-results" role="region" aria-label="CRE simulation results" tabIndex={0}><table><caption>Both native simulation results, criterion by criterion</caption>
        <thead><tr><th scope="col">Criterion</th><th scope="col">Agent {cre2072.agentId}, v{cre2072.passportVersion}</th><th scope="col">Agent {cre2.agentId}, v{cre2.passportVersion}</th></tr></thead>
        <tbody><tr className="summary"><th scope="row">Overall</th><td><Badge tone="positive">Verified publication</Badge></td><td><Badge>Valid locally, unpublished</Badge></td></tr>
          <tr><th scope="row">Finalized snapshot</th><td><code>block {cre2072.snapshot.blockNumber}</code></td><td><code>block {cre2.snapshot.blockNumber}</code></td></tr>
          <tr><th scope="row">Latest published version</th><td><code>{cre2072.publication.latestVersion}</code></td><td><code>{cre2.publication.latestVersion}</code></td></tr>
          {creCriteria.map(k => { const a = cre2072.criteria[k].status, b = (cre2.criteria as Record<string, { status: string }>)[k]?.status;
            return <tr key={k}><th scope="row">{humanize(k)}</th><td><Badge tone={creTone[a]}>{creLabel[a] ?? a}</Badge></td><td>{b ? <Badge tone={creTone[b]}>{b === "FAIL" && k !== "publication" ? "Fail" : creLabel[b] ?? b}</Badge> : "–"}</td></tr>; })}</tbody></table></div>
      <p>Unpublished is not fraudulent and does not invalidate local evidence. The Agent 2 publication checks are <code>Not found</code> and <code>Unknown</code>, not failures of integrity. Values above are read from the retained CLI result files, not composed by hand.</p>
      <h3>Reproduce it</h3><pre tabIndex={0} className="command"><code>{`cd cre-passport-verifier
cre workflow simulate passport-verifier --target local-simulation \\
  --non-interactive --trigger-index 0
cre workflow simulate passport-verifier --target local-simulation \\
  --non-interactive --trigger-index 0 --config ./config.agent-2.json`}</code></pre>
      <p>Requires CRE CLI login and Bun. No API key, wallet, signer or funded account. New runs report newer snapshot blocks.</p>
      <ul className="link-list"><li><Ext href={repoPath("cre-passport-verifier/passport-verifier", "tree")}>Workflow source</Ext></li><li><Ext href={repoPath("docs/verification/MONAD-M9A-DEMO.md")}>Reproduction guide</Ext></li><li><Ext href={repoPath("docs/verification/MONAD-M9A.md")}>Verification report</Ext></li><li><Ext href={repoPath("docs/verification/m9a-simulations", "tree")}>Raw simulation outputs and logs</Ext></li><li><Ext href={repoPath("docs/verification/MONAD-M9A-simulation-evidence.json")}>Simulation evidence manifest</Ext></li></ul></section>

    <section id="sources" className="docs-section"><h2>Source and evidence</h2><ul className="link-list two">
      <li><Ext href={repoPath("contracts/SignalPassportRegistry.sol")}>Passport Registry contract</Ext></li><li><Ext href={repoPath("packages/policy/src/evaluate.ts")}>Policy engine</Ext></li>
      <li><Ext href={repoPath("packages/consumer/src/validate-agent-bundle.ts")}>Consumer validator</Ext></li><li><Ext href={repoPath("packages/passport/src/generate.ts")}>Passport generator</Ext></li>
      <li><Ext href={repoPath("docs/ARCHITECTURE.md")}>Architecture document</Ext></li><li><Ext href={repoPath("README.md")}>README</Ext></li>
      <li><Ext href="https://testnet.monadscan.com/address/0x7d9cc86196241485cf1efaf8a96c7819ea95b194">Registry on Monadscan</Ext></li><li><Ext href="https://testnet.monadscan.com/tx/0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d">Version 2 publication transaction</Ext></li></ul></section>
  </div></div></Shell>; }
