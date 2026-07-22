#!/usr/bin/env node
// Import a public Medium article URL into the local blog datasets.
// Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { detectCodeLanguage } from "./code-language.mjs";

const requestedUrl = process.argv[2];
const tags = process.argv.slice(3);

if (!requestedUrl) {
  console.error("Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]");
  process.exit(1);
}

const response = await fetch(requestedUrl);
if (!response.ok) throw new Error(`Medium returned HTTP ${response.status}`);

const $ = cheerio.load(await response.text());
const title = $("h1.pw-post-title").first().text().trim() || $("h1").first().text().trim();
const canonical = $('link[rel="canonical"]').attr("href") || requestedUrl;
const articleId = new URL(canonical).pathname.match(/-([a-f0-9]{12})\/?$/i)?.[1] || "medium";
const slug = `${title.replace(/[^a-zA-Z0-9]/g, "-").replace(/^-|-$/g, "")}-${articleId}`;
const date = String($('meta[property="article:published_time"]').attr("content") || "").slice(
  0,
  10,
);
const hero = $('meta[property="og:image"]').attr("content") || null;
const description = $('meta[property="og:description"]').attr("content")?.trim() || "";
const contentRoot = $("h1.pw-post-title").first().parent().parent();

if (!title || !date || !contentRoot.length) {
  throw new Error("Could not parse the Medium article metadata or content root");
}

function inlineHtml(element) {
  const clone = $(element).clone();
  clone.find("*").each((_, node) => {
    const tag = node.tagName?.toLowerCase();
    if (!["a", "strong", "b", "em", "i", "code", "br"].includes(tag)) {
      $(node).replaceWith($(node).contents());
      return;
    }
    for (const attribute of Object.keys(node.attribs || {})) {
      if (!(tag === "a" && attribute === "href")) $(node).removeAttr(attribute);
    }
    if (tag === "a") {
      $(node).attr("target", "_blank").attr("rel", "noreferrer noopener");
    }
  });
  return clone.html()?.trim() || "";
}

function imageUrl(figure) {
  const image = $(figure).find("img").first();
  if (!image.length) return "";
  if (image.attr("src")) return image.attr("src");

  const srcset = $(figure).find("source").first().attr("srcset") || "";
  return srcset.split(",").at(-1)?.trim().split(/\s+/)[0] || "";
}

const blocks = [];
const plain = [];

contentRoot.children().each((_, node) => {
  const element = $(node);
  const tag = node.tagName?.toLowerCase();

  if (tag === "h2" || tag === "h3") {
    const text = element.text().trim();
    if (text) {
      blocks.push({ type: "heading", level: tag === "h2" ? 2 : 3, text });
      plain.push(text);
    }
    return;
  }

  if (tag === "p" && element.hasClass("pw-post-body-paragraph")) {
    const text = element.text().trim();
    if (text) {
      blocks.push({ type: "paragraph", html: inlineHtml(node) });
      plain.push(text);
    }
    return;
  }

  if (tag === "pre") {
    const code = element.text().replace(/\r\n?/g, "\n").trimEnd();
    if (code) {
      blocks.push({ type: "code", lang: detectCodeLanguage(code), code });
      plain.push(code);
    }
    return;
  }

  if (tag === "blockquote") {
    const text = element.text().replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push({ type: "quote", html: inlineHtml(node) });
      plain.push(text);
    }
    return;
  }

  if (tag === "ul" || tag === "ol") {
    const items = element
      .children("li")
      .toArray()
      .map((item) => inlineHtml(item));
    if (items.length) {
      blocks.push({ type: "list", ordered: tag === "ol", items });
      plain.push(element.text().replace(/\s+/g, " ").trim());
    }
    return;
  }

  if (tag === "figure" && element.hasClass("paragraph-image")) {
    const src = imageUrl(node);
    if (!src) return;
    const image = element.find("img").first();
    const caption = element.find("figcaption").text().trim();
    blocks.push({
      type: "image",
      src,
      alt: image.attr("alt") || caption || title,
      caption,
      width: Number(image.attr("width")) || undefined,
      height: Number(image.attr("height")) || undefined,
    });
    if (caption) plain.push(caption);
  }
});

if (blocks.length === 0) throw new Error("Could not parse the Medium article body");

const plainText = plain.join(" ").replace(/\s+/g, " ").trim();
const subtitle = contentRoot.children("p.pw-post-body-paragraph").first().text().trim();
const excerptSource = description || subtitle || plainText;
const excerpt =
  excerptSource.length > 220 ? `${excerptSource.slice(0, 219).trim()}…` : excerptSource;
const readingTime = `${Math.max(1, Math.round(plainText.split(/\s+/).length / 220))} min`;
const post = {
  slug,
  title,
  subtitle,
  excerpt,
  date,
  tags,
  readingTime,
  url: canonical,
  hero,
  content: blocks,
};
const entry = { slug, title, excerpt, date, tags, readingTime, url: canonical, hero };
const searchEntry = { slug, title, tags, plainText };
const postJson = JSON.stringify(post, null, 2);

for (const directory of ["src/data/posts", "public/data/posts"]) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, `${slug}.json`), postJson);
}

for (const indexPath of ["src/data/posts-index.json", "public/data/posts-index.json"]) {
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8")).filter(
    (item) => item.slug !== slug && item.url !== canonical,
  );
  const insertAt = index.findIndex((item) => item.date < date);
  index.splice(insertAt === -1 ? index.length : insertAt, 0, entry);
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
}

for (const searchPath of ["src/data/search-index.json", "public/data/search-index.json"]) {
  const search = JSON.parse(fs.readFileSync(searchPath, "utf8")).filter(
    (item) => item.slug !== slug && item.title !== title,
  );
  search.unshift(searchEntry);
  fs.writeFileSync(searchPath, JSON.stringify(search));
}

console.log(`Imported "${title}" as ${slug} (${blocks.length} blocks).`);
