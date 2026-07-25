import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, MapPin } from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import profile from "@/data/profile.json";
import { SITE_NAME, SITE_URL, absoluteUrl, websiteMeta } from "@/lib/seo";

const title = `Software Engineering Experience | ${SITE_NAME}`;
const description =
  "Explore Mobin Shaterian's 16 years of software engineering experience building high-throughput Go backends, microservices, APIs, ML systems, and data platforms.";

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
            jobTitle: "Senior Software Engineer",
            hasOccupation: {
              "@type": "Occupation",
              name: "Senior Software Engineer",
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
            Sixteen years building and scaling backend systems, from high-throughput Go services and
            payment platforms to telecom data pipelines and production ML infrastructure.
          </p>
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
                      {job.company}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-mono-plus text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-terminal" />
                    {job.location}
                  </span>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {job.highlights.map((highlight) => (
                    <li key={highlight} className="flex gap-3">
                      <span className="mt-2 h-1 w-1 flex-none rounded-full bg-terminal" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <section className="mt-16 rounded-lg border border-terminal/30 bg-terminal/5 p-7">
          <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
            $ next --contact
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Interested in working together?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            I’m open to senior backend, staff-level, and platform engineering opportunities.
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
