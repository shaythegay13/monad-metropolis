import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = { title: "Signal Passport | Monad Testnet", description: "Portable, independently verifiable agent history." };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
