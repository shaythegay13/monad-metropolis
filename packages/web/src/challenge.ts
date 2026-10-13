// Shared by browser and server. The server re-derives and checks every field; no dependencies.
export function challengeMessage(c: { agentId: string; address: string; origin: string; issuedAt: string; nonce: string }) {
  return ["Signal Passport wants to generate a Passport for an agent you control.",
    "This signature proves wallet control. It sends no transaction and costs no gas.",
    `Agent ID: ${c.agentId}`, `Wallet: ${c.address.toLowerCase()}`, "Chain ID: 10143",
    `Origin: ${c.origin}`, `Issued at: ${c.issuedAt}`, `Nonce: ${c.nonce}`].join("\n");
}
