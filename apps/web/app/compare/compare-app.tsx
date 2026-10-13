"use client";
import { useEffect, useRef, useState } from "react";
import type { Evaluation, ConsumerPolicy } from "../../../../packages/policy/src/index";
import { Shell, Badge, type Tone } from "../../components/site";
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
const outcomeTone = (o?: Evaluation["outcome"]): Tone => o === "SATISFIED" ? "positive" : o === "INDETERMINATE" ? "caution" : o ? "neutral" : "pending";
const checkTone: Record<string, Tone> = { PASS: "positive", FAIL: "neutral", INSUFFICIENT_EVIDENCE: "caution" };
const checkLabel: Record<string, string> = { PASS: "Pass", FAIL: "Not met", INSUFFICIENT_EVIDENCE: "Unknown" };
const DiffTag = () => <span className="diff-tag">Differs</span>;
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
  const resultFor = (c: Candidate) => results?.find(item => item.candidateId === c.candidateId);
  const criteria = results ? [...new Set(results.flatMap(r => r.checks.map(c => c.criterion)))] : [];
  const m = (c: Candidate, id: string) => c.passport.payload.metrics.find(x => x.metricId === id)?.value ?? "Unavailable";
  const differs = (read: (c: Candidate) => string | undefined) => Boolean(results) && candidates.length === 2 && read(candidates[0]) !== read(candidates[1]);
  const satisfied = results?.filter(r => r.outcome === "SATISFIED").map(r => `Agent ${r.agentId}`) ?? [];
  return <Shell active="compare">
    <div className="page-head"><div><h1>Compare agents against your requirements</h1>
      <p className="lede">Two real Passports. Both carry valid local evidence; only one was published on Monad. Decide what your application needs, then evaluate both.</p></div>
      <div className="head-actions"><button disabled={busy || candidates.length !== 2} onClick={() => void run()}>{busy ? "Verifying and evaluating…" : "Evaluate both agents"}</button>
        <p className="head-note">Read-only. Starts with the default example policy below. Verification runs on the server against Monad; no wallet or signature.</p></div></div>

    <div className="compare-layout">
      <section className="policy-editor" aria-labelledby="policy-title">
        <h2 id="policy-title">Your requirements</h2>
        <fieldset disabled={busy}><legend className="sr-only">Configure requirements</legend>
          <label className="field"><span>Start from an example</span><select defaultValue="modest" onChange={e => update({ ...examples[e.target.value] })}>
            <option value="modest">Modest, published evidence</option><option value="strict">Strict, 10 transactions</option><option value="local">Local integrity, no publication required</option>
          </select><small>Examples demonstrate behavior, not safety recommendations.</small></label>
          <div className="policy-fields">{fields.map(([key, label]) => <label className="field" key={key}><span>{label}</span><input type="number" inputMode="numeric" min="0" max={Number.MAX_SAFE_INTEGER} step="1" value={policy[key] ?? ""}
            onChange={e => update({ ...policy, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>)}
            <p className="field-hint">Leave a threshold blank for no requirement. Numeric checks require complete query coverage.</p></div>
          <div className="policy-switches">
            <label className="switch locked"><input type="checkbox" checked readOnly aria-describedby="integrity-note" disabled/><span>Local Passport integrity<small id="integrity-note">Always required</small></span></label>
            <label className="switch"><input type="checkbox" checked={policy.requireCompleteCoverage ?? false} onChange={e => update({ ...policy, requireCompleteCoverage: e.target.checked })}/><span>Require complete query coverage</span></label>
            <label className="switch"><input type="checkbox" checked={policy.requireMonadPublication ?? false} onChange={e => update({ ...policy, requireMonadPublication: e.target.checked })}/><span>Require verified Monad publication</span></label></div>
        </fieldset>
        <button className="full-width" disabled={busy || candidates.length !== 2} onClick={() => void run()}>{busy ? "Verifying and evaluating…" : "Evaluate both agents"}</button>
        <p className="microcopy" role="status">{!results && !busy ? "Run evaluation to see results for the current requirements." : busy ? "Independent, read-only Monad checks in progress. No signature needed." : "Results reflect the requirements above. Changing a control clears them."}</p>
      </section>

      <section className="comparison" aria-labelledby="comparison-title">
        <h2 id="comparison-title" className="sr-only">Comparison</h2>
        {error && <p role="alert" className="notice error">{error}</p>}
        <div className={`outcome-strip ${results ? "evaluated" : ""}`} role="status" tabIndex={-1} ref={resultsRef} aria-label={results ? "Evaluation results for selected requirements" : undefined}>
          {results ? <><p>{satisfied.length === 0 ? <><strong>Neither agent</strong> meets these requirements.</> : <><strong>{satisfied.join(" and ")}</strong> {satisfied.length === 1 ? "meets" : "meet"} these requirements.</>} Each result applies only to the policy on the left.</p>
            <div className="outcomes">{candidates.map(c => { const r = resultFor(c);
              return <div key={c.candidateId}><span>Agent {c.passport.payload.subject.agentId}</span><Badge tone={outcomeTone(r?.outcome)}>{r ? outcomeLabels[r.outcome] : "Result unavailable"}</Badge><code>{r?.outcome ?? "UNKNOWN"}</code></div>; })}</div></>
            : <p>{busy ? "Verifying both Passports against Monad…" : candidates.length ? "Not evaluated yet. Set your requirements, then evaluate both agents." : error ? "Candidate data unavailable." : "Loading real Passport artifacts…"}</p>}
        </div>
        {candidates.length > 0 && <div className="matrix-wrap"><table className="matrix" aria-live="polite">
          <caption className="sr-only">Evidence, verification and criterion results for both agents</caption>
          <thead><tr><td/>{candidates.map(c => { const p = c.passport.payload;
            return <th scope="col" key={c.candidateId}><span className={`agent-chip ${p.subject.agentId === "2" ? "alt" : ""}`} aria-hidden="true">{p.subject.agentId === "2" ? "02" : "SP"}</span>
              <span className="agent-name">Agent {p.subject.agentId}</span><span className="agent-sub">Passport v{p.generation.passportVersion}, schema {c.passport.schemaVersion}</span></th>; })}</tr></thead>
          <tbody><tr className="group"><th scope="rowgroup" colSpan={3}>Evidence in each Passport</th></tr>
            {[["observed_transaction_count", "Observed transactions"], ["active_utc_days", "Active UTC days"], ["unique_recipient_addresses", "Recipient addresses"]].map(([id, label]) =>
              <tr key={id}><th scope="row">{label}</th>{candidates.map(c => <td key={c.candidateId} className="num">{m(c, id)}</td>)}</tr>)}
            <tr><th scope="row">Activity observed</th>{candidates.map(c => <td key={c.candidateId}>{dateLabel(String(m(c, "first_observed_activity_at")))} to {dateLabel(String(m(c, "last_observed_activity_at")))}</td>)}</tr>
            <tr><th scope="row">Declared coverage</th>{candidates.map(c => <td key={c.candidateId}>{c.passport.payload.coverage.coverageStatus.replaceAll("_", " ")}<small>Blocks [{c.passport.payload.observationScope.fromBlock}, {c.passport.payload.observationScope.toBlockExclusive})</small></td>)}</tr>
          </tbody>
          <tbody><tr className="group"><th scope="rowgroup" colSpan={3}>Independent verification</th></tr>
            <tr><th scope="row">Local integrity</th>{candidates.map(c => { const r = resultFor(c); return <td key={c.candidateId}>{r ? <Badge tone={r.integrity === "valid" ? "positive" : "negative"}>{r.integrity === "valid" ? "Valid" : "Invalid"}</Badge> : <span className="muted">Not checked in this session</span>}</td>; })}</tr>
            <tr className={differs(c => resultFor(c)?.publication.status) ? "differs" : undefined}><th scope="row">Monad publication{differs(c => resultFor(c)?.publication.status) && <DiffTag/>}</th>{candidates.map(c => { const r = resultFor(c); return <td key={c.candidateId}>{r ? <><Badge tone={publicationTone(r.publication.status)}>{publicationLabels[r.publication.status]}</Badge><small>Checked at block {"checkedBlock" in r.publication ? r.publication.checkedBlock ?? "unavailable" : "not checked"}</small></> : <span className="muted">Not checked in this session</span>}</td>; })}</tr>
          </tbody>
          <tbody><tr className="group"><th scope="rowgroup" colSpan={3}>Your requirements</th></tr>
            {results ? criteria.map(criterion => <tr key={criterion} className={differs(c => resultFor(c)?.checks.find(x => x.criterion === criterion)?.outcome) ? "criterion differs" : "criterion"}><th scope="row">{criterionLabels[criterion] ?? criterion}{differs(c => resultFor(c)?.checks.find(x => x.criterion === criterion)?.outcome) && <DiffTag/>}</th>{candidates.map(c => { const check = resultFor(c)?.checks.find(x => x.criterion === criterion);
              return <td key={c.candidateId}>{check ? <><Badge tone={checkTone[check.outcome]}>{checkLabel[check.outcome]}</Badge>{check.metricId && <span className="observed">observed {check.actual ?? "unknown"}, minimum {check.required}</span>}<small>{check.reason}</small></> : <span className="muted">Not applicable</span>}</td>; })}</tr>)
              : <tr><th scope="row">Criteria</th><td colSpan={2} className="muted">{busy ? "Evaluating…" : "Each requirement is checked here after you evaluate."}</td></tr>}
          </tbody>
          <tfoot><tr><th scope="row">Outcome</th>{candidates.map(c => { const r = resultFor(c); return <td key={c.candidateId}><Badge tone={outcomeTone(r?.outcome)}>{r ? outcomeLabels[r.outcome] : "Ready for your policy"}</Badge><code>{r?.outcome ?? "NOT EVALUATED"}</code></td>; })}</tr></tfoot>
        </table></div>}
        {candidates.length > 0 && <div className="candidate-details-grid">{candidates.map(c => { const r = resultFor(c), p = c.passport.payload;
          return <div key={c.candidateId} className="candidate-more"><h3>Agent {p.subject.agentId} in detail</h3>
            <details><summary>Evidence, coverage and limitations</summary><p>Retrieved {dateLabel(p.provenance.retrievedAt)}, generated {dateLabel(p.generation.generatedAt)}.</p><p>Blocks [{p.observationScope.fromBlock}, {p.observationScope.toBlockExclusive}). Current wallet designation is not proof of historical ownership.</p><ul>{p.limitations.map(l => <li key={l.code}>{l.description}</li>)}</ul>{r && <p>Publication checked at block {"checkedBlock" in r.publication ? r.publication.checkedBlock ?? "unavailable" : "not checked"}.</p>}</details>
            {r && r.checks.some(check => check.metricId) && <details><summary>Evidence IDs behind each metric check</summary>{r.checks.filter(check => check.metricId).map(check => <div key={check.criterion}><p><code>{check.metricId}</code></p><pre tabIndex={0}>{JSON.stringify(check.evidenceIds, null, 2)}</pre></div>)}</details>}
            <details><summary>Inspect Passport JSON</summary><pre tabIndex={0}>{JSON.stringify(c.passport, null, 2)}</pre></details>
            {r && <details><summary>Structured policy result</summary><pre tabIndex={0}>{JSON.stringify(r, null, 2)}</pre></details>}</div>; })}</div>}
        <aside className="comparison-note"><strong>Eligibility is contextual. It is not a ranking.</strong><p>Multiple qualifying agents remain equally eligible. Not meeting a requirement does not mean an agent is malicious or unsafe. Transaction counts do not establish commerce.</p></aside>
      </section>
    </div>
    <div className="next-step"><div><h2>Bring your own policy</h2><p>The same verifier and policy engine run in your code, with your trust root.</p></div><a className="button secondary" href="/developers">Developer guide</a></div>
  </Shell>;
}
