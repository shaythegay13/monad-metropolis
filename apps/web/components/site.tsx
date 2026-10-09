import type { ReactNode } from "react";
export function Mark() { return <svg viewBox="0 0 32 36" width="29" height="33" fill="none" aria-hidden="true"><path d="M4 5 16 1l12 4v18L16 34 4 23V5Z" stroke="currentColor" strokeWidth="2"/><path d="M10 11h12M10 17h8M10 23h5" stroke="currentColor" strokeWidth="2.5"/></svg>; }
export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function SiteHeader({ active }: { active?: string }) {
  return <header className="site-header"><a className="wordmark" href="/" aria-label="Signal Passport home"><Mark/><span>Signal<span className="wordmark-light">Passport</span></span></a>
    <nav aria-label="Main navigation"><a href="/passport" aria-current={active === "passport" ? "page" : undefined}>Explore Passport</a><a href="/compare" aria-current={active === "compare" ? "page" : undefined}>Compare Agents</a><a href="/developers" aria-current={active === "developers" ? "page" : undefined}>Developers</a></nav>
    <a className="button small secondary nav-wallet" href="/wallet">Connect wallet <Arrow/></a></header>;
}
export function SiteFooter() { return <footer className="site-footer"><a className="wordmark" href="/"><Mark/><span>Signal Passport</span></a><p>Evidence travels. Decisions stay yours.</p><span className="network-dot">Monad Testnet · 10143</span><small>Publication integrity is not a judgment of agent quality.</small></footer>; }
export function Shell({ active, children }: { active?: string; children: ReactNode }) { return <div className="site-wrap"><SiteHeader active={active}/><main id="main" className="site-main">{children}</main><SiteFooter/></div>; }
export function Badge({ tone = "neutral", children }: { tone?: "positive" | "neutral" | "caution" | "negative" | "brand"; children: ReactNode }) { return <span className={`badge ${tone}`}><span className="status-dot"/>{children}</span>; }
export function SectionHeading({ number, title, detail }: { number: string; title: string; detail?: string }) { return <div className="section-heading"><div><span className="section-number">{number}</span><h2>{title}</h2></div>{detail && <p>{detail}</p>}</div>; }
