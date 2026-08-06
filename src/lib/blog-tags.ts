import postsIndex from "@/data/posts-index.json";

type TaggedPost = {
  tags: string[];
};

export type BlogTag = {
  name: string;
  count: number;
};

export const ALL_BLOG_TAG = "All";
export const STAR_BLOG_TAG = "Star";

const posts = postsIndex as TaggedPost[];
const tagCounts = new Map<string, number>();

for (const post of posts) {
  for (const tag of post.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

const starCount = tagCounts.get(STAR_BLOG_TAG) ?? 0;
const otherTags = [...tagCounts.entries()]
  .filter(([name]) => name !== ALL_BLOG_TAG && name !== STAR_BLOG_TAG)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([name, count]) => ({ name, count }));

export const BLOG_TAGS: BlogTag[] = [
  { name: ALL_BLOG_TAG, count: posts.length },
  ...(starCount ? [{ name: STAR_BLOG_TAG, count: starCount }] : []),
  ...otherTags,
];

export function blogTagLabel(tag: BlogTag) {
  return tag.name === STAR_BLOG_TAG ? `★ star (${tag.count})` : `${tag.name} (${tag.count})`;
}

export function blogTagSearchValue(name: string) {
  return name === ALL_BLOG_TAG ? "" : name;
}
