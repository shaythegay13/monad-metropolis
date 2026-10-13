import type { ReactNode } from "react";
export const REPO = "https://github.com/shaythegay13/signal-passport-monad";
export const repoPath = (path: string, kind: "tree" | "blob" = "blob") => `${REPO}/${kind}/monad-metropolis/${path}`;
export function Mark() { return <svg viewBox="0 0 32 36" width="29" height="33" fill="none" aria-hidden="true"><path d="M4 5 16 1l12 4v18L16 34 4 23V5Z" stroke="currentColor" strokeWidth="2"/><path d="M10 11h12M10 17h8M10 23h5" stroke="currentColor" strokeWidth="2.5"/></svg>; }
export function Arrow() { return <span aria-hidden="true" className="glyph">↗</span>; }
/** Link that leaves the site. Screen readers hear that it opens a new tab. */
export function Ext({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}<Arrow/><span className="sr-only"> (opens in a new tab)</span></a>;
}
const nav = [["passport", "/passport", "Passport", ""], ["compare", "/compare", "Compare", " agents"], ["developers", "/developers", "Developers", ""]] as const;
export function SiteHeader({ active }: { active?: string }) {
  return <header className="site-header"><a className="wordmark" href="/" aria-label="Signal Passport home"><Mark/><span>Signal Passport</span></a>
    <nav aria-label="Main navigation">{nav.map(([key, href, label, more]) => <a key={key} href={href} aria-current={active === key ? "page" : undefined}>{label}{more && <span className="nav-long">{more}</span>}</a>)}
      <a className="nav-wallet" href="/wallet" aria-current={active === "wallet" ? "page" : undefined}>Wallet</a></nav></header>;
}
export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-brand"><a className="wordmark" href="/"><Mark/><span>Signal Passport</span></a>
    <p>Portable, evidence-backed history for AI agents. Publication integrity is not a judgment of agent quality.</p></div>
    <dl className="footer-facts"><div><dt>Network</dt><dd>Monad Testnet, chain 10143</dd></div><div><dt>Passport Registry</dt><dd><code>0x7d9c…b194</code></dd></div>
      <div><dt>Source</dt><dd><Ext href={REPO}>GitHub, MIT licensed</Ext></dd></div><div><dt>Mode</dt><dd>Public read-only demo</dd></div></dl></footer>;
}
/** bare: the page renders its own main landmark (the wallet workspace keeps its accepted root element). */
export function Shell({ active, children, bare }: { active?: string; children: ReactNode; bare?: boolean }) {
  return <div className="site-wrap"><SiteHeader active={active}/>{bare ? <div className="site-main">{children}</div> : <main id="main" className="site-main">{children}</main>}<SiteFooter/></div>;
}
export { Badge, type Tone } from "./status";
export function SectionHeading({ title, detail, id, kicker }: { title: string; detail?: ReactNode; id?: string; kicker?: string }) {
  return <div className="section-heading" id={id}>{kicker && <p className="kicker">{kicker}</p>}<h2>{title}</h2>{detail && <p className="section-detail">{detail}</p>}</div>;
}
/** Deterministic machine-readable line built from real values. Decorative; values are shown elsewhere in text. */
export function Mrz({ agent, version, digest }: { agent: string; version: number | string; digest: string }) {
  const pad = (s: string, n: number) => (s + "<".repeat(n)).slice(0, n);
  const l1 = pad(`SP<MON10143<AGENT<${agent}<<V${version}`, 44), l2 = pad(digest.toUpperCase().replace(/^0X/, ""), 44);
  return <div className="mrz" aria-hidden="true"><span>{l1}</span><span>{l2}</span></div>;
}
