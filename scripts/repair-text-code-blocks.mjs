#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const check = args.has("--check");
const verbose = args.has("--verbose");

if (args.has("--help")) {
  console.log(`Usage: node scripts/repair-text-code-blocks.mjs [options]

Audits code blocks whose language is "text", detects likely source code, and
prepares safer formatting and language metadata updates.

Options:
  --write    Apply updates to src/data/posts and public/data/posts
  --check    Exit with status 1 when the audit finds pending updates
  --verbose  Print every proposed update
  --help     Show this help

The default mode is read-only.`);
  process.exit(0);
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "src/data/posts");
const publicRoot = path.join(projectRoot, "public/data/posts");

function isJson(value) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function inferLanguage(code, title) {
  const value = code.trim();

  if (/^[{[]/.test(value) && isJson(value)) return "json";

  if (
    (/^\{/.test(value) || /^"[^"]+"\s*:/.test(value)) &&
    /(VS.Code|Vscode|Test|Elasticsearch|Nodejs|NestJS)/i.test(title)
  ) {
    return "jsonc";
  }

  if (
    /^\s*(SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|CREATE\s+(TABLE|TYPE|INDEX|MATERIALIZED\s+VIEW|SERVER|USER\s+MAPPING|FOREIGN\s+TABLE|CONSTRAINT)|ALTER(?:\s+TABLE|\s+USER)|DROP\s+(TABLE|INDEX|DATABASE)|WITH\s+\w+\s+AS|MERGE\s+INTO|START\s+TRANSACTION|SET\s+GLOBAL|SHOW\s+GRANTS|WHERE\s+)\b/i.test(
      value,
    )
  ) {
    return "sql";
  }

  if (
    /<\?php|\bSchema::|curl_setopt\(|Redirect::|return\s+view\(|\$[A-Za-z_]\w*\s*(?:=|->)|->\w+\(/.test(
      value,
    ) ||
    (/Zarinpal.*Laravel|Laravel.*Zarinpal/i.test(title) &&
      /\b(if|else\s+if|strlen|isset|empty|array_key_exists)\s*\(/.test(value))
  ) {
    return "php";
  }

  if (
    /Solidity|Smart.Contract|Crowdfunding/i.test(title) &&
    /\b(contract|modifier|event)\s+\w+|mapping\s*\(|pragma\s+solidity|receive\(\)\s+external|require\s*\(|msg\.(sender|value)|address\[\]\s+\w+/.test(
      value,
    )
  ) {
    return "solidity";
  }

  if (
    /(^|\n)\s*(package\s+\w+|func\s+(?:\([^)]*\)\s*)?\w+|type\s+\w+\s+struct)\b/.test(value) ||
    /\w+\s*:=\s*|fmt\.|fx\.(Provide|Invoke)|colly\.|zap\.|require\.NoError|http\.(NewRequest|Status)|grpc\.Dial|context\.(Background|TODO)|ethclient\.|\/\/go:generate|\/\/\s+@\w+|\bgo\s+func\(|\w+\s+\w+\s*=\s*&\w+\{/.test(
      value,
    ) ||
    (/\bGo(?:lang)?\b/i.test(title) &&
      /\b(if|for|defer|return|type|struct|interface|const)\b|[A-Za-z_]\w*\.[A-Za-z_]\w*\(|\w+\s+func\(|^\w+\s*\(|^\w+:\s*\w+\(/.test(
        value,
      ))
  ) {
    return "go";
  }

  if (
    /\b(async\s+\w+\(|Promise<|AuthCredentialsDto|Task\[\]|private\s+\w+|public\s+\w+|readonly\s+\w+|this\.\w+|ConfigModule\.forRoot|@(?:Controller|Injectable|Module))/.test(
      value,
    ) ||
    (/NestJS/i.test(title) &&
      /\b(await|constructor|return|process\.env|Module\.register)\b|this\.\w+|@\w+\(/.test(value))
  ) {
    return "typescript";
  }

  if (
    /\b(const|let|var)\s+\w+\s*=|=>\s*[{(]|describe\(|it\(|web3\.|assert\.equal|db\.query\(/.test(
      value,
    ) ||
    (/Smart.Contract|Nodejs/i.test(title) && /\btry\s*\{[\s\S]*\bawait\b/.test(value)) ||
    /\b(ObjectId|NumberLong|ISODate)\(/.test(value)
  ) {
    return "javascript";
  }

  if (
    /(^|\n)\s*(def\s+\w+\(|class\s+\w+.*:|from\s+\S+\s+import|import\s+\w+|@staticmethod|%pip\s+|>>>\s*import|python3import)|\b(tf\.|pd\.|np\.|DataFrame\(|Word2Vec\(|model\.fit\(|print\(|open\(|os\.environ|client\.fine_tuning|client\.chat|vectorstore\s*=|loader\s*=|rag_chain|text_splitter|Parse\.|sent_tokenize|word_tokenize|tickets\.list_tickets)/.test(
      value,
    ) ||
    (/(Python|Tensorflow|Topic.Modeling|RAG|Fine.tune|Open.AI)/i.test(title) &&
      /^\s*[A-Za-z_]\w*\s*=/m.test(value))
  ) {
    return "python";
  }

  if (
    /^\s*(query|mutation|subscription|type\s+\w+|scalar\s+\w+)\b/.test(value) &&
    /[{}]/.test(value)
  ) {
    return "graphql";
  }

  if (
    /^\s*(apiVersion:|kind:|services:|version:\s*v?\d|name:\s+.+\n(?:on|jobs):|image:\s+\S+|before_script:|-\s+(?:run|uses):)/m.test(
      value,
    ) ||
    /(?:^|\n)\s*(workflow_dispatch:|permissions:|plugins:|managed:|modules:)\s*/.test(value)
  ) {
    return "yaml";
  }

  if (
    /^\s*(#!\/bin\/(?:ba)?sh|sudo\s+|git\s+|go(?:-micro)?\s+(?:get|install|mod|run|test|build|call|new)\b|docker(?:-compose)?\s+|kubectl\s+|curl\s+|wget\s+|ssh(?:-keygen)?\s*|rsync\s+|nats\s+|buf\s+|pip3?\s+|python3?\s+-m\s+|export\s+\w+=|make(?:\s|$)|cd\s+\S+|aws\s+|liquibase\s+|scp\s+|find\s+|cat\s+|dig\s+|ping\s+|mysql\s+|nvcc\s+|cp\s+|for\s+\w+\s+in\s+|[A-Za-z_]\w*=\$\()/m.test(
      value,
    ) ||
    (/^\s*#/.test(value) &&
      /(sudo|curl|wget|git|go|docker|kubectl|python|pip|export)\s+/.test(value))
  ) {
    return "bash";
  }

  if (/^\s*<[A-Za-z_][\s\S]*<\/[A-Za-z_][^>]*>\s*$/.test(value)) {
    return "xml";
  }

  if (
    /(^|\n)\s*(server|location|upstream)\s*(?:[^{]*)\{|try_files\s+\$|proxy_pass\s+https?:/.test(
      value,
    )
  ) {
    return "nginx";
  }

  if (/(^|\n)\s*(sonar\.\w+|[A-Z][A-Z0-9_]+)\s*=\s*\S+/.test(value) && !/[{}]/.test(value)) {
    return "properties";
  }

  return null;
}

function mapOutsideQuotes(code, transform) {
  const parts = [];
  let plain = "";
  let quoted = "";
  let quote = null;

  const flushPlain = () => {
    if (plain) parts.push(transform(plain));
    plain = "";
  };
  const flushQuoted = () => {
    if (quoted) parts.push(quoted);
    quoted = "";
  };

  for (let index = 0; index < code.length; index += 1) {
    const character = code[index];
    if (!quote) {
      if (character === "'" || character === '"' || character === "`") {
        flushPlain();
        quote = character;
        quoted = character;
      } else {
        plain += character;
      }
      continue;
    }

    quoted += character;
    if (character === "\\" && index + 1 < code.length) {
      quoted += code[index + 1];
      index += 1;
    } else if (character === quote) {
      if (code[index + 1] === quote) {
        quoted += code[index + 1];
        index += 1;
      } else {
        quote = null;
        flushQuoted();
      }
    }
  }

  if (quote) flushQuoted();
  else flushPlain();
  return parts.join("");
}

function formatGo(code) {
  const prefix = "package snippets\n\nfunc example() {\n";
  const result = spawnSync("gofmt", {
    input: `${prefix}${code}\n}\n`,
    encoding: "utf8",
    timeout: 1_000,
  });
  if (result.status !== 0) return code.trim();

  return result.stdout
    .split("\n")
    .slice(3, -2)
    .map((line) => (line.startsWith("\t") ? line.slice(1).replaceAll("\t", "    ") : line))
    .join("\n")
    .trim();
}

function formatSql(code) {
  const keywords =
    "SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON CONFLICT|ON DUPLICATE|RETURNING|UNION ALL|UNION|AS SELECT|WHEN MATCHED|WHEN NOT MATCHED|THEN UPDATE";
  return mapOutsideQuotes(code, (plain) =>
    plain.replace(new RegExp(`\\s+(?=(${keywords})\\b)`, "gi"), "\n").replace(/\s*;\s*/g, ";\n"),
  ).trim();
}

function formatShell(code) {
  const command =
    "#!\\/bin\\/(?:ba)?sh|sudo\\s+|git\\s+|go(?:-micro)?\\s+(?:get|install|mod|run|test|build|call|new)\\b|docker(?:-compose)?\\s+|kubectl\\s+|curl\\s+|wget\\s+|ssh(?:-keygen)?\\s*|rsync\\s+|nats\\s+|buf\\s+|pip3?\\s+|python3?\\s+-m\\s+|export\\s+|make(?:\\s|$)|cd\\s+|aws\\s+|liquibase\\s+|scp\\s+|find\\s+|cat\\s+|dig\\s+|ping\\s+|mysql\\s+|nvcc\\s+";
  return mapOutsideQuotes(code, (plain) =>
    plain
      .replace(new RegExp(`(?<=\\S)(?=(${command}))`, "gm"), "\n")
      .replace(/(?<=\S)\s+(?=(?:#\s+[A-Z]|wait$))/gm, "\n"),
  ).trim();
}

function formatPython(code) {
  return mapOutsideQuotes(code, (plain) =>
    plain
      .replace(/(?<=\w)(?=from\s+\S+\s+import|userdata\.|retriever\s*=|prompt\s*=|llm\s*=)/g, "\n")
      .replace(/python3(?=import\s+)/g, "python3\n")
      .replace(/(?<=\))(?=>>>|[A-Za-z_]\w*\.)/g, "\n")
      .replace(
        /(?<=[)\]]|')(?=(?:[A-Za-z_]\w*\s*=|(?:for|if|with|return)\s+|print\(|client\.|rag_chain\.|os\.environ))/g,
        "\n",
      )
      .replace(/(?<=\S)(?=(?:import\s+\w+|@staticmethod|def\s+\w+\())/g, "\n"),
  ).trim();
}

function formatTree(code) {
  return code
    .replace(/(?<!^)(?=(?:│\s*)*[├└]──)/g, "\n")
    .replace(/(?<=\.(?:go|json|sql|js|ts|yml|yaml|env))(?=(?:[├└│]|[A-Za-z_]))/g, "\n")
    .trim();
}

function formatJson(code) {
  try {
    return JSON.stringify(JSON.parse(code), null, 2);
  } catch {
    const fragment = code.trim().replace(/,\s*$/, "");
    try {
      return JSON.stringify(JSON.parse(`{${fragment}}`), null, 2);
    } catch {
      return code.trim();
    }
  }
}

function formatTextStructure(code) {
  if ((code.match(/→/g)?.length ?? 0) >= 2) {
    return code
      .replace(/(?<=\))(?=[A-Z])/g, "\n")
      .replace(/(?<=\w)\s+(?=[A-Za-z_]+:[A-Za-z_]+\s+→)/g, "\n")
      .trim();
  }
  return code.replaceAll("||", "|\n|").trim();
}

async function formatCode(code, lang) {
  if (lang === "json") return formatJson(code);
  if (lang === "go") return formatGo(code);
  if (lang === "sql") return formatSql(code);
  if (lang === "bash") return formatShell(code);
  if (lang === "python") return formatPython(code);

  const parser = {
    jsonc: "json5",
    javascript: "babel",
    typescript: "typescript",
    graphql: "graphql",
    yaml: "yaml",
  }[lang];
  if (!parser) return code.trim();

  try {
    return (await prettier.format(code, { parser })).trim();
  } catch {
    return code.trim();
  }
}

function stagePair(sourcePath, publicPath, serialized) {
  const sourceTemp = `${sourcePath}.repair-${process.pid}.tmp`;
  const publicTemp = `${publicPath}.repair-${process.pid}.tmp`;
  try {
    fs.writeFileSync(sourceTemp, serialized);
    fs.writeFileSync(publicTemp, serialized);
    JSON.parse(fs.readFileSync(sourceTemp, "utf8"));
    JSON.parse(fs.readFileSync(publicTemp, "utf8"));
    fs.renameSync(sourceTemp, sourcePath);
    fs.renameSync(publicTemp, publicPath);
  } finally {
    for (const temporaryPath of [sourceTemp, publicTemp]) {
      if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    }
  }
}

const changes = [];
const languageCounts = Object.create(null);
const files = fs
  .readdirSync(sourceRoot)
  .filter((filename) => filename.endsWith(".json"))
  .sort();

for (const filename of files) {
  const sourcePath = path.join(sourceRoot, filename);
  const publicPath = path.join(publicRoot, filename);
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const publicText = fs.readFileSync(publicPath, "utf8");
  const sourcePost = JSON.parse(sourceText);
  const publicPost = JSON.parse(publicText);

  if (JSON.stringify(sourcePost) !== JSON.stringify(publicPost)) {
    throw new Error(`${filename}: source and public data differ`);
  }

  let articleChanged = false;
  for (const [index, block] of sourcePost.content.entries()) {
    if (block.type !== "code" || block.lang !== "text") continue;

    const lang = inferLanguage(block.code, sourcePost.title);
    const isTree =
      (block.code.match(/[├└]──/g)?.length ?? 0) >= 2 && block.code.split("\n").length <= 5;
    const isStructure =
      ((block.code.match(/→/g)?.length ?? 0) >= 2 ||
        (block.code.includes("||") && /^\s*\|/.test(block.code))) &&
      block.code.split("\n").length <= 5;
    if (!lang && !isTree && !isStructure) continue;

    const nextLanguage = lang ?? "text";
    const nextCode = lang
      ? await formatCode(block.code, lang)
      : isTree
        ? formatTree(block.code)
        : formatTextStructure(block.code);
    if (nextLanguage === block.lang && nextCode === block.code) continue;

    sourcePost.content[index] = {
      ...block,
      lang: nextLanguage,
      code: nextCode,
    };
    publicPost.content[index] = { ...sourcePost.content[index] };
    articleChanged = true;
    changes.push({
      filename,
      index,
      from: block.lang,
      to: nextLanguage,
      addedLines: nextCode.split("\n").length - block.code.split("\n").length,
    });
    languageCounts[nextLanguage] = (languageCounts[nextLanguage] ?? 0) + 1;
  }

  if (articleChanged && write) {
    const sourceSerialized = `${JSON.stringify(sourcePost, null, 2)}\n`;
    const publicSerialized = `${JSON.stringify(publicPost, null, 2)}\n`;
    if (sourceSerialized !== publicSerialized) {
      throw new Error(`${filename}: generated source/public data differ`);
    }
    stagePair(sourcePath, publicPath, sourceSerialized);
  }
}

if (verbose) {
  for (const change of changes) {
    console.log(
      `${change.filename} content[${change.index}]: ${change.from} -> ${change.to}, ${change.addedLines >= 0 ? "+" : ""}${change.addedLines} lines`,
    );
  }
}

console.log(
  JSON.stringify(
    {
      mode: write ? "write" : "audit",
      articlesScanned: files.length,
      articlesWithChanges: new Set(changes.map(({ filename }) => filename)).size,
      pendingOrAppliedBlocks: changes.length,
      byLanguage: languageCounts,
    },
    null,
    2,
  ),
);

if (check && changes.length > 0) process.exitCode = 1;
