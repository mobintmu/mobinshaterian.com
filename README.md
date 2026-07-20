# mobinshaterian.com

Personal portfolio and technical blog for Mobin Shaterian. The site presents a resume-style home page and a searchable archive of 200+ articles imported from Medium.

The application is built with React and TanStack Start, then prerendered to static HTML for deployment to GitHub Pages. Blog content is stored as JSON in the repository, so the site does not need a database, CMS, or production API.

## What the site contains

- `/` — portfolio page with profile, experience, skills, education, recent writing, and contact details
- `/blogs` — full blog archive with tag filters and client-side full-text search
- `/blog/:slug` — an individual article rendered from local JSON
- `/data/posts-index.json` — public, machine-readable post metadata
- `/data/posts/:slug.json` — public JSON representation of an article
- Custom application and article 404 pages
- SEO metadata, Open Graph fields, canonical Medium links, and article JSON-LD

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

| Source file                 | Route                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `src/routes/__root.tsx`     | Root document, global metadata, providers, error boundary, and 404 UI |
| `src/routes/index.tsx`      | `/`                                                                   |
| `src/routes/blogs.tsx`      | `/blogs`                                                              |
| `src/routes/blog.$slug.tsx` | `/blog/:slug`                                                         |

`src/routeTree.gen.ts` is generated from these files. Do not edit it manually.

At build time, `vite.config.ts` reads every slug from `src/data/posts-index.json` and adds the home page, archive, and all article URLs to the prerender list. TanStack Start and Nitro render those routes ahead of time. The resulting static site is written to `.output/public` and can be hosted without a running Node server.

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

### GitHub Pages routing

Static hosts cannot normally resolve an unknown nested client-side URL. `public/404.html` stores the requested location in `sessionStorage` and redirects to `/`; the root React component then restores that path through TanStack Router. Prerendered known routes load directly, while unknown routes reach the application's 404 UI.

## Project structure

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages build and deployment
├── public/
│   ├── 404.html                  # GitHub Pages SPA fallback
│   ├── data/                     # Public post, metadata, and search JSON
│   ├── CNAME                     # Custom domain copied into the build
│   └── robots.txt, favicons...
├── scripts/
│   ├── import-medium.mjs         # Convert a Medium export to site JSON
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
│   │   └── search-index.json     # Full-text search source data
│   ├── lib/                      # Utilities and error handling
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

| Command             | Description                                           |
| ------------------- | ----------------------------------------------------- |
| `bun run dev`       | Start the Vite development server with hot reload.    |
| `bun run build`     | Create the production/prerendered build in `.output`. |
| `bun run build:dev` | Build using Vite's development mode.                  |
| `bun run preview`   | Preview the production build locally.                 |
| `bun run lint`      | Run ESLint and Prettier checks.                       |
| `bun run format`    | Rewrite supported files with Prettier.                |

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
- Add new article slugs to `src/data/posts-index.json` through the importer so `vite.config.ts` prerenders them.
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