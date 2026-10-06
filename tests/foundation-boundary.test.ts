import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { buildEvidenceId } from "../packages/schema/src/evidence.js";
import { validateImportedBundle } from "../packages/consumer/src/validate-bundle.js";

test("evidence ID preserves chain and normalizes hash independently of retrieval order", () => {
  const hash = "0x" + "Ab".repeat(32);
  assert.equal(buildEvidenceId(10143, hash), `10143:${hash.toLowerCase()}`);
  assert.notEqual(buildEvidenceId(143, hash), buildEvidenceId(10143, hash));
});
test("evidence ID distinguishes log zero, other logs and transaction-only records", () => {
  const hash = "0x" + "a".repeat(64);
  assert.equal(buildEvidenceId(10143, hash, 0), `10143:${hash}:0`);
  assert.notEqual(buildEvidenceId(10143, hash, 0), buildEvidenceId(10143, hash, 1));
  assert.equal(buildEvidenceId(10143, hash, null), buildEvidenceId(10143, hash));
});
test("migrated consumer verifies a self-contained fixture without network or analysis", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Network forbidden in offline verification"); };
  try {
    const bundle = JSON.parse(readFileSync("fixtures/real/passport-bundle.json", "utf8"));
    const result = validateImportedBundle(bundle);
    assert.equal(result.isValid, true);
    assert.equal(result.steps.find(s => s.step === "evidence")?.passed, true);
  } finally { globalThis.fetch = originalFetch; }
});
test("all local source imports stay within this repository; consumer has no identity/analysis imports", () => {
  const root = process.cwd();
  function inspect(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) { inspect(file); continue; }
      if (!file.endsWith(".ts")) continue;
      const text = readFileSync(file, "utf8");
      const imports = [...text.matchAll(/(?:from\s+|import\s*\()(["'])([^"']+)\1/g)].map(m => m[2]);
      for (const specifier of imports) {
        if (specifier.startsWith(".")) {
          const relative = path.relative(root, path.resolve(path.dirname(file), specifier));
          assert.ok(!relative.startsWith("..") && !path.isAbsolute(relative), `${file}: escaping import`);
        }
        assert.ok(!specifier.includes("ledgerlens") && !specifier.includes("signal-passport/"));
        if (file.includes(path.join("packages", "consumer")))
          assert.ok(!specifier.includes("identity") && !specifier.includes("analysis"));
      }
    }
  }
  inspect(path.join(root, "packages")); inspect(path.join(root, "scripts"));
});
