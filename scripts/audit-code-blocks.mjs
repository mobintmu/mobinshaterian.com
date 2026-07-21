#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { detectCodeLanguage, supportedCodeLanguages } from "./code-language.mjs";

const SOURCE_DIR = "src/data/posts";
const PUBLIC_DIR = "public/data/posts";
const shouldFix = process.argv.includes("--fix");
const counts = new Map();
const proposed = new Map();
const errors = [];
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

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Schema validation passed: no empty or malformed code blocks.");
}
