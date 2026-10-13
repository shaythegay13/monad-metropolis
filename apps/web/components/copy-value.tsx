"use client";
import { useState } from "react";
export function CopyValue({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  return <div className="copy-value"><code title={value}>{value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}</code><button className="copy-button" aria-label={`Copy ${label}`} onClick={async () => {
    try { await navigator.clipboard.writeText(value); setMessage("Copied"); } catch { setMessage("Copy unavailable; expand full value"); }
  }}>Copy</button><details><summary>Full value</summary><code>{value}</code></details><span role="status" className="copy-feedback">{message}</span></div>;
}
/** Copy control for a value that is already displayed in full nearby. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [message, setMessage] = useState("");
  return <span className="copy-inline"><button className="copy-button" aria-label={`Copy ${label}`} onClick={async () => {
    try { await navigator.clipboard.writeText(value); setMessage("Copied"); } catch { setMessage("Copy unavailable; select the value instead"); }
  }}>Copy</button><span role="status" className="copy-feedback">{message}</span></span>;
}
