export type GitHubLanguage = {
  name: string;
  bytes: number;
  percentage: number;
};

export type GitHubProject = {
  name: string;
  kind: string;
  tagline: string;
  summary: string;
  features: string[];
  stack: string[];
  quickStart: string[];
  description: string | null;
  githubUrl: string;
  readmeUrl: string;
  issuesUrl: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  topics: string[];
  readme: string;
  readmeExcerpt: string;
  languages: GitHubLanguage[];
};

export type GitHubData = {
  generatedAt: string;
  profile: {
    login: string;
    name: string;
    bio: string;
    avatar: string;
    url: string;
    publicRepos: number;
    followers: number;
    following: number;
    createdAt: string;
  };
  projects: GitHubProject[];
};

const languageColors: Record<string, string> = {
  Go: "#00ADD8",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  CSS: "#663399",
  HTML: "#e34c26",
  Dockerfile: "#384d54",
};

export function languageColor(language: string) {
  return languageColors[language] ?? "#8b949e";
}

export function formatGitHubDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
