#!/usr/bin/env node
import { readFileSync } from "node:fs";

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

export function curate(diff) {
  const files = parseDiff(diff);
  const areas = [...new Set(files.map((file) => file.to.split("/")[0]))];
  const type = files.some((file) => /test|spec/.test(file.to)) ? "test" : files.some((file) => /readme|docs?/i.test(file.to)) ? "docs" : "feat";
  const subject = areas.length ? `${type}: update ${areas.slice(0, 2).join(" and ")}` : `${type}: update project files`;
  const changed = files.map((file) => `- ${file.to}: +${file.added} -${file.removed}`).join("\n") || "- No file-level diff detected";
  return `# Commit\n\n${subject}\n\n# PR Summary\n\n${changed}\n\n# Risks\n\n- Review behavior around changed public entry points.\n\n# Test Plan\n\n- Run the relevant unit tests and one manual smoke test.\n`;
}

async function stdin() {
  return await new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => resolve(data));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  const diff = file ? readFileSync(file, "utf8") : await stdin();
  console.log(curate(diff));
}
