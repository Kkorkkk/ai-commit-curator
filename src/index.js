#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function parseDiff(diff) {
  const files = [];
  for (const line of diff.split(/\r?\n/)) {
    const match = line.match(/^diff --git a\/(.*?) b\/(.*)$/);
    if (match) files.push({ from: match[1], to: match[2], added: 0, removed: 0 });
    else if (files.length && line.startsWith("+") && !line.startsWith("+++")) files.at(-1).added++;
    else if (files.length && line.startsWith("-") && !line.startsWith("---")) files.at(-1).removed++;
  }
  return files;
}

function riskHints(files) {
  const hints = [];
  if (files.some((file) => /package-lock|pnpm-lock|yarn\.lock/.test(file.to))) hints.push("Dependency lockfile changed; verify install reproducibility.");
  if (files.some((file) => /\.github\/workflows\//.test(file.to))) hints.push("CI workflow changed; verify branch and permission behavior.");
  if (files.some((file) => /migrations?|schema|database/i.test(file.to))) hints.push("Data/schema path changed; confirm migration and rollback behavior.");
  if (files.some((file) => /src\/index|bin\//.test(file.to))) hints.push("Public CLI or entry point changed; run a manual command smoke test.");
  if (files.some((file) => /test|spec/i.test(file.to))) hints.push("Tests changed; ensure they fail before the code fix and pass after.");
  return hints.length ? hints : ["Review behavior around changed public entry points."];
}

function testHints(files) {
  const hints = ["Run the relevant unit tests."];
  if (files.some((file) => /package\.json|lock/.test(file.to))) hints.push("Run a clean install or npm ci.");
  if (files.some((file) => /\.github\/workflows\//.test(file.to))) hints.push("Dry-run or inspect the GitHub Actions workflow.");
  if (files.some((file) => /src\/index|bin\//.test(file.to))) hints.push("Run the CLI against a real fixture.");
  if (!files.length) hints.push("Paste a real git diff and rerun this tool.");
  return hints;
}

export function curate(diff) {
  const files = parseDiff(diff);
  const areas = [...new Set(files.map((file) => file.to.split("/")[0]))];
  const type = files.some((file) => /test|spec/.test(file.to)) ? "test" : files.some((file) => /readme|docs?/i.test(file.to)) ? "docs" : "feat";
  const subject = areas.length ? `${type}: update ${areas.slice(0, 2).join(" and ")}` : `${type}: update project files`;
  const changed = files.map((file) => `- ${file.to}: +${file.added} -${file.removed}`).join("\n") || "- No file-level diff detected";
  return `# Commit\n\n${subject}\n\n# PR Summary\n\n${changed}\n\n# Risks\n\n${riskHints(files).map((hint) => `- ${hint}`).join("\n")}\n\n# Test Plan\n\n${testHints(files).map((hint) => `- ${hint}`).join("\n")}\n`;
}

export function curateWithAdapter(diff, command) {
  const [cmd, ...args] = splitCommand(command);
  if (!cmd) throw new Error("--model-command requires a command.");
  const context = { files: parseDiff(diff), draft: curate(diff) };
  const result = spawnSync(cmd, args, {
    input: JSON.stringify(context, null, 2),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"]
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Model command failed with exit ${result.status}: ${result.stderr || result.stdout || ""}`.trim());
  const modelNotes = result.stdout.trim();
  return modelNotes ? `${context.draft}\n# Model Notes\n\n${modelNotes}\n` : context.draft;
}

function splitCommand(command) {
  if (!command || typeof command !== "string") return [];
  const tokens = [];
  let current = "";
  let quote = null;
  for (let index = 0; index < command.length; index++) {
    const char = command[index];
    if (quote) {
      if (char === "\\") current += command[++index] || "";
      else if (char === quote) quote = null;
      else current += char;
    } else if (char === "'" || char === '"') {
      quote = char;
    } else if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (quote) throw new Error("Unclosed quote in command.");
  if (current) tokens.push(current);
  return tokens;
}

async function stdin() {
  return await new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => resolve(data));
  });
}

function flagValue(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

export function parseCliArgs(args) {
  let file = null;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--model-command") {
      index++;
    } else if (!args[index].startsWith("--")) {
      file = args[index];
      break;
    }
  }
  return {
    file,
    modelCommand: flagValue(args, "--model-command")
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { file, modelCommand } = parseCliArgs(process.argv.slice(2));
    const diff = file ? readFileSync(file, "utf8") : await stdin();
    console.log(modelCommand ? curateWithAdapter(diff, modelCommand) : curate(diff));
  } catch (error) {
    console.error(`ai-commit-curator: ${error.message}`);
    process.exit(2);
  }
}
