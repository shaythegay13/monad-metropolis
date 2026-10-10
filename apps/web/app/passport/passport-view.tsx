"use client";
import { useCallback, useEffect, useState } from "react";
import artifact from "../../../../fixtures/real/monad-m5/agent-2072-passport-v2.json";
import type { Evaluation } from "../../../../packages/policy/src/index";
import { Shell, Mark, Badge, Arrow, SectionHeading } from "../../components/site";
import { CopyValue } from "../../components/copy-value";
import { dateLabel, publicationLabels, publicationTone, versionLabel } from "../../lib/presentation";
const p = artifact.payload;
const registry = "0x7d9cc86196241485cf1efaf8a96c7819ea95b194";
const explorer = "https://testnet.monadscan.com";
const tx = "0xf4cd39fb5e51c0ac909ba907efbc8189c981342b12441e74df34c802c410bd9d";
function metric(id: string) { return p.metrics.find(m => m.metricId === id)?.value ?? "Unavailable"; }
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
    ["Local integrity", busy ? "Checking artifact integrity…" : result ? result.integrity === "valid" ? "Schema, references & digest match" : "Invalid Passport integrity" : "Check unavailable", result?.integrity === "valid"],
    ["Onchain publication", busy ? "Reading Monad publication…" : v ? publicationLabels[v.status] : "Check unavailable", v?.status === "verified"],
    ["Published hash", busy ? "Comparing the published digest…" : published?.publishedHashMatches === true ? "Matches this exact artifact" : published?.publishedHashMatches === false ? "No matching published hash" : "Not established", published?.publishedHashMatches === true],
    ["Publisher provenance", busy ? "Checking Registry authorization…" : published?.publicationProvenanceVerified ? "Verified under Registry authorization" : "Not established", published?.publicationProvenanceVerified],
    ["Evidence coverage", busy ? "Validating declared scope…" : result?.coverage?.coverageStatus === "complete_for_query" ? "Complete for the declared query" : result?.coverage?.coverageStatus ?? "Check unavailable", result?.coverage?.coverageStatus === "complete_for_query"]
  ] as const;
  return <Shell active="passport"><div className="page-title"><div><p className="eyebrow">EXPLORE / AGENT 2072</p><h1>A record you can<br/><em>look behind.</em></h1><p>Inspect the activity. Verify the publication. Keep the context.</p></div><div className="actions"><a className="button" href="/passports/agent-2072-v2-published.json" download>Download Passport <span aria-hidden="true">↓</span></a><a className="button secondary" href="/compare">Compare agents <Arrow/></a></div></div>
    <div className="passport-layout"><article className="passport-document"><div className="document-ribbon"><Mark/><span>SIGNAL PASSPORT<span>PORTABLE AGENT ACTIVITY RECORD</span></span><span className="document-serial">No. 2072</span></div>
      <div className="document-identity"><div className="agent-symbol" aria-hidden="true">SP<span>2072</span></div><div><p className="eyebrow">ERC-8004 IDENTITY</p><h2>{p.subject.registration.document.name}</h2><p>Agent {p.subject.agentId} <span className="text-divider">/</span> Monad Testnet</p></div></div>
      <div className="document-badges"><Badge tone="brand">{versionLabel(2, latest, busy)}</Badge><Badge>Schema {artifact.schemaVersion}</Badge></div>
      <dl className="identity-fields"><div><dt>Current registry-designated wallet</dt><dd>{wallet ? <CopyValue value={wallet} label="current agent wallet"/> : busy ? "Reading current wallet…" : "Live wallet designation unavailable"}</dd></div><div><dt>Identity Registry</dt><dd><a href={`${explorer}/address/${p.subject.registryAddress}`} target="_blank" rel="noreferrer">ERC-8004 Identity Registry <Arrow/></a></dd></div></dl>
      <div className="document-rule"><span>OBSERVED ACTIVITY</span><span>{dateLabel(String(metric("first_observed_activity_at")))}</span></div>
      <div className="passport-metrics">{[["observed_transaction_count", "Observed transactions"], ["active_utc_days", "Active UTC day"], ["unique_recipient_addresses", "Recipient addresses"]].map(([id, label]) => <div key={id}><strong>{metric(id)}</strong><span>{label}</span></div>)}</div>
      <div className="execution-row"><span><b>{metric("successful_execution_count")}</b> successful executions</span><span><b>{metric("failed_execution_count")}</b> failed executions</span><span><b>{metric("unknown_execution_status_count")}</b> unknown status</span></div>
      <p className="document-caveat">Observed EVM activity does not by itself establish commerce or service delivery.</p>
      <div className="document-seal"><Mark/><div>PORTABLE BY DESIGN<small>Canonical SHA-256 · evidence included</small></div><span>2072 / 002</span></div>
    </article><aside className="verification-panel" aria-label="Independent verification"><div className="section-title"><h2>Independent checks</h2><span className="network-dot">10143</span></div><p>Checked against the artifact and the pinned Monad Registry. No wallet connection needed.</p>
      <div aria-live="polite">{checks.map(([title, description, passed], index) => <div className="verification-item" key={title}><span className={`check-icon ${passed ? "positive" : index === 0 && result?.integrity === "invalid" ? "negative" : index < 4 ? publicationTone(v?.status) : "neutral"}`} aria-hidden="true">{passed ? "✓" : "·"}</span><div><strong>{title}</strong><p>{description}</p></div></div>)}</div>
      {error && <p role="alert" className="notice error">{error}</p>}{stateError && <p role="alert" className="notice error">{stateError}</p>}<button className="secondary full-width" disabled={busy} onClick={() => void verify()}>{busy ? "Checking independently…" : "Verify again ↻"}</button><p className="microcopy" role="status">{busy ? "Reading a fresh, read-only chain snapshot…" : published?.checkedBlock ? `Read-only snapshot · block ${published.checkedBlock}` : "No verified chain snapshot available."}</p><a className="text-link" href="#limitations">What this does not prove <span aria-hidden="true">↓</span></a>
    </aside></div>
    <section className="page-section" id="evidence"><SectionHeading number="01" title="The evidence behind the record." detail="Four real transactions. Every reference inspectable."/><div className="evidence-list">{p.evidence.map((e, i) => <details key={e.evidenceId}><summary><span className="evidence-number">0{i + 1}</span><span><strong>Observed outgoing transaction</strong><small>{dateLabel(e.timestamp)} · block {e.blockNumber}</small></span><Badge tone="positive">{e.status === "success" ? "Executed" : e.status}</Badge><span className="expand-sign" aria-hidden="true">+</span></summary><div className="evidence-detail"><dl><div><dt>Transaction hash</dt><dd><CopyValue value={e.transactionHash} label={`transaction ${i + 1}`}/><a href={`${explorer}/tx/${e.transactionHash}`} target="_blank" rel="noreferrer">View transaction <Arrow/></a></dd></div><div><dt>Recorded timestamp (UTC)</dt><dd>{e.timestamp}</dd></div><div><dt>Recipient address</dt><dd>{e.recipient ? <CopyValue value={e.recipient} label={`recipient ${i + 1}`}/> : "No recipient recorded"}</dd></div><div><dt>Source</dt><dd><a href={e.sourceReference} target="_blank" rel="noreferrer">Envio HyperSync query endpoint <Arrow/></a><p>This source requires an authenticated query; it is not a public transaction viewer.</p></dd></div></dl></div></details>)}</div></section>
    <section className="proof-grid"><div className="card"><p className="eyebrow">02 / PUBLICATION PROOF</p><h2>The exact record on Monad.</h2><dl><div className="field"><dt>Artifact profile hash</dt><dd><CopyValue value={`0x${artifact.integrity.digest}`} label="artifact profile hash"/></dd></div><div className="field"><dt>Published profile hash · live read</dt><dd>{published?.profileHash ? <CopyValue value={published.profileHash} label="published profile hash"/> : busy ? "Reading published hash…" : "Unavailable"}</dd></div><div className="field"><dt>Passport Registry</dt><dd><CopyValue value={registry} label="Passport Registry"/><a href={`${explorer}/address/${registry}`} target="_blank" rel="noreferrer">View contract <Arrow/></a></dd></div><div className="field"><dt>Publisher · live record</dt><dd>{published?.publisher ? <CopyValue value={published.publisher} label="publisher"/> : busy ? "Reading publisher…" : "Unavailable"}</dd></div><div className="field"><dt>Publication</dt><dd><a href={`${explorer}/tx/${tx}`} target="_blank" rel="noreferrer">Version 2 transaction <Arrow/></a><p>Recorded block 69236935 · chain 10143<br/>Live read block: {published?.publicationBlock ?? (busy ? "checking…" : "unavailable")}</p></dd></div></dl></div>
      <div><div className="card"><p className="eyebrow">03 / SCOPE & HISTORY</p><h2>A snapshot, not a lifetime.</h2><p>Observed {dateLabel(String(metric("first_observed_activity_at")))}. Retrieved {dateLabel(p.provenance.retrievedAt)}.</p><dl><div className="field"><dt>Frozen block range</dt><dd>[{p.observationScope.fromBlock}, {p.observationScope.toBlockExclusive}) · upper bound excluded</dd></div><div className="field"><dt>Query scope</dt><dd>Direct outgoing transactions for the wallet designated at the recorded identity snapshot.</dd></div></dl><div className="version-history"><div><strong>Version 2</strong><Badge tone="brand">Featured published record</Badge><span>Oct 8, 2026</span></div><div><strong>Version 1</strong><Badge>Historical</Badge><a href="/passports/agent-2072-v1-historical.json" download>Download historical JSON ↓</a></div></div></div>
      <details className="card raw-data"><summary>Inspect full Passport JSON</summary><pre>{JSON.stringify(artifact, null, 2)}</pre></details></div></section>
    <section className="limitations-panel" id="limitations"><p className="eyebrow">IMPORTANT CONTEXT</p><h2>What this Passport does not prove.</h2><div className="limitations-grid">{p.limitations.map(l => <p key={l.code}>{l.description}</p>)}</div><p>Cryptographic integrity and authorized publication do not establish that every source observation is truthful, or that an agent is safe or trustworthy.</p></section>
    <div className="next-step"><div><span className="eyebrow">NEXT / APPLY YOUR REQUIREMENTS</span><h2>Same evidence. Your decision.</h2></div><a className="button" href="/compare">Compare Agents <Arrow/></a></div>
  </Shell>;
}
