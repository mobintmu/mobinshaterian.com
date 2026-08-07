#!/usr/bin/env node
// Import a public Medium article URL into the local blog datasets.
// Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as cheerio from "cheerio";
import { detectCodeLanguage, supportedCodeLanguages } from "./code-language.mjs";
import { formatReaderCode } from "./reader-code-formatter.mjs";

const requestedUrl = process.argv[2];
const tags = process.argv.slice(3);

if (!requestedUrl) {
  console.error("Usage: node scripts/import-medium-url.mjs <article-url> [tag ...]");
  process.exit(1);
}

let articleHtml = "";
let readerMarkdown = "";
if (/^https?:\/\//i.test(requestedUrl)) {
  let mediumError;
  try {
    const response = await fetch(requestedUrl);
    if (response.ok) {
      const responseHtml = await response.text();
      const responsePage = cheerio.load(responseHtml);
      if (
        responsePage("h1.pw-post-title, h1").first().text().trim() &&
        responsePage('meta[property="article:published_time"]').attr("content")
      ) {
        articleHtml = responseHtml;
      } else {
        mediumError = "response did not contain article markup";
      }
    } else mediumError = `HTTP ${response.status}`;
  } catch (error) {
    mediumError = error instanceof Error ? error.message : String(error);
  }

  if (!articleHtml) {
    const readerUrl = `https://r.jina.ai/${requestedUrl}`;
    console.warn(`Medium request failed (${mediumError}); trying Jina Reader.`);
    try {
      readerMarkdown = execFileSync(
        "curl",
        [
          "--location",
          "--fail-with-body",
          "--silent",
          "--show-error",
          "--max-time",
          "30",
          readerUrl,
        ],
        { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
      );
      if (
        !/^Title: .+$/m.test(readerMarkdown) ||
        !/^URL Source: https?:\/\/.+$/m.test(readerMarkdown) ||
        !/^Published Time: .+$/m.test(readerMarkdown) ||
        !/^Markdown Content:\s*$/m.test(readerMarkdown)
      ) {
        throw new Error("Jina Reader returned an unexpected response format");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Could not retrieve the Medium article or Jina Reader fallback: ${detail}`);
    }
  }
} else {
  const fileContent = fs.readFileSync(requestedUrl, "utf8");
  if (/^Title: .+\n\nURL Source:/m.test(fileContent)) readerMarkdown = fileContent;
  else articleHtml = fileContent;
}

const $ = cheerio.load(articleHtml);
const readerField = (name) =>
  readerMarkdown.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim() || "";
const title =
  readerField("Title") ||
  $("h1.pw-post-title").first().text().trim() ||
  $("h1").first().text().trim();
const canonical =
  readerField("URL Source") || $('link[rel="canonical"]').attr("href") || requestedUrl;
const articleId = new URL(canonical).pathname.match(/-([a-f0-9]{12})\/?$/i)?.[1] || "medium";
const slug = `${title.replace(/[^a-zA-Z0-9]/g, "-").replace(/^-|-$/g, "")}-${articleId}`;
const date = String(
  readerField("Published Time") ||
    $('meta[property="article:published_time"]').attr("content") ||
    "",
).slice(0, 10);
let hero = $('meta[property="og:image"]').attr("content") || null;
const description = $('meta[property="og:description"]').attr("content")?.trim() || "";
const contentRoot = $("h1.pw-post-title").first().parent().parent();

if (!title || !date || (!readerMarkdown && !contentRoot.length)) {
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

function inlineMarkdown(value) {
  const codeTokens = [];
  const withCodeTokens = value.replace(/`([^`]+)`/g, (_, code) => {
    const token = `\u0000CODE${codeTokens.length}\u0000`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });
  return escapeHtml(withCodeTokens)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!_)_([^_]+)_(?!_)/g, "<em>$1</em>")
    .replace(/\u0000CODE(\d+)\u0000/g, (_, index) => codeTokens[Number(index)])
    .replace(/<code>([\w.:-]+)<\/code>([\w]+)/g, "<code>$1$2</code>");
}

function plainMarkdown(value) {
  return cheerio
    .load(`<body>${inlineMarkdown(value)}</body>`)("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function blocksFromReader(markdown) {
  const body = markdown.split(/^Markdown Content:\s*$/m).at(-1) || "";
  const lines = body.split(/\r?\n/);
  const parsedBlocks = [];
  const parsedPlain = [];
  let paragraph = [];
  let started = false;

  const addPlain = (value) => {
    const text = plainMarkdown(value);
    if (text) parsedPlain.push(text);
  };
  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (!text) return;
    parsedBlocks.push({ type: "paragraph", html: inlineMarkdown(text) });
    addPlain(text);
  };
  const addCodeBlock = (codeLines, language, preserveWhitespace = false) => {
    const rawCode = codeLines
      .filter((codeLine) => codeLine.trim())
      .map((codeLine) => codeLine.trimEnd())
      .join("\n")
      .trimEnd();
    if (!rawCode) return;
    const code = formatReaderCode(rawCode, language || detectCodeLanguage(rawCode), {
      preserveWhitespace,
    });
    parsedBlocks.push({
      type: "code",
      lang: language || detectCodeLanguage(code),
      code,
      ...(preserveWhitespace ? { preserveWhitespace: true } : {}),
    });
    parsedPlain.push(code);
  };

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();

    if (!started) {
      if (
        !line ||
        /^\[!\[/.test(line) ||
        /^\d+ min read$/.test(line) ||
        /^(?:\d+\s+)?(?:minutes?|hours?|days?|weeks?|months?|years?) ago$/i.test(line)
      ) {
        continue;
      }
      started = true;
    }

    if (!line || line === "Press enter or click to view image in full size") {
      flushParagraph();
      continue;
    }

    if (
      /^## Get .+ stories in your inbox$/i.test(line) ||
      /^Join Medium for free to get updates from this writer\.?$/i.test(line) ||
      /^Remember me for faster sign in$/i.test(line)
    ) {
      flushParagraph();
      continue;
    }

    if (/^={20,}$/.test(line)) {
      flushParagraph();
      const diagramLines = [];
      let separatorCount = 0;
      for (; index < lines.length; index++) {
        const diagramLine = lines[index];
        const trimmedDiagramLine = diagramLine.trim();
        if (/^={20,}$/.test(trimmedDiagramLine)) separatorCount++;
        diagramLines.push(diagramLine);

        if (separatorCount >= 2) {
          const nextContentLine = lines
            .slice(index + 1)
            .find((candidate) => candidate.trim())
            ?.trim();
          if (!nextContentLine || /^(?:#{2,3}\s+|!\[|(?:\*|-|\+)\s+)/.test(nextContentLine)) {
            break;
          }
        }
      }
      addCodeBlock(diagramLines, "text", true);
      continue;
    }

    const fence = line.match(/^```\s*([^\s`]*)/);
    if (fence) {
      flushParagraph();
      const codeLines = [];
      for (index++; index < lines.length && !/^```\s*$/.test(lines[index].trim()); index++) {
        codeLines.push(lines[index]);
      }
      const code = codeLines.join("\n").trimEnd();
      if (code) {
        const declaredLanguage = fence[1].toLowerCase();
        parsedBlocks.push({
          type: "code",
          lang: supportedCodeLanguages.has(declaredLanguage)
            ? declaredLanguage
            : detectCodeLanguage(code),
          code,
        });
        parsedPlain.push(code);
      }
      continue;
    }

    if (line === "Code snippet") continue;

    const plainCodeLanguage = /^curl\s+-/.test(line)
      ? "bash"
      : line === "model"
        ? "text"
        : /^import\s+[A-Za-z_]/.test(line) || /^#\s*(?:API Endpoint|Usage)/.test(line)
          ? "python"
          : /^apiVersion:/.test(line)
            ? "yaml"
            : "";
    if (plainCodeLanguage) {
      flushParagraph();
      const codeLines = [];
      for (; index < lines.length; index++) {
        const codeLine = lines[index];
        const trimmedCodeLine = codeLine.trim();
        if (
          codeLines.length &&
          (/^#{2,3}\s+/.test(trimmedCodeLine) ||
            /^>\s?/.test(trimmedCodeLine) ||
            trimmedCodeLine === "Press enter or click to view image in full size" ||
            /^!\[/.test(trimmedCodeLine))
        ) {
          break;
        }
        codeLines.push(codeLine);
      }
      index--;
      addCodeBlock(codeLines, plainCodeLanguage);
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)$/);
    if (image) {
      flushParagraph();
      const alt = image[1].replace(/^Image \d+:?\s*/, "").trim();
      if (!hero) hero = image[2];
      parsedBlocks.push({ type: "image", src: image[2], alt: alt || title, caption: "" });
      continue;
    }

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      const text = plainMarkdown(heading[2]);
      parsedBlocks.push({ type: "heading", level: heading[1].length === 2 ? 2 : 3, text });
      parsedPlain.push(text);
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph();
      const quoteLines = [];
      for (; index < lines.length; index++) {
        const quote = lines[index].trim().match(/^>\s?(.*)$/);
        if (!quote) break;
        quoteLines.push(quote[1]);
      }
      index--;
      const quote = quoteLines.join(" ").trim();
      if (quote) {
        parsedBlocks.push({ type: "quote", html: inlineMarkdown(quote) });
        addPlain(quote);
      }
      continue;
    }

    const unordered = line.match(/^(?:\*|-|\+)\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      const itemPattern = isOrdered ? /^\d+[.)]\s+(.+)$/ : /^(?:\*|-|\+)\s+(.+)$/;
      const items = [];
      for (; index < lines.length; index++) {
        const item = lines[index].trim().match(itemPattern);
        if (!item) break;
        items.push(inlineMarkdown(item[1]));
        addPlain(item[1]);
      }
      index--;
      parsedBlocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    if (/^(?:---+|___+|\*\*\*+)$/.test(line)) {
      flushParagraph();
      parsedBlocks.push({ type: "hr" });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return { blocks: parsedBlocks, plain: parsedPlain };
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

if (readerMarkdown) ({ blocks, plain } = blocksFromReader(readerMarkdown));

const completeParagraphs = readerMarkdown ? [] : apolloParagraphs();
if (completeParagraphs.length > blocks.length) {
  ({ blocks, plain } = blocksFromApollo(completeParagraphs));
}

if (blocks.length === 0) throw new Error("Could not parse the Medium article body");

const plainText = plain.join(" ").replace(/\s+/g, " ").trim();
const subtitle = readerMarkdown
  ? plain.find((text) => text !== title) || ""
  : contentRoot.children("p.pw-post-body-paragraph").first().text().trim();
const excerptSource = description || subtitle || plainText;
const excerpt =
  excerptSource.length > 220 ? `${excerptSource.slice(0, 219).trim()}…` : excerptSource;
const readerReadingTime = readerMarkdown.match(/^\s*(\d+) min read\s*$/m)?.[1];
const readingTime = readerReadingTime
  ? `${readerReadingTime} min`
  : `${Math.max(1, Math.round(plainText.split(/\s+/).length / 220))} min`;
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
