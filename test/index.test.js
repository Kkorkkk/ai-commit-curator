import test from "node:test";
import assert from "node:assert/strict";
import { parseCliArgs, parseDiff, curate, curateWithAdapter } from "../src/index.js";

test("parses diff stats and suggests commit text", () => {
  const diff = "diff --git a/src/index.js b/src/index.js\n+hello\n-old";
  assert.deepEqual(parseDiff(diff)[0], { from: "src/index.js", to: "src/index.js", added: 1, removed: 1 });
  assert.match(curate(diff), /feat: update src/);
  assert.match(curate(diff), /manual command smoke test/);
});

test("adds contextual risks and optional model notes", () => {
  const diff = "diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml\n+run: npm test";
  assert.match(curate(diff), /CI workflow changed/);
  assert.match(curateWithAdapter(diff, "printf reviewed"), /# Model Notes\n\nreviewed/);
});

test("validates model command values and failures", () => {
  assert.throws(() => parseCliArgs(["sample.diff", "--model-command"]), /requires a value/);
  assert.equal(parseCliArgs(["--model-command", "cat"]).file, null);
  assert.throws(() => curate(""), /No git diff/);
  assert.throws(
    () => curateWithAdapter("diff --git a/a b/a\n+x", "node -e \"process.exit(9)\""),
    /exit 9/
  );
});
