import { motion } from "framer-motion";
import { Globe2, MessageCircle, CalendarHeart, HeartHandshake } from "lucide-react";

const items = [
  { icon: Globe2, k: "18 countries", d: "Active chapters across the continent." },
  { icon: MessageCircle, k: "Always on", d: "A private builder community that ships." },
  { icon: CalendarHeart, k: "Weekly events", d: "Demos, AMAs, socials and study halls." },
  { icon: HeartHandshake, k: "Partner network", d: "VCs, corporates, universities, founders." },
];

export function Community() {
  return (
    <section id="community" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
              Community · ecosystem
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
              More than education. A movement.
            </h2>
            <p className="mt-5 text-[var(--ink-soft)]">
              SkillyMe Africa is a builder network — a continent of operators, founders and
              technologists working in public, helping each other compound, every day.
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((i, idx) => (
                <motion.div
                  key={i.k}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.45, delay: (idx % 2) * 0.08 }}
                  className="group rounded-2xl border border-black/5 bg-white p-6 transition-colors hover:border-black/10"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ink)] text-white transition-transform group-hover:scale-105">
                    <i.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="mt-5 font-display text-lg font-semibold text-[var(--ink)]">
                    {i.k}
                  </div>
                  <div className="mt-1.5 text-sm text-[var(--ink-soft)]">{i.d}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
