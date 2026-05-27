import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const programs = [
  {
    name: "Founder Forge",
    tag: "Flagship · 12 weeks",
    body: "Our flagship founder accelerator. Build, ship and raise alongside a hand-picked cohort and world-class mentors.",
    highlight: true,
  },
  {
    name: "AI Programs",
    tag: "Cohort · 8 weeks",
    body: "Practical AI fluency for builders: agents, retrieval, evals and production deployment.",
  },
  {
    name: "Startup Bootcamps",
    tag: "Intensive · 4 weeks",
    body: "Zero-to-MVP sprints designed to take an idea into a working product with first users.",
  },
  {
    name: "Innovation Challenges",
    tag: "Quarterly",
    body: "Pan-African challenges sponsored by partners — prizes, mentorship and capital pathways.",
  },
  {
    name: "Community Initiatives",
    tag: "Always-on",
    body: "Local chapters, meetups, builder weekends and partner events across 18 countries.",
  },
];

export function Programs() {
  return (
    <section id="programs" className="relative bg-[var(--secondary)]/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
              Programs & initiatives
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
              Choose your path. Build your future.
            </h2>
          </div>
          <a
            href="#apply"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-black/[0.03]"
          >
            View all programs <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {programs.map((p, i) => (
            <motion.a
              key={p.name}
              href="#apply"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07 }}
              className={`group relative overflow-hidden rounded-3xl border p-8 transition-all hover:-translate-y-0.5 ${
                p.highlight
                  ? "border-transparent bg-gradient-to-br from-[var(--ink)] to-[#0a0f1f] text-white lg:col-span-2 lg:row-span-2"
                  : "border-black/5 bg-white text-[var(--ink)] hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)]"
              }`}
            >
              {p.highlight && (
                <>
                  <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[var(--cyan-accent)]/25 blur-3xl" />
                  <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--red-accent)]/15 blur-3xl" />
                </>
              )}
              <div className="relative flex h-full flex-col">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                    p.highlight ? "text-[var(--cyan-accent)]" : "text-[var(--ink-soft)]/70"
                  }`}
                >
                  {p.tag}
                </div>
                <h3
                  className={`mt-3 font-display font-bold tracking-tight text-balance ${
                    p.highlight ? "text-3xl sm:text-4xl" : "text-2xl"
                  }`}
                >
                  {p.name}
                </h3>
                <p
                  className={`mt-3 max-w-md text-[15px] leading-relaxed ${
                    p.highlight ? "text-white/70" : "text-[var(--ink-soft)]"
                  }`}
                >
                  {p.body}
                </p>
                <div
                  className={`mt-auto pt-8 inline-flex items-center gap-1.5 text-sm font-semibold ${
                    p.highlight ? "text-white" : "text-[var(--ink)]"
                  }`}
                >
                  Learn more
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
