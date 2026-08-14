import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import type { PluginOption } from "vite";
import fs from "node:fs";

const index = JSON.parse(fs.readFileSync("./src/data/posts-index.json", "utf8")) as Array<{
  slug: string;
}>;
const github = JSON.parse(fs.readFileSync("./src/data/github-projects.json", "utf8")) as {
  projects: Array<{ name: string }>;
};
const youtube = JSON.parse(fs.readFileSync("./src/data/youtube-videos.json", "utf8")) as Array<{
  id: string;
}>;
const staticPages = [
  "/",
  "/experience",
  "/blogs",
  "/github",
  "/youtube",
  ...github.projects.map((project) => `/github/${project.name}`),
  ...youtube.map((video) => `/youtube/${video.id}`),
  ...index.map((p) => `/blog/${p.slug}`),
];

const lovableConfig = defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    pages: staticPages.map((path) => ({ path })),
    prerender: {
      enabled: true,
      autoSubfolderIndex: true,
      autoStaticPathsDiscovery: true,
      crawlLinks: false,
    },
  },
  vite: {
    plugins: [nitro({ preset: "node-server" })],
    resolve: {
      tsconfigPaths: true,
    },
  },
});

export default async (env: Parameters<typeof lovableConfig>[0]) => {
  const config = await lovableConfig(env);
  config.plugins = config.plugins?.filter((plugin) => !isTsconfigPathsPlugin(plugin));
  return config;
};

function isTsconfigPathsPlugin(plugin: PluginOption) {
  return (
    plugin !== false &&
    plugin != null &&
    !Array.isArray(plugin) &&
    typeof plugin === "object" &&
    "name" in plugin &&
    plugin.name === "vite-tsconfig-paths"
  );
}
