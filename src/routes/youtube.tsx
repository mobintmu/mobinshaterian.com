import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, Clock3, Youtube } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import videos from "@/data/youtube-videos.json";
import { SITE_NAME, SITE_URL, absoluteUrl, websiteMeta } from "@/lib/seo";

const YOUTUBE_TITLE = "Software Engineering Videos | Mobin Shaterian";
const YOUTUBE_DESCRIPTION =
  "Watch Mobin Shaterian's videos about Go, backend architecture, databases, search engines, data pipelines, and scalable software systems.";

export const Route = createFileRoute("/youtube")({
  head: () => ({
    meta: websiteMeta({
      title: YOUTUBE_TITLE,
      description: YOUTUBE_DESCRIPTION,
      path: "/youtube",
      image: `https://i.ytimg.com/vi/${videos[0].id}/hqdefault.jpg`,
      imageAlt: videos[0].title,
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/youtube` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: YOUTUBE_TITLE,
          url: `${SITE_URL}/youtube`,
          numberOfItems: videos.length,
          itemListElement: videos.map((video, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "VideoObject",
              name: video.title,
              uploadDate: video.published,
              thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
              embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
              contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
              author: { "@type": "Person", name: SITE_NAME, url: absoluteUrl("/") },
            },
          })),
        }),
      },
    ],
  }),
  component: YouTubePage,
});

function YouTubePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-mono-plus text-sm text-terminal terminal-glow">
            ~/mobin<span className="cursor-blink ml-0.5">_</span>
          </Link>
          <SiteMenu />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-24">
            <p className="inline-flex items-center gap-2 font-mono-plus text-xs uppercase tracking-wider text-terminal">
              <Youtube className="h-4 w-4" />
              youtube · @mobinshaterian
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Backend engineering,
              <span className="block text-muted-foreground">explained visually.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Practical videos about Go, scalable architectures, databases, search, and the systems
              behind production software.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={profile.links.youtube}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md bg-[#ff0033] px-4 py-2 font-mono-plus text-sm font-medium text-white transition-colors hover:bg-[#e6002e]"
              >
                <Youtube className="h-4 w-4" />
                subscribe on YouTube
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <span className="font-mono-plus text-xs text-muted-foreground">
                Latest {videos.length} uploads · newest first
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="mb-8 flex items-baseline gap-3">
            <span className="font-mono-plus text-xs text-terminal">$ ls -lt videos/</span>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Latest Videos</h2>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((video) => (
              <article
                key={video.id}
                className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-terminal/40"
              >
                <div className="aspect-video overflow-hidden border-b border-border bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.id}`}
                    title={video.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-plus text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-terminal" />
                      <time dateTime={video.published}>{formatDate(video.published)}</time>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-terminal" />
                      {video.duration}
                    </span>
                  </div>
                  <Link
                    to="/youtube/$id"
                    params={{ id: video.id }}
                    className="text-base font-semibold leading-snug group-hover:text-terminal block"
                  >
                    {video.title}
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {video.description}
                  </p>
                  <div className="mt-4">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-terminal"
                    >
                      watch on YouTube
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <Link to="/" className="transition-colors hover:text-terminal">
            home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
