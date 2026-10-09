"use client";
import { useEffect, useState } from "react";
import type { Evaluation, ConsumerPolicy } from "../../../../packages/policy/src/index";
type Candidate = { candidateId: string; passport: unknown };
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
const labels = { SATISFIED: "Satisfies your policy", NOT_SATISFIED: "Does not satisfy your policy", INDETERMINATE: "Insufficient evidence" };
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
  return <main>
    <header><a className="brand" href="/">Signal Passport<span>Portable agent history</span></a><a href="/">Wallet & publication workspace</a></header>
    <div className="intro"><p className="eyebrow">INDEPENDENT CONSUMER</p><h1>Compare Agents</h1>
      <p>Signal Passport provides verifiable evidence. You define the policy. No score, ranking, signing or new analysis.</p></div>
    <section className="card"><h2>Two real historical datasets</h2>
      <p>Agent 2072: published Passport version 2. Agent 2: offline Passport version 1, using schema 2.0.0; no verified publication is assumed.</p>
      <p>These are different agents and frozen evidence scopes. A current publication check does not make their historical activity current.</p>
      {candidates.map(c => <details key={c.candidateId}><summary>Inspect {c.candidateId} Passport and evidence</summary><pre>{JSON.stringify(c.passport, null, 2)}</pre></details>)}
    </section>
    <section className="card"><h2>Your evidence policy</h2><p>Example settings demonstrate behavior; they are not financial or safety recommendations.</p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0 }}><legend>Configure requirements</legend>
        <label>Example policy <select defaultValue="modest" onChange={e => update({ ...examples[e.target.value] })}>
          <option value="modest">Modest published evidence</option><option value="local">Local integrity and observed activity</option><option value="strict">Stricter transaction threshold</option>
        </select></label>
        <div className="grid">{fields.map(([key, label]) => <label key={key} className="field">{label}
          <input type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" value={policy[key] ?? ""}
            onChange={e => update({ ...policy, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>)}</div>
        <label className="consent"><input type="checkbox" checked={policy.requireCompleteCoverage ?? false} onChange={e => update({ ...policy, requireCompleteCoverage: e.target.checked })}/>Require complete query coverage</label>
        <label className="consent"><input type="checkbox" checked={policy.requireMonadPublication ?? false} onChange={e => update({ ...policy, requireMonadPublication: e.target.checked })}/>Require verified Monad publication</label>
        <p>Valid local integrity is always required. Blank numeric fields omit a requirement. Numeric checks require complete query coverage.</p>
      </fieldset>
      <button disabled={busy || candidates.length !== 2} onClick={() => void run()}>{busy ? "Verifying and evaluating…" : "Run policy evaluation"}</button>
      <p role="status">{!results && !busy ? "Run evaluation to see results for the current settings." : busy ? "Read-only Monad checks in progress. No wallet signature is needed." : "Results use the policy shown above."}</p>
    </section>
    {error && <p role="alert" className="notice error">{error}</p>}
    {results && <section aria-live="polite"><h2>Criterion-level results</h2>
      <p>Eligible agents: {results.filter(r => r.outcome === "SATISFIED").map(r => `Agent ${r.agentId}`).join(", ") || "None established"}. Multiple eligible agents remain equally eligible.</p>
      <div className="grid">{results.map(r => <article key={r.candidateId} className="card"><h2>Agent {r.agentId ?? "unverified"}</h2>
        <h3>{labels[r.outcome]}</h3><p>Passport version {r.passportVersion ?? "unknown"} · Local integrity: {r.integrity}</p>
        <p className="notice"><strong>{publicationLabels[r.publication.status]}</strong></p>
        <p>Coverage: {r.coverage?.coverageStatus ?? "unavailable"}. Checked block: {"checkedBlock" in r.publication ? r.publication.checkedBlock ?? "unavailable" : "not checked"}.</p>
        <p>Evidence retrieved: {r.retrievedAt ?? "unavailable"}<br/>Passport generated: {r.generatedAt ?? "unavailable"}</p>
        <p>Observed activity dates: {r.observedActivity?.first ?? "unavailable"} to {r.observedActivity?.last ?? "unavailable"}.</p>
        <p>Frozen blocks: [{r.scope?.fromBlock ?? "?"}, {r.scope?.toBlockExclusive ?? "?"}). No freshness requirement is enforced by policy version 1.</p>
        {r.checks.map(c => <div className="field" key={c.criterion}><strong>{criterionLabels[c.criterion] ?? c.criterion} — {c.outcome.replaceAll("_", " ")}</strong><p>{c.reason}</p>
          {c.metricId && <details><summary>Metric and supporting evidence references</summary><p>{c.metricId}; observed {c.actual ?? "unknown"}; required {c.required}</p><pre>{JSON.stringify(c.evidenceIds, null, 2)}</pre></details>}</div>)}
        <details><summary>Scope and limitations</summary><p>{r.scope?.description}</p><ul>{r.limitations.map(l => <li key={l.code}>{l.description}</li>)}</ul><pre>{JSON.stringify(r.scope, null, 2)}</pre></details>
        <details><summary>Full structured result</summary><pre>{JSON.stringify(r, null, 2)}</pre></details>
      </article>)}</div></section>}
    <footer>Transactions are not proof of commerce. Recipient addresses are not independent counterparties. Integrity is not a safety judgment.</footer>
  </main>;
}
