import { motion } from "framer-motion";
import { Compass, Telescope } from "lucide-react";

const cards = [
  {
    icon: Compass,
    tag: "Mission",
    title: "Empower African youth through AI, innovation & entrepreneurship.",
    body: "We equip the next generation with practical digital skills, founder mindsets and the AI fluency required to build for Africa and the world.",
    accent: "from-[var(--cyan-accent)]/30 to-transparent",
  },
  {
    icon: Telescope,
    tag: "Vision",
    title: "A globally competitive generation of African technology leaders.",
    body: "A continent where world-class founders, engineers and operators are not the exception — they are the standard.",
    accent: "from-[var(--red-accent)]/25 to-transparent",
  },
];

export function MissionVision() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
            Mission & vision
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
            Why we build, every day.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {cards.map((c, i) => (
            <motion.div
              key={c.tag}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-8 transition-all hover:border-black/10 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)] sm:p-10"
            >
              <div
                className={`pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br ${c.accent} blur-3xl opacity-70`}
              />
              <div className="relative">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ink)] text-white">
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cyan-accent)]">
                  {c.tag}
                </div>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-snug tracking-tight text-[var(--ink)] sm:text-3xl text-balance">
                  {c.title}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink-soft)]">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
