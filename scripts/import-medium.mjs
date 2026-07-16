#!/usr/bin/env node
// Import Medium export → per-article JSON + search index.
// Usage: node scripts/import-medium.mjs <path-to-medium-export/posts>
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const POSTS_DIR = process.argv[2] || "/tmp/medium/posts";
const OUT_POSTS = "src/data/posts";
const PUBLIC_POSTS = "public/data/posts";
const OUT_ASSETS = "public/blog-assets";
const INDEX_FILE = "src/data/posts-index.json";
const PUBLIC_INDEX = "public/data/posts-index.json";
const SEARCH_FILE = "src/data/search-index.json";
const PUBLIC_SEARCH = "public/data/search-index.json";
const DOWNLOAD_IMAGES = process.env.DOWNLOAD_IMAGES !== "0";

const existingIndex = fs.existsSync("src/data/posts.json")
  ? JSON.parse(fs.readFileSync("src/data/posts.json", "utf8"))
  : [];
const tagsBySlug = new Map(existingIndex.map((p) => [p.slug, p.tags || []]));

fs.mkdirSync(OUT_POSTS, { recursive: true });
fs.mkdirSync(PUBLIC_POSTS, { recursive: true });
fs.mkdirSync(OUT_ASSETS, { recursive: true });

const files = fs
  .readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".html") && !f.startsWith("draft_"));

const index = [];
const search = [];
let skipped = 0;
let imgOk = 0;
let imgFail = 0;

function extractSlug(filename) {
  // filename like 2021-02-07_Some-Title-9c31e37903b8.html
  const base = filename.replace(/\.html$/, "");
  const parts = base.split("_");
  const rest = parts.slice(1).join("_");
  // trim leading dashes/spaces
  return rest.replace(/^-+/, "").replace(/^[\s]+/, "");
}

async function downloadImage(url, slug, i) {
  const ext = (url.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i) || [, "png"])[1].toLowerCase();
  const filename = `img-${i}.${ext}`;
  const dir = path.join(OUT_ASSETS, slug);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, filename);
  if (fs.existsSync(dest)) return `/blog-assets/${slug}/${filename}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    imgOk++;
    return `/blog-assets/${slug}/${filename}`;
  } catch (e) {
    imgFail++;
    return url; // fall back to Medium CDN
  }
}

function inlineHtml($, el) {
  // return sanitized-ish inline HTML: keep a, strong, em, code, br
  const $el = $(el).clone();
  $el.find("*").each((_, n) => {
    const tag = n.tagName?.toLowerCase();
    if (!["a", "strong", "em", "b", "i", "code", "br"].includes(tag)) {
      $(n).replaceWith($(n).contents());
    } else {
      // strip all attrs except href on a
      const attrs = Object.keys(n.attribs || {});
      for (const a of attrs) {
        if (!(tag === "a" && a === "href")) $(n).removeAttr(a);
      }
      if (tag === "a") {
        $(n).attr("target", "_blank");
        $(n).attr("rel", "noreferrer noopener");
      }
    }
  });
  return $el.html() || "";
}

function detectLang(code) {
  const c = code.toLowerCase();
  if (/^\s*(package |func |import \(|import ")/m.test(code)) return "go";
  if (/^\s*(#include|std::|int main\()/m.test(code)) return "cpp";
  if (/^\s*(def |import |from .+ import|print\()/m.test(code)) return "python";
  if (/^\s*(<\?php|\$[a-z_])/i.test(code)) return "php";
  if (/^\s*(SELECT |INSERT |UPDATE |CREATE TABLE)/i.test(code)) return "sql";
  if (/^\s*(FROM |RUN |COPY |CMD )/m.test(code)) return "dockerfile";
  if (/^\s*(const |let |function |import .+ from|export )/m.test(code)) return "javascript";
  if (/^\s*(export |apt |sudo |cd |ls |curl |docker |npm |yarn |bun )/m.test(code)) return "bash";
  if (/^\s*\{[\s\S]*"[a-z_]+"\s*:/i.test(code)) return "json";
  if (/^\s*(apiVersion:|kind:)/m.test(code)) return "yaml";
  return "text";
}

async function parseFile(filename) {
  const html = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
  const $ = cheerio.load(html);
  const title = $("h1.p-name").text().trim();
  const subtitle = $('section[data-field="subtitle"]').text().trim();
  const datetime = $("time.dt-published").attr("datetime") || "";
  const canonical = $("a.p-canonical").attr("href") || "";
  const slug = extractSlug(filename);

  const body = $('section[data-field="body"]');
  if (!body.length) return null;

  const blocks = [];
  let plain = [];
  let imgCounter = 0;
  let hero = null;

  // iterate top-level content nodes
  const items = body.find(".section-inner").children().toArray();
  // fall back if not found
  const nodes = items.length ? items : body.find("h1,h2,h3,h4,p,pre,figure,blockquote,ul,ol,hr").toArray();

  for (const node of nodes) {
    const tag = node.tagName?.toLowerCase();
    if (!tag) continue;
    if (tag === "h1" || tag === "h3") {
      const text = $(node).text().trim();
      // Medium exports duplicate the title as h3 first. Skip if same as title.
      if (!text || text === title) continue;
      // Medium uses h3 for section headers; treat as h2 in our output
      blocks.push({ type: "heading", level: 2, text });
      plain.push(text);
    } else if (tag === "h2" || tag === "h4") {
      const text = $(node).text().trim();
      if (!text) continue;
      blocks.push({ type: "heading", level: tag === "h2" ? 2 : 3, text });
      plain.push(text);
    } else if (tag === "p") {
      const text = $(node).text().trim();
      if (!text) continue;
      blocks.push({ type: "paragraph", html: inlineHtml($, node) });
      plain.push(text);
    } else if (tag === "pre") {
      const code = $(node).text();
      blocks.push({ type: "code", lang: detectLang(code), code });
      plain.push(code);
    } else if (tag === "blockquote") {
      const text = $(node).text().trim();
      if (!text) continue;
      blocks.push({ type: "quote", html: inlineHtml($, node) });
      plain.push(text);
    } else if (tag === "ul" || tag === "ol") {
      const items = $(node)
        .find("> li")
        .toArray()
        .map((li) => inlineHtml($, li));
      const plainItems = $(node)
        .find("> li")
        .toArray()
        .map((li) => $(li).text().trim());
      blocks.push({ type: "list", ordered: tag === "ol", items });
      plain.push(plainItems.join(" "));
    } else if (tag === "hr") {
      blocks.push({ type: "hr" });
    } else if (tag === "figure") {
      const img = $(node).find("img").first();
      const iframe = $(node).find("iframe").first();
      const caption = $(node).find("figcaption").text().trim();
      if (img.length) {
        const src = img.attr("src");
        if (!src) continue;
        const width = Number(img.attr("data-width")) || undefined;
        const height = Number(img.attr("data-height")) || undefined;
        const featured = img.attr("data-is-featured") === "true";
        const localSrc = DOWNLOAD_IMAGES ? await downloadImage(src, slug, imgCounter++) : src;
        const block = { type: "image", src: localSrc, alt: caption || title, caption, width, height };
        blocks.push(block);
        if (featured && !hero) hero = localSrc;
        if (caption) plain.push(caption);
      } else if (iframe.length) {
        const url = iframe.attr("src") || "";
        let provider = "iframe";
        if (/youtube|youtu\.be/.test(url)) provider = "youtube";
        else if (/gist\.github/.test(url)) provider = "gist";
        else if (/twitter|x\.com/.test(url)) provider = "twitter";
        blocks.push({ type: "embed", provider, url });
      }
    } else {
      // recurse into wrappers (div/section)
      const inner = $(node).find("h1,h2,h3,h4,p,pre,figure,blockquote,ul,ol,hr").toArray();
      // skip; already handled if picked at top-level
    }
  }

  const plainText = plain.join("\n").replace(/\s+/g, " ").trim();
  if (plainText.length < 200) {
    skipped++;
    return null;
  }
  if (!hero && blocks.find((b) => b.type === "image")) {
    hero = blocks.find((b) => b.type === "image").src;
  }

  const readingTime = `${Math.max(1, Math.round(plainText.split(/\s+/).length / 220))} min`;
  const excerpt = subtitle || plainText.slice(0, 220).trim() + (plainText.length > 220 ? "…" : "");
  const tags = tagsBySlug.get(slug) || [];

  const post = {
    slug,
    title,
    subtitle,
    excerpt,
    date: (datetime || "").slice(0, 10),
    tags,
    readingTime,
    url: canonical,
    hero,
    content: blocks,
  };

  fs.writeFileSync(path.join(OUT_POSTS, `${slug}.json`), JSON.stringify(post, null, 2));

  index.push({
    slug,
    title,
    excerpt,
    date: post.date,
    tags,
    readingTime,
    url: canonical,
    hero,
  });
  search.push({ slug, title, tags, plainText });
  return post;
}

console.log(`Parsing ${files.length} files from ${POSTS_DIR}…`);
let done = 0;
for (const f of files) {
  try {
    await parseFile(f);
  } catch (e) {
    console.error("Failed:", f, e.message);
    skipped++;
  }
  done++;
  if (done % 25 === 0) console.log(`  ${done}/${files.length}`);
}

index.sort((a, b) => (a.date < b.date ? 1 : -1));
fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
fs.writeFileSync(SEARCH_FILE, JSON.stringify(search));

console.log(`\nWrote ${index.length} posts. Skipped ${skipped}. Images ok=${imgOk} fail=${imgFail}.`);
console.log(`  ${INDEX_FILE}`);
console.log(`  ${SEARCH_FILE}`);
console.log(`  ${OUT_POSTS}/*.json`);
