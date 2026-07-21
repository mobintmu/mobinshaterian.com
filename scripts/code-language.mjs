export const supportedCodeLanguages = new Set([
  "bash",
  "cpp",
  "css",
  "cypher",
  "dockerfile",
  "dotenv",
  "go",
  "graphql",
  "html",
  "http",
  "javascript",
  "json",
  "nginx",
  "php",
  "protobuf",
  "python",
  "solidity",
  "sql",
  "text",
  "toml",
  "typescript",
  "xml",
  "yaml",
]);

export function detectCodeLanguage(code) {
  const source = code.trim();
  if (!source) return "text";

  if (/^[\[{]/.test(source)) {
    try {
      JSON.parse(source);
      return "json";
    } catch {
      // Continue: JavaScript, MongoDB, and console output can also start this way.
    }
  }

  if (/^\s*package\s+\w+/m.test(source)) return "go";
  if (/<!doctype\s+html|<html[\s>]/i.test(source)) return "html";
  if (/<\?xml\b|<databaseChangeLog\b|<clickhouse\b|<storage_configuration\b/i.test(source)) {
    return "xml";
  }
  if (
    /pragma\s+solidity\b|SPDX-License-Identifier.*\bcontract\b/is.test(source) ||
    /\bcontract\s+\w+\s*\{[\s\S]*\bfunction\s+\w+\s*\(/.test(source)
  ) {
    return "solidity";
  }
  if (/\bsyntax\s*=\s*["']proto3["']|\boption\s+go_package\s*=/.test(source)) {
    return "protobuf";
  }
  if (/^\s*(?:scalar\s+\w+|type\s+(?:Query|Mutation|Subscription)\b|input\s+\w+\s*\{)/m.test(source)) {
    return "graphql";
  }
  if (
    /\bfunc\b\s*(?:\([^)]*\)\s*)?\w+\s*\(/.test(source) ||
    /\btype\s+\w+\s+(?:struct|interface)\s*\{/.test(source) ||
    /\bvar\s+\w+\s*=\s*\[\]\w+\s*\{/.test(source)
  ) {
    return "go";
  }
  if (
    /^\s*LOAD\s+CSV\b[\s\S]*\b(?:MATCH|MERGE|CREATE)\s*\(/i.test(source) ||
    /^\s*(?:MATCH|MERGE)\s*\([^)]*\)(?:\s*-\[[^\]]*\]->\s*\([^)]*\))?/i.test(source)
  ) {
    return "cypher";
  }
  if (
    /from\s+["'](?:@nestjs\/|class-validator["'])/.test(source) ||
    /@(?:Controller|Injectable|Module|Entity|Schema|Get|Post|Put|Patch|Delete|Mutation|Query|Field|InputType|Is\w+)\s*\(/.test(
      source,
    ) ||
    /\b(?:class|interface)\s+\w+[\s\S]*:\s*(?:string|number|boolean|Promise<)/.test(source)
  ) {
    return "typescript";
  }
  if (/^\s*(?:<\?php|namespace\s+App\\|use\s+Illuminate\\)/m.test(source) || /\$this->/.test(source)) {
    return "php";
  }
  if (
    /^\s*(?:from\s+[\w.]+\s+import\s+|import\s+(?:numpy|pandas|tensorflow|sklearn|torch|openai)\b|def\s+\w+\s*\()/m.test(
      source,
    ) ||
    /\b(?:tf|np|pd)\.[A-Za-z_]\w*\s*\(/.test(source)
  ) {
    return "python";
  }
  if (
    /^(?:\s*--[^\n]*)?\s*(?:SELECT|INSERT\s+INTO|UPDATE\s+\w+\s+SET|CREATE\s+(?:TABLE|INDEX|DATABASE)|ALTER\s+TABLE|WITH\s+\w+\s+AS\s*\(|LOAD\s+CSV)\b/i.test(
      source,
    )
  ) {
    return "sql";
  }
  if (/^\s*(?:FROM|RUN|COPY|CMD|ENTRYPOINT|WORKDIR|EXPOSE)\s+/m.test(source)) {
    return "dockerfile";
  }
  if (/^\s*(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/\S*/m.test(source)) {
    return "http";
  }
  if (/^\s*server\s*\{[\s\S]*\b(?:listen|location|server_name)\b/.test(source)) {
    return "nginx";
  }
  if (
    /^\s*(?:#!\/.*\b(?:ba)?sh\b|sudo\s+|curl\s+|wget\s+|docker(?:-compose)?\s+|kubectl\s+|npm\s+|yarn\s+|bun\s+|mkdir\s+|go\s+(?:run|test|install|build)\s+)/m.test(
      source,
    )
  ) {
    return "bash";
  }
  if (/^\s*#?\s*\.env\b|^(?:[A-Z][A-Z0-9_]*=.+\n?){2,}$/m.test(source)) {
    return "dotenv";
  }
  if (
    /^\s*(?:apiVersion:|kind:|services:|stages:|version:\s*["']?[0-9]|image:\s*\S+)/m.test(source) &&
    /(?:^|\s{2,})[\w.-]+:\s*/m.test(source)
  ) {
    return "yaml";
  }
  if (/^\s*\[[\w.-]+\]\s*$/m.test(source) && /^\s*[\w.-]+\s*=\s*.+$/m.test(source)) {
    return "toml";
  }
  if (/^\s*(?:#include\s*[<"]|using\s+namespace\s+std\b|int\s+main\s*\()/m.test(source)) {
    return "cpp";
  }
  if (
    /^\s*(?:import\s+.+\s+from\s+["']|export\s+(?:default\s+)?|const|let|var)\b|\bfunction\s+\w+\s*\(|addEventListener\s*\(/m.test(
      source,
    )
  ) {
    return "javascript";
  }
  if (/^\s*(?:@import\s+|[.#]?[\w-]+(?:\s+[.#]?[\w-]+)*\s*\{)[\s\S]*:[^;{}]+;/.test(source)) {
    return "css";
  }

  return "text";
}
