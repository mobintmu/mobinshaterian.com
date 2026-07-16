# Run project

```
curl -fsSL https://bun.sh/install | bash   # skip if already installed
bun install
bun run dev

```


# Technology
- **React** – the actual UI library, same as what you know.
- **TanStack Start** – a full-stack React framework (like Next.js, but from the TanStack team — makers of React Query, TanStack Router). It adds file-based routing, server-side rendering, and API routes on top of plain React.
- **Vite** – the build tool/dev server. Fast hot-reload, bundles everything for production.
- **Nitro** – the server engine TanStack Start uses under the hood to actually run/deploy the server (handles the `node-server` preset in your `vite.config.ts`, and produces the static output in `.output/public`).
- **TypeScript** – your code is `.ts`/`.tsx`, typed React.
- **shadcn/ui** (implied by `components.json`) – a component library built on Radix UI + Tailwind CSS, pretty common in Lovable.dev-generated projects.
- **Prerendering** – your `vite.config.ts` has `prerender.enabled: true` with a list of static pages (home, blogs, each blog post) — so at build time it crawls your routes and outputs static HTML, which is why this can deploy to GitHub Pages (a static host) instead of needing a live Node server.
- **bun** – package manager/runtime, replacing npm.
- **Lovable.dev plugins** (`@lovable.dev/vite-plugin-*`) – dev-time tooling from the platform this was originally built in (hot-reload bridges, etc.) — not something you'll need to touch for normal editing.