import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleDot,
  Code2,
  GitBranch,
  GitFork,
  Github,
  Scale,
  Star,
} from "lucide-react";
import { SiteMenu } from "@/components/SiteMenu";
import { ReadmeContent } from "@/components/ReadmeContent";
import githubDataJson from "@/data/github-projects.json";
import profile from "@/data/profile.json";
import { formatGitHubDate, languageColor, type GitHubData, type GitHubProject } from "@/lib/github";
import { SITE_NAME, SITE_URL, websiteMeta } from "@/lib/seo";

const githubData = githubDataJson as GitHubData;

export const Route = createFileRoute("/github_/$repo")({
  loader: ({ params }) => {
    const project = githubData.projects.find((candidate) => candidate.name === params.repo);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: `Project not found | ${SITE_NAME}` },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { project } = loaderData;
    const title = `${project.name}: ${project.tagline} | ${SITE_NAME}`;
    const url = `${SITE_URL}/github/${params.repo}`;
    return {
      meta: websiteMeta({ title, description: project.summary, path: `/github/${params.repo}` }),
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: project.name,
            description: project.summary,
            url,
            codeRepository: project.githubUrl,
            programmingLanguage: project.languages.map((language) => language.name),
            license: project.license
              ? `https://spdx.org/licenses/${project.license}.html`
              : undefined,
            dateCreated: project.createdAt,
            dateModified: project.pushedAt,
            author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
          }),
        },
      ],
    };
  },
  notFoundComponent: ProjectNotFound,
  component: GitHubProjectPage,
});

function GitHubProjectPage() {
  const { project } = Route.useLoaderData();
  const related = githubData.projects
    .filter((candidate) => candidate.name !== project.name)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            to="/github"
            className="inline-flex items-center gap-2 font-mono-plus text-sm text-terminal terminal-glow"
          >
            <ArrowLeft className="h-4 w-4" />
            ~/mobin/github
          </Link>
          <SiteMenu />
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-24">
            <p className="font-mono-plus text-xs uppercase tracking-wider text-terminal">
              {project.kind} · open source
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              {project.name}
            </h1>
            <p className="mt-4 text-xl font-medium text-muted-foreground md:text-2xl">
              {project.tagline}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
              {project.summary}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md bg-terminal px-4 py-2 font-mono-plus text-sm font-medium text-primary-foreground transition-colors hover:bg-terminal/90"
              >
                <Github className="h-4 w-4" />
                view source
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href={project.readmeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 font-mono-plus text-sm transition-colors hover:border-terminal/50 hover:text-terminal"
              >
                <BookOpen className="h-4 w-4" />
                README
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6 py-16">
          <ProjectStats project={project} />

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
            <section>
              <SectionTitle command="cat highlights.md" title="What it includes" />
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-3 rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed"
                  >
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-terminal terminal-glow" />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>

            <aside>
              <SectionTitle command="cat stack.json" title="Technology" />
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface p-5">
                {project.stack.map((technology) => (
                  <span
                    key={technology}
                    className="rounded border border-terminal/30 bg-terminal/5 px-2.5 py-1.5 font-mono-plus text-xs text-terminal"
                  >
                    {technology}
                  </span>
                ))}
              </div>
            </aside>
          </div>

          <section className="mt-16">
            <SectionTitle command="tokei ." title="Languages" />
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="flex h-3 overflow-hidden rounded-full bg-background">
                {project.languages.map((language) => (
                  <span
                    key={language.name}
                    style={{
                      width: `${language.percentage}%`,
                      backgroundColor: languageColor(language.name),
                    }}
                    title={`${language.name}: ${language.percentage}%`}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {project.languages.map((language) => (
                  <span
                    key={language.name}
                    className="inline-flex items-center gap-2 font-mono-plus text-xs text-muted-foreground"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: languageColor(language.name) }}
                    />
                    {language.name} {language.percentage}%
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-16">
            <SectionTitle command="./start.sh" title="Quick start" />
            <pre className="overflow-x-auto rounded-lg border border-border bg-surface p-5 font-mono-plus text-sm leading-7 text-foreground">
              <code>{project.quickStart.map((command) => `$ ${command}`).join("\n")}</code>
            </pre>
          </section>

          <section className="mt-16">
            <SectionTitle command="cat README.md" title="Complete README" />
            <ReadmeContent project={project} />
          </section>

          <section className="mt-16">
            <SectionTitle command="ls ../" title="Explore next" />
            <div className="grid gap-4 md:grid-cols-3">
              {related.map((candidate) => (
                <Link
                  key={candidate.name}
                  to="/github/$repo"
                  params={{ repo: candidate.name }}
                  className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-terminal/50"
                >
                  <span className="font-mono-plus text-[10px] uppercase tracking-wider text-terminal">
                    {candidate.kind}
                  </span>
                  <h3 className="mt-2 font-semibold group-hover:text-terminal">{candidate.name}</h3>
                  <span className="mt-4 inline-flex items-center gap-1 font-mono-plus text-xs text-muted-foreground">
                    open project <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 font-mono-plus text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <Link to="/github" className="transition-colors hover:text-terminal">
            all GitHub projects
          </Link>
        </div>
      </footer>
    </div>
  );
}

function ProjectStats({ project }: { project: GitHubProject }) {
  const stats = [
    { icon: Star, label: "stars", value: project.stars },
    { icon: GitFork, label: "forks", value: project.forks },
    { icon: CircleDot, label: "open issues", value: project.openIssues },
    { icon: GitBranch, label: "default branch", value: project.defaultBranch },
    { icon: Scale, label: "license", value: project.license ?? "Not specified" },
    { icon: CalendarDays, label: "last push", value: formatGitHubDate(project.pushedAt) },
  ];
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-3 lg:grid-cols-6">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="border-b border-r border-border p-4 last:border-r-0 lg:border-b-0"
        >
          <Icon className="h-4 w-4 text-terminal" />
          <strong className="mt-3 block truncate text-sm">{value}</strong>
          <span className="font-mono-plus text-[10px] text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ command, title }: { command: string; title: string }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono-plus text-xs text-terminal">$ {command}</span>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="h-px flex-1 bg-border/70" />
    </div>
  );
}

function ProjectNotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
      <div>
        <Code2 className="mx-auto h-8 w-8 text-terminal" />
        <h1 className="mt-4 text-3xl font-semibold">Project not found</h1>
        <Link
          to="/github"
          className="mt-6 inline-flex items-center gap-2 font-mono-plus text-sm text-terminal"
        >
          <ArrowLeft className="h-4 w-4" /> back to GitHub projects
        </Link>
      </div>
    </div>
  );
}
