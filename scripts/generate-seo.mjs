import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const publicDirectory = path.join(root, "public");
const posts = JSON.parse(fs.readFileSync(path.join(root, "src/data/posts-index.json"), "utf8"));
const siteUrl = "https://mobinshaterian.com";

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urls = [
  { loc: `${siteUrl}/`, changefreq: "monthly", priority: "1.0" },
  {
    loc: `${siteUrl}/experience`,
    changefreq: "monthly",
    priority: "0.9",
  },
  {
    loc: `${siteUrl}/youtube`,
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    loc: `${siteUrl}/virgool`,
    changefreq: "weekly",
    priority: "0.9",
  },
  {
    loc: `${siteUrl}/blogs`,
    lastmod: posts[0]?.date,
    changefreq: "weekly",
    priority: "0.9",
  },
  ...posts.map((post) => ({
    loc: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
    lastmod: post.date,
    changefreq: "monthly",
    priority: "0.8",
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

const feedPosts = posts.slice(0, 50);
const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mobin Shaterian — Software Engineering Blog</title>
    <link>${siteUrl}/blogs</link>
    <description>Practical articles about Go, backend architecture, distributed systems, data engineering, and DevOps.</description>
    <language>en</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${feedPosts
  .map((post) => {
    const url = `${siteUrl}/blog/${encodeURIComponent(post.slug)}`;
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
${post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`).join("\n")}
    </item>`;
  })
  .join("\n")}
  </channel>
</rss>
`;

fs.writeFileSync(path.join(publicDirectory, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(publicDirectory, "feed.xml"), feed);
fs.copyFileSync(
  path.join(root, "src/data/profile.json"),
  path.join(publicDirectory, "data/profile.json"),
);
fs.writeFileSync(
  path.join(publicDirectory, "robots.txt"),
  `User-agent: *
Content-Signal: search=yes,ai-input=yes,ai-train=yes,use=full
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`,
);

console.log(`Generated SEO files and public profile JSON for ${posts.length} posts.`);
