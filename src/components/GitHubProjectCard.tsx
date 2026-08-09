import { Link } from "@tanstack/react-router";
import { ArrowRight, GitFork, Star } from "lucide-react";
import { languageColor, type GitHubProject } from "@/lib/github";

export function GitHubProjectCard({ project }: { project: GitHubProject }) {
  return (
    <Link
      to="/github/$repo"
      params={{ repo: project.name }}
      className="group flex h-full flex-col rounded-lg border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-terminal/50"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono-plus text-[11px] uppercase tracking-wider text-terminal">
          {project.kind}
        </span>
        <span className="flex items-center gap-3 font-mono-plus text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" /> {project.stars}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" /> {project.forks}
          </span>
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-tight group-hover:text-terminal">
        {project.name}
      </h3>
      <p className="mt-2 text-sm font-medium">{project.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {project.summary}
      </p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.stack.slice(0, 4).map((technology) => (
          <span
            key={technology}
            className="rounded border border-border bg-background/50 px-2 py-1 font-mono-plus text-[10px] text-muted-foreground"
          >
            {technology}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono-plus text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: languageColor(project.languages[0]?.name ?? "") }}
          />
          {project.languages[0]?.name ?? "Source"}
        </span>
        <span className="inline-flex items-center gap-1 text-terminal">
          project details
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
