#!/usr/bin/env node
// Replace /blog-assets/<slug>/img-N.<ext> references with original Medium CDN URLs.
import fs from "node:fs";
import path from "node:path";

const HTML_DIR = "/tmp/medium-ext/posts";
const POST_DIRS = ["src/data/posts", "public/data/posts"];
const INDEX_FILES = ["src/data/posts-index.json", "public/data/posts-index.json"];

function extractCdnUrls(html) {
  const urls = [];
  const re = /src="(https:\/\/cdn-images-1\.medium\.com\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) urls.push(m[1]);
  return urls;
}

// Build slug -> html file map by matching the trailing article id
const htmlFiles = fs.readdirSync(HTML_DIR).filter((f) => f.endsWith(".html"));
const byId = new Map();
for (const f of htmlFiles) {
  const m = f.match(/-([a-f0-9]{10,})\.html$/);
  if (m) byId.set(m[1], path.join(HTML_DIR, f));
}

let fixed = 0;
let missing = 0;

const firstDir = POST_DIRS[0];
const slugs = fs
  .readdirSync(firstDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

// slug -> new hero
const slugHero = new Map();

for (const slug of slugs) {
  const idMatch = slug.match(/-([a-f0-9]{10,})$/);
  if (!idMatch) continue;
  const htmlPath = byId.get(idMatch[1]);
  if (!htmlPath) continue;
  const html = fs.readFileSync(htmlPath, "utf8");
  const cdnUrls = extractCdnUrls(html);

  for (const dir of POST_DIRS) {
    const p = path.join(dir, `${slug}.json`);
    if (!fs.existsSync(p)) continue;
    const post = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;

    const imgBlocks = (post.content || []).filter((b) => b.type === "image");
    if (imgBlocks.length && cdnUrls.length) {
      imgBlocks.forEach((b, i) => {
        const url = cdnUrls[i] || cdnUrls[cdnUrls.length - 1];
        if (typeof b.src === "string" && b.src.includes("/blog-assets/")) {
          b.src = url;
          changed = true;
        }
      });
    }

    if (typeof post.hero === "string" && post.hero.includes("/blog-assets/")) {
      post.hero = cdnUrls[0] || null;
      changed = true;
    }
    if (post.hero && !post.hero.includes("/blog-assets/")) slugHero.set(slug, post.hero);

    if (changed) {
      fs.writeFileSync(p, JSON.stringify(post, null, 2) + "\n");
      if (dir === firstDir) fixed++;
    }
  }
  if (!cdnUrls.length) missing++;
}

// Update index files' hero fields
for (const idxPath of INDEX_FILES) {
  if (!fs.existsSync(idxPath)) continue;
  const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  let changed = false;
  for (const entry of idx) {
    if (typeof entry.hero === "string" && entry.hero.includes("/blog-assets/")) {
      const nh = slugHero.get(entry.slug);
      entry.hero = nh || null;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(idxPath, JSON.stringify(idx, null, 2) + "\n");
}

console.log(`fixed ${fixed} posts, ${missing} without CDN urls`);
