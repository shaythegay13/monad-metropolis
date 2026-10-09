import { Shell, Mark, Arrow, Badge, SectionHeading } from "../components/site";
import passport from "../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
const metric = (id: string) => passport.payload.metrics.find(m => m.metricId === id)?.value ?? "Unknown";
const stages = [
  ["Identify", "Start with an ERC-8004 agent and its registry-designated wallet."],
  ["Observe", "Retrieve real onchain activity within an explicit query scope."],
  ["Generate", "Turn evidence into deterministic, traceable observations."],
  ["Publish", "The authorized wallet anchors the Passport digest on Monad."],
  ["Verify", "Independently check the artifact and its published record."],
  ["Evaluate", "Apply the requirements that matter to your application."]
];
export default function Page() { return <Shell>
  <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="status-dot"/> PORTABLE RECORDS FOR AUTONOMOUS AGENTS</p>
    <h1>Know the agent.<br/>Inspect the <em>evidence.</em></h1><p className="hero-description">The CARFAX for autonomous AI agents. A portable record of observed activity that any application can independently verify.</p>
    <div className="actions"><a className="button" href="/passport">Explore a Passport <Arrow/></a><a className="button secondary" href="/compare">Compare agents <span aria-hidden="true">→</span></a></div>
    <p className="microcopy">Real evidence. Your requirements. No universal trust score.</p>
    <div className="hero-facts"><span>ERC-8004 identity</span><span>Monad publication</span><span>Independent verification</span></div>
  </div><div className="hero-art"><div className="preview-caption"><span>REAL PRODUCT DEMONSTRATION</span><span>01 / PASSPORT</span></div>
    <article className="credential-preview"><div className="credential-top"><Mark/><span>SIGNAL PASSPORT<br/><small>AGENT ACTIVITY RECORD</small></span><span className="credential-version">V{passport.payload.generation.passportVersion}</span></div>
      <div className="identity-emblem" aria-hidden="true"><span>SP</span><i/><b>2072</b></div><p className="eyebrow">ERC-8004 · MONAD TESTNET</p><h2>{passport.payload.subject.registration.document.name}</h2><p className="credential-id">AGENT / {passport.payload.subject.agentId}</p>
      <div className="preview-metrics"><div><strong>{metric("observed_transaction_count")}</strong><span>Transactions</span></div><div><strong>{metric("active_utc_days")}</strong><span>Active UTC day</span></div><div><strong>{metric("unique_recipient_addresses")}</strong><span>Recipients</span></div></div>
      <div className="credential-bottom"><Badge tone="positive">Published on Monad</Badge><span>Version 2 · schema 2.0.0</span></div><p className="record-note">Recorded publication · Oct 8, 2026<br/>Open the Passport for a fresh independent check.</p>
    </article><div className="artifact-caption"><span className="mini-line"/> One portable artifact. Independently inspectable.</div></div>
  </section>
  <section className="principle-strip"><p>Identity tells you <strong>who an agent is.</strong><br/>A Passport shows <strong>what was observed.</strong></p><div><p>Agent identity alone does not explain its history. Signal Passport connects a verifiable record to the evidence behind it, with the limits kept in view.</p><a className="text-link" href="/passport#limitations">Understand what verification proves <Arrow/></a></div></section>
  <section className="page-section"><SectionHeading number="01" title="From identity to informed decisions." detail="Six clear steps. A record you can take with you."/><div className="workflow">{stages.map(([title, copy], i) => <article key={title}><span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
  <section className="demo-band"><div><p className="eyebrow">REAL AGENT. REAL TESTNET RECORD.</p><h2>Meet Agent 2072.</h2><p>Four observed transactions. One active UTC day. An exact Passport digest published on Monad Testnet. Every claim has a scope you can inspect.</p><a className="button" href="/passport">Open the activity record <Arrow/></a></div><div className="demo-note"><span className="big-bracket">[ ]</span><h3>Verified publication.<br/>Visible limitations.</h3><p>This demo covers identity management, deployment and publication activity. It does not establish commerce, service delivery or agent quality.</p></div></section>
  <section className="developer-cta"><div><p className="eyebrow">BUILT TO BE CONSUMED</p><h2>Your application.<br/>Your requirements.</h2><p>Verify an existing Passport and apply a policy without running our evidence-generation infrastructure.</p><a className="text-link" href="/developers">Start with the developer guide <Arrow/></a></div><div className="code-card"><div><span className="code-dot"/><span>consumer.ts</span><span>READ-ONLY</span></div><pre><code>{`const verified = await verifyCandidate(\n  "agent-2072", passport, { trust, rpc }\n);\n\nconst result = evaluatePolicy(verified, {\n  policyVersion: "1.0.0",\n  minimumObservedTransactions: 2,\n  requireMonadPublication: true\n});`}</code></pre></div></section>
  </Shell>; }
