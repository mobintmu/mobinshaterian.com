import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const owner = "mobintmu";

const projectDetails = {
  "go-simple": {
    kind: "Backend blueprint",
    tagline: "A production-ready Go service blueprint.",
    summary:
      "A clean, modular reference service for maintainable Go backends, with HTTP and gRPC boundaries, type-safe persistence, caching, authentication, and an observable application lifecycle.",
    features: [
      "Domain-centered Clean Architecture",
      "Gin HTTP API and gRPC service",
      "SQLC-backed PostgreSQL repositories",
      "Redis caching and JWT middleware",
      "Uber FX lifecycle and dependency injection",
      "Migrations, Swagger, tests, and Docker",
    ],
    stack: ["Go", "Gin", "gRPC", "PostgreSQL", "SQLC", "Redis", "Uber FX", "Zap", "Docker"],
    quickStart: ["docker compose up -d", "go run cmd/server/main.go"],
  },
  "go-clickhouse": {
    kind: "Data backend",
    tagline: "A dual-store Go backend with ClickHouse analytics.",
    summary:
      "A clean Go service that combines transactional PostgreSQL storage with a ClickHouse analytics repository while preserving the HTTP, gRPC, caching, and lifecycle patterns of a production backend.",
    features: [
      "ClickHouse product repository and MergeTree examples",
      "PostgreSQL persistence generated with SQLC",
      "REST and gRPC service boundaries",
      "Redis-backed caching",
      "Clean, dependency-injected modules with Uber FX",
      "Docker environment, migrations, and tests",
    ],
    stack: ["Go", "ClickHouse", "PostgreSQL", "SQLC", "Gin", "gRPC", "Redis", "Uber FX", "Docker"],
    quickStart: ["docker compose up -d", "go run cmd/server/main.go"],
  },
  "go-graphql": {
    kind: "GraphQL service",
    tagline: "Type-safe GraphQL APIs on a clean Go core.",
    summary:
      "A gqlgen-powered GraphQL service built around explicit domain, service, and repository layers, with product queries, filters, pagination, PostgreSQL persistence, and Redis caching.",
    features: [
      "Schema-first GraphQL with gqlgen",
      "Generated types plus focused resolvers",
      "Filtering and pagination examples",
      "SQLC-backed PostgreSQL repositories",
      "Redis caching around the service layer",
      "Uber FX lifecycle, configuration, and logging",
    ],
    stack: ["Go", "GraphQL", "gqlgen", "PostgreSQL", "SQLC", "Gin", "Redis", "Uber FX"],
    quickStart: [
      "docker compose up -d",
      "go run github.com/99designs/gqlgen generate",
      "go run cmd/server/main.go",
    ],
  },
  "go-worker": {
    kind: "Worker system",
    tagline: "A tested Poller–Dispatcher–Worker architecture in Go.",
    summary:
      "A concurrency-focused Go reference that separates job polling, dispatch, and execution into testable components, then wires them into a complete backend service lifecycle.",
    features: [
      "Dedicated poller, dispatcher, job, and worker packages",
      "Explicit job fan-out and execution boundaries",
      "Unit tests for polling, dispatch, and workers",
      "Service lifecycle managed through Uber FX",
      "PostgreSQL and Redis integration patterns",
      "Containerized local development environment",
    ],
    stack: ["Go", "Concurrency", "Uber FX", "PostgreSQL", "Redis", "gRPC", "Docker"],
    quickStart: ["docker compose up -d", "go run cmd/server/main.go", "go test ./..."],
  },
  "go-wordpress": {
    kind: "Crawler platform",
    tagline: "A configurable WordPress product crawler in Go.",
    summary:
      "A production-oriented crawler platform using Colly and per-site JSON configuration to discover, clean, persist, and refresh product data through a modular worker pipeline.",
    features: [
      "Colly-based, configuration-driven crawling",
      "Product, category, website, and config modules",
      "Poller–Dispatcher–Worker orchestration",
      "Content cleanup and description extraction",
      "SQLC migrations and idempotent seed data",
      "REST, gRPC, caching, and Docker support",
    ],
    stack: ["Go", "Colly", "PostgreSQL", "SQLC", "Redis", "Gin", "gRPC", "Uber FX", "Docker"],
    quickStart: ["docker compose up -d", "go run cmd/server/main.go"],
  },
  "mobinshaterian.com": {
    kind: "Portfolio platform",
    tagline: "This portfolio, blog, and publishing system.",
    summary:
      "A fast, searchable personal publishing platform that brings together a professional profile, 200+ imported articles, video channels, structured data, and static-first SEO.",
    features: [
      "More than 200 imported engineering articles",
      "Full-text search, tags, and content discovery",
      "Server rendering and route prerendering",
      "Structured data, RSS, sitemap, and social metadata",
      "Repeatable import pipelines for external publishing channels",
      "GitHub Pages-compatible static delivery",
    ],
    stack: [
      "TypeScript",
      "React",
      "TanStack Start",
      "Tailwind CSS",
      "MiniSearch",
      "Vite",
      "Nitro",
      "Bun",
    ],
    quickStart: ["bun install", "bun run dev", "bun run build"],
  },
};

async function github(pathname, accept = "application/vnd.github+json") {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers: { Accept: accept, "User-Agent": "mobinshaterian.com-importer" },
  });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}): ${pathname}`);
  return response;
}

function excerpt(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

const sourceDataPath = path.join(root, "src/data/github-projects.json");
const existingData = fs.existsSync(sourceDataPath)
  ? JSON.parse(fs.readFileSync(sourceDataPath, "utf8"))
  : null;

let profile;
try {
  const profileResponse = await github(`/users/${owner}`);
  const data = await profileResponse.json();
  profile = {
    login: data.login,
    name: data.name,
    bio: data.bio,
    avatar: data.avatar_url,
    url: data.html_url,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
    createdAt: data.created_at,
  };
} catch (error) {
  if (!existingData?.profile) throw error;
  console.warn("GitHub profile API unavailable; keeping the last imported profile metadata.");
  profile = existingData.profile;
}

const projects = await Promise.all(
  Object.entries(projectDetails).map(async ([name, details]) => {
    const previous = existingData?.projects?.find((project) => project.name === name);
    let metadata;
    let languages;
    try {
      const [repoResponse, languagesResponse] = await Promise.all([
        github(`/repos/${owner}/${name}`),
        github(`/repos/${owner}/${name}/languages`),
      ]);
      const repo = await repoResponse.json();
      const languageBytes = await languagesResponse.json();
      const totalBytes = Object.values(languageBytes).reduce((total, bytes) => total + bytes, 0);
      metadata = {
        description: repo.description,
        githubUrl: repo.html_url,
        readmeUrl: `${repo.html_url}/blob/${repo.default_branch}/README.md`,
        issuesUrl: `${repo.html_url}/issues`,
        homepage: repo.homepage || null,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        watchers: repo.subscribers_count,
        openIssues: repo.open_issues_count,
        license: repo.license?.spdx_id ?? null,
        defaultBranch: repo.default_branch,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        topics: repo.topics,
      };
      languages = Object.entries(languageBytes)
        .sort(([, a], [, b]) => b - a)
        .map(([language, bytes]) => ({
          name: language,
          bytes,
          percentage: totalBytes ? Number(((bytes / totalBytes) * 100).toFixed(1)) : 0,
        }));
    } catch (error) {
      if (!previous) throw error;
      console.warn(`GitHub API unavailable for ${name}; keeping its last imported metadata.`);
      metadata = previous;
      languages = previous.languages;
    }

    const branch = metadata.defaultBranch || "main";
    const readmeResponse = await fetch(
      `https://raw.githubusercontent.com/${owner}/${name}/${branch}/README.md`,
    );
    if (!readmeResponse.ok) {
      throw new Error(`README request failed (${readmeResponse.status}): ${name}`);
    }
    const readme = await readmeResponse.text();

    return {
      name,
      ...details,
      ...metadata,
      readme,
      readmeExcerpt: excerpt(readme),
      languages,
    };
  }),
);

const output = {
  generatedAt: new Date().toISOString(),
  profile,
  projects,
};

const json = `${JSON.stringify(output, null, 2)}\n`;
fs.writeFileSync(path.join(root, "src/data/github-projects.json"), json);
fs.writeFileSync(path.join(root, "public/data/github-projects.json"), json);
console.log(`Imported GitHub profile and ${projects.length} featured repositories.`);
