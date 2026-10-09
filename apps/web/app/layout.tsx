import type { Metadata } from "next";
import "./style.css";
import "./redesign.css";
export const metadata: Metadata = { title: "Signal Passport | Monad Testnet", description: "Portable, independently verifiable agent history." };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
