#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { detectCodeLanguage, supportedCodeLanguages } from "./code-language.mjs";
import {
  coalesceFragmentedCode,
  findFragmentedCodeRuns,
  hasCollapsedIndentation,
  hasResidualMarkup,
  repairCrawlerDamage,
  restorePythonIndentation,
} from "./code-block-heuristics.mjs";

const SOURCE_DIR = "src/data/posts";
const PUBLIC_DIR = "public/data/posts";
const shouldFix = process.argv.includes("--fix");
const counts = new Map();
const proposed = new Map();
const healed = new Map();
const errors = [];
const warnings = [];
let filesChecked = 0;
let blocksChecked = 0;
let filesChanged = 0;

for (const filename of fs.readdirSync(SOURCE_DIR).filter((name) => name.endsWith(".json"))) {
  filesChecked++;
  const sourcePath = path.join(SOURCE_DIR, filename);
  const publicPath = path.join(PUBLIC_DIR, filename);
  let post;

  try {
    post = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch (error) {
    errors.push(`${sourcePath}: invalid JSON (${error.message})`);
    continue;
  }

  let changed = false;

  // Crawler lesson (GraphRAG post): fenced code often arrives as one
  // paragraph block per line. Detect those runs; merge them under --fix.
  const fragmentedRuns = findFragmentedCodeRuns(post.content || []);
  for (const [start, end] of fragmentedRuns) {
    warnings.push(
      `${sourcePath}: content[${start}-${end}] reads like exploded code paragraphs${shouldFix ? "" : " (--fix merges into one code block)"}`,
    );
  }
  if (shouldFix && fragmentedRuns.length) {
    coalesceFragmentedCode(post.content || []);
    healed.set("merged code-as-paragraph run(s)", fragmentedRuns.length);
    changed = true;
  }

  for (const [index, block] of (post.content || []).entries()) {
    if (block.type !== "code") continue;
    blocksChecked++;

    if (typeof block.code !== "string") {
      errors.push(`${sourcePath}: content[${index}] must have a string \"code\" property`);
      continue;
    }
    if (!block.code.trim()) errors.push(`${sourcePath}: content[${index}] has empty code`);
    if (Object.hasOwn(block, "text")) {
      errors.push(`${sourcePath}: content[${index}] uses unexpected \"text\" property`);
    }
    if (!supportedCodeLanguages.has(block.lang)) {
      errors.push(`${sourcePath}: content[${index}] has unsupported language \"${block.lang}\"`);
    }

    // Escaped entities / injected <em>/<strong> inside code strings.
    if (hasResidualMarkup(block.code)) {
      if (shouldFix) {
        block.code = repairCrawlerDamage(block.code);
        healed.set("entity/markup repair(s)", (healed.get("entity/markup repair(s)") || 0) + 1);
        changed = true;
      } else {
        warnings.push(
          `${sourcePath}: content[${index}] [${block.lang}] has escaped entities or inline markup (--fix repairs)`,
        );
      }
    }

    // Flattened Python indentation ("def  __init__ (" siblings flush-left).
    if (block.lang === "python" && hasCollapsedIndentation(block.code)) {
      if (shouldFix) {
        block.code = restorePythonIndentation(repairCrawlerDamage(block.code));
        healed.set("python indent rebuild(s)", (healed.get("python indent rebuild(s)") || 0) + 1);
        changed = true;
      } else {
        warnings.push(
          `${sourcePath}: content[${index}] [python] has flattened indentation (--fix rebuilds)`,
        );
      }
    }

    counts.set(block.lang, (counts.get(block.lang) || 0) + 1);
    const detected = detectCodeLanguage(block.code);
    const isSafeCorrection =
      detected !== "text" &&
      (block.lang === "text" ||
        (detected === "typescript" && ["javascript", "python"].includes(block.lang)) ||
        (detected === "javascript" && block.lang === "python"));
    if (!isSafeCorrection || detected === block.lang) continue;
    proposed.set(detected, (proposed.get(detected) || 0) + 1);
    if (shouldFix) {
      block.lang = detected;
      changed = true;
    }
  }

  if (shouldFix && changed) {
    const json = `${JSON.stringify(post, null, 2)}\n`;
    fs.writeFileSync(sourcePath, json);
    fs.writeFileSync(publicPath, json);
    filesChanged++;
  }
}

console.log(`Checked ${blocksChecked} code blocks in ${filesChecked} blog files.`);
console.log(`Current languages: ${JSON.stringify(Object.fromEntries(counts))}`);
console.log(`Confident text reclassifications: ${JSON.stringify(Object.fromEntries(proposed))}`);
if (shouldFix) console.log(`Updated ${filesChanged} source/public file pairs.`);
for (const [label, count] of healed) console.log(`Healed ${count} ${label}.`);
if (warnings.length) {
  console.warn(`\n${warnings.length} crawler-damage warning(s):`);
  console.warn(warnings.join("\n"));
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Schema validation passed: no empty or malformed code blocks.");
}

