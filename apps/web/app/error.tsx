"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="site-wrap"><div className="page-head"><div><h1>This page could not load</h1><p className="lede">No publication or verification result is confirmed. Try loading the page again.</p>
    <button onClick={reset}>Try loading again</button></div></div></main>;
}
