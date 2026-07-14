import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import posts from "@/data/posts.json";
import profile from "@/data/profile.json";
import { ArrowLeft, ExternalLink, Calendar, Clock, Tag as TagIcon } from "lucide-react";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readingTime: string;
  url: string;
};

function getPost(slug: string): Post | undefined {
  return (posts as Post[]).find((p) => p.slug === slug);
}

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
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
    return {
      meta: [
        { title: `${post.title} — Mobin Shaterian` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
        { property: "article:published_time", content: post.date },
        ...post.tags.map((t) => ({ property: "article:tag", content: t })),
      ],
      links: [
        { rel: "canonical", href: post.url },
      ],
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

function BlogPostPage() {
  const { post } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/blogs" className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow">
            <ArrowLeft className="h-4 w-4" />
            ~/blogs
          </Link>
          <a
            href={profile.links.medium}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono-plus text-xs text-muted-foreground hover:text-terminal"
          >
            medium
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-4 font-mono-plus text-xs text-terminal">
          $ cat posts/{post.slug.slice(0, 24)}…
        </div>

        <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
          {post.title}
        </h1>

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

        {post.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            <TagIcon className="h-3.5 w-3.5 text-terminal" />
            {post.tags.map((t) => (
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

        <div className="mt-10 rounded-lg border border-border bg-surface p-6">
          <p className="text-base leading-relaxed text-foreground/90">
            {post.excerpt}
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-terminal/30 bg-terminal/5 p-6">
          <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
            $ read --full
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            The full article lives on Medium (canonical source).
          </p>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-2 rounded border border-terminal bg-terminal/10 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/20"
          >
            Read on Medium
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <Link to="/blogs" className="font-mono-plus text-xs text-muted-foreground hover:text-terminal">
            ← back to archive
          </Link>
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <Link to="/" className="hover:text-terminal">home</Link>
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
        <p className="mt-3 text-sm text-muted-foreground">
          That slug isn't in the archive.
        </p>
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
