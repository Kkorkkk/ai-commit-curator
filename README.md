# AI Commit Curator

[![CI](https://github.com/Kkorkkk/ai-commit-curator/actions/workflows/ci.yml/badge.svg)](https://github.com/Kkorkkk/ai-commit-curator/actions/workflows/ci.yml)

Summarize a git diff into a Conventional Commit, PR body, risks, and test hints.

## Install

```bash
npx ai-commit-curator examples/sample.diff
npm install -g ai-commit-curator
ai-commit-curator examples/sample.diff
```

## Quick start

```bash
npm install
npm test
git diff | node src/index.js
node src/index.js examples/sample.diff
node src/index.js examples/sample.diff --model-command "your-model-wrapper"
```

By default this is a deterministic diff curator, not a hidden hosted AI call. Use `--model-command` to pipe structured diff context to your own model wrapper and append model notes. The model command runs without a shell.

Model commands have a 30 second timeout and bounded output. Empty diffs fail instead of generating a misleading commit draft.

Example output:

```md
# Commit
feat: update src

# Risks
- Public CLI or entry point changed; run a manual command smoke test.
```

## Limits

The built-in mode is heuristic. It is useful for first drafts, but human review should still decide the final commit message and PR body.

## Status

Experimental 0.1 CLI. The tool is small on purpose, with no runtime dependencies. Review generated commands, code, and reports before using them in production workflows.
