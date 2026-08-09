import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROFILE_HANDLE = "mobintmu";
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "..");
const apiUrl = `https://www.aparat.com/etc/api/videoByUser/username/${PROFILE_HANDLE}/perpage/50`;

const response = await fetch(apiUrl);
if (!response.ok) {
  throw new Error(`Aparat import failed with status ${response.status}.`);
}

const payload = await response.json();
const videos = (payload.videobyuser ?? []).map((video) => ({
  id: video.id,
  uid: video.uid,
  title: video.title,
  date: video.create_date.slice(0, 10),
  persianDate: video.sdate,
  duration: video.duration,
  views: video.visit_cnt,
  thumbnail: video.big_poster,
  embedUrl: video.frame,
  url: `https://www.aparat.com/v/${video.uid}`,
}));

if (!videos.length) {
  throw new Error("Aparat API did not contain any public videos.");
}

const output = `${JSON.stringify(videos, null, 2)}\n`;
fs.writeFileSync(path.join(root, "src/data/aparat-videos.json"), output);
fs.writeFileSync(path.join(root, "public/data/aparat-videos.json"), output);
console.log(`Imported ${videos.length} public videos from Aparat @${PROFILE_HANDLE}.`);
