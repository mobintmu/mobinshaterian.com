import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import postsIndex from "@/data/posts-index.json";
import relatedPosts from "@/data/kg/related_posts.json";
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
import {
  BLOG_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  cleanDescription,
} from "@/lib/seo";
import { BLOG_TAGS, blogTagSearchValue } from "@/lib/blog-tags";

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
    const postUrl = absoluteUrl(`/blog/${params.slug}`);
    const title = `${post.title} | ${SITE_NAME}`;
    const description = cleanDescription(
      post.subtitle || post.excerpt || firstParagraph(post),
      BLOG_DESCRIPTION,
    );
    const image = post.hero || DEFAULT_SOCIAL_IMAGE;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { name: "author", content: SITE_NAME },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: post.title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { property: "og:url", content: postUrl },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: image },
      { property: "og:image:alt", content: post.title },
      { property: "article:published_time", content: post.date },
      { property: "article:author", content: SITE_URL },
      { property: "article:section", content: post.tags[0] || "Software Engineering" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: post.title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: post.title },
    ];
    for (const tag of post.tags) {
      meta.push({ property: "article:tag", content: tag });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: postUrl }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "@id": `${postUrl}#article`,
            url: postUrl,
            headline: post.title,
            description,
            datePublished: post.date,
            dateModified: post.date,
            author: {
              "@type": "Person",
              "@id": `${SITE_URL}/#person`,
              name: profile.name,
              url: SITE_URL,
            },
            publisher: { "@id": `${SITE_URL}/#person` },
            keywords: post.tags.join(", "),
            articleSection: post.tags[0] || "Software Engineering",
            image,
            inLanguage: "en",
            isPartOf: { "@id": `${SITE_URL}/blogs#collection` },
            mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
            sameAs: post.url ? [post.url] : undefined,
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

function firstParagraph(post: FullPost) {
  const paragraph = post.content.find(
    (block): block is Extract<Block, { type: "paragraph" }> => block.type === "paragraph",
  );
  return paragraph?.html || "";
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

function normalizeSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/^(post_index_|post_|project_project_1_0_|project_)/, "")
    .replace(
      /-(article|authguard|createtaskdto|tasksservice|taskscontroller|sqlc|gqlgen|gin|jwt|viper|kafka|clickhouse|debezium|mysql|mongodb|meilisearch|redis|projectionservice|pollingservice|backoffpoller)$/,
      "",
    )
    .replace(/-[a-f0-9]{8,16}$/, "")
    .replace(/-\d+$/, "")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .trim();
}

function relatedPostSlugs(slug: string, articles: IndexEntry[]): IndexEntry[] {
  const relationMap = relatedPosts as Record<string, string[]>;
  const cleanCurrentSlug = normalizeSlug(slug);

  const matchedKey = Object.keys(relationMap).find((key) => {
    const cleanKey = normalizeSlug(key);
    return (
      cleanCurrentSlug === cleanKey ||
      cleanCurrentSlug.startsWith(cleanKey) ||
      cleanKey.startsWith(cleanCurrentSlug)
    );
  });

  if (!matchedKey || !relationMap[matchedKey]) {
    return [];
  }

  const rawRelatedSlugs = relationMap[matchedKey];
  const matchedArticles: IndexEntry[] = [];

  for (const relSlug of rawRelatedSlugs) {
    const cleanTarget = normalizeSlug(relSlug);

    const foundArticle = articles.find((candidate) => {
      if (candidate.slug === slug) return false;
      const cleanCandidate = normalizeSlug(candidate.slug);
      return (
        cleanCandidate === cleanTarget ||
        cleanCandidate.startsWith(cleanTarget) ||
        cleanTarget.startsWith(cleanCandidate)
      );
    });

    if (foundArticle && !matchedArticles.some((a) => a.slug === foundArticle.slug)) {
      matchedArticles.push(foundArticle);
    }
  }

  return matchedArticles;
}

function getRelatedPosts(currentPost: FullPost, articles: IndexEntry[]): IndexEntry[] {
  const graphRelated = relatedPostSlugs(currentPost.slug, articles);
  if (graphRelated.length >= 2) {
    return graphRelated.slice(0, 4);
  }

  const primaryTag = currentPost.tags[0]?.toLowerCase();
  const tagRelated = articles.filter(
    (article) =>
      article.slug !== currentPost.slug &&
      !graphRelated.some((g) => g.slug === article.slug) &&
      article.tags.some((t) => t.toLowerCase() === primaryTag),
  );

  return [...graphRelated, ...tagRelated].slice(0, 4);
}

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  const canonicalSource = sourceName(post.url);
  const articles = postsIndex as IndexEntry[];
  const currentIndex = articles.findIndex((article) => article.slug === post.slug);
  const previousPost = currentIndex >= 0 ? articles[currentIndex + 1] : undefined;
  const nextPost = currentIndex > 0 ? articles[currentIndex - 1] : undefined;
  const related = getRelatedPosts(post, articles);

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
            alt={post.title}
            className="mt-8 w-full rounded-md border border-border"
            loading="eager"
          />
        ) : null}

        <article className="mt-8">
          <PostContent blocks={post.content} displayedImageSources={[post.hero]} />
        </article>

        <div className="mt-12 rounded-lg border border-terminal/30 bg-terminal/5 p-6">
          <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
            $ open --canonical
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This article was also published on {canonicalSource}.
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

        {related.length ? (
          <section
            className="mt-10 border-t border-border pt-6"
            aria-labelledby="related-posts-heading"
          >
            <div className="mb-4 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-terminal" />
              <h2
                id="related-posts-heading"
                className="font-mono-plus text-xs uppercase tracking-wider text-terminal"
              >
                Related blogs
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {related.map((article) => (
                <Link
                  key={article.slug}
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="group rounded-md border border-border bg-surface p-4 transition-colors hover:border-terminal/50 hover:bg-terminal/5"
                >
                  <span className="block line-clamp-3 text-sm font-medium leading-snug transition-colors group-hover:text-terminal">
                    {article.title}
                  </span>
                  <span className="mt-2 block font-mono-plus text-[10px] text-muted-foreground">
                    {formatDate(article.date)} · {article.readingTime}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {post.tags.length ? (
          <section
            className="mt-10 border-t border-border pt-6"
            aria-labelledby="post-tags-heading"
          >
            <div className="mb-4 flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-terminal" />
              <h2
                id="post-tags-heading"
                className="font-mono-plus text-xs uppercase tracking-wider text-terminal"
              >
                Tags of this blog
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to="/blogs"
                  search={{ tag, q: "" }}
                  className="rounded border border-terminal/50 bg-terminal/10 px-2 py-1 font-mono-plus text-[11px] text-terminal transition-colors hover:border-terminal hover:bg-terminal/20"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 border-t border-border pt-6" aria-labelledby="all-tags-heading">
          <div className="mb-4 flex items-center gap-2">
            <TagIcon className="h-4 w-4 text-terminal" />
            <h2
              id="all-tags-heading"
              className="font-mono-plus text-xs uppercase tracking-wider text-terminal"
            >
              Explore all tags
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BLOG_TAGS.map((tag) => (
              <Link
                key={tag.name}
                to="/blogs"
                search={{ tag: blogTagSearchValue(tag.name), q: "" }}
                className="rounded border border-border px-2 py-1 font-mono-plus text-[11px] text-muted-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
              >
                #{tag.name} <span className="text-[10px] opacity-70">({tag.count})</span>
              </Link>
            ))}
          </div>
        </section>

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
