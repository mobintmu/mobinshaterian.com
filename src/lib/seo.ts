export const SITE_URL = "https://mobinshaterian.com";
export const SITE_NAME = "Mobin Shaterian";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/mobin.jpg`;

export const HOME_TITLE = "Mobin Shaterian | Senior Software Engineer & Go Developer";
export const HOME_DESCRIPTION =
  "Mobin Shaterian is a senior software engineer with 16 years of experience building high-throughput Go backends, distributed systems, microservices, and data pipelines.";

export const BLOG_TITLE = "Software Engineering Blog | Mobin Shaterian";
export const BLOG_DESCRIPTION =
  "Read 200+ practical articles about Go, backend architecture, distributed systems, ClickHouse, Kafka, databases, DevOps, security, and software engineering.";

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}

export function cleanDescription(value: string, fallback: string, maxLength = 160) {
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description = text.length >= 40 ? text : fallback;

  if (description.length <= maxLength) return description;
  return `${description.slice(0, maxLength - 1).replace(/[\s,.;:!?-]+\S*$/, "")}…`;
}

export function websiteMeta({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
  imageAlt = `${SITE_NAME}, senior software engineer and Go developer`,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}) {
  const url = absoluteUrl(path);
  return [
    { title },
    { name: "description", content: description },
    { name: "author", content: SITE_NAME },
    { name: "robots", content: "index, follow, max-image-preview:large" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_US" },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];
}
