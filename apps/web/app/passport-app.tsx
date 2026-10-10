"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DynamicContextProvider, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum-core";
import { MetaMaskEvmWalletConnectors } from "@dynamic-labs-connectors/metamask-evm";
import { formatEther } from "viem";
import { AGENT_ID, CHAIN_ID, REGISTRY, EXPLORER, V1_TRANSACTION, dynamicNetwork, monadChain } from "../../../packages/web/src/config";
import { walletAuthorization, authorizationText, walletError } from "../../../packages/web/src/wallet";
import type { AgentPassportBundleV2 } from "../../../packages/schema/src/agent-passport";
import type { PublicationVerification } from "../../../packages/publication/src/verify";
import type { UnsignedPublication } from "../../../packages/web/src/publication";

type View = { bundle: AgentPassportBundleV2; verification?: PublicationVerification; agentWallet?: string; latest?: string; network?: string; publicReadOnly?: boolean };
type Prepared = { bundle: AgentPassportBundleV2; transaction: UnsignedPublication };
type Confirmation = { state: "pending" | "reverted" | "unverified" | "confirmed"; receipt?: Record<string, string>; verification?: PublicationVerification };
type Pending = { bundle: AgentPassportBundleV2; hash: string };
const recoveryKey = "signal-passport-monad:2072:v2:pending";
async function post<T>(body: unknown): Promise<T> {
  const response = await fetch("/api/passport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Server request failed. No publication is confirmed.");
  return data;
}
function download(bundle: AgentPassportBundleV2) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = `agent-2072-passport-v${bundle.payload.generation.passportVersion}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="field"><dt>{label}</dt><dd>{children}</dd></div>;
}
const verdicts = { verified: "Published hash matches this Passport", invalid_local: "Invalid local Passport integrity",
  not_found: "No publication found for this version", hash_mismatch: "Published hash does not match",
  provider_error: "RPC verification unavailable — publication unknown", invalid_registry: "Registry identity or bytecode does not match" };

function Workspace() {
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const [view, setView] = useState<View>(); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); const [walletMessage, setWalletMessage] = useState("");
  const [chain, setChain] = useState<number>(); const [prepared, setPrepared] = useState<Prepared>();
  const [pending, setPending] = useState<Pending>(); const [confirmation, setConfirmation] = useState<Confirmation>();
  const [busy, setBusy] = useState(""); const [reviewed, setReviewed] = useState(false);
  const sendLock = useRef(false); const walletRef = useRef(primaryWallet); walletRef.current = primaryWallet;
  const address = primaryWallet?.address;
  const isEvm = Boolean(primaryWallet && isEthereumWallet(primaryWallet));
  const authorization = walletAuthorization(address, isEvm, chain, view?.agentWallet);
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/passport", { cache: "no-store" }); const next = await response.json(); setView(next);
      if (!response.ok) setError(next.error); }
    catch { setError("Cannot reach the verification server. Publication is unknown."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh();
    try { const stored = JSON.parse(localStorage.getItem(recoveryKey) ?? "null");
      if (stored && /^0x[0-9a-f]{64}$/i.test(stored.hash) && stored.bundle?.payload?.generation?.passportVersion === 2 &&
        /^[0-9a-f]{64}$/.test(stored.bundle?.integrity?.digest)) setPending(stored); } catch { /* Recovery is optional. */ }
  }, [refresh]);
  useEffect(() => {
    let active = true;
    setChain(undefined); setReviewed(false);
    async function readNetwork() {
      try { const network = primaryWallet && isEthereumWallet(primaryWallet) ? Number(await primaryWallet.getNetwork()) : undefined;
        if (active) setChain(network); }
      catch { if (active) setChain(undefined); }
    }
    void readNetwork(); const timer = setInterval(readNetwork, 2000);
    return () => { active = false; clearInterval(timer); };
  }, [primaryWallet, address]);
  const checkReceipt = useCallback(async (submission: Pending) => {
    try { const result = await post<Confirmation>({ action: "confirm", ...submission }); setConfirmation(result);
      if (result.state === "confirmed") { setError(""); void refresh(); }
      if (result.state === "reverted") setError("Transaction reverted. No successful version 2 publication is confirmed.");
      return result.state;
    } catch (e) { setError((e as Error).message); return "unverified"; }
  }, [refresh]);
  useEffect(() => {
    if (!pending) return;
    let stopped = false; let timer: ReturnType<typeof setTimeout>; let attempts = 0;
    async function poll() {
      const state = await checkReceipt(pending!);
      if (!stopped && state !== "confirmed" && state !== "reverted" && ++attempts < 40) timer = setTimeout(poll, 3000);
    }
    void poll(); return () => { stopped = true; clearTimeout(timer); };
  }, [pending, checkReceipt]);
  async function prepareNext() {
    if (authorization !== "authorized" || !address || pending || busy) return;
    setBusy("Preparing frozen Envio evidence…"); setError(""); setPrepared(undefined); setReviewed(false);
    try { setPrepared(await post<Prepared>({ action: "prepare", address, chain })); }
    catch (e) { setError((e as Error).message); } finally { setBusy(""); }
  }
  async function publish() {
    // The only signing call is in this explicit click handler. No effect can submit.
    if (sendLock.current || pending || !prepared || !reviewed || authorization !== "authorized") return;
    const wallet = primaryWallet;
    if (!wallet || !isEthereumWallet(wallet)) return;
    sendLock.current = true; setBusy("Rechecking wallet and publication…"); setError("");
    let requestedSignature = false;
    try {
      const client = await wallet.getWalletClient();
      const accounts = await client.getAddresses(); const currentChain = await client.getChainId();
      if (walletAuthorization(accounts[0], true, currentChain, view?.agentWallet) !== "authorized" ||
        walletRef.current?.address.toLowerCase() !== wallet.address.toLowerCase()) throw new Error("Wallet changed or disconnected. Reconnect and review again.");
      const tx = await post<UnsignedPublication>({ action: "preflight", bundle: prepared.bundle, address: accounts[0], chain: currentChain });
      if (tx.data !== prepared.transaction.data || tx.to !== REGISTRY || tx.chainId !== CHAIN_ID || tx.from !== accounts[0].toLowerCase()) throw new Error("Publication details changed. Prepare again.");
      if (BigInt(tx.maxFeeWei) > BigInt(prepared.transaction.maxFeeWei)) {
        setPrepared({ ...prepared, transaction: tx }); setReviewed(false); throw new Error("Anticipated fee increased. Review the updated fee before publishing.");
      }
      if (await client.getChainId() !== CHAIN_ID || walletRef.current?.address.toLowerCase() !== tx.from ||
        (await client.getAddresses())[0]?.toLowerCase() !== tx.from) throw new Error("Wallet account or network changed. Review again.");
      setBusy("Confirm the transaction in MetaMask…"); requestedSignature = true;
      const hash = await client.sendTransaction({ account: tx.from as `0x${string}`, chain: monadChain,
        to: REGISTRY, data: tx.data as `0x${string}`, value: 0n, gas: BigInt(tx.gas), gasPrice: BigInt(tx.gasPrice), type: "legacy" });
      const submission = { hash, bundle: prepared.bundle };
      // Keep the public artifact and hash for read-only recovery after disconnect/reload.
      try { localStorage.setItem(recoveryKey, JSON.stringify(submission)); } catch { /* The hash remains visible in this session. */ }
      setPending(submission); setConfirmation({ state: "pending" }); setReviewed(false);
    } catch (e) { setError(requestedSignature ? walletError(e) : (e as Error).message); }
    finally { sendLock.current = false; setBusy(""); }
  }
  const bundle = view?.bundle; const v = view?.verification;
  return <main id="main" className="wallet-workspace">
    <header><a className="brand" href="/">Signal Passport<span>Portable agent history</span></a><div className="header-actions"><span className="pill">● Monad Testnet</span>
      {address ? <button className="secondary" onClick={() => void handleLogOut().catch(e => setWalletMessage(walletError(e)))}>Disconnect</button>
        : <button onClick={() => { setWalletMessage("If you cancel the connection request, no wallet will be connected."); setShowAuthFlow(true); }}>Connect Wallet</button>}</div></header>
    <nav className="wallet-nav" aria-label="Product navigation"><a href="/">Home</a><a href="/passport">Explore Passport</a><a href="/compare">Compare Agents</a><a href="/developers">Developers</a></nav>
    <div className="intro"><p className="eyebrow">ERC-8004 / AGENT {AGENT_ID}</p><h1>Your wallet.<br/>Your publication controls.</h1><p>Connect through Dynamic to inspect authorization and existing publication status. Passport inspection and comparison do not require a wallet.</p></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {walletMessage && <p className="notice" role="status">{walletMessage}</p>}
    <div className="grid"><section className="card"><div className="section-title"><h2>Agent identity</h2><span className="tag">ERC-8004</span></div>
      <h3>{bundle?.payload.subject.registration.document?.name ?? "Agent 2072"}</h3><dl>
      <Field label="Agent ID">{AGENT_ID}</Field><Field label="Current registry-designated wallet"><code>{view?.agentWallet ?? "Unavailable — current authorization unknown"}</code></Field>
      <Field label="Connected wallet"><code>{address ?? "Not connected"}</code></Field>
      <Field label="Wallet network">{chain === CHAIN_ID ? "Monad Testnet · 10143" : chain ? `Wrong network · ${chain}` : "Not detected"}</Field></dl>
      <p role="status" className={`notice ${authorization === "authorized" ? "good" : "warning"}`}>{view?.publicReadOnly && authorization === "disconnected" ? "Connect MetaMask to inspect wallet status. Publication is unavailable on this public site." : authorizationText[authorization]}</p>
      {authorization === "wrong_network" && <button className="secondary" onClick={async () => { try { await primaryWallet?.switchNetwork(CHAIN_ID); setChain(Number(await primaryWallet?.getNetwork())); }
        catch (e) { setWalletMessage(walletError(e)); } }}>Switch to Monad Testnet</button>}
    </section>
    <section className="card"><div className="section-title"><h2>Historical Passport</h2><span className="tag">VERSION 1</span></div>
      <p>This is the preserved M4 version 1 artifact. Latest onchain version: <strong>{view?.latest ?? "unknown"}</strong>.</p>
      {bundle ? <><div className="metrics">{["observed_transaction_count", "active_utc_days", "unique_recipient_addresses"].map((id, index) =>
        <div key={id}><strong>{bundle.payload.metrics.find(m => m.metricId === id)?.value ?? "Unknown"}</strong><span>{["Observed transactions", "Active UTC days", "Recipient addresses"][index]}</span></div>)}</div>
        <dl><Field label="Schema / Passport version">{bundle.schemaVersion} / {bundle.payload.generation.passportVersion}</Field>
        <Field label="Coverage">{bundle.payload.coverage.coverageStatus.replaceAll("_", " ")}</Field>
        <Field label="Frozen block scope">[{bundle.payload.observationScope.fromBlock}, {bundle.payload.observationScope.toBlockExclusive})</Field></dl>
        <p>These demo transactions concern identity management. They do not establish commerce or service delivery.</p>
        <a className="text-link" href="/api/passport?download=1">Download accepted Passport JSON ↓</a>
        <details><summary>View Passport JSON</summary><pre>{JSON.stringify(bundle, null, 2)}</pre></details>
      </> : <p>{loading ? "Loading accepted Passport…" : "Passport unavailable."}</p>}
    </section></div>
    <section className="card"><div className="section-title"><h2>Historical version 1 verification</h2><button className="secondary" disabled={loading} onClick={() => void refresh()}>{loading ? "Checking…" : "Verify again"}</button></div>
      <div className="checks"><div><span>Local integrity</span><strong>{v ? v.localIntegrityValid ? "Valid SHA-256 payload" : "Invalid" : "Not checked"}</strong></div>
      <div><span>Onchain publication</span><strong>{v?.publicationFound === true ? "Found" : v?.publicationFound === false ? "Not found" : "Unknown"}</strong></div>
      <div><span>Hash comparison</span><strong>{v?.publishedHashMatches === true ? "Match" : v?.publishedHashMatches === false ? "No match" : "Unknown"}</strong></div></div>
      <p className={`notice ${v?.status === "verified" ? "good" : ""}`}>{view?.network === "wrong_chain" ? "Server RPC is on the wrong network. Monad Testnet (10143) is required." : v ? verdicts[v.status] : "Verification unavailable. This is not a claim of zero activity or no publication."}</p>
      <dl><Field label="Published profile hash"><code>{v?.profileHash ?? "Unavailable"}</code></Field><Field label="Passport Registry"><a href={`${EXPLORER}/address/${REGISTRY}`} target="_blank" rel="noreferrer"><code>{REGISTRY}</code></a></Field>
      <Field label="Version 1 publication"><a href={`${EXPLORER}/tx/${V1_TRANSACTION}`} target="_blank" rel="noreferrer">View transaction ↗</a> · block {v?.publicationBlock ?? "unknown"}</Field>
      <Field label="Content URI">Empty in the immutable version 1 record. The artifact is available above.</Field></dl>
    </section>
    <section className="card"><div className="section-title"><h2>Publish the next Passport</h2><span className="tag">VERSION 2</span></div>
      <p>Retrieve a new frozen evidence scope from Envio, then review the digest and fee. Only the current agentWallet can authorize publication.</p>
      {view?.publicReadOnly && <p className="notice">This public deployment is read-only. Connect a wallet to inspect status; preparation and publication are unavailable here.</p>}
      <button disabled={view?.publicReadOnly || authorization !== "authorized" || Boolean(busy) || Boolean(pending) || view?.latest !== "1"} onClick={() => void prepareNext()}>Prepare next Passport</button>
      {view?.latest && view.latest !== "1" && <p className="notice">Latest onchain version is {view.latest}. This M5 flow permits version 2 only; a new publication is disabled.</p>}
      {busy && <p role="status">{busy}</p>}
      {prepared && <div className="review"><h3>Review publication</h3><dl>
        <Field label="Agent / version">{AGENT_ID} / 2</Field><Field label="Profile hash"><code>{prepared.transaction.profileHash}</code></Field>
        <Field label="Previous version hash"><code>0x{prepared.bundle.payload.generation.previousVersionHash}</code></Field>
        <Field label="Publisher"><code>{prepared.transaction.from}</code></Field><Field label="Contract"><code>{prepared.transaction.to}</code></Field>
        <Field label="Chain">Monad Testnet · {prepared.transaction.chainId}</Field><Field label="Anticipated maximum fee">{formatEther(BigInt(prepared.transaction.maxFeeWei))} MON (fee cap: 0.2 MON)</Field>
        <Field label="Evidence scope">[{prepared.bundle.payload.observationScope.fromBlock}, {prepared.bundle.payload.observationScope.toBlockExclusive}) · {prepared.bundle.payload.evidence.length} transactions · {prepared.bundle.payload.coverage.coverageStatus}</Field>
        <Field label="Content URI">Empty — public artifact hosting is deferred. Download and retain this exact artifact.</Field></dl>
        <button className="secondary" onClick={() => download(prepared.bundle)}>Download version 2 JSON</button>
        <label className="consent"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} disabled={Boolean(pending) || Boolean(busy)} />I have reviewed this version, wallet, contract and fee, and authorize one publication.</label>
        <button disabled={view?.publicReadOnly || !reviewed || authorization !== "authorized" || Boolean(busy) || Boolean(pending)} onClick={() => void publish()}>Publish with connected wallet</button>
      </div>}
      {pending && <div className="review" aria-live="polite"><h3>{confirmation?.state === "confirmed" ? "Version 2 confirmed and independently verified" : confirmation?.state === "reverted" ? "Transaction reverted" : "Publication pending or awaiting verification"}</h3>
        <p><a href={`${EXPLORER}/tx/${pending.hash}`} target="_blank" rel="noreferrer"><code>{pending.hash}</code></a></p>
        <p>{confirmation?.state === "confirmed" ? `Receipt succeeded at block ${BigInt(confirmation.receipt!.blockNumber)}; onchain profile hash matches.` : "A wallet response alone is not proof of publication. Receipt and Registry read-back must both pass."}</p>
        <button className="secondary" onClick={() => void checkReceipt(pending)}>Check receipt and read-back</button>{" "}<button className="secondary" onClick={() => download(pending.bundle)}>Download submitted Passport</button>
        {confirmation?.receipt && <details><summary>View public receipt and verification</summary><pre>{JSON.stringify(confirmation, null, 2)}</pre></details>}
      </div>}
    </section>
    <section className="limitations"><h2>Scope, not a trust score</h2><ul>{bundle?.payload.limitations.map(l => <li key={l.code}>{l.description}</li>)}</ul></section>
    <footer>Signal Passport · Monad Testnet · Independent integrity verification does not establish agent quality or safety.</footer>
  </main>;
}
export default function PassportApp() {
  return <DynamicContextProvider settings={{ environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    walletConnectors: [MetaMaskEvmWalletConnectors], initialAuthenticationMode: "connect-only", networkValidationMode: "never",
    overrides: { evmNetworks: [dynamicNetwork] }, recommendedWallets: [{ walletKey: "metamask", label: "Recommended" }] }}>
    <Workspace />
  </DynamicContextProvider>;
}
