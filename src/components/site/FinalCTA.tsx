import { ArrowUpRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="apply" className="relative px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-gradient-to-br from-[var(--ink)] via-[#0a0f1f] to-[#06090f] px-6 py-16 text-white sm:px-12 sm:py-24">
          <div className="absolute inset-0 bg-grid-dark mask-fade-b opacity-50" />
          <div className="absolute -top-24 right-10 h-80 w-80 rounded-full bg-[var(--cyan-accent)]/25 blur-3xl animate-float" />
          <div className="absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-[var(--red-accent)]/20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cyan-accent)]">
              The opportunity
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Join the builders shaping Africa's future.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-white/70">
              Applications are open for our next cohort. If you're ambitious, curious and ready to
              build — we want to meet you.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#apply"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--ink)] transition-transform hover:scale-[1.02]"
              >
                Apply now
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#community"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                Join community
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
