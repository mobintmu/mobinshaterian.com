import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import posts from "@/data/posts-index.json";
import {
  ArrowUpRight,
  Github,
  Linkedin,
  Mail,
  MapPin,
  PenLine,
  Search,
  Send,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/")({
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
  const sortedPosts = [...(posts as Post[])]
    .sort((a, b): number => {
      return a.date === b.date ? a.slug.localeCompare(b.slug) : a.date < b.date ? 1 : -1;
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Nav />
      <Hero />
      <main className="mx-auto max-w-5xl px-6 pb-24">
        <Writing posts={sortedPosts} />
        <About />
        <Experience />
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

function About() {
  return (
    <section className="py-20">
      <SectionHeading id="about" kbd="cat about.md" title="About" />
      <div className="grid gap-8 md:grid-cols-3">
        <p className="text-base leading-relaxed text-muted-foreground md:col-span-2">
          I'm a senior backend engineer focused on Go, distributed systems, and data-heavy
          platforms. Over 16 years I've moved teams from monoliths into microservices, rebuilt B2B
          APIs for scale, and turned research-grade ML services into production systems doing tens
          of thousands of TPS. I care about clean code, honest observability, and the boring parts
          of reliability.
        </p>
        <ul className="space-y-3 font-mono-plus text-sm">
          <li className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-terminal" />
            {profile.location}
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 text-terminal" />
            <a href={`mailto:${profile.email}`} className="hover:text-terminal">
              {profile.email}
            </a>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <PenLine className="h-4 w-4 text-terminal" />
            <a
              href={profile.links.medium}
              target="_blank"
              rel="noreferrer noopener"
              className="hover:text-terminal"
            >
              mobinshaterian.medium.com
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section className="py-20">
      <SectionHeading id="experience" kbd="ls experience/" title="Experience" />
      <ol className="space-y-6">
        {profile.experience.map((job) => (
          <li
            key={`${job.company}-${job.period}`}
            className="group rounded-lg border border-border bg-surface p-6 transition-colors hover:border-terminal/40"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {job.role} <span className="text-muted-foreground">@ {job.company}</span>
                </h3>
                <p className="mt-1 font-mono-plus text-xs text-muted-foreground">{job.location}</p>
              </div>
              <span className="font-mono-plus text-xs text-terminal">{job.period}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {job.highlights.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-terminal" />
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Writing({ posts }: { posts: Post[] }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/blogs", search: { tag: "Star", q: q.trim() } });
  };
  return (
    <section className="py-20">
      <SectionHeading id="writing" kbd="ls -lt posts/" title="Writing" />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        A handful of recent notes. The full archive of 200+ articles lives on{" "}
        <a
          href={profile.links.medium}
          target="_blank"
          rel="noreferrer noopener"
          className="text-terminal underline-offset-4 hover:underline"
        >
          Medium
        </a>
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
                alt=""
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
          search={{ tag: "Star", q: "" }}
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
                <span
                  key={s}
                  className="rounded border border-border bg-background/50 px-2 py-1 font-mono-plus text-xs text-foreground/90"
                >
                  {s}
                </span>
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
