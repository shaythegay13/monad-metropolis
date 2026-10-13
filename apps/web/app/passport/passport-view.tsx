"use client";
import { useCallback, useEffect, useState } from "react";
import artifact from "../../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
import type { Evaluation } from "../../../../packages/policy/src/index";
import { Shell, Mark, Badge, Ext, Mrz, repoPath, type Tone } from "../../components/site";
import { CopyValue, CopyButton } from "../../components/copy-value";
const Chunks = ({ hash }: { hash: string }) => <code className="chunks">{hash.replace(/^0x/, "").match(/.{1,8}/g)!.map((c, i) => <span key={i}>{c}</span>)}</code>;
import { dateLabel, publicationLabels, publicationTone, versionLabel } from "../../lib/presentation";
const p = artifact.payload;
const registry = "0x7d9cc86196241485cf1efaf8a96c7819ea95b194";
const explorer = "https://testnet.monadscan.com";
const tx = "0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d";
function metric(id: string) { return p.metrics.find(m => m.metricId === id)?.value ?? "Unavailable"; }
const timeLabel = (iso: string) => `${iso.slice(11, 19)} UTC`;
const observed = [["observed_transaction_count", "Observed transactions"], ["active_utc_days", "Active UTC day"], ["unique_recipient_addresses", "Recipient addresses"]] as const;
export default function PassportView() {
  const [result, setResult] = useState<Evaluation>(); const [latest, setLatest] = useState<string>();
  const [wallet, setWallet] = useState<string>(); const [busy, setBusy] = useState(true); const [error, setError] = useState("");
  const [stateError, setStateError] = useState("");
  const verify = useCallback(async () => {
    setBusy(true); setError(""); setStateError(""); setResult(undefined); setLatest(undefined); setWallet(undefined);
    const [evaluation, state] = await Promise.allSettled([
      fetch("/api/policy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        policy: { policyVersion: "1.0.0", requireMonadPublication: true }, candidates: [{ candidateId: "agent-2072", passport: artifact }] })
      }).then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.error ?? "Verification unavailable."); return data.candidates[0] as Evaluation; }),
      fetch("/api/passport", { cache: "no-store" }).then(async r => { if (!r.ok) throw Error(); return r.json(); })
    ]);
    if (evaluation.status === "fulfilled") setResult(evaluation.value); else setError("The independent check could not complete. Retry below; publication status is unknown.");
    if (state.status === "fulfilled") {
      setLatest(state.value.latest); setWallet(state.value.agentWallet);
      if (!state.value.latest || !state.value.agentWallet || state.value.network !== "available")
        setStateError("The latest-version or current-wallet read could not complete. Retry to check the live Registry state.");
    } else setStateError("The latest-version and current-wallet read could not complete. Retry to check the live Registry state.");
    setBusy(false);
  }, []);
  useEffect(() => { void verify(); }, [verify]);
  const v = result?.publication; const published = v && "publicationFound" in v ? v : undefined;
  const checks = [
    ["Local integrity", busy ? "Checking artifact integrity…" : result ? result.integrity === "valid" ? "Schema, references and digest match" : "Invalid Passport integrity" : "Check unavailable", result?.integrity === "valid", "Computed from the file itself"],
    ["Onchain publication", busy ? "Reading Monad publication…" : v ? publicationLabels[v.status] : "Check unavailable", v?.status === "verified", "Registry read through Alchemy"],
    ["Published hash", busy ? "Comparing the published digest…" : published?.publishedHashMatches === true ? "Matches this exact artifact" : published?.publishedHashMatches === false ? "No matching published hash" : "Not established", published?.publishedHashMatches === true, "Registry read through Alchemy"],
    ["Publisher provenance", busy ? "Checking Registry authorization…" : published?.publicationProvenanceVerified ? "Verified under Registry authorization" : "Not established", published?.publicationProvenanceVerified, "Registry read through Alchemy"],
    ["Evidence coverage", busy ? "Validating declared scope…" : result?.coverage?.coverageStatus === "complete_for_query" ? "Complete for the declared query" : result?.coverage?.coverageStatus ?? "Check unavailable", result?.coverage?.coverageStatus === "complete_for_query", "Declared from the Envio retrieval"]
  ] as const;
  const toneFor = (passed: boolean | undefined, index: number): Tone => busy ? "pending" : passed ? "positive"
    : index === 0 && result?.integrity === "invalid" ? "negative" : index > 0 && index < 4 ? publicationTone(v?.status) : "neutral";
  const allPassed = !busy && checks.every(check => check[2] === true);
  const hashMatch = published?.profileHash && published.profileHash.toLowerCase() === `0x${artifact.integrity.digest}`;
  return <Shell active="passport">
    <div className="page-head"><div><p className="crumb"><a href="/">Signal Passport</a><span aria-hidden="true">/</span>Agent {p.subject.agentId}</p><h1>Agent {p.subject.agentId} Passport</h1>
      <p className="lede">Version {p.generation.passportVersion}, generated from real Monad Testnet activity and published by the agent&rsquo;s wallet. Its independent checks run again every time this page opens.</p>
      <p className="head-status"><Badge tone={busy ? "pending" : allPassed ? "positive" : "caution"}>{busy ? "Running independent checks" : allPassed ? "All 5 independent checks passed" : "Not every check passed"}</Badge><a href="#checks-title">See the checks</a></p></div>
      <div className="actions"><a className="button" href="/passports/agent-2072-v2-published.json" download>Download Passport JSON <span aria-hidden="true" className="glyph">↓</span></a><a className="button secondary" href="/compare">Compare agents</a></div></div>

    <div className="passport-layout">
      <article className="passport-document" aria-label="Passport data page">
        <header className="document-ribbon"><Mark/><span>Signal Passport<small>Portable agent activity record</small></span><span className="document-serial">No. {p.subject.agentId}</span></header>
        <div className="document-identity"><div className="credential-photo" aria-hidden="true"><span>SP</span><small>{p.subject.agentId}</small></div>
          <div><p className="field-label">ERC-8004 identity</p><h2>{p.subject.registration.document.name}</h2><p className="document-sub">Agent {p.subject.agentId}, Monad Testnet</p>
            <div className="document-badges"><Badge tone={busy ? "pending" : latest === "2" ? "brand" : "neutral"}>{versionLabel(2, latest, busy)}</Badge><Badge>Schema {artifact.schemaVersion}</Badge></div></div></div>
        <dl className="identity-fields"><div><dt>Current registry-designated wallet <small>live read, not proof of historical ownership</small></dt><dd>{wallet ? <CopyValue value={wallet} label="current agent wallet"/> : busy ? "Reading current wallet…" : "Live wallet designation unavailable"}</dd></div>
          <div><dt>Identity registry</dt><dd><Ext href={`${explorer}/address/${p.subject.registryAddress}`}>ERC-8004 Identity Registry</Ext></dd></div></dl>
        <div className="document-rule"><span>Observed activity</span><span>{dateLabel(String(metric("first_observed_activity_at")))}</span></div>
        <dl className="passport-metrics">{observed.map(([id, label]) => <div key={id}><dt>{label}</dt><dd>{metric(id)}</dd></div>)}</dl>
        <p className="execution-row"><span><b>{metric("successful_execution_count")}</b> successful</span><span><b>{metric("failed_execution_count")}</b> failed</span><span><b>{metric("unknown_execution_status_count")}</b> unknown status</span></p>
        <p className="document-caveat">Observed EVM activity does not by itself establish commerce or service delivery.</p>
        <Mrz agent={p.subject.agentId} version={p.generation.passportVersion} digest={artifact.integrity.digest}/>
      </article>

      <aside className="verification-panel" aria-labelledby="checks-title">
        <div className="panel-head"><h2 id="checks-title">Independent checks</h2><span className="chain-tag">Monad Testnet 10143</span></div>
        <p className="panel-intro">The server re-verifies this exact file and reads the pinned Registry over its Alchemy Monad RPC. No wallet needed.</p>
        <ol className="check-list" aria-live="polite">{checks.map(([title, description, passed, source], index) => <li key={title} className={`check ${toneFor(passed, index)}`}>
          <span className="check-mark" aria-hidden="true">{busy ? "" : passed ? "✓" : toneFor(passed, index) === "negative" ? "✕" : "–"}</span>
          <div><strong>{title}</strong><p>{description}</p><small>{source}</small></div></li>)}</ol>
        {error && <p role="alert" className="notice error">{error}</p>}{stateError && <p role="alert" className="notice error">{stateError}</p>}
        <button className="secondary full-width" disabled={busy} onClick={() => void verify()}>{busy ? "Checking independently…" : "Verify again"}</button>
        <p className="microcopy" role="status">{busy ? "Reading a fresh, read-only chain snapshot…" : published?.checkedBlock ? <>Read-only snapshot at block <code>{published.checkedBlock}</code></> : "No verified chain snapshot available."}</p>
        <a className="text-link small" href="#limitations">What these checks do not prove</a>
      </aside>
    </div>

    <section className="provenance" aria-labelledby="provenance-title">
      <div className="section-heading"><h2 id="provenance-title">Where the numbers come from</h2><p className="section-detail">Follow any metric back to the transactions behind it. Envio retrieved the evidence when the Passport was generated; this page shows that frozen record and does not query Envio again.</p></div>
      <ol className="provenance-flow">
        <li><h3>Observed onchain activity</h3><p>Direct outgoing transactions from the designated wallet, all statuses.</p>
          <dl className="mini-facts"><div><dt>Block range</dt><dd><code>[{p.observationScope.fromBlock}, {p.observationScope.toBlockExclusive})</code></dd></div><div><dt>Wallet</dt><dd><code>{p.observationScope.subjectWallet.slice(0, 6)}…{p.observationScope.subjectWallet.slice(-4)}</code></dd></div></dl></li>
        <li><h3>Envio HyperSync evidence</h3><p>Retrieved from <code>{p.provenance.endpoint.replace("https://", "")}</code> and normalized into evidence records.</p>
          <dl className="mini-facts"><div><dt>Rows retrieved</dt><dd>{p.coverage.rawRowsRetrieved} in {p.coverage.pageCount} page</dd></div><div><dt>Stop reason</dt><dd>{p.coverage.stopReason}, coverage {p.coverage.coverageStatus.replaceAll("_", " ")}</dd></div><div><dt>Retrieved</dt><dd>{dateLabel(p.provenance.retrievedAt)}, {timeLabel(p.provenance.retrievedAt)}</dd></div></dl></li>
        <li><h3>Passport observations</h3><p>Deterministic metrics. Each one cites the evidence IDs it was computed from.</p>
          <dl className="mini-facts">{observed.map(([id, label]) => <div key={id}><dt>{label}</dt><dd>{metric(id)} <small>from {p.metrics.find(m => m.metricId === id)?.evidenceIds.length} evidence records</small></dd></div>)}</dl></li>
      </ol>
      <h3 className="table-title">{p.evidence.length} evidence records retrieved through Envio HyperSync</h3>
      <div className="evidence-table" role="list" aria-label="Evidence records">{p.evidence.map((e, i) => <details key={e.evidenceId} role="listitem"><summary>
          <span className="evidence-index">{i + 1}</span><code className="evidence-hash">{e.transactionHash.slice(0, 12)}…{e.transactionHash.slice(-6)}</code>
          <span className="evidence-meta">Block <code>{e.blockNumber}</code><span>{dateLabel(e.timestamp)}, {timeLabel(e.timestamp)}</span></span>
          <Badge tone={e.status === "success" ? "positive" : "neutral"}>{e.status === "success" ? "Executed" : e.status}</Badge><span className="expand-sign" aria-hidden="true"/></summary>
        <dl className="evidence-detail"><div><dt>Transaction hash</dt><dd><CopyValue value={e.transactionHash} label={`transaction ${i + 1}`}/><Ext href={`${explorer}/tx/${e.transactionHash}`}>View on Monadscan</Ext></dd></div>
          <div><dt>Recorded timestamp (UTC)</dt><dd><code>{e.timestamp}</code></dd></div><div><dt>Recipient address</dt><dd>{e.recipient ? <CopyValue value={e.recipient} label={`recipient ${i + 1}`}/> : "No recipient recorded"}</dd></div>
          <div><dt>Source</dt><dd>Envio HyperSync, <code>{e.sourceReference.replace("https://", "")}</code><p>An authenticated query endpoint, not a public transaction viewer. Use the Monadscan link to inspect the transaction.</p></dd></div></dl></details>)}</div>
    </section>

    <section className="publication" aria-labelledby="publication-title">
      <div className="section-heading"><h2 id="publication-title">The exact record on Monad</h2><p className="section-detail">The digest of this file, compared with what the Registry holds for agent {p.subject.agentId}, version {p.generation.passportVersion}.</p></div>
      <div className="publication-grid">
        <div className="hash-compare live" role="group" aria-label="Digest comparison">
          <div><span>Canonical digest of this file</span><Chunks hash={artifact.integrity.digest}/><CopyButton value={`0x${artifact.integrity.digest}`} label="artifact profile hash"/></div>
          <div><span>Published profile hash, live read</span>{published?.profileHash ? <><Chunks hash={published.profileHash}/><CopyButton value={published.profileHash} label="published profile hash"/></> : <p className="pending-value">{busy ? "Reading published hash…" : "Unavailable"}</p>}</div>
          <p className="hash-result">{busy ? <Badge tone="pending">Comparing</Badge> : hashMatch ? <Badge tone="positive">Digests match</Badge> : <Badge tone="caution">Match not established</Badge>}</p>
        </div>
        <dl className="record-fields">
          <div><dt>Publisher, live record</dt><dd>{published?.publisher ? <CopyValue value={published.publisher} label="publisher"/> : busy ? "Reading publisher…" : "Unavailable"}</dd></div>
          <div><dt>Passport Registry</dt><dd><CopyValue value={registry} label="Passport Registry"/><Ext href={`${explorer}/address/${registry}`}>View contract</Ext></dd></div>
          <div><dt>Publication transaction</dt><dd><Ext href={`${explorer}/tx/${tx}`}>Version 2 on Monadscan</Ext><p>Recorded block <code>69236935</code>, chain 10143. Live read block: {published?.publicationBlock ? <code>{published.publicationBlock}</code> : busy ? "checking…" : "unavailable"}</p><p>Signed by the agent wallet through Dynamic and MetaMask.</p></dd></div>
        </dl>
        <div className="version-history"><h3>Version history</h3><ol>
          <li><strong>Version 2</strong><Badge tone="brand">Shown on this page</Badge><span>Oct 8, 2026</span></li>
          <li><strong>Version 1</strong><Badge>Historical</Badge><a href="/passports/agent-2072-v1-historical.json" download>Download JSON <span aria-hidden="true" className="glyph">↓</span></a></li></ol>
          <p>Version 2 links to version 1 through <code>previousVersionHash</code> <code>{p.generation.previousVersionHash.slice(0, 10)}…</code></p></div>
      </div>
    </section>

    <section className="limitations-panel" id="limitations" aria-labelledby="limitations-title">
      <div><h2 id="limitations-title">What this Passport does not prove</h2><p>These statements are part of the hashed payload, so they travel with the record and cannot be dropped without changing the digest.</p></div>
      <ul>{p.limitations.map(l => <li key={l.code}>{l.description}</li>)}</ul>
      <p className="scope-note">Cryptographic integrity and authorized publication do not establish that every source observation is truthful, or that an agent is safe or trustworthy.</p>
      <p className="scope-note">Query scope: direct outgoing transactions for the wallet designated at the recorded identity snapshot. Frozen block range <code>[{p.observationScope.fromBlock}, {p.observationScope.toBlockExclusive})</code>, upper bound excluded.</p>
    </section>

    <details className="raw-data"><summary>Inspect the full Passport JSON</summary><pre tabIndex={0}>{JSON.stringify(artifact, null, 2)}</pre></details>
    <div className="next-step"><div><h2>Same evidence, your decision</h2><p>Apply your own requirements to this agent and one that was never published.</p></div><a className="button" href="/compare">Compare agents</a>
      <Ext className="text-link small" href={repoPath("packages/activity/src/envio.ts")}>Envio ingestion source</Ext></div>
  </Shell>;
}
