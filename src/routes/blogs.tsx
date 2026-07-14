import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import posts from "@/data/posts.json";
import profile from "@/data/profile.json";
import { ArrowLeft, PenLine, Search, Tag as TagIcon } from "lucide-react";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readingTime: string;
  url: string;
};

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
          "All 250+ articles by Mobin Shaterian on Go, distributed systems, data engineering, and backend architecture — filter by tag.",
      },
      { property: "og:title", content: "Blog Archive — Mobin Shaterian" },
      {
        property: "og:description",
        content:
          "Browse and filter 250+ engineering articles by tag: Go, ClickHouse, Kafka, microservices, and more.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BlogsPage,
});

function BlogsPage() {
  const { tag, q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const all = posts as Post[];

  const tagCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of all) for (const t of p.tags) c.set(t, (c.get(t) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [all]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((p) => (tag ? p.tags.includes(tag) : true))
      .filter((p) =>
        needle
          ? p.title.toLowerCase().includes(needle) ||
            p.excerpt.toLowerCase().includes(needle)
          : true,
      )
      .sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1));
  }, [all, tag, q]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow">
            <ArrowLeft className="h-4 w-4" />
            ~/mobin
          </Link>
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
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <span className="font-mono-plus text-xs text-terminal">$ ls -lt posts/ | grep</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Blog archive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} of {all.length} articles{tag ? (
              <>
                {" "}tagged{" "}
                <span className="font-mono-plus text-terminal">#{tag}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="mb-8 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-terminal" />
          <input
            type="text"
            value={q}
            onChange={(e) =>
              navigate({
                search: (prev) => ({ ...prev, q: e.target.value }),
                replace: true,
              })
            }
            placeholder="search title or excerpt…"
            className="w-full bg-transparent font-mono-plus text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {q ? (
            <button
              onClick={() => navigate({ search: (prev) => ({ ...prev, q: "" }), replace: true })}
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
              onClick={() => navigate({ search: (prev) => ({ ...prev, tag: "" }), replace: true })}
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
                  navigate({ search: (prev) => ({ ...prev, tag: t === tag ? "" : t }), replace: true })
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

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center font-mono-plus text-sm text-muted-foreground">
            no posts match those filters.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-terminal/40"
              >
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
              </a>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {profile.name}</span>
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
