"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DynamicContextProvider, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from "@dynamic-labs/ethereum-core";
import { MetaMaskEvmWalletConnectors } from "@dynamic-labs-connectors/metamask-evm";
import { formatEther, encodeFunctionData, decodeEventLog, parseAbi, createPublicClient, http } from "viem";
import { CHAIN_ID, REGISTRY, EXPLORER, dynamicNetwork, monadChain } from "../../../packages/web/src/config";
import { walletError } from "../../../packages/web/src/wallet";
import { challengeMessage } from "../../../packages/web/src/challenge";
import type { AgentPassportBundleV2 } from "../../../packages/schema/src/agent-passport";
import { Badge } from "../components/status";

type Lookup = { agentId: string; owner: string; agentWallet: string | null; registration: { name: string | null };
  publication: { latestVersion: string; nextVersion: string } };
type Generated = { bundle: AgentPassportBundleV2; version: number; scope: { fromBlock: number; toBlockExclusive: number; basis: string } };
type Tx = { from: string; to: string; data: string; chainId: number; gas: string; gasPrice: string; maxFeeWei: string;
  agentId: string; version: number; profileHash: string; contentUri: string };
type Confirmation = { state: "pending" | "reverted" | "unverified" | "confirmed"; receipt?: { blockNumber: string; transactionHash: string } };
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? { cache: "no-store" } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed. Nothing was confirmed.");
  return data as T;
}
function download(bundle: AgentPassportBundleV2) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url;
  a.download = `agent-${bundle.payload.subject.agentId}-passport-v${bundle.payload.generation.passportVersion}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// ERC-8004 Identity Registry on Monad Testnet (public, permissionless registration). Reads use the public Monad RPC from the browser.
const IDENTITY_REGISTRY = "0x8004a818bfb912233c491871b3d84c89a494bd9e" as const;
const identityAbi = parseAbi(["function register(string agentURI) returns (uint256)", "event Registered(uint256 indexed agentId, string agentURI, address indexed owner)"]);
const publicClient = createPublicClient({ chain: monadChain, transport: http() });
function registrationUri(name: string, description: string) {
  const json = JSON.stringify({ type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1", name, description, services: [], active: false, registrations: [] });
  return `data:application/json;base64,${btoa(String.fromCharCode(...new TextEncoder().encode(json)))}`;
}
type RegTx = { data: `0x${string}`; uri: string; gas: bigint; gasPrice: bigint; fee: bigint };
const metric = (b: AgentPassportBundleV2, id: string) => b.payload.metrics.find(m => m.metricId === id)?.value ?? "Unavailable";
const randomNonce = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), x => x.toString(16).padStart(2, "0")).join("");

function Workspace() {
  const { primaryWallet, setShowAuthFlow, handleLogOut } = useDynamicContext();
  const address = primaryWallet?.address?.toLowerCase(); const isEvm = Boolean(primaryWallet && isEthereumWallet(primaryWallet));
  const [chain, setChain] = useState<number>(); const [agentId, setAgentId] = useState("");
  const [lookup, setLookup] = useState<Lookup>(); const [generated, setGenerated] = useState<Generated>();
  const [tx, setTx] = useState<Tx>(); const [reviewed, setReviewed] = useState(false);
  const [hash, setHash] = useState<string>(); const [confirmation, setConfirmation] = useState<Confirmation>();
  const [busy, setBusy] = useState(""); const [error, setError] = useState(""); const [note, setNote] = useState("");
  const [regOpen, setRegOpen] = useState(false);
  const openRegistration = () => { setRegOpen(true);
    setTimeout(() => document.getElementById("register")?.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 0); };
  const [regName, setRegName] = useState(""); const [regDescription, setRegDescription] = useState("");
  const [regTx, setRegTx] = useState<RegTx>(); const [regConsent, setRegConsent] = useState(false); const [regHash, setRegHash] = useState<string>();
  const [regState, setRegState] = useState<"" | "pending" | "registered" | "reverted">(""); const [newAgent, setNewAgent] = useState<string>();
  const sendLock = useRef(false); const walletRef = useRef(primaryWallet); walletRef.current = primaryWallet;
  useEffect(() => { let active = true;
    async function read() { try { const n = primaryWallet && isEthereumWallet(primaryWallet) ? Number(await primaryWallet.getNetwork()) : undefined; if (active) setChain(n); } catch { if (active) setChain(undefined); } }
    void read(); const t = setInterval(read, 2000); return () => { active = false; clearInterval(t); };
  }, [primaryWallet, address]);
  function resetFrom(step: "agent" | "generated") {
    if (step === "agent") { setLookup(undefined); setGenerated(undefined); }
    setTx(undefined); setReviewed(false); setHash(undefined); setConfirmation(undefined); setError("");
  }
  const authorized = Boolean(address && isEvm && chain === CHAIN_ID && lookup?.agentWallet && lookup.agentWallet === address);
  async function check() {
    resetFrom("agent"); setBusy("Reading the agent from Monad…");
    try { setLookup(await api<Lookup>(`/api/agents/${encodeURIComponent(agentId)}`)); } catch (e) { setError((e as Error).message); } finally { setBusy(""); }
  }
  async function generate() {
    const wallet = primaryWallet; if (!wallet || !address || !lookup || !authorized) return;
    resetFrom("generated"); setGenerated(undefined); setBusy("Sign the request in your wallet (no transaction, no gas)…");
    try {
      const message = challengeMessage({ agentId: lookup.agentId, address, origin: window.location.origin, issuedAt: new Date().toISOString(), nonce: randomNonce() });
      const signature = await wallet.signMessage(message);
      if (!signature) throw new Error("No signature returned. Nothing was generated.");
      setBusy("Retrieving real evidence through Envio and building the Passport…");
      setGenerated(await api<Generated>("/api/self/generate", { message, signature }));
    } catch (e) { setError(e instanceof Error && /reject|denied|4001/i.test(e.message) ? "Signature request rejected. Nothing was generated." : (e as Error).message); }
    finally { setBusy(""); }
  }
  async function prepare() {
    if (!generated || !address) return; setTx(undefined); setReviewed(false); setError(""); setBusy("Checking authorization, version and fee against Monad…");
    try { setTx(await api<Tx>("/api/self/prepare", { passport: generated.bundle, address, chain })); } catch (e) { setError((e as Error).message); } finally { setBusy(""); }
  }
  const poll = useCallback(async (bundle: AgentPassportBundleV2, txHash: string) => {
    for (let i = 0; i < 40; i++) {
      try { const c = await api<Confirmation>("/api/self/confirm", { passport: bundle, hash: txHash }); setConfirmation(c);
        if (c.state === "confirmed" || c.state === "reverted") return; }
      catch (e) { setError((e as Error).message); return; }
      await new Promise(r => setTimeout(r, 3000));
    }
  }, []);
  async function publish() {
    // The only transaction request is in this explicit click handler, after review and consent.
    const wallet = primaryWallet;
    if (sendLock.current || !generated || !tx || !reviewed || !authorized || !wallet || !isEthereumWallet(wallet)) return;
    sendLock.current = true; setError(""); setBusy("Re-checking wallet, network, version and digest…");
    let requested = false;
    try {
      const client = await wallet.getWalletClient();
      const [account] = await client.getAddresses(); const current = await client.getChainId();
      if (current !== CHAIN_ID) throw new Error("Switch your wallet to Monad Testnet (10143). Nothing was sent.");
      if (account?.toLowerCase() !== tx.from || walletRef.current?.address.toLowerCase() !== tx.from) throw new Error("Wallet account changed. Review again. Nothing was sent.");
      const fresh = await api<Tx>("/api/self/prepare", { passport: generated.bundle, address: tx.from, chain: current });
      if (fresh.data !== tx.data || fresh.to !== REGISTRY || fresh.chainId !== CHAIN_ID || fresh.from !== tx.from || fresh.version !== tx.version || fresh.profileHash !== tx.profileHash)
        throw new Error("Publication details changed. Review again. Nothing was sent.");
      if (BigInt(fresh.maxFeeWei) > BigInt(tx.maxFeeWei)) { setTx(fresh); setReviewed(false); throw new Error("The estimated fee increased. Review the new fee. Nothing was sent."); }
      setBusy("Confirm the transaction in your wallet…"); requested = true;
      const sent = await client.sendTransaction({ account: tx.from as `0x${string}`, chain: monadChain, to: REGISTRY,
        data: tx.data as `0x${string}`, value: 0n, gas: BigInt(tx.gas), gasPrice: BigInt(tx.gasPrice), type: "legacy" });
      setHash(sent); setConfirmation({ state: "pending" }); setReviewed(false); setBusy("");
      void poll(generated.bundle, sent);
    } catch (e) { setError(requested ? walletError(e) : (e as Error).message); }
    finally { sendLock.current = false; setBusy(""); }
  }
  async function reviewRegistration() {
    setRegTx(undefined); setRegConsent(false); setError("");
    const name = regName.trim(), description = regDescription.trim();
    if (!address || chain !== CHAIN_ID) { setError("Connect your wallet on Monad Testnet first."); return; }
    if (name.length < 2 || name.length > 60 || description.length > 280) { setError("Use a name of 2 to 60 characters and a description up to 280 characters."); return; }
    setBusy("Estimating the registration fee on Monad Testnet…");
    try {
      const uri = registrationUri(name, description);
      const data = encodeFunctionData({ abi: identityAbi, functionName: "register", args: [uri] });
      const gas = await publicClient.estimateGas({ account: address as `0x${string}`, to: IDENTITY_REGISTRY, data }) * 125n / 100n;
      const gasPrice = await publicClient.getGasPrice() * 120n / 100n; const fee = gas * gasPrice;
      if (fee <= 0n || fee > 200_000_000_000_000_000n) throw new Error("The estimated fee is above the 0.2 MON safety cap. Nothing was sent.");
      if (await publicClient.getBalance({ address: address as `0x${string}` }) < fee) throw new Error("Your wallet needs testnet MON for the fee. Get some from a Monad Testnet faucet, then try again.");
      setRegTx({ data, uri, gas, gasPrice, fee });
    } catch (e) { setError((e as Error).message.split("\n")[0]); } finally { setBusy(""); }
  }
  async function register() {
    const wallet = primaryWallet;
    if (sendLock.current || !regTx || !regConsent || !wallet || !isEthereumWallet(wallet) || !address) return;
    sendLock.current = true; setError(""); let requested = false;
    try {
      const client = await wallet.getWalletClient();
      const [account] = await client.getAddresses();
      if (await client.getChainId() !== CHAIN_ID) throw new Error("Switch your wallet to Monad Testnet (10143). Nothing was sent.");
      if (account?.toLowerCase() !== address) throw new Error("Wallet account changed. Review again. Nothing was sent.");
      setBusy("Confirm the registration in your wallet…"); requested = true;
      const hash = await client.sendTransaction({ account, chain: monadChain, to: IDENTITY_REGISTRY, data: regTx.data, value: 0n, gas: regTx.gas, gasPrice: regTx.gasPrice, type: "legacy" });
      setRegHash(hash); setRegState("pending"); setRegConsent(false); setBusy("Waiting for the registration receipt…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      if (receipt.status !== "success") { setRegState("reverted"); return; }
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== IDENTITY_REGISTRY) continue;
        try {
          const ev = decodeEventLog({ abi: identityAbi, data: log.data, topics: log.topics });
          if (ev.eventName === "Registered" && ev.args.owner.toLowerCase() === address) {
            const id = ev.args.agentId.toString(); setNewAgent(id); setRegState("registered"); setAgentId(id);
            setLookup(await api<Lookup>(`/api/agents/${id}`)); return;
          }
        } catch { /* not a Registered event */ }
      }
      setRegState("registered");
    } catch (e) { setError(requested ? walletError(e) : (e as Error).message); }
    finally { sendLock.current = false; setBusy(""); }
  }
  const b = generated?.bundle;
  return <main id="main" className="wallet-workspace">
    <div className="page-head"><div><h1>Create and publish a Passport</h1>
      <p className="lede">For agent operators: connect your agent&rsquo;s registry-designated wallet, build the next Passport from real Monad activity, and publish it from your own wallet. Anyone can <a href="/verify">verify agents</a> without connecting.</p></div>
      <div className="actions">{address ? <button className="secondary" onClick={() => void handleLogOut().catch(e => setNote(walletError(e)))}>Disconnect</button>
        : <button onClick={() => { setNote("If you cancel the connection request, no wallet is connected."); setShowAuthFlow(true); }}>Connect wallet</button>}</div></div>
    {note && <p className="notice" role="status">{note}</p>}

    <section className="onboarding" id="register" aria-labelledby="register-title">
      <div className="onboarding-head"><div><h2 id="register-title">New here? Start by registering an agent</h2>
        <p>A Passport belongs to an ERC-8004 agent. If you don&rsquo;t have one yet, register one on Monad Testnet from your wallet in a single transaction, then continue with step 1.</p></div>
        <div className="actions"><button aria-expanded={regOpen} aria-controls="register-form" onClick={() => setRegOpen(open => !open)}>{regOpen ? "Hide registration" : "Register a new agent"}</button>
          <a className="text-link" href="#step-agent">I already have an agent</a></div></div>
      {regOpen && <div id="register-form" className="onboarding-form">
      <p>This creates a new ERC-8004 agent identity owned by your connected wallet in the public Identity Registry. The Registry designates your wallet as the agent&rsquo;s agentWallet, so you can then build and publish its Passport. History starts at registration, so a new agent&rsquo;s first Passport shows very little activity.</p>
      <div className="verify-grid"><label className="field"><span>Agent name</span><input maxLength={60} value={regName} onChange={e => { setRegName(e.target.value); setRegTx(undefined); }} placeholder="My test agent" /></label>
        <label className="field"><span>Short description (optional)</span><input maxLength={280} value={regDescription} onChange={e => { setRegDescription(e.target.value); setRegTx(undefined); }} placeholder="What this agent does" /></label></div>
      <button className="secondary" disabled={!address || chain !== CHAIN_ID || Boolean(busy) || regState === "pending"} onClick={() => void reviewRegistration()}>Review registration</button>
      {regTx && !regHash && <div className="review"><h3>Review the registration transaction</h3><dl className="record-fields">
        <div><dt>Contract</dt><dd>ERC-8004 Identity Registry <code className="break">{IDENTITY_REGISTRY}</code></dd></div>
        <div><dt>Function</dt><dd><code>register(string agentURI)</code></dd></div>
        <div><dt>Network</dt><dd>Monad Testnet, chain {CHAIN_ID}</dd></div>
        <div><dt>Registration file, stored onchain as a data URI</dt><dd><code className="break">{new TextDecoder().decode(Uint8Array.from(atob(regTx.uri.split(",")[1]), c => c.charCodeAt(0)))}</code></dd></div>
        <div><dt>Maximum fee</dt><dd>{formatEther(regTx.fee)} MON (safety cap 0.2 MON)</dd></div></dl>
        <label className="consent"><input type="checkbox" checked={regConsent} onChange={e => setRegConsent(e.target.checked)} />I want to register a new public agent identity owned by my wallet and pay this testnet fee.</label>
        <button disabled={!regConsent || Boolean(busy)} onClick={() => void register()}>Register with my wallet</button></div>}
      {regHash && <p className="notice" aria-live="polite">{regState === "registered" ? (newAgent ? <>Registered as agent <strong>{newAgent}</strong>. It is selected below.</> : "Registered. Find your agent ID on Monadscan, then enter it below.") : regState === "reverted" ? "The registration reverted. Nothing was created." : "Waiting for the receipt…"} <a href={`${EXPLORER}/tx/${regHash}`} target="_blank" rel="noreferrer">View transaction ↗</a></p>}
      </div>}
    </section>

    <section className="status-ledger" aria-label="Your wallet and agent">
      <div className="ledger-row"><span className="ledger-label">Connected account</span><div className="ledger-value">{address ? <code className="break">{address}</code> : <span className="muted">Not connected</span>}<small>via Dynamic, MetaMask connector</small></div>
        <Badge tone={address ? "positive" : "neutral"}>{address ? "Connected" : "Disconnected"}</Badge></div>
      <div className="ledger-row"><span className="ledger-label">Network</span><div className="ledger-value">{chain === CHAIN_ID ? "Monad Testnet, chain 10143" : chain ? `Wrong network, chain ${chain}` : <span className="muted">Not detected</span>}
        {address && chain !== undefined && chain !== CHAIN_ID && <button className="secondary small" onClick={async () => { try { await primaryWallet?.switchNetwork(CHAIN_ID); } catch (e) { setNote(walletError(e)); } }}>Switch to Monad Testnet</button>}</div>
        <Badge tone={chain === CHAIN_ID ? "positive" : chain ? "caution" : "neutral"}>{chain === CHAIN_ID ? "Correct network" : chain ? "Wrong network" : "Unknown"}</Badge></div>
      <div className="ledger-row"><span className="ledger-label">Agent authorization</span><div className="ledger-value">
        {!lookup ? <span className="muted">Check an agent ID below.</span> : !lookup.agentWallet ? "This agent has no agentWallet set, so no one can publish for it."
          : authorized ? <>You control agent {lookup.agentId}&rsquo;s designated wallet.</> : <>Agent {lookup.agentId}&rsquo;s designated wallet is <code className="break">{lookup.agentWallet}</code>. Connect that wallet to continue.</>}</div>
        <Badge tone={authorized ? "positive" : lookup ? "caution" : "neutral"}>{authorized ? "Authorized" : lookup ? "Not authorized" : "Not checked"}</Badge></div>
    </section>
    {error && <p className="notice error" role="alert">{error}</p>}
    {busy && <p className="notice" role="status">{busy}</p>}


    <section className="wallet-section publish-section" aria-labelledby="step-agent"><h2 id="step-agent">1. Choose your agent</h2>
      <form className="lookup-form" onSubmit={e => { e.preventDefault(); if (agentId) void check(); }}>
        <label className="field"><span>Your ERC-8004 agent ID on Monad Testnet</span><input inputMode="numeric" maxLength={31} value={agentId} onChange={e => { setAgentId(e.target.value.replace(/\D/g, "")); }} placeholder="Agent ID" /></label>
        <button className="secondary" disabled={!agentId || Boolean(busy)}>Check agent</button></form>
      {lookup && <p>{lookup.registration.name ?? `Agent ${lookup.agentId}`}: latest published Passport version <strong>{lookup.publication.latestVersion}</strong>, so the next version is <strong>{lookup.publication.nextVersion}</strong>.</p>}
      {lookup && address && lookup.agentWallet !== address && <p className="notice">Your connected wallet doesn&rsquo;t control agent {lookup.agentId}. <button type="button" className="link-button" onClick={openRegistration}>Register your own agent</button></p>}
      <p className="microcopy">A connected wallet is not automatically an agent. Only the wallet the ERC-8004 Identity Registry designates for an agent can generate and publish its Passport. Don&rsquo;t have one? <button type="button" className="link-button" onClick={openRegistration}>Register a new agent</button></p>
    </section>

    <section className="wallet-section publish-section" aria-labelledby="step-generate"><h2 id="step-generate">2. Generate from real evidence</h2>
      <p>You sign a short message (no transaction, no gas) so the server knows you control the wallet. It then retrieves this agent wallet&rsquo;s outgoing Monad Testnet transactions through Envio HyperSync, within a bounded block range, and builds version {lookup?.publication.nextVersion ?? "N"} with our deterministic generator.</p>
      <button disabled={!authorized || Boolean(busy)} onClick={() => void generate()}>{lookup ? `Sign and generate version ${lookup.publication.nextVersion}` : "Sign and generate"}</button>
      {b && generated && <div className="review">
        <h3>Agent {b.payload.subject.agentId}, Passport version {generated.version}</h3>
        <dl className="passport-metrics"><div><dt>Observed transactions</dt><dd>{String(metric(b, "observed_transaction_count"))}</dd></div><div><dt>Active UTC days</dt><dd>{String(metric(b, "active_utc_days"))}</dd></div><div><dt>Recipient addresses</dt><dd>{String(metric(b, "unique_recipient_addresses"))}</dd></div></dl>
        <dl className="record-fields">
          <div><dt>Evidence scope</dt><dd>Blocks <code>[{generated.scope.fromBlock}, {generated.scope.toBlockExclusive})</code>, {generated.scope.basis === "since_registration" ? "since the agent's registration" : "a recent window (registration block not found)"}</dd></div>
          <div><dt>Coverage</dt><dd>{b.payload.coverage.coverageStatus.replaceAll("_", " ")} ({b.payload.coverage.rawRowsRetrieved} rows in {b.payload.coverage.pageCount} page{b.payload.coverage.pageCount === 1 ? "" : "s"})</dd></div>
          <div><dt>Execution status</dt><dd>{String(metric(b, "successful_execution_count"))} successful, {String(metric(b, "failed_execution_count"))} failed, {String(metric(b, "unknown_execution_status_count"))} unknown</dd></div>
          <div><dt>Canonical digest</dt><dd><code className="break">0x{b.integrity.digest}</code></dd></div>
          <div><dt>Links to previous version</dt><dd>{b.payload.generation.previousVersionHash ? <code className="break">0x{b.payload.generation.previousVersionHash}</code> : "First version"}</dd></div></dl>
        <p className="microcopy">{b.payload.limitations.map(l => l.description).join(" ")}</p>
        <div className="actions"><button className="secondary" onClick={() => download(b)}>Download Passport JSON</button><button disabled={Boolean(busy) || !authorized} onClick={() => void prepare()}>Review publication</button></div>
      </div>}
    </section>

    <section className="wallet-section publish-section" aria-labelledby="step-publish"><h2 id="step-publish">3. Publish from your wallet</h2>
      {!tx && <p className="muted">Generate a Passport, then review the exact transaction here before anything is signed.</p>}
      {tx && b && <div className="review"><h3>Review the transaction</h3><dl className="record-fields">
        <div><dt>Contract</dt><dd>Signal Passport Registry <code className="break">{tx.to}</code></dd></div>
        <div><dt>Agent and version</dt><dd>Agent {tx.agentId}, version {tx.version}</dd></div>
        <div><dt>Digest being published</dt><dd><code className="break">{tx.profileHash}</code></dd></div>
        <div><dt>Network</dt><dd>Monad Testnet, chain {tx.chainId}</dd></div>
        <div><dt>Content URI</dt><dd>Empty. The file is not hosted by us; keep the downloaded JSON and share it with whoever verifies you.</dd></div>
        <div><dt>Maximum fee</dt><dd>{formatEther(BigInt(tx.maxFeeWei))} MON (safety cap 0.2 MON)</dd></div>
        <div><dt>Publisher</dt><dd><code className="break">{tx.from}</code></dd></div></dl>
        <label className="consent"><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} disabled={Boolean(busy) || Boolean(hash)} />I reviewed the agent, version, digest, contract, network and fee, and I authorize one publication from my wallet.</label>
        <button disabled={!reviewed || !authorized || Boolean(busy) || Boolean(hash)} onClick={() => void publish()}>Publish with my wallet</button></div>}
      {hash && b && <div className="review" aria-live="polite"><h3>{confirmation?.state === "confirmed" ? `Version ${b.payload.generation.passportVersion} is published and independently verified` : confirmation?.state === "reverted" ? "Transaction reverted — nothing was published" : confirmation?.state === "unverified" ? "Receipt found, but the Registry read-back did not verify" : "Waiting for the receipt…"}</h3>
        <p><a href={`${EXPLORER}/tx/${hash}`} target="_blank" rel="noreferrer"><code className="break">{hash}</code> ↗</a></p>
        <p>{confirmation?.state === "confirmed" ? `Confirmed at block ${confirmation.receipt?.blockNumber}; the Registry's digest matches your file.` : "A wallet response alone is not proof. The receipt and a Registry read-back must both pass."}</p>
        <div className="actions"><button className="secondary" onClick={() => download(b)}>Download Passport JSON</button>
          <a className="button secondary" href={`/verify?agent=${b.payload.subject.agentId}`}>Open the verification page</a>
          {confirmation?.state !== "confirmed" && <button className="secondary" onClick={() => void poll(b, hash)}>Check again</button>}</div>
        <p className="microcopy">Share link: <code className="break">{typeof window === "undefined" ? "" : `${window.location.origin}/verify?agent=${b.payload.subject.agentId}`}</code>. Others look up the onchain record there and check your JSON file against it.</p></div>}
    </section>
  </main>;
}
export default function SelfServiceApp() {
  return <DynamicContextProvider settings={{ environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    walletConnectors: [MetaMaskEvmWalletConnectors], initialAuthenticationMode: "connect-only", networkValidationMode: "never",
    overrides: { evmNetworks: [dynamicNetwork] }, recommendedWallets: [{ walletKey: "metamask", label: "Recommended" }] }}>
    <Workspace />
  </DynamicContextProvider>;
}
