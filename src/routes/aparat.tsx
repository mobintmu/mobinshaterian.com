import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpLeft, CalendarDays, Clock3, Eye, Play, Tv } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import videos from "@/data/aparat-videos.json";
import profile from "@/data/profile.json";
import { SITE_NAME, SITE_URL, websiteMeta } from "@/lib/seo";

const APARAT_TITLE = "ویدیوهای فارسی مبین شاطریان | آپارات";
const APARAT_DESCRIPTION =
  "ویدیوهای فارسی مبین شاطریان درباره لینوکس، نرم‌افزار آزاد، فناوری و تجربه‌های حرفه‌ای در آپارات.";

export const Route = createFileRoute("/aparat")({
  head: () => ({
    meta: websiteMeta({
      title: APARAT_TITLE,
      description: APARAT_DESCRIPTION,
      path: "/aparat",
      image: videos[0].thumbnail,
      imageAlt: videos[0].title,
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/aparat` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: APARAT_TITLE,
          url: `${SITE_URL}/aparat`,
          numberOfItems: videos.length,
          itemListElement: videos.map((video, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "VideoObject",
              name: video.title,
              uploadDate: video.date,
              duration: toIsoDuration(video.duration),
              thumbnailUrl: video.thumbnail,
              embedUrl: video.embedUrl,
              contentUrl: video.url,
              inLanguage: "fa",
              author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
            },
          })),
        }),
      },
    ],
  }),
  component: AparatPage,
});

function AparatPage() {
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
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-24" dir="rtl">
            <p className="inline-flex items-center gap-2 font-mono-plus text-xs text-[#ed145b]">
              <Tv className="h-4 w-4" />
              آپارات · mobintmu@
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              ویدیوهای فارسی،
              <span className="block text-muted-foreground">از لینوکس تا تجربه‌های حرفه‌ای.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              مجموعه‌ای از ویدیوها و سخنرانی‌های فارسی درباره نرم‌افزار آزاد، لینوکس، فناوری و مسیر
              حرفه‌ای.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={profile.links.aparat}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md bg-[#ed145b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d61152]"
              >
                <Play className="h-4 w-4 fill-current" />
                مشاهده کانال در آپارات
                <ArrowUpLeft className="h-4 w-4" />
              </a>
              <span className="font-mono-plus text-xs text-muted-foreground">
                {toPersianNumber(videos.length)} ویدیوی عمومی
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-20" dir="rtl">
          <div className="mb-8 flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">ویدیوها</h2>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {videos.map((video) => (
              <article
                key={video.id}
                className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-[#ed145b]/60"
              >
                <div className="aspect-video overflow-hidden border-b border-border bg-black">
                  <iframe
                    src={video.embedUrl}
                    title={video.title}
                    loading="lazy"
                    allow="autoplay; fullscreen; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-plus text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-[#ed145b]" />
                      <time dateTime={video.date}>{toPersianDigits(video.persianDate)}</time>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-[#ed145b]" />
                      {formatDuration(video.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-[#ed145b]" />
                      {toPersianNumber(video.views)} بازدید
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-8 group-hover:text-[#ed145b]">
                    {video.title}
                  </h3>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-[#ed145b]"
                  >
                    تماشا در آپارات
                    <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
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

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const value = hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
  return toPersianDigits(value);
}

function toIsoDuration(totalSeconds: number) {
  return `PT${totalSeconds}S`;
}

function toPersianNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);
}
