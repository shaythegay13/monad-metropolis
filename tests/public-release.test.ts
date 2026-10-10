import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { isPublicReadOnly } from "../packages/web/src/deployment.js";

test("M8 Vercel publication controls fail closed regardless of a local override", () => {
  assert.equal(isPublicReadOnly({ VERCEL: "1" }), true);
  assert.equal(isPublicReadOnly({ VERCEL: "1", SIGNAL_PASSPORT_PUBLIC_READ_ONLY: "0" }), true);
  assert.equal(isPublicReadOnly({ SIGNAL_PASSPORT_PUBLIC_READ_ONLY: "1" }), true);
  assert.equal(isPublicReadOnly({}), false);
});

test("M8 public Passport files preserve the accepted bytes, not reserialized JSON", () => {
  const pairs = [
    ["fixtures/real/monad-m5/agent-2072-passport-v2.json", "apps/web/public/passports/agent-2072-v2-published.json", "eca35f6a109fe98c6974eb410f0d07f74b8ac4165dd8eb3be29eb2f1b8669e6c", 2],
    ["fixtures/real/monad-m4/agent-2072-activity.json.passport.json", "apps/web/public/passports/agent-2072-v1-historical.json", "e5000c87c18182c6e4c2f18690ccff82942a695915d04e649c71e39eab02dde1", 1],
    ["fixtures/real/monad-m3/agent-2-passport-v2.json", "apps/web/public/passports/agent-2-v1-unpublished.json", "d1d8fcc35100d80c34a977b1670432fea9a3fe1706f345f438b868447787629d", 1]
  ] as const;
  for (const [source, hosted, expectedHash, version] of pairs) {
    const original = readFileSync(source); const copy = readFileSync(hosted);
    assert.deepEqual(copy, original);
    assert.equal(createHash("sha256").update(copy).digest("hex"), expectedHash);
    assert.equal(JSON.parse(copy.toString("utf8")).payload.generation.passportVersion, version);
  }
});
