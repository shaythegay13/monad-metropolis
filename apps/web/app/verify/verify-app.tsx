"use client";
import { useCallback, useEffect, useState } from "react";
import type { ConsumerPolicy, Evaluation } from "../../../../packages/policy/src/index";
import { Shell, Badge, Ext, type Tone } from "../../components/site";
import { outcomeLabels, publicationTone } from "../../lib/presentation";

type Lookup = { agentId: string; owner: string; agentWallet: string | null; agentWalletStatus: string; agentUriKind: string;
  registration: { status: string; name: string | null; description: string | null; warnings: string[] }; resolvedAtBlock: string;
  publication: { latestVersion: string; nextVersion: string; listedVersionsTruncated: boolean;
    versions: { version: string; profileHash: string; contentUri: string; publisher: string; blockNumber: string; publisherIsCurrentWallet: boolean }[] } };
type Association = { status: "checked"; currentOwner: string; currentWallet: string; ownerMatchesArtifact: boolean; walletMatchesArtifact: boolean; uriMatchesArtifact: boolean } | { status: "unavailable" };
type Result = { candidateId: string; local: { schemaValid: boolean; referencesValid: boolean; digestMatches: boolean; errors: string[] };
  subject: { agentId: string; version: number; digest: string } | null; evaluation: Evaluation; association: Association | null };
const explorer = "https://testnet.monadscan.com";
const criterionNames: Record<string, string> = { local_integrity: "Local integrity", complete_coverage: "Complete coverage", monad_publication: "Monad publication",
  minimumObservedTransactions: "Minimum observed transactions", minimumActiveUtcDays: "Minimum active UTC days", minimumUniqueRecipientAddresses: "Minimum recipient addresses" };
const short = (v: string) => `${v.slice(0, 10)}…${v.slice(-6)}`;
const presets: Record<string, ConsumerPolicy> = {
  published: { policyVersion: "1.0.0", minimumObservedTransactions: 1, requireCompleteCoverage: true, requireMonadPublication: true },
  local: { policyVersion: "1.0.0", requireLocalIntegrity: true },
  modest: { policyVersion: "1.0.0", minimumObservedTransactions: 2, minimumActiveUtcDays: 1, minimumUniqueRecipientAddresses: 1, requireCompleteCoverage: true, requireMonadPublication: true }
};
const fields = [["minimumObservedTransactions", "Minimum observed transactions"], ["minimumActiveUtcDays", "Minimum active UTC days"],
  ["minimumUniqueRecipientAddresses", "Minimum recipient addresses"]] as const;
const publicationText: Record<string, string> = { verified: "Published on Monad; digest matches this file", not_found: "No publication for this agent and version",
  hash_mismatch: "Published digest differs from this file", provider_error: "Monad read failed — publication unknown",
  invalid_registry: "Registry could not be verified", not_checked: "Not checked (file failed integrity)", invalid_local: "Not checked (file failed integrity)" };
async function json(response: Response) { const body = await response.json().catch(() => ({})); if (!response.ok) throw Error(body.error ?? "Request failed."); return body; }

export default function VerifyApp() {
  const [agentId, setAgentId] = useState(""); const [lookup, setLookup] = useState<Lookup>(); const [lookupError, setLookupError] = useState("");
  const [looking, setLooking] = useState(false);
  const [file, setFile] = useState<{ name: string; passport: unknown }>(); const [fileError, setFileError] = useState("");
  const [policy, setPolicy] = useState<ConsumerPolicy>(presets.published); const [result, setResult] = useState<Result>();
  const [verifying, setVerifying] = useState(false); const [verifyError, setVerifyError] = useState("");
  const look = useCallback(async (id: string) => {
    setLooking(true); setLookupError(""); setLookup(undefined);
    try { setLookup(await json(await fetch(`/api/agents/${encodeURIComponent(id.trim())}`, { cache: "no-store" }))); }
    catch (e) { setLookupError((e as Error).message); } finally { setLooking(false); }
  }, []);
  useEffect(() => { const id = new URLSearchParams(window.location.search).get("agent");
    if (id && /^\d{1,31}$/.test(id)) { setAgentId(id); void look(id); } }, [look]);
  async function readFile(f: File | undefined) {
    setFileError(""); setResult(undefined); setVerifyError("");
    if (!f) return;
    if (f.size > 512 * 1024) { setFile(undefined); setFileError("That file is larger than 512 KB, the Passport size limit."); return; }
    try { setFile({ name: f.name, passport: JSON.parse(await f.text()) }); } catch { setFile(undefined); setFileError("That file is not valid JSON."); }
  }
  async function useSample() {
    setFileError(""); setResult(undefined);
    const passport = await fetch("/passports/agent-2072-v2-published.json").then(r => r.json());
    setFile({ name: "agent-2072-v2-published.json (sample)", passport });
  }
  function update(next: ConsumerPolicy) { setPolicy(next); setResult(undefined); }
  async function verify() {
    if (!file) return; setVerifying(true); setVerifyError(""); setResult(undefined);
    try { const body = await json(await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy, candidates: [{ candidateId: "submitted", passport: file.passport }] }) }));
      setResult(body.results[0]); }
    catch (e) { setVerifyError((e as Error).message); } finally { setVerifying(false); }
  }
  const pub = result?.evaluation.publication; const published = pub && "publicationFound" in pub ? pub : undefined;
  const checks: [string, Tone, string][] = result ? [
    ["Schema", result.local.schemaValid ? "positive" : "negative", result.local.schemaValid ? "Valid Passport v2 structure" : "Not a valid Passport v2 file"],
    ["Evidence references", result.local.referencesValid ? "positive" : "negative", result.local.referencesValid ? "Every metric and observation points to included evidence" : "References disagree"],
    ["Canonical digest", result.local.digestMatches ? "positive" : "negative", result.local.digestMatches ? `Matches: ${short(result.subject?.digest ?? "")}` : "Recomputed digest does not match the file"],
    ["Registry publication", publicationTone(pub?.status) === "neutral" && pub?.status === "not_found" ? "neutral" : publicationTone(pub?.status) === "neutral" ? "caution" : publicationTone(pub?.status),
      publicationText[pub?.status ?? "not_checked"] + (published?.publicationBlock ? ` (block ${published.publicationBlock})` : "")],
    ["Current identity", !result.association ? "caution" : result.association.status === "unavailable" ? "caution"
      : result.association.walletMatchesArtifact && result.association.ownerMatchesArtifact ? "positive" : "neutral",
      !result.association ? "Not checked (file failed integrity)" : result.association.status === "unavailable" ? "Could not read the current ERC-8004 record"
      : result.association.walletMatchesArtifact && result.association.ownerMatchesArtifact ? "Current owner and agentWallet match the file"
      : "Current owner or agentWallet differs from the file (historical publication can still be valid)"]
  ] : [];
  return <Shell active="verify">
    <div className="page-head"><div><h1>Verify any agent</h1><p className="lede">Look up a Monad Testnet ERC-8004 agent, see its Signal Passport publications, and check a Passport file yourself. No wallet needed.</p></div></div>

    <section className="wallet-section" aria-labelledby="lookup-title"><h2 id="lookup-title">Look up an agent</h2>
      <form className="lookup-form" onSubmit={e => { e.preventDefault(); if (agentId.trim()) void look(agentId); }}>
        <label className="field"><span>ERC-8004 agent ID</span><input inputMode="numeric" pattern="[0-9]*" maxLength={31} value={agentId} onChange={e => setAgentId(e.target.value.replace(/\D/g, ""))} placeholder="for example 2072" /></label>
        <button disabled={looking || !agentId}>{looking ? "Reading Monad…" : "Look up"}</button></form>
      {lookupError && <p className="notice error" role="alert">{lookupError}</p>}
      {lookup && <div className="lookup-result" aria-live="polite">
        <dl className="record-fields">
          <div><dt>Agent</dt><dd><strong>{lookup.registration.name ?? `Agent ${lookup.agentId}`}</strong> · ID {lookup.agentId} · registration {lookup.registration.status.replaceAll("_", " ")}</dd></div>
          <div><dt>Owner</dt><dd><code className="break">{lookup.owner}</code></dd></div>
          <div><dt>Registry-designated agentWallet</dt><dd>{lookup.agentWallet ? <code className="break">{lookup.agentWallet}</code> : "Not set — this agent cannot publish a Passport"}</dd></div>
          <div><dt>Read at block</dt><dd><code>{lookup.resolvedAtBlock}</code></dd></div></dl>
        <h3 className="table-title">Signal Passport publications</h3>
        {lookup.publication.versions.length === 0 ? <p className="notice">No Signal Passport has been published for this agent. That is not evidence about the agent either way.</p>
          : <div className="table-wrap" role="region" aria-label="Publication history" tabIndex={0}><table><thead><tr><th scope="col">Version</th><th scope="col">Digest</th><th scope="col">Publisher</th><th scope="col">Block</th><th scope="col">Content URI</th></tr></thead>
            <tbody>{lookup.publication.versions.map(v => <tr key={v.version}><td>{v.version}</td><td><code>{short(v.profileHash)}</code></td>
              <td><code>{short(v.publisher)}</code>{v.publisherIsCurrentWallet ? "" : <small> (not the current wallet)</small>}</td><td><code>{v.blockNumber}</code></td>
              <td>{v.contentUri ? <code className="break">{v.contentUri}</code> : <span className="muted">Empty — ask the agent for the file</span>}</td></tr>)}</tbody></table></div>}
        <p className="microcopy">The Registry stores each version's digest, not the file. To check a Passport's contents, verify the file below.</p>
      </div>}
    </section>

    <section className="wallet-section publish-section" aria-labelledby="file-title"><h2 id="file-title">Verify a Passport file</h2>
      <div className="verify-grid"><div>
        <label className="field"><span>Passport JSON file (up to 512 KB)</span><input type="file" accept="application/json,.json" onChange={e => void readFile(e.target.files?.[0])} /></label>
        <p className="microcopy">Nothing is stored. <button type="button" className="secondary small" onClick={() => void useSample()}>Use Agent 2072's published file</button></p>
        {file && <p className="notice">Loaded <strong>{file.name}</strong></p>}
        {fileError && <p className="notice error" role="alert">{fileError}</p>}
      </div>
      <fieldset className="policy-mini" disabled={verifying}><legend>Your requirements</legend>
        <label className="field"><span>Start from</span><select defaultValue="published" onChange={e => update({ ...presets[e.target.value] })}>
          <option value="published">Published, at least 1 transaction</option><option value="modest">Modest, published evidence</option><option value="local">Local integrity only</option></select></label>
        {fields.map(([key, label]) => <label className="field" key={key}><span>{label}</span><input type="number" min="0" step="1" value={policy[key] ?? ""}
          onChange={e => update({ ...policy, [key]: e.target.value === "" ? undefined : Number(e.target.value) })} /></label>)}
        <label className="switch"><input type="checkbox" checked={policy.requireCompleteCoverage ?? false} onChange={e => update({ ...policy, requireCompleteCoverage: e.target.checked })} /><span>Require complete query coverage</span></label>
        <label className="switch"><input type="checkbox" checked={policy.requireMonadPublication ?? false} onChange={e => update({ ...policy, requireMonadPublication: e.target.checked })} /><span>Require verified Monad publication</span></label>
      </fieldset></div>
      <button disabled={!file || verifying} onClick={() => void verify()}>{verifying ? "Verifying against Monad…" : "Verify file"}</button>
      {verifyError && <p className="notice error" role="alert">{verifyError}</p>}
      {result && <div className="verify-result" aria-live="polite">
        <p className="head-status"><Badge tone={result.evaluation.outcome === "SATISFIED" ? "positive" : result.evaluation.outcome === "INDETERMINATE" ? "caution" : "neutral"}>{outcomeLabels[result.evaluation.outcome]}</Badge>
          <code>{result.evaluation.outcome}</code>{result.subject && <span>Agent {result.subject.agentId}, Passport version {result.subject.version}</span>}</p>
        <ol className="check-list">{checks.map(([title, tone, text]) => <li key={title} className={`check ${tone}`}><span className="check-mark" aria-hidden="true">{tone === "positive" ? "✓" : tone === "negative" ? "✕" : "–"}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        <h3 className="table-title">Your requirements, criterion by criterion</h3>
        <ul className="criteria">{result.evaluation.checks.map(c => <li key={c.criterion}><Badge tone={c.outcome === "PASS" ? "positive" : c.outcome === "FAIL" ? "neutral" : "caution"}>{c.outcome === "PASS" ? "Pass" : c.outcome === "FAIL" ? "Not met" : "Unknown"}</Badge> <strong>{criterionNames[c.criterion] ?? c.criterion}</strong> — {c.reason}</li>)}</ul>
        {result.local.errors.length > 0 && <p className="notice error">Integrity problems: {result.local.errors.join("; ")}</p>}
        {result.subject && <p className="microcopy"><a href={`/verify?agent=${result.subject.agentId}`} onClick={() => setTimeout(() => void look(result.subject!.agentId), 0)}>Look up agent {result.subject.agentId}</a>{published?.publicationBlock && <> · <Ext href={`${explorer}/address/0x7d9cc86196241485cf1efaf8a96c7819ea95b194`}>Registry on Monadscan</Ext></>}</p>}
      </div>}
    </section>
  </Shell>;
}
