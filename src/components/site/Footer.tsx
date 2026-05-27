import { Logo } from "./Logo";
import { Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-8">
          <div className="flex flex-col items-start text-left max-w-sm">
            <Logo />
            <p className="mt-5 text-sm text-[var(--ink-soft)] text-balance">
              Africa's premium AI, innovation and founder ecosystem — training, accelerating and
              connecting the builders shaping our future.
            </p>
          </div>

          <div className="flex flex-col items-start text-left text-sm text-[var(--ink-soft)] gap-3">
            <h4 className="font-semibold text-[var(--ink)]">Contact Us</h4>
            <a href="mailto:info@skillyme.africa" className="flex items-center gap-2 hover:text-[var(--ink)] transition-colors">
              <span className="text-base">📧</span> info@skillyme.africa
            </a>
            <a href="tel:+254745266526" className="flex items-center gap-2 hover:text-[var(--ink)] transition-colors">
              <span className="text-base">📞</span> +254 745 266526
            </a>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span> Nairobi, Kenya
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <h4 className="font-semibold text-[var(--ink)] text-sm">Follow Us</h4>
            <div className="flex items-center gap-2">
              {[Twitter, Linkedin, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 text-[var(--ink-soft)] transition-colors hover:border-black/20 hover:text-[var(--ink)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-black/5 pt-8 text-xs text-[var(--ink-soft)] sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} SkillyMe Africa. Built for the continent.</div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-[var(--ink)]">Privacy</a>
            <a href="#" className="hover:text-[var(--ink)]">Terms</a>
            <a href="#" className="hover:text-[var(--ink)]">Code of conduct</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
