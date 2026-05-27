import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const links = [
  { label: "Programs", href: "#programs" },
  { label: "What We Do", href: "#what" },
  { label: "Impact", href: "#impact" },
  { label: "Community", href: "#community" },
  { label: "About", href: "#about" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2.5" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between rounded-2xl border px-4 sm:px-5 transition-all duration-500 ${
            scrolled
              ? "border-black/5 bg-white/80 py-2.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] backdrop-blur-xl"
              : "border-transparent bg-transparent py-3"
          }`}
        >
          <Logo />
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--ink-soft)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <button
            onClick={() => setOpen((o) => !o)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white/60 text-[var(--ink)]"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden mt-2 rounded-2xl border border-black/5 bg-white/95 p-3 shadow-xl backdrop-blur-xl">
            <nav className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:bg-black/5"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
