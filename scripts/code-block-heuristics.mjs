#!/usr/bin/env node
// Shared heuristics for crawler-damaged code blocks.
//
// Lessons from the GraphRAG post repair: URL-based crawlers frequently
// (a) explode fenced code into one paragraph block per line, (b) glue the
// next prose sentence onto the last code line, (c) turn snake_case into
// <em>/<strong> markup and escape quotes (&quot;, &#39;), and (d) collapse
// indentation runs down to a single space (e.g. "def  __init__ (").
import { detectCodeLanguage } from "./code-language.mjs";

export function decodeInlinedHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function looksLikeCodeLine(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return false;
  // Directory-tree glyphs ("├── file", "│   └── dir").
  if (/^[│├└─\s]*[│├└─]/.test(text)) return true;
  // Bare path or lone punctuation line ("src/data/", "}", ");").
  if (/^[A-Za-z0-9_.@~/-]+\/?$/.test(text) && text.includes("/")) return true;
  if (/^[{}()[\]]$|^;\s*$/.test(text)) return true;
  // Common statement openers.
  if (
    /^(?:def |class |func |function |const |let |var |return |import |from |export |async |await |public |private |type |package |with |elif |else\b)/.test(
      text,
    )
  )
    return true;
  // Chained method calls (".map(relSlug => ...)", ").json()").
  if (/^\.[A-Za-z_]/.test(text) || /^\)[\s.]/.test(text)) return true;
  // Control flow with braces or Python-style colon terminators.
  if (/^(?:if|for|while|switch|case|try|except|finally|with)\s*[({][^.!?]*[:{]\s*$/.test(text)) return true;
  if (/^(?:if|for|while|try)\b[^.!?]*:\s*$/.test(text)) return true;
  // Shell command starters.
  if (/^(?:sudo|curl|wget|docker|kubectl|npm|yarn|bun|pnpm|pip3?|python3?|go|git|cd|mkdir|chmod|chown|env|apt(?:-get)?)\s/.test(text))
    return true;
  // Assignments and calls ("content += f\"# {title}\"", "f.write(content)").
  if (/^[A-Za-z_][\w.[\]"']*(?:\.[\w.]+)*\s*\+?=(?!=)/.test(text) && !/[.!?]$/.test(text)) return true;
  if (/^\w+(?:\.\w+)+\s*\(/.test(text)) return true;
  return false;
}

export function looksLikeProseLine(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return false;
  const words = text.split(/\s+/);
  return words.length >= 10 && /[.!?]$/.test(text);
}

function paragraphText(block) {
  return decodeInlinedHtml(block?.html ?? "");
}

/**
 * Find runs of >= minRun consecutive paragraph blocks whose every line reads
 * like exploded code rather than prose. Returns [startIndex, endIndex] pairs.
 */
export function findFragmentedCodeRuns(blocks, minRun = 2) {
  const runs = [];
  let start = -1;
  const flush = (end) => {
    if (start >= 0 && end - start >= minRun) runs.push([start, end]);
    start = -1;
  };
  (blocks || []).forEach((block, index) => {
    const text = block?.type === "paragraph" ? paragraphText(block) : "";
    const codey =
      block?.type === "paragraph" &&
      Boolean(text) &&
      !looksLikeProseLine(text) &&
      looksLikeCodeLine(text);
    if (codey) {
      if (start < 0) start = index;
    } else {
      flush(index);
    }
  });
  flush((blocks || []).length);
  return runs;
}

/** Merge fragmented runs in place into {"type":"code"} blocks. Returns count. */
export function coalesceFragmentedCode(blocks, minRun = 2) {
  const runs = findFragmentedCodeRuns(blocks, minRun);
  let merged = 0;
  for (const [start, end] of runs.reverse()) {
    const code = blocks
      .slice(start, end + 1)
      .map(paragraphText)
      .map((line) => line.replace(/\s+$/, ""))
      .join("\n");
    blocks.splice(start, end - start + 1, {
      type: "code",
      lang: detectCodeLanguage(code) || "text",
      code,
    });
    merged++;
  }
  return merged;
}

/** Reverse common crawler damage inside code strings (safe, idempotent). */
export function repairCrawlerDamage(source) {
  return String(source ?? "")
    .replace(/<(em|i)>([^<]*)<\/\1>/gi, "_$2_")
    .replace(/<\/?(?:em|i)>/gi, "")
    .replace(/<(strong|b)>([^<]*)<\/\1>/gi, "$2")
    .replace(/<\/?(?:strong|b)>/gi, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\b(def|class)\s{2,}(?=\S)/g, "$1 ")
    .replace(/(__\w+__)\s+\(/g, "$1(");
}

/** True when a Python block's indentation was flattened to single spaces. */
export function hasCollapsedIndentation(code) {
  const text = String(code || "");
  return text.includes("\n") && !/^ {2,}\S/m.test(text) && /^ \S/m.test(text);
}

/** True when escaped entities or inline markup survived inside code. */
export function hasResidualMarkup(code) {
  return /&(?:quot|lt|gt|amp|#0?39|#x27);|<\/?(?:em|i|strong|b)>/i.test(String(code || ""));
}

/**
 * Rebuild 4-space Python indentation for blocks whose leading whitespace was
 * flattened by a crawler (every logical line kept its newline but lost its
 * indent). Uses a scope stack driven by statement keywords; lines inside
 * triple-quoted strings are preserved verbatim. Best-effort: review with
 * --preview before writing. Handles the exact damage seen in the GraphRAG
 * post ("def  __init__ (" siblings all flush-left or single-space indented).
 */
export function restorePythonIndentation(source) {
  const OPENER = /^(?:async\s+def\s|def\s|class\s|if\s|for\s|while\s|with\s|try\b)/;
  const BLOCK_RESET = /^(?:else\b|elif\s|except\b|finally\b)/;
  const SCOPE_EXIT = /^(?:return\b|raise\b)/;
  const DEF_LIKE = /^(?:async\s+def\s|def\s|class\s|@)/;

  const lines = String(source ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const stack = [];
  const out = [];
  let triple = null;

  for (const raw of lines) {
    if (triple) {
      out.push(raw);
      if ((raw.match(/"""|'''/g) || []).length % 2 === 1) triple = null;
      continue;
    }
    const text = raw.trim();
    if (!text) {
      out.push("");
      continue;
    }
    const tripleHits = (text.match(/"""|'''/g) || []).length;
    if (tripleHits % 2 === 1) triple = text.match(/("""|''')/)?.[1] ?? null;

    if (DEF_LIKE.test(text)) {
      // A new def/class/decorator closes every scope up to its class (or module).
      const classIndex = stack.lastIndexOf("class");
      stack.length = classIndex >= 0 ? classIndex + 1 : 0;
    } else if (BLOCK_RESET.test(text)) {
      if (stack.at(-1) === "block") stack.pop();
    } else if (SCOPE_EXIT.test(text)) {
      // A bare return/raise usually ends the innermost function body chain.
      while (stack.at(-1) === "block") stack.pop();
    }

    out.push(`${"    ".repeat(stack.length)}${text}`);

    const opensBlock = /:\s*(#.*)?$/.test(text) && (OPENER.test(text) || BLOCK_RESET.test(text));
    if (opensBlock) {
      stack.push(
        /^class\s/.test(text) ? "class" : /^(?:async\s+def\s|def\s)/.test(text) ? "def" : "block",
      );
    }
  }
  return out.join("\n");
}
