import { motion } from "framer-motion";
import { Counter } from "./Counter";

const blocks = [
  { v: 42, s: "+", k: "Programs launched", d: "Across AI, founders, engineering & product." },
  { v: 340, s: "+", k: "Founders empowered", d: "From idea-stage to revenue-generating teams." },
  { v: 210, s: "+", k: "Projects built", d: "Real products shipped during cohort sprints." },
  { v: 24, s: "+", k: "Hackathons", d: "Continent-wide, partner-backed builder weekends." },
  { v: 180, s: "+", k: "Workshops", d: "Live, hands-on sessions with senior operators." },
  { v: 35, s: "+", k: "Partnerships", d: "Universities, corporates, VCs and ecosystems." },
];

export function Impact() {
  return (
    <section id="impact" className="relative overflow-hidden bg-[#06090f] py-24 text-white sm:py-32">
      <div className="absolute inset-0 bg-grid-dark mask-fade-b opacity-60" />
      <div className="absolute -top-20 right-1/4 h-96 w-96 rounded-full bg-[var(--cyan-accent)]/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[var(--red-accent)]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
              Impact · what we've done
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl text-balance">
              Momentum you can measure.
            </h2>
            <p className="mt-5 max-w-md text-white/60">
              We don't just teach — we ship, fund, connect and grow. Every metric below is the
              result of operators, founders and a community executing in public.
            </p>
            <a
              href="#programs"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition-transform hover:scale-[1.02]"
            >
              See our programs
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {blocks.map((b, i) => (
                <motion.div
                  key={b.k}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
                  className="bg-[#06090f] p-6"
                >
                  <div className="font-display text-3xl font-extrabold tracking-tight">
                    <Counter to={b.v} suffix={b.s} />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{b.k}</div>
                  <div className="mt-1.5 text-xs leading-relaxed text-white/50">{b.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
