import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import MiniSearch from "minisearch";
import { SiteMenu } from "@/components/SiteMenu";
import postsIndex from "@/data/posts-index.json";
import profile from "@/data/profile.json";
import { ArrowLeft, Search, Tag as TagIcon, FileJson } from "lucide-react";
import { BLOG_DESCRIPTION, BLOG_TITLE, SITE_URL, absoluteUrl, websiteMeta } from "@/lib/seo";
import { ALL_BLOG_TAG, BLOG_TAGS, blogTagLabel, blogTagSearchValue } from "@/lib/blog-tags";

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

const POSTS_PER_PAGE = 20;

const searchSchema = z.object({
  tag: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/blogs")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: websiteMeta({
      title: BLOG_TITLE,
      description: BLOG_DESCRIPTION,
      path: "/blogs",
    }),
    links: [{ rel: "canonical", href: absoluteUrl("/blogs") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "@id": `${SITE_URL}/blogs#collection`,
          url: absoluteUrl("/blogs"),
          name: BLOG_TITLE,
          description: BLOG_DESCRIPTION,
          inLanguage: "en",
          author: { "@type": "Person", name: "Mobin Shaterian", url: SITE_URL },
          isPartOf: { "@id": `${SITE_URL}/#website` },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: (postsIndex as IndexEntry[]).length,
            itemListElement: (postsIndex as IndexEntry[]).slice(0, 20).map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/blog/${post.slug}`),
              name: post.title,
            })),
          },
        }),
      },
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
  const activeTag = tag || ALL_BLOG_TAG;
  const navigate = Route.useNavigate();
  const all = postsIndex as IndexEntry[];
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const { ms, loading, load } = useSearchIndex();
  useEffect(() => {
    if (q.trim()) load();
  }, [q, load]);

  const matchedSlugs = useMemo(() => {
    const needle = q.trim();
    if (!needle) return null;
    if (!ms) return null;
    const res = ms.search(needle);
    return new Set(res.map((r) => r.id as string));
  }, [q, ms]);

  const filtered = useMemo(() => {
    return all
      .filter((p) => (activeTag === ALL_BLOG_TAG ? true : p.tags.includes(activeTag)))
      .filter((p) => (matchedSlugs ? matchedSlugs.has(p.slug) : true))
      .sort((a, b) =>
        a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1,
      );
  }, [all, activeTag, matchedSlugs]);

  const searching = q.trim() && !ms;
  const visiblePosts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [activeTag, q]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((count) => Math.min(count + POSTS_PER_PAGE, filtered.length));
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered.length, hasMore]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow"
          >
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
              <span className="hidden sm:inline">index.json</span>
            </a>
            <SiteMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10">
          <span className="font-mono-plus text-xs text-terminal">$ ls -lt posts/ | grep</span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Blog archive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered.length} of {all.length} articles
            {activeTag !== ALL_BLOG_TAG ? (
              <>
                {" "}
                tagged <span className="font-mono-plus text-terminal">#{activeTag}</span>
              </>
            ) : null}
            {q.trim() ? (
              <>
                {" "}
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
                navigate({
                  search: (prev: { tag: string; q: string }) => ({ ...prev, q: "" }),
                  replace: true,
                })
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
            {BLOG_TAGS.map((tagOption) => (
              <button
                key={tagOption.name}
                onClick={() =>
                  navigate({
                    search: (prev: { tag: string; q: string }) => ({
                      ...prev,
                      tag: tagOption.name === activeTag ? "" : blogTagSearchValue(tagOption.name),
                    }),
                    replace: true,
                  })
                }
                className={
                  "rounded border px-2 py-1 font-mono-plus text-xs transition-colors " +
                  (activeTag === tagOption.name
                    ? "border-terminal bg-terminal/10 text-terminal"
                    : "border-border text-muted-foreground hover:border-terminal/50 hover:text-terminal")
                }
              >
                {blogTagLabel(tagOption)}
              </button>
            ))}
          </div>
        </div>

        {loading && !ms ? (
          <div className="mb-4 font-mono-plus text-xs text-muted-foreground">
            $ loading search index…
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 text-center font-mono-plus text-sm text-muted-foreground">
            no posts match those filters.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-terminal/40"
                >
                  {p.hero ? (
                    <img
                      src={p.hero}
                      alt={p.title}
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
            {hasMore ? (
              <div
                ref={loadMoreRef}
                className="mt-8 flex min-h-12 items-center justify-center font-mono-plus text-xs text-muted-foreground"
                aria-live="polite"
              >
                $ scroll to load more · showing {visiblePosts.length} of {filtered.length}
              </div>
            ) : null}
          </>
        )}
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span className="hidden md:inline">
            open data ·{" "}
            <a className="hover:text-terminal" href="/data/posts-index.json">
              posts-index.json
            </a>{" "}
            · <code className="text-terminal">/data/posts/&lt;slug&gt;.json</code>
          </span>
          <Link to="/" className="hover:text-terminal">
            ← back home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
