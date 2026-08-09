import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import posts from "@/data/posts-index.json";
import videos from "@/data/youtube-videos.json";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  websiteMeta,
} from "@/lib/seo";
import {
  ArrowUpRight,
  Download,
  Github,
  Linkedin,
  Mail,
  Newspaper,
  PenLine,
  Search,
  Send,
  Terminal,
  Youtube,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: websiteMeta({
      title: HOME_TITLE,
      description: HOME_DESCRIPTION,
      path: "/",
    }),
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": `${SITE_URL}/#person`,
              name: SITE_NAME,
              url: SITE_URL,
              image: absoluteUrl("/logo.jpg"),
              jobTitle: "Senior Software Engineer",
              description: HOME_DESCRIPTION,
              email: `mailto:${profile.email}`,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Tehran",
                addressCountry: "IR",
              },
              alumniOf: profile.education.map((education) => ({
                "@type": "EducationalOrganization",
                name: education.school,
              })),
              knowsAbout: Object.values(profile.skills).flat(),
              sameAs: Object.values(profile.links),
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              url: SITE_URL,
              name: SITE_NAME,
              description: HOME_DESCRIPTION,
              inLanguage: "en",
              publisher: { "@id": `${SITE_URL}/#person` },
            },
            {
              "@type": "ProfilePage",
              "@id": `${SITE_URL}/#profile`,
              url: SITE_URL,
              name: HOME_TITLE,
              description: HOME_DESCRIPTION,
              mainEntity: { "@id": `${SITE_URL}/#person` },
              isPartOf: { "@id": `${SITE_URL}/#website` },
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
  readingTime: string;
  url: string;
  hero?: string | null;
};

function HomePage() {
  const writingPosts = profile.writingSlugs
    .map((slug) => (posts as Post[]).find((post) => post.slug === slug))
    .filter((post): post is Post => Boolean(post));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Nav />
      <Hero />
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <Writing posts={writingPosts} />
        <YouTubePreview />
        <Featured />
        <ExperiencePreview />
        <Skills />
        <Education />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

/* ---------- sections ---------- */

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#top" className="font-mono-plus text-sm text-terminal terminal-glow">
          ~/mobin
          <span className="cursor-blink ml-0.5">_</span>
        </a>
        <SiteMenu />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-terminal/40 bg-terminal/5 px-3 py-1 font-mono-plus text-xs text-terminal">
          <span className="h-1.5 w-1.5 rounded-full bg-terminal terminal-glow" />
          available for senior backend roles
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          {profile.name}.<span className="block text-muted-foreground">{profile.title}.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{profile.tagline}</p>

        <div className="mt-8 font-mono-plus text-sm">
          <div className="flex items-center gap-2 text-terminal">
            <Terminal className="h-4 w-4" />
            <span>whoami</span>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-surface p-4 text-xs leading-relaxed text-foreground/90 md:text-sm">
            {`> role      : Senior Software Engineer @ MTN Irancell
> stack     : Go · Python · Nestjs · ClickHouse · Kafka · Postgres
> shipped   : 15M rows/hr · 400K req/day · 10K TPS ML inference
> location  : ${profile.location}
> writing   : 200+ articles on Medium`}
          </pre>
          <p className="mt-4 max-w-3xl font-sans text-base leading-relaxed text-muted-foreground">
            I'm a senior backend engineer focused on Go, distributed systems, and data-heavy
            platforms. Over 16 years I've moved teams from monoliths to microservices, rebuilt B2B
            APIs for scale, and turned research-grade ML services into production systems handling
            tens of thousands of TPS. I care about clean code, honest observability, and the boring
            parts of reliability.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Mail className="h-4 w-4" />
            {profile.email}
          </a>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Github className="h-4 w-4" />
            github
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Linkedin className="h-4 w-4" />
            linkedin
          </a>
          <a
            href={profile.links.medium}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <PenLine className="h-4 w-4" />
            medium
          </a>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ id, kbd, title }: { id: string; kbd: string; title: string }) {
  return (
    <div className="mb-8 flex items-baseline gap-3" id={id}>
      <span className="font-mono-plus text-xs text-terminal">$ {kbd}</span>
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}

function Featured() {
  const featuresByDate = [...profile.features].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );

  return (
    <section className="py-20">
      <SectionHeading id="featured" kbd="cat ./featured.log" title="Featured In" />
      <div className="grid gap-4">
        {featuresByDate.map((feature) => (
          <article
            key={feature.url}
            className="group rounded-lg border border-terminal/30 bg-terminal/5 p-6 transition-colors hover:border-terminal/60 hover:bg-terminal/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 font-mono-plus text-xs uppercase tracking-wider text-terminal">
                <Newspaper className="h-4 w-4" />
                {feature.source}
              </span>
              <time className="font-mono-plus text-xs text-muted-foreground">{feature.date}</time>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight">{feature.title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a
                href={feature.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-terminal"
              >
                Read on {feature.source}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              {"pdf" in feature && feature.pdf ? (
                <a
                  href={feature.pdf}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-terminal"
                >
                  Read PDF
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : null}
              {"youtube" in feature && feature.youtube ? (
                <a
                  href={feature.youtube}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-terminal"
                >
                  <Youtube className="h-3.5 w-3.5" />
                  Watch presentation
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExperiencePreview() {
  return (
    <section className="py-20">
      <SectionHeading id="experience" kbd="ls experience/" title="Experience" />
      <div className="rounded-lg border border-border bg-surface p-7">
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
          Sixteen years across backend engineering, distributed systems, data platforms, and
          production ML—from services handling hundreds of thousands of daily requests to telecom
          pipelines processing millions of rows per hour.
        </p>
        <Link
          to="/experience"
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-terminal/40 bg-terminal/5 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/10"
        >
          view complete experience
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function YouTubePreview() {
  const [latest, ...moreVideos] = videos.slice(0, 3);

  return (
    <section className="py-20">
      <SectionHeading id="youtube" kbd="play ./latest" title="YouTube" />
      <div className="grid overflow-hidden rounded-lg border border-border bg-surface lg:grid-cols-[1.45fr_1fr]">
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="aspect-video bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${latest.id}`}
              title={latest.title}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="p-5">
            <span className="font-mono-plus text-xs text-terminal">latest upload</span>
            <h3 className="mt-2 text-lg font-semibold leading-snug">{latest.title}</h3>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Watch practical breakdowns of Go, backend architecture, databases, search engines, and
              production-scale systems.
            </p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {moreVideos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noreferrer noopener"
                className="group grid grid-cols-[7rem_1fr] gap-3 p-4 transition-colors hover:bg-terminal/5"
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-full rounded border border-border object-cover"
                />
                <span className="self-center text-sm font-medium leading-snug group-hover:text-terminal">
                  {video.title}
                </span>
              </a>
            ))}
          </div>
          <div className="mt-auto p-5">
            <Link
              to="/youtube"
              className="inline-flex items-center gap-2 rounded-md border border-terminal/40 bg-terminal/5 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/10"
            >
              browse all videos
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Writing({ posts }: { posts: Post[] }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/blogs", search: { tag: "All", q: q.trim() } });
  };
  return (
    <section className="py-20">
      <SectionHeading id="writing" kbd="ls -lt posts/" title="Writing" />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        A handful of recent notes from my archive of 200+ software engineering articles.{" "}
        <Link
          to="/blogs"
          search={{ tag: "All", q: "" }}
          className="text-terminal underline-offset-4 hover:underline"
        >
          Browse the complete archive
        </Link>
        .
      </p>
      <form
        onSubmit={submit}
        className="mb-8 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2"
      >
        <Search className="h-4 w-4 text-terminal" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search all posts by title, tag, or content…"
          className="w-full bg-transparent font-mono-plus text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          className="rounded border border-terminal/40 bg-terminal/5 px-2 py-1 font-mono-plus text-xs text-terminal hover:bg-terminal/10"
        >
          search
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
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
                className="h-40 w-full border-b border-border object-cover"
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
      <div className="mt-8 flex justify-center">
        <Link
          to="/blogs"
          search={{ tag: "All", q: "" }}
          className="inline-flex items-center gap-2 rounded-md border border-terminal/40 bg-terminal/5 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/10"
        >
          browse all posts · filter by tag
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section className="py-20">
      <SectionHeading id="skills" kbd="cat skills.json" title="Skills" />
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(profile.skills).map(([group, items]) => (
          <div key={group} className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 font-mono-plus text-xs uppercase tracking-wider text-terminal">
              {group}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(items as string[]).map((s) => (
                <Link
                  key={s}
                  to="/blogs"
                  search={{ tag: s, q: "" }}
                  className="rounded border border-border bg-background/50 px-2 py-1 font-mono-plus text-xs text-foreground/90 transition-colors hover:border-terminal/50 hover:text-terminal"
                  title={`Browse articles tagged ${s}`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Education() {
  return (
    <section className="py-20">
      <SectionHeading id="education" kbd="cat edu.log" title="Education" />
      <ul className="space-y-4">
        {profile.education.map((e) => (
          <li key={e.degree} className="rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">{e.degree}</h3>
              <span className="font-mono-plus text-xs text-terminal">{e.period}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{e.school}</p>
            {"notes" in e && e.notes ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e.notes}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section className="py-20">
      <SectionHeading id="contact" kbd="./contact.sh" title="Contact" />
      <div className="rounded-lg border border-border bg-surface p-8">
        <p className="max-w-xl text-base text-muted-foreground">
          The fastest way to reach me is email. I'm open to senior backend, staff-level, and
          platform roles — remote or Tehran-based.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-2 rounded-md bg-terminal px-4 py-2 font-mono-plus text-sm font-medium text-primary-foreground transition-colors hover:bg-terminal/90"
          >
            <Mail className="h-4 w-4" />
            {profile.email}
          </a>
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href={profile.links.telegram}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Send className="h-4 w-4" />
            Telegram
          </a>
          <a
            href="/data/pdf/MobinShaterian.pdf"
            download
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 font-mono-plus text-sm text-foreground transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            <Download className="h-4 w-4" />
            Download profile (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>built with react · tanstack start</span>
      </div>
    </footer>
  );
}

/* ---------- utils ---------- */

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
