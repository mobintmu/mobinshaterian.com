#!/usr/bin/env node
// Remove "Machine Learning" tag from posts that aren't actually about ML/AI.
import fs from "node:fs";
import path from "node:path";

const DIRS = ["src/data/posts", "public/data/posts"];
const INDEX_FILES = ["src/data/posts-index.json", "public/data/posts-index.json"];
const SEARCH_FILES = ["src/data/search-index.json", "public/data/search-index.json"];

// Keywords that indicate an article is genuinely about ML/AI.
const ML_PATTERNS = [
  /\bmachine learning\b/i,
  /\bdeep learning\b/i,
  /\bneural network/i,
  /\btensorflow\b/i,
  /\bpytorch\b/i,
  /\bscikit[- ]learn\b/i,
  /\bkeras\b/i,
  /\bhuggingface\b/i,
  /\btransformer(s)?\b/i,
  /\bembedding(s)?\b/i,
  /\bLLM\b/,
  /\blarge language model/i,
  /\bopenai\b/i,
  /\bchatgpt\b/i,
  /\bgpt-?\d/i,
  /\bprompt engineering\b/i,
  /\bRAG\b/,
  /\bretrieval[- ]augmented/i,
  /\bvector (db|database|store|search)/i,
  /\bfine[- ]tun(e|ing)/i,
  /\btraining data\b/i,
  /\bdataset\b/i,
  /\bmodel (training|inference|weights)/i,
  /\bregression\b/i,
  /\bclassifier\b/i,
  /\bclustering\b/i,
  /\bk[- ]means\b/i,
  /\bAI (model|agent|bot|assistant)/i,
  /\bartificial intelligence\b/i,
  /\brecommendation system/i,
  /\bnlp\b/i,
  /\bnatural language processing\b/i,
  /\bcomputer vision\b/i,
  /\bpandas\b/i,
  /\bnumpy\b/i,
];

function isMlPost(post) {
  const hay = [
    post.title,
    post.subtitle,
    post.excerpt,
    ...(post.content || []).map((b) =>
      b.type === "paragraph" || b.type === "quote"
        ? b.html
        : b.type === "heading"
          ? b.text
          : b.type === "code"
            ? b.code
            : "",
    ),
  ]
    .filter(Boolean)
    .join(" ");
  return ML_PATTERNS.some((r) => r.test(hay));
}

const kept = new Map(); // slug -> boolean (is ML)
for (const dir of DIRS) {
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const p = path.join(dir, f);
    const post = JSON.parse(fs.readFileSync(p, "utf8"));
    const ml = isMlPost(post);
    kept.set(post.slug, ml);
    const tags = (post.tags || []).filter((t) => t !== "Machine Learning");
    if (ml) tags.push("Machine Learning");
    post.tags = Array.from(new Set(tags));
    fs.writeFileSync(p, JSON.stringify(post, null, 2));
  }
}

for (const f of INDEX_FILES) {
  const idx = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const entry of idx) {
    const ml = kept.get(entry.slug);
    const tags = (entry.tags || []).filter((t) => t !== "Machine Learning");
    if (ml) tags.push("Machine Learning");
    entry.tags = Array.from(new Set(tags));
  }
  fs.writeFileSync(f, JSON.stringify(idx, null, 2));
}

for (const f of SEARCH_FILES) {
  if (!fs.existsSync(f)) continue;
  const arr = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const entry of arr) {
    const ml = kept.get(entry.slug);
    const tags = (entry.tags || []).filter((t) => t !== "Machine Learning");
    if (ml) tags.push("Machine Learning");
    entry.tags = Array.from(new Set(tags));
  }
  fs.writeFileSync(f, JSON.stringify(arr));
}

const mlCount = [...kept.values()].filter(Boolean).length;
console.log(`Total posts: ${kept.size}. Kept "Machine Learning" on ${mlCount}.`);
