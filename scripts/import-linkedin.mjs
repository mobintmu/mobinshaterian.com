#!/usr/bin/env node
// Import a public LinkedIn article into the local blog datasets.
// Usage: node scripts/import-linkedin.mjs <article-url> [tag ...]
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const url = process.argv[2];
const tags = process.argv.slice(3);
if (!url) {
  console.error("Usage: node scripts/import-linkedin.mjs <article-url> [tag ...]");
  process.exit(1);
}

const canonicalUrl = url.split("?")[0].replace(/\/$/, "");
const response = await fetch(canonicalUrl);
if (!response.ok) throw new Error(`LinkedIn returned HTTP ${response.status}`);
const html = await response.text();
const $ = cheerio.load(html);

const title = $("h1.pulse-title").first().text().trim() || $("title").text().trim();
const canonical = $('link[rel="canonical"]').attr("href") || canonicalUrl;
const hero = $('meta[property="og:image"]').attr("content") || null;
const schema = JSON.parse($('script[type="application/ld+json"]').first().text() || "{}");
const date = String(schema.datePublished || "").slice(0, 10);
const readingTime =
  $('meta[name="twitter:data2"]').attr("content")?.replace(/\s+read$/, "") || "1 min";
const slugPart = new URL(canonical).pathname.split("/").filter(Boolean).at(-1) || "";
const articleId = slugPart.split("-").at(-1) || "linkedin";
const slug = `${title
  .replace(/[^a-zA-Z0-9]/g, "-")
  .replace(/^-|-$/g, "")}-${articleId}`;

function inlineHtml(element) {
  const clone = $(element).clone();
  clone.find("*").each((_, node) => {
    const tag = node.tagName?.toLowerCase();
    if (!["a", "strong", "b", "em", "i", "code", "br", "span"].includes(tag)) {
      $(node).replaceWith($(node).contents());
      return;
    }
    if (tag === "span") {
      if ($(node).attr("class")?.includes("font-[700]")) {
        $(node).replaceWith(`<strong>${$(node).html() || ""}</strong>`);
      } else {
        $(node).replaceWith($(node).contents());
      }
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

const blocks = [];
const plain = [];
const container = $('[data-test-id="article-content-blocks"]').first();
container.children().each((_, wrapper) => {
  const element = $(wrapper);
  if (element.is("hr")) {
    blocks.push({ type: "hr" });
    return;
  }
  const heading = element.find("h2, h3").first();
  if (heading.length) {
    const text = heading.text().trim();
    if (text) {
      blocks.push({ type: "heading", level: heading.is("h2") ? 2 : 3, text });
      plain.push(text);
    }
    return;
  }
  const pre = element.find("pre").first();
  if (pre.length) {
    const code = pre.text().replace(/\r\n?/g, "\n").trimEnd();
    const lang = /@Sse|Observable|const |new EventSource|fetch\(/.test(code)
      ? "typescript"
      : /^(GET|POST|Cookie:|Accept:)/m.test(code)
        ? "http"
        : "text";
    blocks.push({ type: "code", lang, code });
    plain.push(code);
    return;
  }
  const list = element.find("ol, ul").first();
  if (list.length) {
    const items = list
      .children("li")
      .toArray()
      .map((item) => inlineHtml(item));
    blocks.push({ type: "list", ordered: list.is("ol"), items });
    plain.push(items.map((item) => cheerio.load(item).text()).join(" "));
    return;
  }
  const paragraph = element.find("p").first();
  if (paragraph.length) {
    const text = paragraph.text().trim();
    if (!text) return;
    blocks.push({ type: "paragraph", html: inlineHtml(paragraph) });
    plain.push(text);
  }
});

if (!title || !date || blocks.length === 0) {
  throw new Error("Could not parse the LinkedIn article");
}

const plainText = plain.join(" ").replace(/\s+/g, " ").trim();
const excerptSource = $('meta[property="og:description"]').attr("content") || plainText;
const excerpt =
  excerptSource.length > 220 ? `${excerptSource.slice(0, 219).trim()}…` : excerptSource;
const post = {
  slug,
  title,
  subtitle: "",
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
