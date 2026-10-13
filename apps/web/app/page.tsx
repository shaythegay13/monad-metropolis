import { Shell, Mark, Badge, Ext, Mrz, REPO, repoPath } from "../components/site";
import passport from "../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
import agent2 from "../public/passports/agent-2-v1-unpublished.json";
const p = passport.payload;
const metric = (id: string) => p.metrics.find(m => m.metricId === id)?.value ?? "Unknown";
type Metrics = { metrics: { metricId: string; value: unknown }[] };
const plural = (n: unknown, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const activity = (payload: Metrics) => { const v = (id: string) => payload.metrics.find(m => m.metricId === id)?.value ?? "Unknown";
  return <>{plural(v("observed_transaction_count"), "transaction")}<small>{plural(v("active_utc_days"), "active UTC day")}, {plural(v("unique_recipient_addresses"), "recipient")}</small></>; };
const digest = `0x${passport.integrity.digest}`;
const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-8)}`;
const chunk = (h: string) => h.replace(/^0x/, "").match(/.{1,8}/g)!;
const anatomy = [
  ["subject", "Who", "The ERC-8004 agent, its registry and the wallet designated when the evidence was collected."],
  ["observationScope", "Where we looked", "A frozen block range and an explicit query, so coverage can be stated, not implied."],
  ["evidence", "What was seen", "Each transaction as retrieved through Envio HyperSync: hash, block, timestamp, recipient and execution status."],
  ["metrics", "What it adds up to", "Deterministic counts. Every value lists the evidence IDs it was calculated from."],
  ["limitations", "What it does not say", "Plain-language limits that travel with the record, next to the declared coverage."],
  ["integrity", "Tamper evidence", "SHA-256 over the canonical payload. This digest is what gets published on Monad."]
] as const;
const lifecycle = [
  { stage: "Observe", tech: "Envio HyperSync", role: "Retrieves the agent wallet's outgoing Monad Testnet transactions for a frozen block range and reports whether coverage is complete.", link: ["Ingestion source", repoPath("packages/activity/src/envio.ts")] },
  { stage: "Generate", tech: "Signal Passport", role: "Normalizes evidence into deterministic metrics and observations, then computes the canonical SHA-256 digest.", link: ["Generator source", repoPath("packages/passport/src/generate.ts")] },
  { stage: "Publish", tech: "Dynamic with MetaMask", role: "The registry-designated agent wallet signs the Registry write. Agent 2072 version 2 was published this way.", link: ["Registry contract", repoPath("contracts/SignalPassportRegistry.sol")] },
  { stage: "Verify", tech: "Alchemy and Chainlink CRE", role: "The app server reads Monad through Alchemy; a separate CRE workflow reads it on its own.", link: ["Verifier source", repoPath("packages/publication/src/verify.ts")] },
  { stage: "Decide", tech: "Your policy", role: "You state the requirements. Each agent gets SATISFIED, NOT_SATISFIED or INDETERMINATE, with reasons per criterion.", link: ["Policy engine", repoPath("packages/policy/src/evaluate.ts")] }
] as const;
export default function Page() { return <Shell>
  <section className="hero" aria-labelledby="hero-title">
    <div className="hero-text">
      <h1 id="hero-title">Portable, <span className="nowrap">evidence-backed</span> history for AI agents.</h1>
      <div className="hero-side"><p className="lede">Independently verifiable on Monad. Each application that relies on an agent sets its own requirements.</p>
        <div className="actions"><a className="button" href="/passport">Inspect a real Passport</a><a className="button secondary" href="/compare">Compare two agents</a></div></div>
    </div>
    <figure className="custody" aria-labelledby="custody-caption">
      <ol className="custody-rail">
        <li><span className="node" aria-hidden="true"/><strong>Observed activity</strong><span>{metric("observed_transaction_count")} outgoing transactions on Monad Testnet</span><code>blocks {p.observationScope.fromBlock}–{p.observationScope.toBlockExclusive}</code></li>
        <li><span className="node" aria-hidden="true"/><strong>Envio HyperSync</strong><span>{p.coverage.rawRowsRetrieved} rows retrieved in {p.coverage.pageCount} page, query exhausted</span><code>coverage: {p.coverage.coverageStatus}</code></li>
        <li className="custody-document">
          <article className="credential" aria-label="Agent 2072 Passport, version 2">
            <header className="credential-head"><Mark/><span>Signal Passport<small>Agent activity record</small></span><span className="credential-no">No. {p.subject.agentId}</span></header>
            <div className="credential-body">
              <div className="credential-photo" aria-hidden="true"><span>SP</span><small>{p.subject.agentId}</small></div>
              <dl className="credential-fields">
                <div className="wide"><dt>Name</dt><dd className="credential-name">{p.subject.registration.document.name}</dd></div>
                <div><dt>Identity</dt><dd>ERC-8004, agent {p.subject.agentId}</dd></div><div><dt>Network</dt><dd>Monad Testnet</dd></div>
                <div><dt>Passport version</dt><dd>{p.generation.passportVersion}, schema {passport.schemaVersion}</dd></div><div><dt>Generated</dt><dd>Oct 8, 2026</dd></div>
              </dl>
            </div>
            <dl className="credential-metrics"><div><dt>transactions</dt><dd>{metric("observed_transaction_count")}</dd></div><div><dt>active UTC day</dt><dd>{metric("active_utc_days")}</dd></div><div><dt>recipients</dt><dd>{metric("unique_recipient_addresses")}</dd></div></dl>
            <p className="credential-digest"><span>Canonical digest</span><code>{short(digest)}</code></p>
            <Mrz agent={p.subject.agentId} version={p.generation.passportVersion} digest={digest}/>
          </article>
        </li>
        <li><span className="node filled" aria-hidden="true"/><strong>Monad Registry</strong><span>Version 2 digest published by the agent wallet</span><code>block 69236935</code></li>
        <li><span className="node outline" aria-hidden="true"/><strong>Your policy</strong><span>Requirements you define, checked against verified evidence</span><code className="outcome-list"><span>SATISFIED</span><span>NOT_SATISFIED</span><span>INDETERMINATE</span></code></li>
      </ol>
      <figcaption id="custody-caption">Chain of custody for Agent 2072 version 2, using the values recorded in the published artifact.</figcaption>
    </figure>
  </section>

  <section className="statement" aria-labelledby="problem-title">
    <h2 id="problem-title">Agents are starting to transact. Their history doesn&rsquo;t travel with them.</h2>
    <dl className="gaps">
      <div><dt>Identity without history</dt><dd>ERC-8004 resolves an agent and its designated wallet. It says nothing about what that wallet has done.</dd></div>
      <div><dt>History without portability</dt><dd>Indexed activity usually lives inside one platform&rsquo;s database. Another application cannot check it.</dd></div>
      <div><dt>Scores without evidence</dt><dd>A single reputation number hides the evidence, its coverage and whose judgment it encodes.</dd></div>
    </dl>
  </section>

  <section className="anatomy" aria-labelledby="anatomy-title">
    <div className="anatomy-intro"><h2 id="anatomy-title">What a Passport contains</h2><p>One JSON file that stands on its own. Every number traces back to evidence, and every limit is written down. This is Agent 2072&rsquo;s actual version 2.</p>
      <a className="text-link" href="/passports/agent-2072-v2-published.json" download>Download the file ({Math.round(19508 / 1024)} KB)</a></div>
    <div className="anatomy-body">
      <pre tabIndex={0} className="json-excerpt" aria-label="Excerpt of the Agent 2072 Passport JSON"><code>{`{
  "schemaVersion": "${passport.schemaVersion}",
  "payload": {
    `}<mark>&quot;subject&quot;</mark>{`: { "agentId": "${p.subject.agentId}", "chainId": ${p.subject.chainId} },
    `}<mark>&quot;observationScope&quot;</mark>{`: {
      "fromBlock": "${p.observationScope.fromBlock}",
      "toBlockExclusive": "${p.observationScope.toBlockExclusive}"
    },
    `}<mark>&quot;evidence&quot;</mark>{`: [ /* ${p.evidence.length} transactions, "provider": "envio" */ ],
    `}<mark>&quot;metrics&quot;</mark>{`: [ { "metricId": "observed_transaction_count",
                  "value": ${metric("observed_transaction_count")}, "evidenceIds": [ … ] } ],
    "coverage": { "coverageStatus": "${p.coverage.coverageStatus}" },
    `}<mark>&quot;limitations&quot;</mark>{`: [ /* ${p.limitations.length} statements */ ]
  },
  `}<mark>&quot;integrity&quot;</mark>{`: { "algorithm": "sha256",
                 "digest": "${passport.integrity.digest.slice(0, 16)}…" }
}`}</code></pre>
      <dl className="anatomy-notes">{anatomy.map(([key, title, copy]) => <div key={key}><dt><code>{key}</code>{title}</dt><dd>{copy}</dd></div>)}</dl>
    </div>
  </section>

  <section className="proof-band" aria-labelledby="proof-title">
    <div className="proof-copy"><h2 id="proof-title">Publish once. Anyone can check it.</h2>
      <p>The agent&rsquo;s registry-designated wallet publishes the digest to the Signal Passport Registry on Monad. The Registry accepts only the current ERC-8004 agent wallet, and versions are append-only.</p>
      <p>Anyone holding the file recomputes the digest and compares it with the onchain record. Our server is not part of that check.</p></div>
    <div className="hash-compare" role="group" aria-label="Recorded digest comparison">
      <div><span>Recomputed from the file</span><code>{chunk(digest).map((c, i) => <span key={i}>{c}</span>)}</code></div>
      <div><span>Published on Monad, version 2</span><code>{chunk(digest).map((c, i) => <span key={i}>{c}</span>)}</code></div>
      <p className="hash-result"><Badge tone="positive">Digests match</Badge><span>Published at block <code>69236935</code> by <code>0xBC63…51DD</code>. These are recorded values; the Passport page reads the Registry again live.</span></p>
    </div>
  </section>

  <section className="policy-teaser" aria-labelledby="policy-title">
    <div><h2 id="policy-title">No universal score. Your requirements.</h2>
      <p>Signal Passport does not rank agents. A consumer states what it needs, and each agent is evaluated against exactly that, criterion by criterion.</p>
      <a className="button secondary" href="/compare">Try it with two real agents</a></div>
    <table className="teaser-table"><caption>Two real Passports with different activity and different publication status</caption>
      <thead><tr><th scope="col">Agent</th><th scope="col">Observed activity</th><th scope="col">Local integrity</th><th scope="col">Monad publication</th></tr></thead>
      <tbody><tr><th scope="row">Agent 2072, version 2</th><td className="activity">{activity(p)}</td><td><Badge tone="positive">Valid</Badge></td><td><Badge tone="positive">Published</Badge><small>block 69236935</small></td></tr>
        <tr><th scope="row">Agent 2, version 1</th><td className="activity">{activity(agent2.payload)}</td><td><Badge tone="positive">Valid</Badge></td><td><Badge>Not published</Badge><small>confirmed at block 70569534</small></td></tr></tbody></table>
    <p className="teaser-note">Observed activity is evidence, not a verdict. Under the default example policy on Compare (at least 2 transactions, 1 active day and 1 recipient, plus Monad publication), both agents meet the activity thresholds. The one criterion that differs is Monad publication, so Agent 2 is <code>NOT_SATISFIED</code>. That is not a finding that its evidence is wrong. It was never published.</p>
  </section>

  <section className="lifecycle" aria-labelledby="stack-title">
    <div className="lifecycle-intro"><h2 id="stack-title">How the record is made and checked</h2><p>Each stage runs on real infrastructure. The public demo serves artifacts generated earlier from real Monad Testnet activity; it does not re-index on page load.</p></div>
    <ol className="lifecycle-steps">{lifecycle.map((s, i) => <li key={s.stage} className={s.stage === "Verify" ? "split" : undefined}>
      <span className="step-index">{i + 1}</span><h3>{s.stage}</h3><p className="tech">{s.tech}</p>
      {s.stage === "Verify" ? <div className="verifiers"><p><strong>Alchemy</strong> provides the deployed app&rsquo;s server-side Monad RPC. The app reads the Registry record, version, publisher and bytecode through it.</p>
        <p><strong>Chainlink CRE</strong> runs a separate workflow that fetches the hosted file and reads Monad itself. Simulated with the CRE CLI, not deployed to a DON.</p></div> : <p>{s.role}</p>}
      <Ext className="text-link small" href={s.link[1]}>{s.link[0]}</Ext></li>)}</ol>
  </section>

  <section className="consume" aria-labelledby="consume-title">
    <div><h2 id="consume-title">Consume a Passport in your own code</h2><p>Verify an existing Passport and apply your policy without running Envio, our server or the generator. The trust root comes from you, never from the file.</p>
      <div className="actions"><a className="button" href="/developers">Read the developer guide</a><Ext className="button secondary" href={REPO}>Source on GitHub</Ext></div></div>
    <div className="code-block"><div className="code-head"><span>consumer.mjs</span><span>read-only</span></div><pre tabIndex={0} aria-label="consumer.mjs example"><code>{`const verified = await verifyCandidate(
  "agent-2072", passport, { trust, rpc }
);
const result = evaluatePolicy(verified, {
  policyVersion: "1.0.0",
  minimumObservedTransactions: 2,
  requireMonadPublication: true
});
result.outcome; // "SATISFIED" | "NOT_SATISFIED" | "INDETERMINATE"`}</code></pre></div>
  </section>
</Shell>; }
