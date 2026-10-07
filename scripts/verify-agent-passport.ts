import { readFile } from "node:fs/promises";
import { validateImportedBundle } from "../packages/consumer/src/validate-bundle.js";

async function main() {
  const [input] = process.argv.slice(2);
  if (!input) throw Error();
  const result = validateImportedBundle(JSON.parse(await readFile(input, "utf8")));
  console.log(JSON.stringify({ isValid: result.isValid, integrityLabel: result.integrityLabel,
    integrityExplanation: result.integrityExplanation, steps: result.steps, errorSummary: result.errorSummary }, null, 2));
  if (!result.isValid) process.exitCode = 1;
}
main().catch(() => { console.error("Offline verification failed; provide a readable Passport JSON file"); process.exitCode = 1; });
