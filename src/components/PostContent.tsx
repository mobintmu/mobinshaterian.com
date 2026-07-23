import { useState } from "react";
import { Check, Copy } from "lucide-react";

export type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; html: string }
  | { type: "code"; lang: string; code: string }
  | { type: "image"; src: string; alt?: string; caption?: string; width?: number; height?: number }
  | { type: "quote"; html: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "embed"; provider: string; url: string }
  | { type: "hr" };

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };
  return (
    <div className="my-6 overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border/60 bg-background/40 px-3 py-1.5">
        <span className="font-mono-plus text-[10px] uppercase tracking-wider text-terminal">
          {lang || "text"}
        </span>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 font-mono-plus text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-terminal"
          type="button"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="max-w-full whitespace-pre-wrap [overflow-wrap:anywhere] p-4 font-mono-plus text-xs leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Embed({ provider, url }: { provider: string; url: string }) {
  if (provider === "youtube") {
    return (
      <div className="my-6 aspect-video overflow-hidden rounded-md border border-border">
        <iframe
          src={url}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="YouTube embed"
        />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="my-6 block rounded-md border border-border bg-surface p-4 font-mono-plus text-xs text-terminal hover:border-terminal/50"
    >
      ↗ {url}
    </a>
  );
}

function normalizeImageSource(src: string) {
  const value = src.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

export function PostContent({
  blocks,
  displayedImageSources = [],
}: {
  blocks: Block[];
  displayedImageSources?: Array<string | null | undefined>;
}) {
  const seenImageSources = new Set(
    displayedImageSources
      .filter((source): source is string => Boolean(source))
      .map(normalizeImageSource),
  );

  return (
    <div className="post-content">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return b.level === 2 ? (
              <h2 key={i} className="mt-10 mb-3 text-2xl font-semibold tracking-tight">
                {b.text}
              </h2>
            ) : (
              <h3 key={i} className="mt-8 mb-2 text-xl font-semibold tracking-tight">
                {b.text}
              </h3>
            );
          case "paragraph":
            return (
              <p
                key={i}
                className="my-4 text-base leading-relaxed text-foreground/90 [&_a]:text-terminal [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:border [&_code]:border-border [&_code]:bg-surface [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono-plus [&_code]:text-[0.85em]"
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );
          case "code":
            return <CodeBlock key={i} lang={b.lang} code={b.code} />;
          case "image": {
            const normalizedSource = normalizeImageSource(b.src);
            if (normalizedSource && seenImageSources.has(normalizedSource)) {
              return null;
            }
            if (normalizedSource) seenImageSources.add(normalizedSource);

            return (
              <figure key={i} className="my-6">
                <img
                  src={b.src}
                  alt={b.alt || ""}
                  width={b.width}
                  height={b.height}
                  loading="lazy"
                  className="mx-auto rounded-md border border-border"
                />
                {b.caption ? (
                  <figcaption className="mt-2 text-center font-mono-plus text-xs text-muted-foreground">
                    {b.caption}
                  </figcaption>
                ) : null}
              </figure>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                className="my-6 border-l-2 border-terminal/50 bg-terminal/5 px-4 py-3 text-base italic text-foreground/90"
                dangerouslySetInnerHTML={{ __html: b.html }}
              />
            );
          case "list":
            return b.ordered ? (
              <ol key={i} className="my-4 ml-6 list-decimal space-y-1 text-foreground/90">
                {b.items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: it }} />
                ))}
              </ol>
            ) : (
              <ul key={i} className="my-4 ml-6 list-disc space-y-1 text-foreground/90">
                {b.items.map((it, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: it }} />
                ))}
              </ul>
            );
          case "embed":
            return <Embed key={i} provider={b.provider} url={b.url} />;
          case "hr":
            return <hr key={i} className="my-8 border-border" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
