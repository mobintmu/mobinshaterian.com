import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const CHANNEL_HANDLE = "mobinshaterian";
const CHANNEL_ID = "UCTwwa7ad2dwiDfotiQg7Ufw";
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");

const [videosResponse, feedResponse] = await Promise.all([
  fetch(`https://www.youtube.com/@${CHANNEL_HANDLE}/videos`),
  fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`),
]);

if (!videosResponse.ok || !feedResponse.ok) {
  throw new Error(
    `YouTube import failed (videos: ${videosResponse.status}, feed: ${feedResponse.status})`,
  );
}

const html = await videosResponse.text();
const marker = "var ytInitialData = ";
const start = html.indexOf(marker) + marker.length;
const end = html.indexOf(";</script>", start);

if (start < marker.length || end < 0) {
  throw new Error("YouTube page data was not found. Its page format may have changed.");
}

const pageData = JSON.parse(html.slice(start, end));
const selectedTab = pageData.contents.twoColumnBrowseResultsRenderer.tabs.find(
  (tab) => tab.tabRenderer?.selected,
);
const gridItems = selectedTab.tabRenderer.content.richGridRenderer.contents;
const pageMetadata = new Map(
  gridItems
    .map((item) => item.richItemRenderer?.content?.lockupViewModel)
    .filter(Boolean)
    .map((video) => {
      const duration = video.contentImage.thumbnailViewModel.overlays?.flatMap(
        (overlay) => overlay.thumbnailBottomOverlayViewModel?.badges ?? [],
      )[0]?.thumbnailBadgeViewModel?.text;

      return [video.contentId, { duration: duration ?? "" }];
    }),
);

const xml = await feedResponse.text();
const $ = cheerio.load(xml, { xmlMode: true });
const videos = $("entry")
  .toArray()
  .map((entry) => {
    const element = $(entry);
    const id = element.find("yt\\:videoId").text();
    return {
      id,
      title: element.children("title").first().text(),
      published: element.children("published").text().slice(0, 10),
      duration: pageMetadata.get(id)?.duration ?? "",
    };
  });

const output = `${JSON.stringify(videos, null, 2)}\n`;
fs.writeFileSync(path.join(root, "src/data/youtube-videos.json"), output);
fs.writeFileSync(path.join(root, "public/data/youtube-videos.json"), output);
console.log(`Imported ${videos.length} videos from @${CHANNEL_HANDLE}.`);
