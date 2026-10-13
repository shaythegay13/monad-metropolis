"use client";
import dynamic from "next/dynamic";
import { Shell } from "../components/site";
const PassportApp = dynamic(() => import("./passport-app"), { ssr: false,
  loading: () => <main id="main" className="wallet-workspace"><div className="page-head"><div><h1>Wallet and publication authority</h1><p className="lede" role="status">Loading the Monad Testnet wallet workspace…</p></div></div></main> });
export default function WalletApp() { return <Shell active="wallet" bare><PassportApp /></Shell>; }
