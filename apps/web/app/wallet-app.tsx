"use client";
import dynamic from "next/dynamic";
const PassportApp = dynamic(() => import("./passport-app"), { ssr: false,
  loading: () => <main id="main" className="wallet-workspace"><h1>Signal Passport</h1><p>Loading Monad Testnet workspace…</p></main> });
export default function WalletApp() { return <PassportApp />; }
