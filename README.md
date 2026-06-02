# AI Commit Curator

[![CI](https://github.com/Kkorkkk/ai-commit-curator/actions/workflows/ci.yml/badge.svg)](https://github.com/Kkorkkk/ai-commit-curator/actions/workflows/ci.yml)

## Overview / 项目说明

English: AI Commit Curator turns a git diff into a structured commit and PR draft with risk notes and a test plan. The built-in mode is deterministic, and an optional trusted model command can add model-generated review notes without hiding network calls inside the CLI.

中文：AI Commit Curator 会把 git diff 整理成结构化的提交信息和 PR 草稿，并附带风险提示与测试计划。内置模式是确定性的，也可以选择调用你信任的模型命令补充 AI 评审意见，CLI 本身不会偷偷发起托管模型请求。

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
