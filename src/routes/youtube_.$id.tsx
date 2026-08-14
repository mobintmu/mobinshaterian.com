import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Youtube } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import videos from "@/data/youtube-videos.json";
import type { YouTubeVideo } from "@/types/youtube";
import { SITE_NAME, SITE_URL, absoluteUrl, cleanDescription, websiteMeta } from "@/lib/seo";

export const Route = createFileRoute("/youtube_/$id")({
  loader: ({ params }) => {
    const video = videos.find((candidate): candidate is YouTubeVideo => candidate.id === params.id);
    if (!video) throw notFound();
    return { video };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: `Video not found | ${SITE_NAME}` }, { name: "robots", content: "noindex" }],
      };
    }
    const { video } = loaderData;
    const description = cleanDescription(
      video.description,
      `Watch ${video.title} by ${SITE_NAME} on YouTube.`,
    );

    return {
      meta: websiteMeta({
        title: `${video.title} | Mobin Shaterian`,
        description,
        path: `/youtube/${video.id}`,
        image: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
        imageAlt: video.title,
      }),
      links: [{ rel: "canonical", href: `${SITE_URL}/youtube/${video.id}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: video.title,
            description: video.description || description,
            uploadDate: video.published,
            thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
            contentUrl: `https://www.youtube.com/watch?v=${video.id}`,
            author: { "@type": "Person", name: SITE_NAME, url: absoluteUrl("/") },
          }),
        },
      ],
    };
  },
  notFoundComponent: YouTubeVideoNotFound,
  component: YouTubeVideoPage,
});

function YouTubeVideoPage() {
  const { video } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-mono-plus text-sm text-terminal terminal-glow">
            ~/mobin<span className="cursor-blink ml-0.5">_</span>
          </Link>
          <SiteMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
        <div className="mb-6">
          <Link
            to="/youtube"
            className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-muted-foreground transition-colors hover:text-terminal"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            cd ../videos
          </Link>
        </div>

        <article>
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-plus text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-terminal" />
              <time dateTime={video.published}>{formatDate(video.published)}</time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-4 w-4 text-terminal" />
              {video.duration}
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{video.title}</h1>

          <div className="mt-8 aspect-video overflow-hidden rounded-lg border border-border bg-black shadow-lg">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.id}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-md bg-[#ff0033] px-4 py-2 font-mono-plus text-xs font-medium text-white transition-colors hover:bg-[#e6002e]"
            >
              <Youtube className="h-4 w-4" />
              watch on YouTube
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-12 rounded-lg border border-border bg-surface p-6 md:p-8">
            <h2 className="font-mono-plus text-xs text-terminal">$ cat description.txt</h2>
            <div className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-muted-foreground">
              {video.description}
            </div>
          </div>
        </article>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
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

function YouTubeVideoNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
      <h1 className="text-2xl font-semibold">Video not found</h1>
      <p className="mt-2 text-muted-foreground">The requested YouTube video does not exist.</p>
      <Link
        to="/youtube"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-terminal px-4 py-2 font-mono-plus text-xs font-medium text-background"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to YouTube videos
      </Link>
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
