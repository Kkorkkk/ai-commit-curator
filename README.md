# AI Commit Curator

Summarize a git diff into a Conventional Commit, PR body, risks, and test hints.

## Quick start

```bash
npm install
npm test
git diff | node src/index.js
node src/index.js examples/sample.diff
node src/index.js examples/sample.diff --model-command "your-model-wrapper"
```

By default this is a deterministic diff curator, not a hidden hosted AI call. Use `--model-command` to pipe structured diff context to your own model wrapper and append model notes.

## Limits

The built-in mode is heuristic. It is useful for first drafts, but human review should still decide the final commit message and PR body.
