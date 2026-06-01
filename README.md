# AI Commit Curator

Summarize a git diff into a Conventional Commit, PR body, risks, and test hints.

## Quick start

```bash
npm install
npm test
git diff | node src/index.js
node src/index.js examples/sample.diff
```