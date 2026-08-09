import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { GitHubProject } from "@/lib/github";

export function ReadmeContent({ project }: { project: GitHubProject }) {
  const repositoryBase = `${project.githubUrl}/blob/${project.defaultBranch}/`;
  const rawBase = `https://raw.githubusercontent.com/mobintmu/${project.name}/${project.defaultBranch}/`;

  return (
    <div className="readme-content overflow-hidden rounded-lg border border-border bg-surface p-5 md:p-8">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mb-5 mt-2 border-b border-border pb-3 text-3xl font-semibold tracking-tight">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="mb-4 mt-10 border-b border-border pb-2 text-2xl font-semibold tracking-tight first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-3 mt-8 text-xl font-semibold tracking-tight">{children}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="mb-2 mt-6 text-base font-semibold text-terminal">{children}</h5>
          ),
          p: ({ children }) => (
            <p className="my-4 text-sm leading-7 text-muted-foreground md:text-base">{children}</p>
          ),
          a: ({ href = "", children }) => (
            <a
              href={resolveRepositoryUrl(href, repositoryBase)}
              target={href.startsWith("#") ? undefined : "_blank"}
              rel={href.startsWith("#") ? undefined : "noreferrer noopener"}
              className="text-terminal underline decoration-terminal/40 underline-offset-4 hover:decoration-terminal"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="my-4 ml-5 list-disc space-y-2 text-sm leading-7 text-muted-foreground md:text-base">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-5 list-decimal space-y-2 text-sm leading-7 text-muted-foreground md:text-base">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-2 border-terminal bg-terminal/5 px-5 py-1 italic">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-5 overflow-x-auto rounded-md border border-border bg-background p-4 font-mono-plus text-xs leading-6 text-foreground md:text-sm [&>code]:bg-transparent [&>code]:p-0">
              {children}
            </pre>
          ),
          code: ({ children }) => (
            <code className="rounded bg-background px-1.5 py-0.5 font-mono-plus text-[0.9em] text-foreground">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-terminal/10 text-terminal">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-r border-border p-3 font-medium">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-r border-border p-3 align-top text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-8 border-border" />,
          img: ({ src = "", alt = "" }) => (
            <img
              src={resolveImageUrl(src, rawBase)}
              alt={alt}
              loading="lazy"
              className="my-5 max-w-full rounded-md border border-border"
            />
          ),
        }}
      >
        {project.readme}
      </ReactMarkdown>
    </div>
  );
}

function resolveRepositoryUrl(url: string, base: string) {
  if (/^(https?:|mailto:|#)/i.test(url)) return url;
  return new URL(url.replace(/^\.\//, ""), base).toString();
}

function resolveImageUrl(url: string, base: string) {
  if (/^(https?:|data:)/i.test(url)) return url;
  return new URL(url.replace(/^\.\//, ""), base).toString();
}
