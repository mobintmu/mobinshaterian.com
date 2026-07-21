#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const SOURCE_DIR = "src/data/posts";
const PUBLIC_DIR = "public/data/posts";
const shouldFix = process.argv.includes("--fix");
const shouldPreview = process.argv.includes("--preview");
const fileFilter = process.argv.find((argument) => argument.startsWith("--file="))?.slice(7);
const MAX_LINE_LENGTH = 100;

function replaceOutsideStrings(source, replacer) {
  let result = "";
  let quote = null;
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      result += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      result += char;
      continue;
    }
    result += replacer(char, index, source);
  }

  return result;
}

function formatBraceLanguage(source, indentWidth = 2) {
  let indent = 0;
  let output = "";
  let quote = null;
  let escaped = false;
  let pendingSpace = false;

  const newline = () => {
    output = output.replace(/[ \t]+$/g, "");
    if (output && !output.endsWith("\n")) output += "\n";
  };
  const writeIndent = () => {
    if (!output || output.endsWith("\n")) output += " ".repeat(indent * indentWidth);
  };

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      if (pendingSpace && output && !/[\s([{.]$/.test(output)) output += " ";
      pendingSpace = false;
      writeIndent();
      quote = char;
      output += char;
      continue;
    }
    if (char === "\n") {
      pendingSpace = false;
      newline();
      continue;
    }
    if (/\s/.test(char)) {
      pendingSpace = true;
      continue;
    }

    if (char === "{") {
      if (pendingSpace && output && !/[\s([{.]$/.test(output)) output += " ";
      pendingSpace = false;
      writeIndent();
      output += "{";
      indent++;
      newline();
    } else if (char === "}") {
      pendingSpace = false;
      indent = Math.max(0, indent - 1);
      newline();
      writeIndent();
      output += "}";
      const next = source.slice(index + 1).match(/^\s*(.)/)?.[1];
      if (next && ![",", ";", ")", "]", "."].includes(next)) newline();
    } else if (char === ";") {
      pendingSpace = false;
      writeIndent();
      output += ";";
      newline();
    } else {
      if (pendingSpace && output && !/[\s([{.]$/.test(output) && !/[),;.\]]/.test(char)) {
        output += " ";
      }
      pendingSpace = false;
      writeIndent();
      output += char;
    }
  }

  return output.replace(/\n{3,}/g, "\n\n").trim();
}

function restoreIndentRuns(source, indentWidth, exactOnly = false) {
  let output = "";
  let quote = null;
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      output += char;
      continue;
    }
    if (char !== " ") {
      output += char;
      continue;
    }

    let end = index;
    while (source[end + 1] === " ") end++;
    const width = end - index + 1;
    const isIndent = exactOnly ? width === indentWidth : width >= indentWidth && width % indentWidth === 0;
    output += isIndent ? `\n${" ".repeat(width)}` : " ".repeat(width);
    index = end;
  }

  return output;
}

function formatSimpleGoStructs(source) {
  return source.replace(/(\b(?:type\s+\w+\s+)?struct\s*\{)([^{}]+)(\})/g, (match, opening, body, closing) => {
    const fieldPattern = /([A-Za-z_]\w*)\s+((?:\*|\[\])*[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?(?:\[[^\]]+\])?(?:\s+`[^`]+`)?)/g;
    const fields = [...body.matchAll(fieldPattern)];
    if (fields.length < 2) return match;
    const consumed = fields.map((field) => field[0]).join(" ").replace(/\s+/g, " ").trim();
    const normalizedBody = body.replace(/\s+/g, " ").trim();
    if (consumed !== normalizedBody) return match;
    return `${opening}\n${fields.map((field) => `    ${field[1]} ${field[2]}`).join("\n")}\n${closing}`;
  });
}

function hardWrapLine(line, width = MAX_LINE_LENGTH, forceBreak = false) {
  if (line.length <= width) return line;
  const result = [];
  let rest = line;
  const baseIndent = rest.match(/^\s*/)?.[0] || "";

  while (rest.length > width) {
    let quote = null;
    let escaped = false;
    let breakAt = -1;
    for (let index = 0; index <= width && index < rest.length; index++) {
      const char = rest[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === "`") {
        quote = char;
      } else if (/\s/.test(char)) {
        breakAt = index;
      }
    }
    if (breakAt <= baseIndent.length) {
      if (!forceBreak) break;
      breakAt = width;
    }
    result.push(rest.slice(0, breakAt).trimEnd());
    rest = `${baseIndent}${rest.slice(breakAt).trimStart()}`;
  }
  result.push(rest);
  return result.join("\n");
}

function hardWrap(source, forceBreak = false) {
  return source
    .split("\n")
    .map((line) => hardWrapLine(line, MAX_LINE_LENGTH, forceBreak))
    .join("\n");
}

function formatCode(code, language) {
  let source = code.replace(/\r\n?/g, "\n").trim();
  if (!source) return source;

  if (language === "json") {
    try {
      return JSON.stringify(JSON.parse(source), null, 2);
    } catch {
      // Some legacy MongoDB/JavaScript objects were labeled JSON.
    }
  }

  if (["go", "javascript", "typescript", "php", "solidity"].includes(language)) {
    if (language === "go") {
      source = formatSimpleGoStructs(source);
      source = restoreIndentRuns(source, 4, true);
    }
    source = source
      .replace(/^package\s+([a-z_]\w*?)import\s*\(/, "package $1\n\nimport (")
      .replace(/"\s+(?=")/g, '"\n    ')
      .replace(/\bimport\s*\(\s*/, "import (\n    ")
      .replace(/\)\s*(?=(?:type|func|var|const)\b)/g, "\n)\n\n")
      .replace(/([)}])(?=(?:func|type|var|const|import|export|class|interface)\b)/g, "$1\n\n")
      .replace(
        /(\/\/[^{};]*?)(?=(?:func|type|var|const|export|class|interface|@\w+|if\s*\(|return\b|await\b))/g,
        "$1\n",
      );
    source = formatBraceLanguage(source, language === "go" ? 4 : 2);
  } else if (language === "sql") {
    source = source.replace(
      /(?<!^)(?=SELECT\b|FROM\b|WHERE\b|GROUP BY\b|ORDER BY\b|HAVING\b|LIMIT\b|INSERT INTO\b|VALUES\b|UPDATE\b|SET\b|CREATE\b|ALTER\b|DROP\b|WITH\b|FOR SYSTEM_TIME\b)/gi,
      "\n",
    );
  } else if (language === "xml" || language === "html") {
    source = source.replace(/>\s*</g, ">\n<");
  } else if (language === "graphql") {
    source = source
      .replace(/(?<!^)(?=scalar\s+\w+|type\s+\w+\s*\{|input\s+\w+\s*\{|enum\s+\w+\s*\{)/g, "\n")
      .replace(/\{/g, "{\n")
      .replace(/\}/g, "\n}\n");
  } else if (language === "protobuf") {
    source = source
      .replace(/;/g, ";\n")
      .replace(/(?<!^)(?=message\s+\w+|service\s+\w+|rpc\s+\w+)/g, "\n")
      .replace(/\{/g, "{\n")
      .replace(/\}/g, "\n}\n");
  } else if (language === "http") {
    source = source
      .replace(/(?<!^)(?=(?:Host|Content-Type|Authorization|Accept|X-[\w-]+):\s*)/g, "\n")
      .replace(/(?<=application\/json)(?=\{)/g, "\n\n");
  } else if (["bash", "dockerfile"].includes(language)) {
    source = source
      .replace(/\\ {2,}/g, "\\\n  ")
      .replace(
        /(?<!^)(?=(?:sudo|curl|wget|docker(?:-compose)?|kubectl|npm|yarn|bun|mkdir|chmod|chown|apt(?:-get)?|go\s+(?:run|test|build|install))\s+)/g,
        "\n",
      );
  } else if (language === "yaml") {
    source = restoreIndentRuns(source, 2);
  } else if (language === "python") {
    source = source
      .replace(/(?<!^)(?=def\s+\w+\s*\(|class\s+\w+\s*[:(]|from\s+[\w.]+\s+import\s+|import\s+[\w.]+)/g, "\n")
      .replace(/(?<! ) {4}(?! )/g, "\n    ");
  } else if (language === "dotenv") {
    source = source.replace(/(?<=[^\n])(?=[A-Z][A-Z0-9_]*=)/g, "\n");
  } else if (language === "text") {
    source = source
      .replace(/(?<!^)(?=https?:\/\/)/g, "\n")
      .replace(/(?<!^)(?=\/(?:\.well-known|oauth2|userinfo|health|version)\b)/g, "\n");
  }

  return hardWrap(
    source.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim(),
    language === "text",
  );
}

let filesChecked = 0;
let blocksChecked = 0;
let blocksChanged = 0;
let filesChanged = 0;
const previews = [];

for (const filename of fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".json"))) {
  if (fileFilter && !filename.includes(fileFilter)) continue;
  filesChecked++;
  const sourcePath = path.join(SOURCE_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);
  const post = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  let changed = false;

  for (const block of post.content || []) {
    if (block.type !== "code" || typeof block.code !== "string") continue;
    blocksChecked++;
    if (block.code.includes("\n")) continue;
    const formatted = formatCode(block.code, block.lang);
    if (formatted === block.code) continue;
    if (shouldPreview && previews.length < 8) {
      previews.push({ filename, language: block.lang, before: block.code, after: formatted });
    }
    block.code = formatted;
    blocksChanged++;
    changed = true;
  }

  if (shouldFix && changed) {
    const json = `${JSON.stringify(post, null, 2)}\n`;
    fs.writeFileSync(sourcePath, json);
    fs.writeFileSync(publicPath, json);
    filesChanged++;
  }
}

console.log(
  `${shouldFix ? "Formatted" : "Would format"} ${blocksChanged} of ${blocksChecked} code blocks in ${filesChanged || filesChecked} blog files.`,
);
for (const preview of previews) {
  console.log(`\n--- ${preview.filename} [${preview.language}]`);
  console.log(preview.after);
}
