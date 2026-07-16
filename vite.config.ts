import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import fs from "node:fs";

const index = JSON.parse(fs.readFileSync("./src/data/posts-index.json", "utf8")) as Array<{ slug: string }>;
const staticPages = ["/", "/blogs", ...index.map((p) => `/blog/${p.slug}`)];

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    prerender: {
      enabled: true,
      autoSubfolderIndex: true,
      autoStaticPathsDiscovery: true,
      crawlLinks: true,
      pages: staticPages,
    },
  },
  vite: {
    plugins: [nitro({ preset: "node-server" })],
  },
});
