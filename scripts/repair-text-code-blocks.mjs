import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import prettier from "prettier";

const sourceRoot = "src/data/posts";
const publicRoot = "public/data/posts";

function inferLanguage(code, title) {
  const value = code.trim();

  if (
    /^[{[]/.test(value) &&
    (() => {
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    })()
  ) {
    return "json";
  }

  if (
    (/^\{/.test(value) || /^"[^"]+"\s*:/.test(value)) &&
    /(VS.Code|Vscode|Test|Elasticsearch|Nodejs|NestJS)/i.test(title)
  ) {
    return "jsonc";
  }

  if (
    /^"[^"]+"\s*:/.test(value) &&
    /(VS.Code|Vscode|Test|Elasticsearch|NestJS)/i.test(title)
  ) {
    return "json";
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
    /\b(contract|modifier|event)\s+\w+|mapping\s*\(|pragma\s+solidity|receive\(\)\s+external|require\s*\(|msg\.(sender|value)|address\[\]\s+\w+/.test(
      value,
    ) &&
    /Solidity|Smart.Contract|Crowdfunding/i.test(title)
  ) {
    return "solidity";
  }

  if (
    /(^|\n)\s*(package\s+\w+|func\s+(?:\([^)]*\)\s*)?\w+|type\s+\w+\s+struct)\b/.test(
      value,
    ) ||
    /\w+\s*:=\s*|fmt\.|fx\.(Provide|Invoke)|colly\.|zap\.|require\.NoError|http\.(NewRequest|Status)|grpc\.Dial|context\.(Background|TODO)|ethclient\.|\/\/go:generate|\/\/\s+@\w+|\bgo\s+func\(|\w+\s+\w+\s*=\s*&\w+\{/.test(
      value,
    ) ||
    (/\bGo(?:lang)?\b/i.test(title) &&
      /\b(if|for|defer|return|type|struct|interface|const)\b|[A-Za-z_]\w*\.[A-Za-z_]\w*\(|\w+\s+func\(|^\w+\s*\(|^\w+:\s*\w+\(/.test(value))
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
    (/Smart.Contract|Nodejs/i.test(title) && /\btry\s*\{[\s\S]*\bawait\b/.test(value))
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
    /^\s*(apiVersion:|kind:|services:|version:\s*v?\d|name:\s+.+\n(?:on|jobs):|image:\s+\S+)/m.test(
      value,
    ) ||
    /(?:^|\n)\s*(workflow_dispatch:|permissions:|plugins:|managed:|modules:)\s*/.test(
      value,
    )
  ) {
    return "yaml";
  }

  if (
    /^\s*(before_script:|-\s+(?:run|uses):|name:\s+.+(?:on:|push:|pull_request:))/m.test(
      value,
    )
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

  if (
    /(^|\n)\s*(sonar\.\w+|[A-Z][A-Z0-9_]+)\s*=\s*\S+/.test(value) &&
    !/[{}]/.test(value)
  ) {
    return "properties";
  }

  if (/\b(ObjectId|NumberLong|ISODate)\(/.test(value)) {
    return "javascript";
  }

  return null;
}

function formatGo(code) {
  const wrapperStart = "package snippets\n\nfunc example() {\n";
  const wrapperEnd = "\n}\n";
  const wrapped = `${wrapperStart}${code}${wrapperEnd}`;
  const result = spawnSync("gofmt", {
    input: wrapped,
    encoding: "utf8",
    timeout: 1_000,
  });

  if (result.status !== 0) return code;

  const lines = result.stdout.split("\n");
  const body = lines.slice(3, -2).map((line) =>
    line.startsWith("\t") ? line.slice(1).replaceAll("\t", "    ") : line,
  );
  return body.join("\n").trim();
}

function formatSql(code) {
  const keywords =
    "SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|VALUES|SET|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON CONFLICT|ON DUPLICATE|RETURNING|UNION ALL|UNION|AS SELECT|WHEN MATCHED|WHEN NOT MATCHED|THEN UPDATE";
  return code
    .replace(
      new RegExp(`\\s+(?=(${keywords})\\b)`, "gi"),
      "\n",
    )
    .replace(/\s*(;)\s*/g, "$1\n")
    .trim();
}

function formatShell(code) {
  const command =
    "#!\\/bin\\/(?:ba)?sh|sudo\\s+|git\\s+|go(?:-micro)?\\s+(?:get|install|mod|run|test|build|call|new)\\b|docker(?:-compose)?\\s+|kubectl\\s+|curl\\s+|wget\\s+|ssh(?:-keygen)?\\s*|rsync\\s+|nats\\s+|buf\\s+|pip3?\\s+|python3?\\s+-m\\s+|export\\s+|make(?:\\s|$)|cd\\s+|aws\\s+|liquibase\\s+|scp\\s+|find\\s+|cat\\s+|dig\\s+|ping\\s+|mysql\\s+|nvcc\\s+";
  return code
    .replace(new RegExp(`(?<=[A-Za-z0-9"'_./)>-])(?=(${command}))`, "gm"), "\n")
    .replace(
      new RegExp(`(?<=\\S)(?=(${command}))`, "gm"),
      "\n",
    )
    .replace(/(?<=\S)\s+(?=(?:#\s+[A-Z]|wait$))/gm, "\n")
    .trim();
}

function formatPython(code) {
  return code
    .replace(/(?<=\w)(?=from\s+\S+\s+import)/g, "\n")
    .replace(/(?<=\w)(?=userdata\.)/g, "\n")
    .replace(/(?<=\w)(?=retriever\s*=|prompt\s*=|llm\s*=)/g, "\n")
    .replace(/python3(?=import\s+)/g, "python3\n")
    .replace(/(?<=\))(?=>>>)/g, "\n")
    .replace(
      /(?<=[)\]'"])(?=(?:[A-Za-z_]\w*\s*=|(?:for|if|with|return)\s+|print\(|client\.|rag_chain\.|os\.environ))/g,
      "\n",
    )
    .replace(/(?<=\))(?=[A-Za-z_]\w*\.)/g, "\n")
    .replace(/(?<=\S)(?=(?:from\s+\S+\s+import|import\s+\w+|@staticmethod|def\s+\w+\())/g, "\n")
    .trim();
}

function formatTree(code) {
  return code
    .replace(/(?<!^)(?=(?:│\s*)*[├└]──)/g, "\n")
    .replace(/(?<=\\.(?:go|json|sql|js|ts|yml|yaml|env))(?=(?:[├└│]|[A-Za-z_]))/g, "\n")
    .trim();
}

function formatJsonFragment(code) {
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
  if (code.includes("||") && /^\s*\|/.test(code)) {
    return code.replaceAll("||", "|\n|").trim();
  }
  return code;
}

async function formatCode(code, lang) {
  if (lang === "json") return formatJsonFragment(code);
  if (lang === "go") return formatGo(code);
  if (lang === "sql") return formatSql(code);
  if (lang === "bash") return formatShell(code);
  if (lang === "python") return formatPython(code);
  if (lang === "jsonc") {
    try {
      return (await prettier.format(code, { parser: "json5" })).trim();
    } catch {
      return code.trim();
    }
  }

  const parser = {
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

const changes = [];
const files = fs.readdirSync(sourceRoot).filter((file) => file.endsWith(".json"));

for (const [fileNumber, filename] of files.entries()) {
  if (fileNumber % 20 === 0) {
    console.log(`Auditing ${fileNumber + 1}/${files.length}: ${filename}`);
  }
  const sourcePath = path.join(sourceRoot, filename);
  const publicPath = path.join(publicRoot, filename);
  const sourcePost = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const publicPost = JSON.parse(fs.readFileSync(publicPath, "utf8"));

  if (JSON.stringify(sourcePost) !== JSON.stringify(publicPost)) {
    throw new Error(`${filename}: source and public data differ before repair`);
  }

  let changed = false;

  for (const [index, block] of sourcePost.content.entries()) {
    if (block.type !== "code" || block.lang !== "text") continue;

    const lang = inferLanguage(block.code, sourcePost.title);
    const isFlattenedTree =
      (block.code.match(/[├└]──/g)?.length ?? 0) >= 2 &&
      block.code.split("\n").length <= 5;
    const isFlattenedStructure =
      ((block.code.match(/→/g)?.length ?? 0) >= 2 ||
        (block.code.includes("||") && /^\s*\|/.test(block.code))) &&
      block.code.split("\n").length <= 5;
    if (!lang && !isFlattenedTree && !isFlattenedStructure) continue;

    const originalLineCount = block.code.split("\n").length;
    const formatted = lang
      ? await formatCode(block.code, lang)
      : isFlattenedTree
        ? formatTree(block.code)
        : formatTextStructure(block.code);
    block.lang = lang ?? "text";
    block.code = formatted;
    publicPost.content[index].lang = lang ?? "text";
    publicPost.content[index].code = formatted;
    changes.push({
      filename,
      index,
      lang: lang ?? "text-structure",
      addedLines: formatted.split("\n").length - originalLineCount,
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(sourcePath, `${JSON.stringify(sourcePost, null, 2)}\n`);
    fs.writeFileSync(publicPath, `${JSON.stringify(publicPost, null, 2)}\n`);
  }
}

const byLanguage = Object.create(null);
for (const change of changes) {
  byLanguage[change.lang] = (byLanguage[change.lang] ?? 0) + 1;
}

console.log(
  JSON.stringify(
    {
      articles: new Set(changes.map((change) => change.filename)).size,
      blocks: changes.length,
      byLanguage,
    },
    null,
    2,
  ),
);
