import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, BookOpen, Github, Star, Users } from "lucide-react";
import { GitHubProjectCard } from "@/components/GitHubProjectCard";
import { SiteMenu } from "@/components/SiteMenu";
import githubDataJson from "@/data/github-projects.json";
import profile from "@/data/profile.json";
import type { GitHubData } from "@/lib/github";
import { SITE_NAME, SITE_URL, websiteMeta } from "@/lib/seo";

const githubData = githubDataJson as GitHubData;
const title = `Open-source GitHub projects | ${SITE_NAME}`;
const description =
  "Explore Mobin Shaterian's featured open-source projects: Go backend blueprints, ClickHouse and GraphQL services, worker systems, crawling infrastructure, and this website.";

export const Route = createFileRoute("/github")({
  head: () => ({
    meta: websiteMeta({ title, description, path: "/github", image: githubData.profile.avatar }),
    links: [{ rel: "canonical", href: `${SITE_URL}/github` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: `${SITE_URL}/github`,
          author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: githubData.projects.length,
            itemListElement: githubData.projects.map((project, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_URL}/github/${project.name}`,
              name: project.name,
            })),
          },
        }),
      },
    ],
  }),
  component: GitHubPage,
});

function GitHubPage() {
  const totalStars = githubData.projects.reduce((total, project) => total + project.stars, 0);

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

      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
          <div className="relative mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-[1fr_auto] md:items-center md:py-24">
            <div>
              <p className="inline-flex items-center gap-2 font-mono-plus text-xs text-terminal">
                <Github className="h-4 w-4" />
                github.com/{githubData.profile.login}
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                Open-source work,
                <span className="block text-muted-foreground">built in the open.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Production-minded reference architectures and real systems spanning Go, data
                infrastructure, GraphQL, concurrent workers, web crawling, and publishing.
              </p>
              <a
                href={githubData.profile.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-terminal px-4 py-2 font-mono-plus text-sm font-medium text-primary-foreground transition-colors hover:bg-terminal/90"
              >
                <Github className="h-4 w-4" />
                follow @{githubData.profile.login}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
            <div className="w-fit rounded-xl border border-terminal/30 bg-surface/90 p-5 shadow-xl">
              <img
                src={githubData.profile.avatar}
                alt={`${githubData.profile.name} on GitHub`}
                className="h-28 w-28 rounded-lg border border-border"
              />
              <p className="mt-4 font-semibold">{githubData.profile.name}</p>
              <p className="font-mono-plus text-xs text-muted-foreground">
                @{githubData.profile.login}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-10">
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-4">
            <Stat
              icon={BookOpen}
              value={githubData.profile.publicRepos}
              label="public repositories"
            />
            <Stat icon={Users} value={githubData.profile.followers} label="followers" />
            <Stat icon={Star} value={totalStars} label="featured stars" />
            <Stat
              icon={Github}
              value={
                new Date().getFullYear() - new Date(githubData.profile.createdAt).getFullYear()
              }
              label="years on GitHub"
            />
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24 pt-10">
          <div className="mb-8 flex items-baseline gap-3">
            <span className="font-mono-plus text-xs text-terminal">$ ls featured/</span>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Featured projects</h2>
            <div className="h-px flex-1 bg-border/70" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {githubData.projects.map((project) => (
              <GitHubProjectCard key={project.name} project={project} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <span>data refreshed {new Date(githubData.generatedAt).toLocaleDateString("en-US")}</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Github; value: number; label: string }) {
  return (
    <div className="border-b border-r border-border p-5 last:border-r-0 md:border-b-0">
      <Icon className="h-4 w-4 text-terminal" />
      <strong className="mt-3 block text-2xl">{value}</strong>
      <span className="font-mono-plus text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
