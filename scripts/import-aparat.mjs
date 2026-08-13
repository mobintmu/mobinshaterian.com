import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROFILE_HANDLE = "mobintmu";
const EXTRA_VIDEO_UIDS = ["u65t5bd", "w68j1bf"];
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const apiUrl = `https://www.aparat.com/etc/api/videoByUser/username/${PROFILE_HANDLE}/perpage/50`;

const responses = await Promise.all([
  fetch(apiUrl),
  ...EXTRA_VIDEO_UIDS.map((uid) => fetch(`https://www.aparat.com/etc/api/video/videohash/${uid}`)),
]);
const failedResponse = responses.find((response) => !response.ok);
if (failedResponse) {
  throw new Error(`Aparat import failed with status ${failedResponse.status}.`);
}

const [profilePayload, ...extraPayloads] = await Promise.all(
  responses.map((response) => response.json()),
);
const importedVideos = [
  ...(profilePayload.videobyuser ?? []),
  ...extraPayloads.map((payload) => payload.video),
];
const videos = [...new Map(importedVideos.map((video) => [video.uid, video])).values()]
  .map((video) => ({
    id: video.id,
    uid: video.uid,
    title: video.title,
    date: video.create_date.slice(0, 10),
    persianDate: video.sdate,
    duration: video.duration,
    views: video.visit_cnt,
    thumbnail: video.big_poster.split("?")[0],
    embedUrl: video.frame,
    url: `https://www.aparat.com/v/${video.uid}`,
  }))
  .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

if (!videos.length) {
  throw new Error("Aparat API did not contain any public videos.");
}

const output = `${JSON.stringify(videos, null, 2)}\n`;
fs.writeFileSync(path.join(root, "src/data/aparat-videos.json"), output);
fs.writeFileSync(path.join(root, "public/data/aparat-videos.json"), output);
console.log(`Imported ${videos.length} public videos from Aparat @${PROFILE_HANDLE}.`);
