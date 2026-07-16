# Full Blog Import from Medium Archive

## What you'll do
1. Export from Medium: Settings → *Download your information* → wait for email → upload the `.zip` (or the extracted `posts/` folder) into the chat.
2. I run a one-time parser that produces one JSON file per article and a search index.
3. Blog pages render everything locally — no Medium roundtrip.

## What I'll build

### 1. Parser script (`scripts/import-medium.mjs`)
- Reads every `posts/*.html` from the uploaded Medium export.
- For each post, extracts:
  - `slug` (from filename, cleaned), `title`, `subtitle`, `date`, `readingTime`, `tags`, canonical `url`, `lang`.
  - `hero` image (if present).
  - `content`: **block array** — one of:
    - `{type:"heading", level:2|3|4, text}`
    - `{type:"paragraph", html}` (inline `<a>`, `<strong>`, `<em>`, `<code>` preserved as sanitized HTML)
    - `{type:"code", lang, code}` (language guessed from Medium's `<pre>` class or content sniff)
    - `{type:"image", src, alt, caption, width, height}`
    - `{type:"quote", html}`
    - `{type:"list", ordered, items:[html]}`
    - `{type:"embed", provider, url}` (YouTube, GitHub gists, tweets)
    - `{type:"hr"}`
  - `plainText` (stripped content, used for search and excerpt fallback).
- Downloads inline images into `public/blog-assets/<slug>/img-N.<ext>` and rewrites `src` to `/blog-assets/...` so everything is self-hosted and open.
- Writes:
  - `src/data/posts/<slug>.json` — one file per article (open data, crawler-friendly).
  - `src/data/posts-index.json` — array of `{slug,title,excerpt,date,tags,readingTime,url}` for the archive page.
  - `src/data/search-index.json` — `{slug,title,tags,plainText}` for full-text search.
- Idempotent: safe to re-run when you add new Medium posts.

### 2. Routes
- **`/blogs`** (rewrite of current page)
  - Reads `posts-index.json` for cards + tag facets.
  - Loads `search-index.json` lazily on first keystroke.
  - Search matches across **title, tags, and full content**; results ranked (title > tags > body), snippet with highlighted match.
  - Tag filter and free-text search combine; both live in URL (`?tag=go&q=kafka`).
- **`/blog/$slug`** (rewritten)
  - Loads `src/data/posts/<slug>.json` via a small dynamic import so each post is a separate chunk.
  - Renders block array with a `<PostContent blocks={...} />` component:
    - Code blocks use `shiki` (SSR-friendly, no runtime JS) with a copy button + language label.
    - Images use native `loading="lazy"` and preserve dimensions.
    - Embeds render as safe `<iframe>` (YouTube) or link cards (tweets/gists).
  - JSON-LD `Article` schema, canonical → Medium URL, per-post OG title/description, `og:image` from `hero`.
  - "View source JSON" link → raw `/data/posts/<slug>.json` so AI crawlers and readers can grab structured data.

### 3. Static build
- Prerender discovers every `/blog/$slug` via the existing `autoStaticPathsDiscovery` (already on) plus an explicit list built from `posts-index.json` in `vite.config.ts`, so all posts ship as static HTML for GitHub Pages.

### 4. Open-data affordances
- `public/blog-assets/**` and `src/data/posts/*.json` are all static, CORS-friendly, and served from your domain.
- `/blogs` page footer links to `/data/posts-index.json` and mentions the per-post JSON URL pattern.
- Add `Sitemap:` entry for `/sitemap.xml` (generated during build from `posts-index.json`).

## Technical notes
- Parser deps (installed on run): `cheerio` (HTML parse), `he` (entity decode), `slugify`, `shiki` (build-time syntax highlighting so runtime bundle stays small), `dompurify` + `jsdom` (sanitize inline HTML in paragraphs/quotes).
- Search: `minisearch` (~7KB gzipped, tokenizer + prefix + fuzzy). Fast for ~250 docs, works fully client-side.
- No changes to auth, styling tokens, or existing home page beyond the blog nav link already in place.

## What I need from you
Upload the Medium export `.zip` (or drop the extracted `posts/` folder). Once it's in the chat I'll run the importer, commit the JSONs, and wire up the new pages.
