import test from "node:test";
import assert from "node:assert/strict";
import { parseDiff, curate } from "../src/index.js";

test("parses diff stats and suggests commit text", () => {
  const diff = "diff --git a/src/a.js b/src/a.js\n+hello\n-old";
  assert.deepEqual(parseDiff(diff)[0], { from: "src/a.js", to: "src/a.js", added: 1, removed: 1 });
  assert.match(curate(diff), /feat: update src/);
});
