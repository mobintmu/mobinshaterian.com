import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Download, Linkedin, MapPin } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import { SITE_NAME, SITE_URL, absoluteUrl, websiteMeta } from "@/lib/seo";

const title = `Software Engineering Experience | ${SITE_NAME}`;
const description =
  "Explore Mobin Shaterian's 16 years of experience leading engineering teams and building backend systems, data platforms, and production ML services.";

export const Route = createFileRoute("/experience")({
  head: () => ({
    meta: websiteMeta({
      title,
      description,
      path: "/experience",
    }),
    links: [{ rel: "canonical", href: absoluteUrl("/experience") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "@id": `${SITE_URL}/experience#profile`,
          url: absoluteUrl("/experience"),
          name: title,
          description,
          inLanguage: "en",
          mainEntity: {
            "@type": "Person",
            "@id": `${SITE_URL}/#person`,
            name: SITE_NAME,
            jobTitle: profile.title,
            hasOccupation: {
              "@type": "Occupation",
              name: profile.title,
              occupationLocation: {
                "@type": "City",
                name: "Tehran",
              },
              skills: Object.values(profile.skills).flat().join(", "),
            },
          },
          mainContentOfPage: {
            "@type": "ItemList",
            numberOfItems: profile.experience.length,
            itemListElement: profile.experience.map((job, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: `${job.role} at ${job.company}`,
              description: job.highlights.join(" "),
            })),
          },
          isPartOf: { "@id": `${SITE_URL}/#website` },
        }),
      },
    ],
  }),
  component: ExperiencePage,
});

function ExperiencePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow"
          >
            <ArrowLeft className="h-4 w-4" />
            ~/mobin
          </Link>
          <SiteMenu />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 md:py-20">
        <header className="max-w-3xl">
          <span className="font-mono-plus text-xs text-terminal">$ cat experience.log</span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Software engineering experience
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Roles across 16 years in software engineering, from web development, teaching, and
            healthcare research to technical leadership, telecom data platforms, and production
            machine learning.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/data/pdf/MobinShaterian.pdf"
              download
              className="inline-flex items-center gap-2 rounded-md bg-terminal px-4 py-2 font-mono-plus text-sm font-medium text-primary-foreground transition-colors hover:bg-terminal/90"
            >
              <Download className="h-4 w-4" />
              Download CV (PDF)
            </a>
            <a
              href={profile.links.linkedin}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm transition-colors hover:border-terminal/50 hover:text-terminal"
            >
              <Linkedin className="h-4 w-4" />
              View LinkedIn profile
            </a>
          </div>
        </header>

        <ol className="relative mt-14 space-y-6 before:absolute before:bottom-4 before:left-[0.4375rem] before:top-4 before:w-px before:bg-border md:before:left-[8.9375rem]">
          {profile.experience.map((job) => (
            <li
              key={`${job.company}-${job.period}`}
              className="relative grid gap-3 pl-7 md:grid-cols-[8rem_1fr] md:gap-8 md:pl-0"
            >
              <span className="absolute left-1 top-6 h-2 w-2 rounded-full bg-terminal ring-4 ring-background terminal-glow md:left-[8.6875rem]" />
              <time className="pt-4 font-mono-plus text-xs text-terminal md:text-right">
                {job.period}
              </time>
              <article className="rounded-lg border border-border bg-surface p-6 transition-colors hover:border-terminal/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight">{job.role}</h2>
                    <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4 text-terminal" />
                      <bdi>{job.company}</bdi>
                    </p>
                  </div>
                  {job.location ? (
                    <span className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-terminal" />
                      {job.location}
                    </span>
                  ) : null}
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {job.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 flex-none rounded-full bg-terminal" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
                {job.articles ? (
                  <ul className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
                    {job.articles.map((article) => (
                      <li key={article.slug}>
                        <Link
                          to="/blog/$slug"
                          params={{ slug: article.slug }}
                          className="text-terminal underline decoration-terminal/50 underline-offset-4 hover:decoration-current"
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </li>
          ))}
        </ol>

        <section aria-labelledby="projects-heading" className="mt-16">
          <h2 id="projects-heading" className="text-2xl font-semibold tracking-tight">
            Selected engineering projects
          </h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.experienceProjects.map(({ name, summary, article }) => (
              <li key={name} className="rounded-lg border border-border bg-surface p-6">
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: article.slug }}
                  className="mt-4 inline-block text-sm text-terminal underline decoration-terminal/50 underline-offset-4 hover:decoration-current"
                >
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 rounded-lg border border-terminal/30 bg-terminal/5 p-7">
          <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
            $ next --contact
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Interested in working together?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            I’m open to senior engineering and technical leadership roles in backend systems, data
            engineering, and applied AI.
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="mt-5 inline-flex items-center gap-2 rounded border border-terminal bg-terminal/10 px-4 py-2 font-mono-plus text-sm text-terminal transition-colors hover:bg-terminal/20"
          >
            Contact me
            <ArrowRight className="h-4 w-4" />
          </a>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
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
