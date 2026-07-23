import { Link } from "@tanstack/react-router";
import { Menu, PenLine, Send, X } from "lucide-react";
import { useState } from "react";
import profile from "@/data/profile.json";

const items = [
  { href: "/#about", label: "about" },
  { href: "/#writing", label: "writing" },
  { href: "/#experience", label: "experience" },
  { href: "/#skills", label: "skills" },
  { href: "/#contact", label: "contact" },
];

export function SiteMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative flex items-center gap-3">
      <nav className="hidden items-center gap-5 font-mono-plus text-xs text-muted-foreground md:flex">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="transition-colors hover:text-terminal">
            {item.label}
          </a>
        ))}
        <Link to="/blogs" className="transition-colors hover:text-terminal">
          blog
        </Link>
      </nav>
      <a
        href={profile.links.medium}
        target="_blank"
        rel="noreferrer noopener"
        className="hidden items-center gap-1.5 rounded border border-terminal/40 bg-terminal/5 px-3 py-1.5 font-mono-plus text-xs text-terminal transition-colors hover:bg-terminal/10 md:inline-flex"
      >
        <PenLine className="h-3.5 w-3.5" />
        medium
      </a>
      <a
        href={profile.links.telegram}
        target="_blank"
        rel="noreferrer noopener"
        className="hidden items-center gap-1.5 rounded border border-terminal/40 bg-terminal/5 px-3 py-1.5 font-mono-plus text-xs text-terminal transition-colors hover:bg-terminal/10 md:inline-flex"
      >
        <Send className="h-3.5 w-3.5" />
        telegram
      </a>
      <button
        type="button"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMobileMenuOpen((open) => !open)}
        className="inline-flex h-9 w-9 items-center justify-center rounded border border-border bg-surface text-terminal transition-colors hover:border-terminal/50 hover:bg-terminal/10 md:hidden"
      >
        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      {mobileMenuOpen ? (
        <nav
          id="mobile-navigation"
          className="absolute right-0 top-full mt-3 grid w-[min(20rem,calc(100vw-3rem))] grid-cols-2 gap-2 rounded-md border border-border bg-background/95 p-3 font-mono-plus text-sm text-muted-foreground shadow-xl backdrop-blur md:hidden"
        >
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className="rounded border border-border bg-surface px-3 py-2 transition-colors hover:border-terminal/50 hover:text-terminal"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/blogs"
            onClick={closeMobileMenu}
            className="rounded border border-border bg-surface px-3 py-2 transition-colors hover:border-terminal/50 hover:text-terminal"
          >
            blog
          </Link>
          <a
            href={profile.links.medium}
            target="_blank"
            rel="noreferrer noopener"
            onClick={closeMobileMenu}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-terminal/40 bg-terminal/5 px-3 py-2 text-terminal transition-colors hover:bg-terminal/10"
          >
            <PenLine className="h-3.5 w-3.5" />
            medium
          </a>
          <a
            href={profile.links.telegram}
            target="_blank"
            rel="noreferrer noopener"
            onClick={closeMobileMenu}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-terminal/40 bg-terminal/5 px-3 py-2 text-terminal transition-colors hover:bg-terminal/10"
          >
            <Send className="h-3.5 w-3.5" />
            telegram
          </a>
        </nav>
      ) : null}
    </div>
  );
}
