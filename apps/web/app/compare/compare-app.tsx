"use client";
import { useEffect, useRef, useState } from "react";
import type { Evaluation, ConsumerPolicy } from "../../../../packages/policy/src/index";
import { Shell, Badge, Arrow } from "../../components/site";
import { dateLabel, outcomeLabels, publicationTone } from "../../lib/presentation";
import type { AgentPassportBundleV2 } from "../../../../packages/schema/src/agent-passport";
type Candidate = { candidateId: string; passport: AgentPassportBundleV2 };
const examples: Record<string, ConsumerPolicy> = {
  modest: { policyVersion: "1.0.0", minimumObservedTransactions: 2, minimumActiveUtcDays: 1, minimumUniqueRecipientAddresses: 1,
    requireCompleteCoverage: true, requireLocalIntegrity: true, requireMonadPublication: true },
  local: { policyVersion: "1.0.0", minimumObservedTransactions: 2, requireLocalIntegrity: true },
  strict: { policyVersion: "1.0.0", minimumObservedTransactions: 10, requireMonadPublication: true }
};
const fields = [
  ["minimumObservedTransactions", "Minimum observed transactions"],
  ["minimumActiveUtcDays", "Minimum active UTC days within the dataset"],
  ["minimumUniqueRecipientAddresses", "Minimum unique recipient addresses"]
] as const;
const criterionLabels: Record<string, string> = { local_integrity: "Local Passport integrity", complete_coverage: "Complete query coverage",
  monad_publication: "Monad publication", ...Object.fromEntries(fields) };
const publicationLabels: Record<string, string> = {
  verified: "Independently verified Monad publication", not_found: "Confirmed: no publication for this version",
  hash_mismatch: "Published hash does not match", provider_error: "RPC unavailable — publication unknown",
  invalid_registry: "Registry could not be verified", invalid_local: "Invalid Passport", not_checked: "Publication not checked"
};
export default function CompareApp() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [policy, setPolicy] = useState<ConsumerPolicy>(examples.modest);
  const [results, setResults] = useState<Evaluation[]>();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!results) return;
    resultsRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    resultsRef.current?.focus({ preventScroll: true });
  }, [results]);
  useEffect(() => { let active = true;
    fetch("/api/policy", { cache: "no-store" }).then(async r => { if (!r.ok) throw Error(); return r.json(); })
      .then(data => { if (active) setCandidates(data.candidates); }).catch(() => { if (active) setError("Candidate files could not load. Reload to retry."); });
    return () => { active = false; };
  }, []);
  function update(next: ConsumerPolicy) { setPolicy(next); setResults(undefined); setError(""); }
  async function run() {
    setBusy(true); setError(""); setResults(undefined);
    try {
      const response = await fetch("/api/policy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policy, candidates }) });
      const data = await response.json(); if (!response.ok) throw Error(data.error);
      setResults(data.candidates);
    } catch (e) { setError(e instanceof Error ? e.message : "Evaluation unavailable."); }
    finally { setBusy(false); }
  }
  return <Shell active="compare">
    <div className="page-title compare-intro"><div><p className="eyebrow">CONSUMER POLICIES / COMPARE AGENTS</p><h1>Your requirements.<br/><em>Their evidence.</em></h1><p>Two real agents. Different histories. Decide what matters to your application.</p></div><Badge tone="brand">Read-only · no wallet required</Badge></div>
    <section className="policy-editor"><div className="policy-heading"><div><span className="section-number">01</span><h2>Define your requirements</h2></div><span className="microcopy">Examples demonstrate behavior, not safety recommendations.</span></div>
      <fieldset disabled={busy}><legend className="sr-only">Configure requirements</legend>
        <div className="preset-row"><label>Example policy <select defaultValue="modest" onChange={e => update({ ...examples[e.target.value] })}>
          <option value="modest">Modest · published evidence</option><option value="strict">Strict · 10 transactions</option><option value="local">Local integrity · no publication required</option>
        </select></label><p>Choose an example, then make it yours.<br/>Blank thresholds mean no requirement.</p></div>
        <div className="policy-fields">{fields.map(([key, label]) => <label key={key}><span>{label}</span><input type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" value={policy[key] ?? ""}
          onChange={e => update({ ...policy, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>)}</div>
        <div className="policy-switches"><label className="consent"><input type="checkbox" checked={policy.requireCompleteCoverage ?? false} onChange={e => update({ ...policy, requireCompleteCoverage: e.target.checked })}/>Require complete query coverage</label>
        <label className="consent"><input type="checkbox" checked={policy.requireMonadPublication ?? false} onChange={e => update({ ...policy, requireMonadPublication: e.target.checked })}/>Require verified Monad publication</label></div>
      </fieldset>
      <div className="policy-run"><p>Local integrity is always required. Numeric checks require complete query coverage.</p><button disabled={busy || candidates.length !== 2} onClick={() => void run()}>{busy ? "Verifying & evaluating…" : "Evaluate both agents →"}</button></div>
      <p className="microcopy" role="status">{!results && !busy ? "Run evaluation to see results for the current requirements." : busy ? "Independent, read-only Monad checks in progress. No signature needed." : "Results reflect the requirements above. Changing a control clears these results."}</p>
    </section>
    {error && <p role="alert" className="notice error">{error}</p>}
    {results && <div className="results-summary" role="status" tabIndex={-1} ref={resultsRef} aria-label="Evaluation results for selected requirements">
      <div><p className="eyebrow">RESULTS / SELECTED REQUIREMENTS</p><h2>Here is what your policy found.</h2><p>These outcomes apply only to the requirements above.</p></div>
      <div className="summary-outcomes">{candidates.map(c => { const r = results.find(item => item.candidateId === c.candidateId);
        return <div key={c.candidateId}><strong>Agent {c.passport.payload.subject.agentId}</strong><Badge tone={r?.outcome === "SATISFIED" ? "positive" : r?.outcome === "INDETERMINATE" ? "caution" : "neutral"}>{r ? outcomeLabels[r.outcome] : "Result unavailable"}</Badge><code>{r?.outcome ?? "UNKNOWN"}</code></div>;
      })}</div>
    </div>}
    <div className="comparison-heading"><div><span className="section-number">02</span><h2>Inspect the results</h2></div><p>{results ? `Meets these requirements: ${results.filter(r => r.outcome === "SATISFIED").map(r => `Agent ${r.agentId}`).join(", ") || "None established"}` : "Independent verification runs when you evaluate."}</p></div>
    {candidates.length === 0 && <p className="loading-panel" role="status">{error ? "Candidate data unavailable." : "Loading real Passport artifacts…"}</p>}
    <div className="comparison-cards" aria-live="polite">{candidates.map(c => {
      const r = results?.find(r => r.candidateId === c.candidateId), p = c.passport.payload;
      const m = (id: string) => p.metrics.find(m => m.metricId === id)?.value ?? "Unavailable";
      const good = r?.outcome === "SATISFIED";
      return <article key={c.candidateId} className="candidate-card"><div className="candidate-top"><div className={`candidate-avatar ${p.subject.agentId === "2" ? "alternate" : ""}`} aria-hidden="true">{p.subject.agentId === "2" ? "02" : "SP"}</div><div><p className="eyebrow">ERC-8004 / {p.subject.agentId}</p><h2>Agent {p.subject.agentId}</h2><p>Passport version {p.generation.passportVersion} · schema {c.passport.schemaVersion}</p></div></div>
        <div className="candidate-verification"><Badge tone={publicationTone(r?.publication.status)}>{r ? publicationLabels[r.publication.status] : "Publication not checked in this session"}</Badge><p>Local integrity: <strong>{r?.integrity ?? "not checked in this session"}</strong></p></div>
        <div className="preview-metrics"><div><strong>{m("observed_transaction_count")}</strong><span>Transactions</span></div><div><strong>{m("active_utc_days")}</strong><span>Active UTC day</span></div><div><strong>{m("unique_recipient_addresses")}</strong><span>Recipients</span></div></div>
        <div className="candidate-scope"><span>ACTIVITY OBSERVED</span><strong>{dateLabel(String(m("first_observed_activity_at")))} – {dateLabel(String(m("last_observed_activity_at")))}</strong><p>Artifact declares: {p.coverage.coverageStatus.replaceAll("_", " ")}. Different frozen scopes; no freshness requirement.</p></div>
        <div className={`decision ${r ? good ? "positive" : r.outcome === "INDETERMINATE" ? "caution" : "neutral" : "pending"}`}><span aria-hidden="true">{r ? good ? "✓" : "—" : "·"}</span><div><strong>{r ? outcomeLabels[r.outcome] : "Ready for your policy"}</strong><small>{r?.outcome ?? "NOT EVALUATED"}</small></div></div>
        {r && <div className="criteria-list">{r.checks.map(check => <details key={check.criterion}><summary><span>{criterionLabels[check.criterion] ?? check.criterion}</span><span className={`criterion-status ${check.outcome.toLowerCase()}`}>{check.outcome === "INSUFFICIENT_EVIDENCE" ? "Unknown" : check.outcome === "PASS" ? "Pass" : "Not met"}</span></summary><p>{check.reason}</p>{check.metricId && <><p><code>{check.metricId}</code> · observed {check.actual ?? "unknown"} / minimum {check.required}</p><pre>{JSON.stringify(check.evidenceIds, null, 2)}</pre></>}</details>)}</div>}
        <details className="candidate-details"><summary>Evidence, coverage & limitations</summary><p>Retrieved {dateLabel(p.provenance.retrievedAt)} · generated {dateLabel(p.generation.generatedAt)}.</p><p>Blocks [{p.observationScope.fromBlock}, {p.observationScope.toBlockExclusive}). Current wallet designation is not proof of historical ownership.</p><ul>{p.limitations.map(l => <li key={l.code}>{l.description}</li>)}</ul>{r && <p>Publication checked at block {"checkedBlock" in r.publication ? r.publication.checkedBlock ?? "unavailable" : "not checked"}.</p>}</details>
        <details className="candidate-details"><summary>Inspect Passport JSON</summary><pre>{JSON.stringify(c.passport, null, 2)}</pre></details>
        {r && <details className="candidate-details"><summary>Structured policy result</summary><pre>{JSON.stringify(r, null, 2)}</pre></details>}
      </article>;
    })}</div>
    <div className="comparison-note"><span aria-hidden="true">↔</span><div><strong>Eligibility is contextual. It is not a ranking.</strong><p>Multiple qualifying agents remain equally eligible. Not meeting a requirement does not mean an agent is malicious or unsafe. Transaction counts do not establish commerce.</p></div></div>
    <div className="next-step"><div><p className="eyebrow">NEXT / BUILD WITH THE EVIDENCE</p><h2>Bring your own policy.</h2></div><a className="button secondary" href="/developers">Developer guide <Arrow/></a></div>
  </Shell>;
}
