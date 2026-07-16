import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import MiniSearch from "minisearch";
import postsIndex from "@/data/posts-index.json";
import profile from "@/data/profile.json";
import { ArrowLeft, PenLine, Search, Tag as TagIcon, FileJson } from "lucide-react";

type IndexEntry = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readingTime: string;
  url: string;
  hero?: string | null;
};

type SearchDoc = { slug: string; title: string; tags: string[]; plainText: string };

const searchSchema = z.object({
  tag: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/blogs")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Blog Archive — Mobin Shaterian" },
      {
        name: "description",
        content:
          "All 200+ articles by Mobin Shaterian on Go, distributed systems, data engineering, and backend architecture — full-text search across title, tags, and content.",
      },
      { property: "og:title", content: "Blog Archive — Mobin Shaterian" },
      {
        property: "og:description",
        content:
          "Browse and search 200+ engineering articles by title, tag, or full text. Open data — per-article JSON at /data/posts/<slug>.json.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BlogsPage,
});

function useSearchIndex() {
  const [ms, setMs] = useState<MiniSearch<SearchDoc> | null>(null);
  const [loading, setLoading] = useState(false);
  const load = () => {
    if (ms || loading) return;
    setLoading(true);
    fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((docs: SearchDoc[]) => {
        const engine = new MiniSearch<SearchDoc>({
          idField: "slug",
          fields: ["title", "tags", "plainText"],
          storeFields: ["slug"],
          searchOptions: {
            boost: { title: 4, tags: 3, plainText: 1 },
            prefix: true,
            fuzzy: 0.15,
            combineWith: "AND",
          },
          extractField: (doc, field) => {
            const v = (doc as Record<string, unknown>)[field];
            return Array.isArray(v) ? v.join(" ") : (v as string) || "";
          },
        });
        engine.addAll(docs);
        setMs(engine);
      })
      .finally(() => setLoading(false));
  };
  return { ms, loading, load };
}

function BlogsPage() {
  const { tag, q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const all = postsIndex as IndexEntry[];

  const { ms, loading, load } = useSearchIndex();
  useEffect(() => {
    if (q.trim()) load();
  }, [q, load]);

  const tagCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of all) for (const t of p.tags) c.set(t, (c.get(t) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [all]);

  const matchedSlugs = useMemo(() => {
    const needle = q.trim();
    if (!needle) return null;
    if (!ms) return null;
    const res = ms.search(needle);
    return new Set(res.map((r) => r.id as string));
  }, [q, ms]);

  const filtered = useMemo(() => {
    return all
      .filter((p) => (tag ? p.tags.includes(tag) : true))
      .filter((p) => (matchedSlugs ? matchedSlugs.has(p.slug) : true))
      .sort((a, b) =>
        a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1,
      );
  }, [all, tag, matchedSlugs]);

  const searching = q.trim() && !ms;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow">
            <ArrowLeft className="h-4 w-4" />
            ~/mobin
          </Link>
          <div className="flex items-center gap-2">
            <a
              href="/data/posts-index.json"
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono-plus text-[11px] text-muted-foreground hover:border-terminal/50 hover:text-terminal"
              title="Open data — machine readable"
            >
              <FileJson className="h-3 w-3" />
              index.json
            </a>
            <a
              href={profile.links.medium}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded border border-terminal/40 bg-terminal/5 px-3 py-1.5 font-mono-plus text-xs text-terminal transition-colors hover:bg-terminal/10"
            >
              <PenLine className="h-3.5 w-3.5" />
              medium
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <span className="font-mono-plus text-xs text-terminal">$ ls -lt posts/ | grep</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Blog archive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} of {all.length} articles
            {tag ? (
              <>
                {" "}tagged <span className="font-mono-plus text-terminal">#{tag}</span>
              </>
            ) : null}
            {q.trim() ? (
              <>
                {" "}matching{" "}
                <span className="font-mono-plus text-terminal">"{q.trim()}"</span>
                {searching ? <span className="text-muted-foreground"> · indexing…</span> : null}
              </>
            ) : null}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-terminal" />
          <input
            type="text"
            value={q}
            onFocus={load}
            onChange={(e) =>
              navigate({
                search: (prev: { tag: string; q: string }) => ({ ...prev, q: e.target.value }),
                replace: true,
              })
            }
            placeholder="search title, tags, or full content…"
            className="w-full bg-transparent font-mono-plus text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q ? (
            <button
              onClick={() =>
                navigate({ search: (prev: { tag: string; q: string }) => ({ ...prev, q: "" }), replace: true })
              }
              className="font-mono-plus text-xs text-muted-foreground hover:text-terminal"
            >
              clear
            </button>
          ) : null}
        </div>

        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 font-mono-plus text-xs uppercase tracking-wider text-terminal">
            <TagIcon className="h-3.5 w-3.5" />
            filter by tag
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() =>
                navigate({ search: (prev: { tag: string; q: string }) => ({ ...prev, tag: "" }), replace: true })
              }
              className={
                "rounded border px-2 py-1 font-mono-plus text-xs transition-colors " +
                (!tag
                  ? "border-terminal bg-terminal/10 text-terminal"
                  : "border-border text-muted-foreground hover:border-terminal/50 hover:text-terminal")
              }
            >
              all ({all.length})
            </button>
            {tagCounts.map(([t, n]) => (
              <button
                key={t}
                onClick={() =>
                  navigate({
                    search: (prev: { tag: string; q: string }) => ({ ...prev, tag: t === tag ? "" : t }),
                    replace: true,
                  })
                }
                className={
                  "rounded border px-2 py-1 font-mono-plus text-xs transition-colors " +
                  (tag === t
                    ? "border-terminal bg-terminal/10 text-terminal"
                    : "border-border text-muted-foreground hover:border-terminal/50 hover:text-terminal")
                }
              >
                {t} ({n})
              </button>
            ))}
          </div>
        </div>

        {loading && !ms ? (
          <div className="mb-4 font-mono-plus text-xs text-muted-foreground">$ loading search index…</div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center font-mono-plus text-sm text-muted-foreground">
            no posts match those filters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.slug}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-terminal/40"
              >
                {p.hero ? (
                  <img
                    src={p.hero}
                    alt=""
                    loading="lazy"
                    className="h-36 w-full border-b border-border object-cover"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center justify-between font-mono-plus text-xs text-muted-foreground">
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    <span>{p.readingTime}</span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold leading-snug group-hover:text-terminal">
                    {p.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {p.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-border px-1.5 py-0.5 font-mono-plus text-[10px] uppercase tracking-wide text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <span className="hidden md:inline">
            open data · <a className="hover:text-terminal" href="/data/posts-index.json">posts-index.json</a> · <code className="text-terminal">/data/posts/&lt;slug&gt;.json</code>
          </span>
          <Link to="/" className="hover:text-terminal">← back home</Link>
        </div>
      </footer>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
