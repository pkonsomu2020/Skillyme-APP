import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, Play } from "lucide-react";

const ecosystem = [
  "AI Education",
  "Founder Programs",
  "Startup Incubation",
  "Digital Skills",
  "Innovation Labs",
  "Mentorship",
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* background */}
      <div className="absolute inset-0 -z-10 bg-grid-soft mask-fade-b" />
      <div className="absolute -top-40 right-0 -z-10 h-[520px] w-[520px] rounded-full bg-[var(--cyan-accent)]/15 blur-3xl animate-float" />
      <div className="absolute -top-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full bg-[var(--red-accent)]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--ink-soft)] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[var(--cyan-accent)]" />
            Africa's premium AI & innovation ecosystem
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--ink)] text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            Building Africa's next generation of{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[var(--ink)] via-[var(--cyan-accent)] to-[var(--red-accent)] bg-clip-text text-transparent">
                innovators, founders
              </span>
            </span>{" "}
            & AI talent.
          </h1>

          <p className="mt-6 max-w-2xl text-base text-[var(--ink-soft)] sm:text-lg text-balance">
            We train, accelerate and back the African youth shaping the continent's next decade —
            through AI, entrepreneurship and practical digital skills built for the real world.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#apply"
              className="group inline-flex items-center gap-2 rounded-xl bg-[var(--ink)] px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-2xl hover:shadow-black/20"
            >
              Apply now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="#programs"
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-6 py-3.5 text-sm font-semibold text-[var(--ink)] backdrop-blur transition-colors hover:bg-white"
            >
              Explore programs
            </a>
            <a
              href="#community"
              className="inline-flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                <Play className="h-3 w-3 fill-current" />
              </span>
              Join the ecosystem
            </a>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium uppercase tracking-wider text-[var(--ink-soft)]/70">
            {ecosystem.map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[var(--cyan-accent)]" />
                {e}
              </span>
            ))}
          </div>
        </motion.div>

        {/* showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="relative rounded-3xl border border-black/5 bg-gradient-to-br from-[var(--ink)] to-[#0a0f1f] p-1 shadow-2xl">
            <div className="relative overflow-hidden rounded-[22px] bg-[#06090f] p-8 text-white sm:p-12">
              <div className="absolute inset-0 bg-grid-dark mask-fade-b opacity-50" />
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--cyan-accent)]/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[var(--red-accent)]/20 blur-3xl" />
              <div className="relative grid gap-8 sm:grid-cols-3">
                {[
                  { k: "Cohort 04", v: "Founder Forge", d: "Now accepting applications" },
                  { k: "Live", v: "AI Builder Lab", d: "Weekly hands-on sessions" },
                  { k: "2026", v: "Innovation Summit", d: "Lagos · Nairobi · Kigali" },
                ].map((c) => (
                  <div
                    key={c.v}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--cyan-accent)]">
                      {c.k}
                    </div>
                    <div className="mt-2 font-display text-xl font-semibold">{c.v}</div>
                    <div className="mt-1.5 text-sm text-white/60">{c.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
