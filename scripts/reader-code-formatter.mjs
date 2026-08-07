import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function runGofmt(source) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "blog-go-format-"));
  const filename = path.join(directory, "snippet.go");
  try {
    fs.writeFileSync(filename, source);
    const result = spawnSync("gofmt", ["-w", filename], {
      encoding: "utf8",
      timeout: 2_000,
    });
    return result.status === 0 ? fs.readFileSync(filename, "utf8").trimEnd() : null;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function formatGo(source) {
  // A blog block can be a complete file, declarations without a package line,
  // or a few statements copied from a function. Try each shape independently
  // and leave invalid/illustrative snippets untouched. gofmt only changes
  // whitespace, so this never invents identifiers, expressions, or imports.
  const firstToken = source
    .replace(/^(?:(?:\/\/[^\n]*\n)|(?:\/\*[\s\S]*?\*\/\s*))*/, "")
    .trimStart();

  if (/^package\b/.test(firstToken)) {
    return runGofmt(source) ?? source;
  }

  const declarationPrefix = "package snippet\n\n";
  if (/^(?:import|const|var|type|func)\b/.test(firstToken)) {
    const declaration = runGofmt(`${declarationPrefix}${source}\n`);
    if (declaration?.startsWith(declarationPrefix)) {
      return declaration.slice(declarationPrefix.length).trimEnd();
    }
    return source;
  }

  const statementPrefix = "package snippet\n\nfunc _() {\n";
  const statements = runGofmt(`${statementPrefix}${source}\n}\n`);
  if (statements?.startsWith(statementPrefix) && statements.endsWith("\n}")) {
    return statements
      .slice(statementPrefix.length, -2)
      .split("\n")
      .map((line) => (line.startsWith("\t") ? line.slice(1) : line))
      .join("\n")
      .trimEnd();
  }

  return source;
}

function formatJsonPayload(source) {
  const payload = source.match(/(-d\s+')([\s\S]*)(\'\s*)$/);
  if (!payload) return source;

  try {
    const json = JSON.stringify(JSON.parse(payload[2]), null, 2)
      .split("\n")
      .map((line, index) => (index === 0 ? line : `  ${line}`))
      .join("\n");
    const command = source
      .slice(0, payload.index)
      .split("\n")
      .filter((line) => line.trim())
      .map((line, index) => (index === 0 ? line.trim() : `  ${line.trim()}`))
      .join("\n");
    return `${command}\n  -d '${json}'`;
  } catch {
    return source;
  }
}

function formatOpenFga(source) {
  if (!/^model\s*$/m.test(source) || !/^\s*schema\s+\d/m.test(source)) return source;
  return source
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const value = line.trim();
      if (/^define\s+/.test(value)) return `    ${value}`;
      if (/^(?:schema\s+|relations$)/.test(value)) return `  ${value}`;
      return value;
    })
    .join("\n");
}

function bracketDelta(line) {
  let delta = 0;
  let quote = null;
  let escaped = false;
  for (const character of line) {
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
    } else if (['"', "'"].includes(character)) quote = character;
    else if ("([{".includes(character)) delta++;
    else if (")]}".includes(character)) delta--;
  }
  return delta;
}

function formatLoosePython(source) {
  if (!/(?:^|\n)(?:def\s+\w+|if __name__\s*==)/.test(source)) return source;
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const output = [];
  let inFunction = false;
  let suite = "";
  let continuationDepth = 0;
  let continuationBase = 0;

  for (const line of lines) {
    if (/^(?:def|class)\s+\w+/.test(line)) {
      if (output.length && output.at(-1) !== "") output.push("");
      inFunction = true;
      suite = "";
      continuationDepth = 0;
      output.push(line);
      continue;
    }
    if (/^if __name__\s*==/.test(line)) {
      if (output.at(-1) !== "") output.push("");
      inFunction = false;
      suite = "main";
      continuationDepth = 0;
      output.push(line);
      continue;
    }
    if (/^# Usage\b/.test(line)) {
      if (output.at(-1) !== "") output.push("");
      inFunction = false;
      suite = "";
      continuationDepth = 0;
      output.push(line);
      continue;
    }

    let baseIndent = inFunction || suite === "main" ? 1 : 0;
    if (suite === "with") baseIndent = 2;
    if (suite === "for-row" || suite === "for-batch") baseIndent = 2;

    if (suite === "with" && /^(?:keycloak_users|openfga_writes)\s*=/.test(line)) {
      suite = "";
      baseIndent = 1;
    }
    if (suite === "for-row" && /^kc_token\s*=/.test(line)) {
      suite = "";
      baseIndent = 1;
    }

    if (continuationDepth > 0) {
      const closesFirst = /^[\])}]/.test(line);
      const indent = continuationBase + Math.max(0, continuationDepth - (closesFirst ? 1 : 0));
      output.push(`${"    ".repeat(indent)}${line}`);
      continuationDepth += bracketDelta(line);
      continue;
    }

    output.push(`${"    ".repeat(baseIndent)}${line}`);
    const delta = bracketDelta(line);
    if (delta > 0) {
      continuationDepth = delta;
      continuationBase = baseIndent;
    }

    if (/^with\b.*:$/.test(line)) suite = "with";
    else if (/^for\s+row\b.*:$/.test(line)) suite = "for-row";
    else if (/^for\s+\w+\b.*:$/.test(line)) suite = "for-batch";
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n");
}

function formatCronJobYaml(source) {
  if (!/^kind:\s*CronJob$/m.test(source)) return source;
  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let specCount = 0;
  return lines
    .map((line) => {
      if (/^(?:apiVersion|kind|metadata):/.test(line)) return line;
      if (line === "spec:") {
        specCount++;
        return `${"  ".repeat((specCount - 1) * 2)}${line}`;
      }
      if (/^name:/.test(line)) return `  ${line}`;
      if (/^(?:schedule|jobTemplate):/.test(line)) return `  ${line}`;
      if (/^template:/.test(line)) return `      ${line}`;
      if (/^containers:/.test(line)) return `          ${line}`;
      if (/^- name:/.test(line)) return `            ${line}`;
      if (/^image:/.test(line)) return `              ${line}`;
      if (/^restartPolicy:/.test(line)) return `          ${line}`;
      return line;
    })
    .join("\n");
}

function formatDecisionDiagram(source) {
  if (!source.includes("DECISION & DATA FLOW ARCHITECTURE")) return source;
  return `DECISION & DATA FLOW ARCHITECTURE

┌──────────────────────────────────────────────────────────────────────┐
│ 1. LEGACY MONOLITH DATABASE                                          │
├──────────────────────────────────────────────────────────────────────┤
│ PostgreSQL / MySQL                                                   │
│ Tables: users_user, users_user_groups, auth_group, auth_permission   │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ Phase 1: aggregated JSON query
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. ETL SYNC ENGINE / CRON WORKER                                    │
├──────────────────────────────────────────────────────────────────────┤
│ • Extract user profiles, groups, and permissions                    │
│ • Transform into Keycloak JSON and OpenFGA tuples                   │
└───────────────────┬────────────────────────────────┬─────────────────┘
                    │ Phase 2: HTTP REST             │ Phase 3: HTTP REST
                    ▼                                ▼
┌────────────────────────────────┐  ┌──────────────────────────────────┐
│ KEYCLOAK IDENTITY PROVIDER     │  │ OPENFGA AUTHORIZATION ENGINE     │
├────────────────────────────────┤  ├──────────────────────────────────┤
│ • User credentials             │  │ • Relationship graph (ReBAC)    │
│ • Profile attributes           │  │ • Fine-grained permissions      │
│ • Global realm roles           │  │ • Object/resource mapping       │
└────────────────┬───────────────┘  └─────────────────┬────────────────┘
                 │ Authenticate and issue JWT         │ Check permission
                 └──────────────────┬──────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. APPLICATION BACKEND / MICROSERVICES API MIDDLEWARE               │
└──────────────────────────────────────────────────────────────────────┘`;
}

export function formatReaderCode(source, language, { preserveWhitespace = false } = {}) {
  const normalized = source.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return normalized;
  if (preserveWhitespace) return formatDecisionDiagram(normalized);
  if (language === "go") return formatGo(normalized);
  if (language === "bash") return formatJsonPayload(normalized);
  if (language === "python") return formatLoosePython(normalized);
  if (language === "yaml") return formatCronJobYaml(normalized);
  if (language === "text") return formatOpenFga(normalized);
  return normalized;
}
