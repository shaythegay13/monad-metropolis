import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./redesign.css";
const display = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-display", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
export const metadata: Metadata = { title: "Signal Passport | Monad Testnet", description: "Portable, evidence-backed history for AI agents, independently verifiable on Monad." };
export const viewport: Viewport = { themeColor: "#123e32" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
