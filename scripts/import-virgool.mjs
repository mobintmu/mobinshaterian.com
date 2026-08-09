import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const PROFILE_HANDLE = "mobinshaterian";
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const feedUrl = `https://virgool.io/feed/@${PROFILE_HANDLE}`;

const response = await fetch(feedUrl);
if (!response.ok) {
  throw new Error(`Virgool import failed with status ${response.status}.`);
}

const xml = await response.text();
const $ = cheerio.load(xml, { xmlMode: true });
const posts = $("item")
  .toArray()
  .map((item) => {
    const element = $(item);
    const description = element.children("description").text().replace(/\s+/g, " ").trim();

    return {
      title: element.children("title").text().trim(),
      url: element.children("link").text().trim(),
      date: new Date(element.children("pubDate").text()).toISOString().slice(0, 10),
      excerpt: `${description.slice(0, 240)}${description.length > 240 ? "…" : ""}`,
    };
  });

if (!posts.length) {
  throw new Error("Virgool feed did not contain any posts.");
}

const output = `${JSON.stringify(posts, null, 2)}\n`;
fs.writeFileSync(path.join(root, "src/data/virgool-posts.json"), output);
fs.writeFileSync(path.join(root, "public/data/virgool-posts.json"), output);
console.log(`Imported ${posts.length} posts from Virgool @${PROFILE_HANDLE}.`);
