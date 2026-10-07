import { readFile, writeFile } from "node:fs/promises";
import { generateAgentPassport } from "../packages/passport/src/generate.js";
import { canonicalJsonStringify } from "../packages/verification/src/canonical.js";

// Offline fixture boundary. Timestamp is supplied explicitly, never hidden in calculation.
async function main() {
  const [input, output, generatedAt] = process.argv.slice(2);
  if (!input || !output || !generatedAt) throw Error();
  const fixture = JSON.parse(await readFile(input, "utf8"));
  const bundle = generateAgentPassport(fixture.identity, fixture, { generatedAt, passportVersion: 1 });
  await writeFile(output, canonicalJsonStringify(bundle) + "\n", { flag: "wx" });
  console.log(JSON.stringify({ schemaVersion: bundle.schemaVersion, digest: bundle.integrity.digest,
    coverage: bundle.payload.coverage.coverageStatus, metrics: bundle.payload.metrics.map(m => ({ metricId: m.metricId, value: m.value })) }, null, 2));
}
main().catch(() => {
  console.error("Generation failed. Usage: generate-agent-passport <M2-fixture.json> <new-output.json> <explicit-UTC-generatedAt>; input must be valid and output must not exist.");
  process.exitCode = 1;
});
