import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpLeft, CalendarDays, Feather, Rss } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import posts from "@/data/virgool-posts.json";
import { SITE_NAME, SITE_URL, websiteMeta } from "@/lib/seo";

const VIRGOOL_TITLE = "نوشته‌های فارسی مبین شاطریان | ویرگول";
const VIRGOOL_DESCRIPTION =
  "مجموعه نوشته‌های فارسی مبین شاطریان درباره فناوری، محیط کار، جامعه، سینما و تجربه‌های شخصی در ویرگول.";

export const Route = createFileRoute("/virgool")({
  head: () => ({
    meta: websiteMeta({
      title: VIRGOOL_TITLE,
      description: VIRGOOL_DESCRIPTION,
      path: "/virgool",
      imageAlt: "نوشته‌های فارسی مبین شاطریان در ویرگول",
    }),
    links: [{ rel: "canonical", href: `${SITE_URL}/virgool` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: VIRGOOL_TITLE,
          description: VIRGOOL_DESCRIPTION,
          url: `${SITE_URL}/virgool`,
          inLanguage: "fa",
          author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.map((post, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "BlogPosting",
                headline: post.title,
                datePublished: post.date,
                url: post.url,
                inLanguage: "fa",
              },
            })),
          },
        }),
      },
    ],
  }),
  component: VirgoolPage,
});

function VirgoolPage() {
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
            <p className="inline-flex items-center gap-2 font-mono-plus text-xs text-terminal">
              <Feather className="h-4 w-4" />
              ویرگول · mobinshaterian@
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
              نوشته‌های فارسی،
              <span className="block text-muted-foreground">فناوری و فراتر از آن.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              یادداشت‌هایی درباره فناوری، فرهنگ محیط کار، جامعه، سینما و تجربه‌های شخصی؛ منتشرشده در
              ویرگول.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={profile.links.virgool}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md bg-[#00b67a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#009f6b]"
              >
                <Feather className="h-4 w-4" />
                دنبال کردن در ویرگول
                <ArrowUpLeft className="h-4 w-4" />
              </a>
              <a
                href="https://virgool.io/feed/@mobinshaterian"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
              >
                <Rss className="h-4 w-4" />
                خوراک RSS
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-16 md:py-20" dir="rtl">
          <div className="mb-8 flex items-baseline gap-3">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">آخرین نوشته‌ها</h2>
            <span className="font-mono-plus text-xs text-terminal">{posts.length} نوشته</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((post, index) => (
              <article
                key={post.url}
                className={`group flex flex-col rounded-lg border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-terminal/50 ${
                  index === 0 ? "border-terminal/40 bg-terminal/5 md:col-span-2" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono-plus text-xs text-terminal">
                    {index === 0 ? "تازه‌ترین نوشته" : `یادداشت ${toPersianNumber(index + 1)}`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-terminal" />
                    <time dateTime={post.date}>{formatPersianDate(post.date)}</time>
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-8 group-hover:text-terminal">
                  {post.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">
                  {post.excerpt}
                </p>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex items-center gap-1.5 self-start text-sm text-terminal"
                >
                  ادامه مطلب در ویرگول
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
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

function formatPersianDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

function toPersianNumber(value: number) {
  return new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(value);
}
