import { readFile, writeFile } from "node:fs/promises";
import { createRpc } from "../packages/identity/src/resolver.js";
import { activityEvidenceSchema } from "../packages/schema/src/activity.js";

// Independent verification only. This RPC never supplies the product ingestion dataset.
async function main() {
  const [output, ...inputs] = process.argv.slice(2);
  if (!output || inputs.length < 1 || inputs.length > 5) throw Error("Usage");
  const rpc = createRpc("https://testnet-rpc.monad.xyz");
  if (BigInt(String(await rpc("eth_chainId", []))) !== 10143n) throw Error("Wrong chain");
  const samples = [];
  for (const input of inputs) {
    const artifact = JSON.parse(await readFile(input, "utf8"));
    if (!Array.isArray(artifact.evidence)) throw Error("Missing evidence");
    for (const raw of artifact.evidence.slice(0, 3)) {
      const expected = activityEvidenceSchema.parse(raw);
      const transaction = await rpc("eth_getTransactionByHash", [expected.transactionHash]) as Record<string, unknown> | null;
      if (!transaction) throw Error("Missing transaction");
      const block = await rpc("eth_getBlockByNumber", [transaction.blockNumber, false]) as Record<string, unknown>;
      const receipt = await rpc("eth_getTransactionReceipt", [expected.transactionHash]) as Record<string, unknown>;
      const actual = { transactionHash: String(transaction.hash).toLowerCase(),
        blockNumber: BigInt(String(transaction.blockNumber)).toString(),
        blockHash: String(transaction.blockHash).toLowerCase(), sender: String(transaction.from).toLowerCase(),
        recipient: transaction.to == null ? null : String(transaction.to).toLowerCase(),
        value: BigInt(String(transaction.value)).toString(),
        timestamp: new Date(Number(BigInt(String(block.timestamp)) * 1000n)).toISOString(),
        status: BigInt(String(receipt.status)) === 1n ? "success" : "failed" };
      const matches = Object.fromEntries(Object.entries(actual).map(([key, value]) =>
        [key, value === expected[key as keyof typeof expected]]));
      const matched = Object.values(matches).every(Boolean) &&
        String(block.hash).toLowerCase() === expected.blockHash &&
        String(receipt.transactionHash).toLowerCase() === expected.transactionHash &&
        String(receipt.blockHash).toLowerCase() === expected.blockHash;
      samples.push({ input, actual, matches, matched });
    }
  }
  const report = { source: "https://testnet-rpc.monad.xyz", chainId: 10143, checkedAt: new Date().toISOString(),
    scope: "Bounded independent RPC sample; not an alternative ingestion provider", samples,
    allMatched: samples.length > 0 && samples.every(s => s.matched) };
  await writeFile(output, JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ samples: samples.length, allMatched: report.allMatched }));
  if (!report.allMatched) process.exitCode = 1;
}
main().catch(() => { console.error("Independent RPC cross-check failed; details withheld"); process.exitCode = 1; });
