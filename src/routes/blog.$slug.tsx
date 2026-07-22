import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import postsIndex from "@/data/posts-index.json";
import profile from "@/data/profile.json";
import { PostContent, type Block } from "@/components/PostContent";
import { SiteMenu } from "@/components/SiteMenu";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Calendar,
  Clock,
  Tag as TagIcon,
  FileJson,
} from "lucide-react";

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

type FullPost = IndexEntry & {
  subtitle?: string;
  content: Block[];
};

const postModules = import.meta.glob("@/data/posts/*.json");

async function loadPost(slug: string): Promise<FullPost | null> {
  const key = Object.keys(postModules).find((k) => k.endsWith(`/${slug}.json`));
  if (!key) return null;
  const mod = (await postModules[key]()) as { default: FullPost };
  return mod.default;
}

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await loadPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Post not found — Mobin Shaterian" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post } = loaderData;
    const meta: Array<Record<string, string>> = [
      { title: `${post.title} — Mobin Shaterian` },
      { name: "description", content: post.excerpt },
      { property: "og:title", content: post.title },
      { property: "og:description", content: post.excerpt },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/blog/${params.slug}` },
      { property: "article:published_time", content: post.date },
      ...post.tags.map((t) => ({ property: "article:tag", content: t })),
    ];
    if (post.hero) meta.push({ property: "og:image", content: post.hero });
    return {
      meta,
      links: [{ rel: "canonical", href: post.url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Person", name: profile.name },
            keywords: post.tags.join(", "),
            image: post.hero || undefined,
            mainEntityOfPage: post.url,
          }),
        },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: BlogPostPage,
});

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function sourceName(url: string) {
  try {
    const hostname = new URL(url).hostname;
    if (hostname.includes("linkedin.com")) return "LinkedIn";
    if (hostname.includes("medium.com")) return "Medium";
  } catch {
    // Keep a useful generic label when an imported URL is malformed.
  }
  return "the original source";
}

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const canonicalSource = sourceName(post.url);
  const articles = postsIndex as IndexEntry[];
  const currentIndex = articles.findIndex((article) => article.slug === post.slug);
  const previousPost = currentIndex >= 0 ? articles[currentIndex + 1] : undefined;
  const nextPost = currentIndex > 0 ? articles[currentIndex - 1] : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/blogs"
            className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow"
          >
            <ArrowLeft className="h-4 w-4" />
            ~/blogs
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`/data/posts/${post.slug}.json`}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 font-mono-plus text-xs text-muted-foreground hover:border-terminal/50 hover:text-terminal"
              title="Open data — machine readable"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">.json</span>
            </a>
            <SiteMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-4 font-mono-plus text-xs text-terminal">
          $ cat posts/{post.slug.slice(0, 24)}…
        </div>

        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>

        {post.subtitle ? (
          <p className="mt-3 text-lg text-muted-foreground">{post.subtitle}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-4 font-mono-plus text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-terminal" />
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-terminal" />
            {post.readingTime}
          </span>
        </div>

        {post.tags?.length ? (
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-terminal" />
            {post.tags.map((t: string) => (
              <Link
                key={t}
                to="/blogs"
                search={{ tag: t, q: "" }}
                className="rounded border border-border px-2 py-0.5 font-mono-plus text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
              >
                #{t}
              </Link>
            ))}
          </div>
        ) : null}

        {post.hero ? (
          <img
            src={post.hero}
            alt=""
            className="mt-8 w-full rounded-md border border-border"
            loading="eager"
          />
        ) : null}

        <article className="mt-8">
          <PostContent blocks={post.content} />
        </article>

        <div className="mt-12 rounded-lg border border-terminal/30 bg-terminal/5 p-6">
          <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
            $ open --canonical
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Also published on {canonicalSource} — the canonical source.
          </p>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-2 rounded border border-terminal bg-terminal/10 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/20"
          >
            View on {canonicalSource}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <nav
          className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-2"
          aria-label="Blog post navigation"
        >
          {previousPost ? (
            <Link
              to="/blog/$slug"
              params={{ slug: previousPost.slug }}
              rel="prev"
              className="group flex min-w-0 items-center gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-terminal/50 hover:bg-terminal/5"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-terminal transition-transform group-hover:-translate-x-1" />
              <span className="min-w-0">
                <span className="block font-mono-plus text-[10px] uppercase tracking-wider text-muted-foreground">
                  Previous blog
                </span>
                <span className="mt-1 block line-clamp-2 text-sm font-medium leading-snug">
                  {previousPost.title}
                </span>
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextPost ? (
            <Link
              to="/blog/$slug"
              params={{ slug: nextPost.slug }}
              rel="next"
              className="group flex min-w-0 items-center justify-end gap-3 rounded-md border border-border bg-surface p-4 text-right transition-colors hover:border-terminal/50 hover:bg-terminal/5"
            >
              <span className="min-w-0">
                <span className="block font-mono-plus text-[10px] uppercase tracking-wider text-muted-foreground">
                  Next blog
                </span>
                <span className="mt-1 block line-clamp-2 text-sm font-medium leading-snug">
                  {nextPost.title}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-terminal transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
        </nav>

        <div className="mt-6">
          <Link
            to="/blogs"
            className="font-mono-plus text-xs text-muted-foreground hover:text-terminal"
          >
            ← back to archive
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <Link to="/" className="hover:text-terminal">
            home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function PostNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="font-mono-plus text-xs text-terminal">$ cat posts/{slug}</div>
        <h1 className="mt-4 text-3xl font-semibold">cat: no such post</h1>
        <p className="mt-3 text-sm text-muted-foreground">That slug isn't in the archive.</p>
        <Link
          to="/blogs"
          className="mt-8 inline-flex items-center gap-2 rounded border border-terminal bg-terminal/10 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/20"
        >
          <ArrowLeft className="h-4 w-4" />
          browse archive
        </Link>
      </main>
    </div>
  );
}
