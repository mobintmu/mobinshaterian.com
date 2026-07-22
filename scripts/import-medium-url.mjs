#!/usr/bin/env node
// Import a public Medium article URL into the local blog datasets.
// Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { detectCodeLanguage, supportedCodeLanguages } from "./code-language.mjs";

const requestedUrl = process.argv[2];
const tags = process.argv.slice(3);

if (!requestedUrl) {
  console.error("Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]");
  process.exit(1);
}

let articleHtml;
if (/^https?:\/\//i.test(requestedUrl)) {
  const response = await fetch(requestedUrl);
  if (!response.ok) throw new Error(`Medium returned HTTP ${response.status}`);
  articleHtml = await response.text();
} else {
  articleHtml = fs.readFileSync(requestedUrl, "utf8");
}

const $ = cheerio.load(articleHtml);
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

let blocks = [];
let plain = [];

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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphHtml(paragraph) {
  const text = paragraph.text || "";
  const markups = (paragraph.markups || [])
    .filter((markup) => markup.start < markup.end)
    .map((markup) => ({
      ...markup,
      start: Math.max(0, markup.start),
      end: Math.min(text.length, markup.end),
    }));

  const opening = new Map();
  const closing = new Map();
  for (const markup of markups) {
    if (!opening.has(markup.start)) opening.set(markup.start, []);
    if (!closing.has(markup.end)) closing.set(markup.end, []);
    opening.get(markup.start).push(markup);
    closing.get(markup.end).push(markup);
  }

  function tags(markup) {
    if (markup.type === "STRONG") return ["<strong>", "</strong>"];
    if (markup.type === "EM") return ["<em>", "</em>"];
    if (markup.type === "CODE") return ["<code>", "</code>"];
    if (markup.type === "A" && markup.href) {
      return [
        `<a href="${escapeHtml(markup.href)}" target="_blank" rel="noreferrer noopener">`,
        "</a>",
      ];
    }
    return ["", ""];
  }

  let html = "";
  for (let index = 0; index <= text.length; index++) {
    const ending = [...(closing.get(index) || [])].sort((a, b) => b.start - a.start);
    for (const markup of ending) html += tags(markup)[1];

    const starting = [...(opening.get(index) || [])].sort((a, b) => b.end - a.end);
    for (const markup of starting) html += tags(markup)[0];

    if (index < text.length) html += escapeHtml(text[index]);
  }
  return html;
}

function apolloParagraphs() {
  const script = $("script")
    .toArray()
    .map((node) => $(node).text())
    .find((text) => text.startsWith("window.__APOLLO_STATE__"));
  if (!script) return [];

  const state = JSON.parse(script.slice(script.indexOf("=") + 1).replace(/;\s*$/, ""));
  const post = state[`Post:${articleId}`];
  const contentKey = Object.keys(post || {}).find((key) => key.startsWith("content("));
  const references = contentKey ? post[contentKey]?.bodyModel?.paragraphs || [] : [];
  return references.map((reference) => state[reference.__ref]).filter(Boolean);
}

function blocksFromApollo(paragraphs) {
  const parsedBlocks = [];
  const parsedPlain = [];

  for (let index = 0; index < paragraphs.length; index++) {
    const paragraph = paragraphs[index];
    const text = (paragraph.text || "").trim();

    if (index === 0 && text === title) continue;

    if (paragraph.type === "H3" || paragraph.type === "H4") {
      if (text) {
        parsedBlocks.push({
          type: "heading",
          level: paragraph.type === "H3" ? 2 : 3,
          text,
        });
        parsedPlain.push(text);
      }
      continue;
    }

    if (paragraph.type === "P" || paragraph.type === "BQ") {
      if (text) {
        parsedBlocks.push({
          type: paragraph.type === "BQ" ? "quote" : "paragraph",
          html: paragraphHtml(paragraph),
        });
        parsedPlain.push(text);
      }
      continue;
    }

    if (paragraph.type === "PRE") {
      if (text) {
        const declaredLanguage = paragraph.codeBlockMetadata?.lang;
        parsedBlocks.push({
          type: "code",
          lang: supportedCodeLanguages.has(declaredLanguage)
            ? declaredLanguage
            : detectCodeLanguage(text),
          code: paragraph.text.replace(/\r\n?/g, "\n").trimEnd(),
        });
        parsedPlain.push(text);
      }
      continue;
    }

    if (paragraph.type === "ULI" || paragraph.type === "OLI") {
      const ordered = paragraph.type === "OLI";
      const items = [];
      while (index < paragraphs.length && paragraphs[index].type === (ordered ? "OLI" : "ULI")) {
        items.push(paragraphHtml(paragraphs[index]));
        parsedPlain.push((paragraphs[index].text || "").trim());
        index++;
      }
      index--;
      if (items.length) parsedBlocks.push({ type: "list", ordered, items });
      continue;
    }

    if (paragraph.type === "IMG" && paragraph.metadata?.id) {
      const metadata = paragraph.metadata;
      parsedBlocks.push({
        type: "image",
        src: `https://miro.medium.com/v2/resize:fit:1400/${metadata.id}`,
        alt: metadata.alt || title,
        caption: text,
        width: metadata.originalWidth || undefined,
        height: metadata.originalHeight || undefined,
      });
      if (text) parsedPlain.push(text);
    }
  }

  return { blocks: parsedBlocks, plain: parsedPlain };
}

const completeParagraphs = apolloParagraphs();
if (completeParagraphs.length > blocks.length) {
  ({ blocks, plain } = blocksFromApollo(completeParagraphs));
}

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
