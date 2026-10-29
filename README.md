# mobinshaterian.com

Personal portfolio and technical blog for Mobin Shaterian. The site presents a resume-style home page, a searchable archive of 200+ English articles imported from Medium, and an index of Persian writing and videos published on Virgool and Aparat.

The application is built with React and TanStack Start, then pre rendered to static HTML for deployment to GitHub Pages. Blog content is stored as JSON in the repository, so the site does not need a database, CMS, or production API.

## What the site contains

- `/` — portfolio page with profile, experience, skills, education, recent writing, and contact details
- `/experience` — long-form work history page
- `/blogs` — full blog archive with tag filters and client-side full-text search
- `/blog/:slug` — an individual article rendered from local JSON
- `/github` and `/github/:repo` — featured open-source repositories and per-repository detail pages
- `/youtube` and `/youtube/:id` — English video index and per-video detail pages
- `/aparat` — Persian video index that links to Aparat
- `/virgool` — Persian article index that links to Virgool; articles stay canonical on virgool.io
- `/data/*.json` — public, machine-readable metadata: `posts-index.json`, `posts/:slug.json`, `virgool-posts.json`, `youtube-videos.json`, `aparat-videos.json`, and `github-projects.json`
- Custom application and article 404 pages
- SEO metadata, Open Graph fields, canonical links, per-page JSON-LD, `sitemap.xml`, `feed.xml`, and `robots.txt`

## Technology stack

### Application framework

| Technology                                            | Purpose in this project                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [React 19](https://react.dev/)                        | Builds the user interface from components.                                                                                                                   |
| [TypeScript](https://www.typescriptlang.org/)         | Adds static types to the React and server code. Strict mode is enabled.                                                                                      |
| [TanStack Start](https://tanstack.com/start/latest)   | Full-stack React framework responsible for server rendering, application startup, and prerendering.                                                          |
| [TanStack Router](https://tanstack.com/router/latest) | Type-safe, file-based routing, route loaders, URL search parameters, metadata, 404 handling, and scroll restoration.                                         |
| [TanStack Query](https://tanstack.com/query/latest)   | Provides the application-level `QueryClient`. It is ready for cached asynchronous data, although the current pages mainly use local JSON.                    |
| [Vite](https://vite.dev/)                             | Development server, hot module replacement, and production build pipeline.                                                                                   |
| [Nitro](https://nitro.build/)                         | Server/build engine used by TanStack Start. The configured `node-server` preset produces the `.output` build, including `.output/public` for static hosting. |

### Styling and UI

| Technology                                           | Purpose in this project                                                                                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Tailwind CSS 4](https://tailwindcss.com/)           | Utility-first styling, loaded through the Vite plugin and `src/styles.css`.                                                                                         |
| [shadcn/ui](https://ui.shadcn.com/)                  | Project convention and configuration for reusable UI components. Components are copied into `src/components/ui`, rather than installed as a single runtime package. |
| [Radix UI](https://www.radix-ui.com/)                | Accessible primitives underlying the shadcn components.                                                                                                             |
| [Lucide React](https://lucide.dev/)                  | Icons used throughout the portfolio and blog pages.                                                                                                                 |
| `class-variance-authority`, `clsx`, `tailwind-merge` | Class composition, component variants, and conflict-safe Tailwind class merging.                                                                                    |
| Inter and JetBrains Mono                             | Web fonts used for the main text and terminal-inspired interface.                                                                                                   |
| `tw-animate-css`                                     | Reusable Tailwind animation utilities.                                                                                                                              |

The repository also includes shadcn components backed by libraries such as Sonner, Vaul, Recharts, Embla Carousel, React Hook Form, Zod, and React Day Picker. Many are available for future UI work and are not currently used by the three main pages.

### Content and search

| Technology                                          | Purpose in this project                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| JSON files                                          | Store profile details, post metadata, full post content, and the search corpus.                             |
| [MiniSearch](https://lucaong.github.io/minisearch/) | Runs full-text blog search entirely in the browser. The search index is fetched lazily when search is used. |
| [Zod](https://zod.dev/) and `@tanstack/zod-adapter` | Validate the `/blogs` URL parameters (`q` and `tag`).                                                       |
| [Cheerio](https://cheerio.js.org/)                  | Parses exported Medium HTML in the import script. It is a development dependency, not browser code.         |
| `slugify`                                           | Installed slug-generation utility; it is not currently referenced by the application or import scripts.     |

### Tooling and delivery

| Technology             | Purpose in this project                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [Bun](https://bun.sh/) | Package manager and command runner. `bun.lock` makes installs reproducible.                                              |
| ESLint 9               | Lints TypeScript, React hooks, and refresh-compatible exports.                                                           |
| Prettier               | Formats source and configuration files; formatting violations are surfaced through ESLint too.                           |
| GitHub Actions         | Builds the site on every push to `main` and deploys `.output/public` to GitHub Pages.                                    |
| GitHub Pages           | Static production host. `CNAME` and `public/CNAME` configure the custom domain.                                          |
| Lovable                | The project is connected to Lovable and uses its TanStack/Vite configuration package and browser error-reporting bridge. |

## How the application works

### Routing and rendering

Routes live in `src/routes` and follow TanStack Router's file-based conventions:

| Source file                    | Route                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| `src/routes/__root.tsx`        | Root document, global metadata, providers, error boundary, and 404 UI |
| `src/routes/index.tsx`         | `/`                                                                   |
| `src/routes/experience.tsx`    | `/experience`                                                         |
| `src/routes/blogs.tsx`         | `/blogs`                                                              |
| `src/routes/blog.$slug.tsx`    | `/blog/:slug`                                                         |
| `src/routes/github.tsx`        | `/github`                                                             |
| `src/routes/github_.$repo.tsx` | `/github/:repo` (`_` opts the page out of nesting under `/github`)    |
| `src/routes/youtube.tsx`       | `/youtube`                                                            |
| `src/routes/youtube_.$id.tsx`  | `/youtube/:id`                                                        |
| `src/routes/aparat.tsx`        | `/aparat`                                                             |
| `src/routes/virgool.tsx`       | `/virgool`                                                            |

`src/routeTree.gen.ts` is generated from these files. Do not edit it manually.

At build time, `vite.config.ts` reads every slug from `src/data/posts-index.json` and adds the home page, archive, and all article URLs to the prerender list. TanStack Start and Nitro render those routes ahead of time. Static routes that are not listed explicitly, such as `/virgool` and `/aparat`, are still discovered by `prerender.autoStaticPathsDiscovery`, so they are pre rendered as well. The resulting static site is written to `.output/public` and can be hosted without a running Node server.

The custom server entry in `src/server.ts` is still used by the build/server-rendering pipeline. Together with `src/start.ts` and the error helpers in `src/lib`, it converts catastrophic SSR failures into a user-friendly HTML error page and reports client-side route errors to Lovable when that bridge is available.

### Blog data flow

The content pipeline intentionally writes two copies of some data:

```text
Medium HTML export
        |
        v
scripts/import-medium.mjs
        |
        +-- src/data/posts/*.json --------> bundled by article route loaders
        +-- src/data/posts-index.json ----> home page, archive, prerender route list
        +-- src/data/search-index.json ---> source copy of the search corpus
        |
        +-- public/data/posts/*.json ------> public /data/posts/:slug.json files
        +-- public/data/posts-index.json --> public metadata endpoint
        +-- public/data/search-index.json -> browser full-text search
```

The copies under `src/data` are application source inputs. The copies under `public/data` are copied unchanged into the public build and can be fetched directly by browsers or other tools.

An article JSON file contains metadata plus an ordered `content` array. `PostContent.tsx` renders supported block types: headings, paragraphs, code, images, quotes, lists, embeds, and horizontal rules. Code blocks include a copy button; YouTube embeds render inline, while other embeds become external links.

On `/blogs`, titles and post cards come from the small metadata index. The larger search index is downloaded only after a visitor focuses the search field or supplies a query. MiniSearch gives titles and tags more weight than article body text and supports prefixes and fuzzy matches. The selected query and tag stay in the URL, so filtered views are shareable.

### SEO artifacts

`scripts/generate-seo.mjs` runs before every build (through the `prebuild` script) and can be run on its own with `bun run seo`. It writes the static SEO files into `public/`:

| Output                                                            | Source of truth                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/sitemap.xml`                                              | Every public page. `lastmod` comes from `github-projects.json` (`generatedAt` and per-project `pushedAt`), `youtube-videos.json` (`published`), `posts-index.json` (`dateModified` or `date`), and the newest entry in `virgool-posts.json` for `/virgool` |
| `public/feed.xml`                                                 | The 50 newest English Medium articles. Persian Virgool posts are intentionally excluded because they stay canonical on virgool.io                                                                                                                          |
| `public/robots.txt`                                               | Crawling rules, the `Content-Signal` hints, and the sitemap location                                                                                                                                                                                       |
| `public/data/profile.json` and `public/data/github-projects.json` | Copies of the matching `src/data` files                                                                                                                                                                                                                    |

Per-page metadata lives in each route's `head()` and is built with `websiteMeta()` from `src/lib/seo.ts`. That helper emits the description, author, robots, Open Graph, and Twitter tags, and accepts a `locale` argument so Persian pages (`/virgool`, `/aparat`) declare `og:locale=fa_IR` instead of the `en_US` default. Titles and descriptions shared across the app belong in that file as constants such as `HOME_TITLE`, `BLOG_DESCRIPTION`, or `VIRGOOL_TITLE`.

Structured data is emitted per route: `Person`, `WebSite`, and `ProfilePage` on `/`, a `@graph` holding the shared `Person` and `WebSite` nodes plus a `CollectionPage` with an `ItemList` of `BlogPosting` entries on `/virgool` (with `dateModified` taken from the newest post), and `ItemList` of `VideoObject` entries on `/youtube` and `/aparat`. Because Virgool articles are canonical on virgool.io, individual Virgool URLs are not added to `sitemap.xml`; only the `/virgool` index is submitted.

### GitHub Pages routing

Static hosts cannot normally resolve an unknown nested client-side URL. `public/404.html` stores the requested location in `sessionStorage` and redirects to `/`; the root React component then restores that path through TanStack Router. Pre rendered known routes load directly, while unknown routes reach the application's 404 UI.

## Project structure

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages build and deployment
├── public/
│   ├── 404.html                  # GitHub Pages SPA fallback
│   ├── data/                     # Public post, metadata, and search JSON
│   ├── sitemap.xml, feed.xml     # Generated by scripts/generate-seo.mjs
│   ├── CNAME                     # Custom domain copied into the build
│   └── robots.txt, favicons...
├── scripts/
│   ├── import-medium.mjs         # Convert a Medium export to site JSON
│   ├── import-virgool.mjs        # Read the Virgool RSS feed into post metadata
│   ├── import-youtube.mjs        # Refresh src/data/youtube-videos.json
│   ├── import-aparat.mjs         # Refresh src/data/aparat-videos.json
│   ├── import-github.mjs         # Refresh src/data/github-projects.json
│   ├── generate-seo.mjs          # Write sitemap, RSS feed, robots, public data
│   ├── fix-images.mjs            # Replace broken local image paths with Medium CDN URLs
│   └── retag-ml.mjs              # Recalculate the Machine Learning tag
├── src/
│   ├── components/
│   │   ├── PostContent.tsx       # Article block renderer
│   │   └── ui/                   # shadcn/Radix UI components
│   ├── data/
│   │   ├── profile.json          # Portfolio content and contact links
│   │   ├── posts/                # Full article JSON used by route loaders
│   │   ├── posts-index.json      # Compact post metadata
│   │   ├── search-index.json     # Full-text search source data
│   │   ├── virgool-posts.json    # Persian article metadata shown on /virgool
│   │   ├── youtube-videos.json   # Video metadata shown on /youtube
│   │   ├── aparat-videos.json    # Persian video metadata shown on /aparat
│   │   └── github-projects.json  # Repository metadata shown on /github
│   ├── lib/                      # Utilities, SEO helpers (seo.ts), error handling
│   ├── routes/                   # File-based pages
│   ├── router.tsx                # Router and QueryClient context
│   ├── server.ts                 # Custom TanStack Start server entry
│   ├── start.ts                  # Request middleware
│   └── styles.css                # Tailwind theme and global styles
├── components.json              # shadcn/ui configuration
├── eslint.config.js              # Lint and formatting rules
├── package.json                  # Dependencies and commands
├── tsconfig.json                 # TypeScript configuration and @/* alias
└── vite.config.ts                # TanStack Start, Nitro, and prerender config
```

## Local development

### Requirements

- Bun (the repository uses a Bun lockfile)
- A current Node-compatible environment; CI installs the latest Bun release

Install and start the development server:

```bash
curl -fsSL https://bun.sh/install | bash  # skip if Bun is installed
bun install
bun run dev
```

Vite prints the local URL, normally `http://localhost:3000`.

No environment variables, external database, or API credentials are required for the current site.

## Available commands

| Command                   | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `bun run dev`             | Start the Vite development server with hot reload.                              |
| `bun run build`           | Create the production/pre rendered build in `.output`.                          |
| `bun run build:dev`       | Build using Vite's development mode.                                            |
| `bun run preview`         | Preview the production build locally.                                           |
| `bun run lint`            | Run ESLint and Prettier checks.                                                 |
| `bun run format`          | Rewrite supported files with Prettier.                                          |
| `bun run seo`             | Regenerate `sitemap.xml`, `feed.xml`, `robots.txt`, and the public data copies. |
| `bun run import:virgool`  | Refresh the Persian post metadata from the Virgool RSS feed.                    |
| `bun run import:youtube`  | Refresh `src/data/youtube-videos.json` from YouTube.                            |
| `bun run import:aparat`   | Refresh `src/data/aparat-videos.json` from Aparat.                              |
| `bun run import:github`   | Refresh `src/data/github-projects.json` from GitHub.                            |
| `bun run format:go-posts` | Reformat Go code blocks inside imported articles.                               |

There is currently no automated test command.

## Editing site content

Portfolio content is data-driven. Update `src/data/profile.json` to change the name, summary, contact details, skills, work history, or education. The home page reads that file directly.

Global colors, fonts, terminal effects, and reusable CSS utilities are in `src/styles.css`. The theme uses CSS variables with OKLCH colors and Tailwind's `@theme` mapping.

To add a route, create a file under `src/routes` using the conventions documented in `src/routes/README.md`. The route tree will be regenerated by the TanStack Router tooling.

## Importing articles from Medium

Medium articles are generated from the `posts` directory inside an unzipped Medium export:

```bash
bun scripts/import-medium.mjs /absolute/path/to/medium-export/posts
```

By default, the importer attempts to download article images into `public/blog-assets`. To retain the remote Medium image URLs instead:

```bash
DOWNLOAD_IMAGES=0 bun scripts/import-medium.mjs /absolute/path/to/medium-export/posts
```

The importer:

1. Ignores draft HTML files.
2. Extracts article metadata and canonical URLs.
3. Converts supported HTML elements into typed content blocks.
4. Estimates reading time at roughly 220 words per minute.
5. Preserves existing tags from `src/data/posts.json` when slugs match.
6. Writes matching source and public post collections and indexes.

After importing, run the normal validation commands and inspect the changed JSON before committing:

```bash
bun run lint
bun run build
```

Two one-off maintenance scripts are also included:

- `bun scripts/fix-images.mjs` maps missing `/blog-assets/...` references back to original Medium CDN images. It currently expects exported HTML at `/tmp/medium-ext/posts`.
- `bun scripts/retag-ml.mjs` scans article text and consistently adds or removes the `Machine Learning` tag across both source and public indexes.

Both maintenance scripts rewrite many generated JSON files, so review their diff before committing.

## Persian content on Virgool

`/virgool` is an index of Persian articles that are written and hosted on [Virgool](https://virgool.io/@mobinshaterian). The repository stores only metadata and links out, so no Virgool article body is copied into this site.

```bash
bun run import:virgool   # node scripts/import-virgool.mjs
```

The importer reads `https://virgool.io/feed/@mobinshaterian`, fails loudly when the feed is unreachable or empty, and writes the same array to `src/data/virgool-posts.json` and `public/data/virgool-posts.json`:

```json
[
  {
    "title": "کلاچ برقی در عصر ماشین‌های پرنده",
    "url": "https://virgool.io/@mobinshaterian/...-zymt4fd0hbgy",
    "date": "2026-10-28",
    "excerpt": "…"
  }
]
```

| Field     | Rule                                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `title`   | RSS `<title>`, trimmed                                                                                                  |
| `url`     | RSS `<link>`, which is the canonical Virgool URL                                                                        |
| `date`    | `<pubDate>` normalized to an ISO date (`YYYY-MM-DD`); drives the card date label and JSON-LD `datePublished`            |
| `excerpt` | First 240 characters of the whitespace-normalized `<description>`, suffixed with `…` when the text was longer than that |

The list is ordered newest first and the first element is rendered as the featured card. `src/routes/virgool.tsx` reads the source copy at build time, `scripts/generate-seo.mjs` uses `[0].date` as the `/virgool` sitemap `lastmod`, and the page's `CollectionPage` JSON-LD reuses it as `dateModified`.

### When the Virgool feed is unavailable

The Virgool RSS endpoint occasionally answers `500 Internal Server Error`. The importer aborts in that case instead of writing a partial or empty file, so add the post by hand and keep the list newest first:

1. Open the article and read `article:published_time` from its metadata for the exact `date`.
2. Add `{ title, url, date, excerpt }` as the first element of both `src/data/virgool-posts.json` and `public/data/virgool-posts.json`.
3. Run `bun run seo` so the `/virgool` sitemap `lastmod` matches the new post, then run `bun run lint`.

Once the feed is healthy again, `bun run import:virgool` rebuilds the entire list from the feed, so manual entries do not accumulate as debt. The individual Virgool URLs are deliberately left out of `sitemap.xml` and `feed.xml` because Virgool is their canonical host; only the `/virgool` index is promoted.

## Production deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`. The workflow:

1. Checks out the repository.
2. Installs Bun.
3. Runs `bun install --frozen-lockfile`.
4. Runs `bun run build`.
5. Uploads `.output/public` as the GitHub Pages artifact.
6. Deploys that artifact to the `github-pages` environment.

For a manual deployment, run the workflow from the GitHub Actions interface. GitHub Pages must be configured to use GitHub Actions as its source.

## Important maintenance notes

- Keep `src/data` and `public/data` synchronized; the import and maintenance scripts already update both.
- Keep `src/data/virgool-posts.json` ordered newest first. The featured card, the `CollectionPage` `dateModified`, and the `/virgool` sitemap `lastmod` all read the first entry.
- Run `bun run seo` (or any build, because `prebuild` runs it) after changing profile, GitHub, YouTube, Aparat, or Virgool data so `sitemap.xml`, `feed.xml`, and the public JSON copies stay in sync.
- Add new article slugs to `src/data/posts-index.json` through the importer so `vite.config.ts` pre renders them.
- Do not edit `src/routeTree.gen.ts` by hand.
- Do not commit `.output`, `dist`, `.vinxi`, or `node_modules`.
- This repository is connected to Lovable. Do not force-push, rebase, amend, or squash commits that have already been pushed, because rewriting published history can break Lovable's project history.

# Technology

- **React** – the actual UI library, same as what you know.
- **TanStack Start** – a full-stack React framework (like Next.js, but from the TanStack team — makers of React Query, TanStack Router). It adds file-based routing, server-side rendering, and API routes on top of plain React.
- **Vite** – the build tool/dev server. Fast hot-reload, bundles everything for production.
- **Nitro** – the server engine TanStack Start uses under the hood to actually run/deploy the server (handles the `node-server` preset in your `vite.config.ts`, and produces the static output in `.output/public`).
- **TypeScript** – your code is `.ts`/`.tsx`, typed React.
- **shadcn/ui** (implied by `components.json`) – a component library built on Radix UI + Tailwind CSS, pretty common in Lovable.dev-generated projects.
- **Pre rendering** – your `vite.config.ts` has `prerender.enabled: true` with a list of static pages (home, blogs, each blog post) — so at build time it crawls your routes and outputs static HTML, which is why this can deploy to GitHub Pages (a static host) instead of needing a live Node server.
- **bun** – package manager/runtime, replacing npm.
- **Lovable.dev plugins** (`@lovable.dev/vite-plugin-*`) – dev-time tooling from the platform this was originally built in (hot-reload bridges, etc.) — not something you'll need to touch for normal editing.

## Mobin'AI chat embed

The root layout loads the versioned chat script from `https://chat.mobinshaterian.com/embed/v1.js` once on every page. It adds a 56px circular launcher, remembers only the open/closed preference in this site’s `localStorage`, and creates a chat-origin iframe only when opened. The chat UI, registration, token, and API calls stay in the separate `mobin-ai-frontend` project. This is a JavaScript loader, not a JSON file.

The same integration works on a plain HTML site when placed immediately before `</body>`:

```html
<script
  defer
  src="https://chat.mobinshaterian.com/embed/v1.js"
  data-base-url="https://chat.mobinshaterian.com"
></script>
```

The loader and CSS live in `mobin-ai-frontend/src/embed/loader.ts`; this website contains only the root script reference. The iframe uses `https://chat.mobinshaterian.com/embed` and never receives credentials in its URL. The chat host must permit framing by this website; GitHub Pages cannot set a path-specific `frame-ancestors` header without an edge rule. Backend CORS will need to allow the chat origin, not the main website, when the backend is deployed.

For local development, start `mobin-ai-frontend` with `npm run demo` at `http://127.0.0.1:5173`, then run this site with:

```bash
VITE_MOBIN_AI_ORIGIN=http://127.0.0.1:5173 bun run dev
```

The website needs `VITE_MOBIN_AI_ORIGIN` only to override the default chat origin during development. Deploy the chat frontend at `chat.mobinshaterian.com` before expecting the launcher to work on the public website. If a Content Security Policy is added to this site, allow the chat origin in `script-src` and `frame-src`.
