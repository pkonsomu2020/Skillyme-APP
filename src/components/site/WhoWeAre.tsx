import { motion } from "framer-motion";

export function WhoWeAre() {
  return (
    <section id="about" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
              Who we are
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
              An innovation ecosystem built for Africa's next decade.
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6 }}
              className="space-y-5 text-lg leading-relaxed text-[var(--ink-soft)]"
            >
              <p>
                SkillyMe Africa is not another online course platform. We are a builder ecosystem
                training, accelerating and connecting the founders, engineers and operators shaping
                modern Africa.
              </p>
              <p>
                We exist because the future of work, technology and entrepreneurship will be
                authored — not waited for. From AI fluency to startup execution, we equip African
                talent with the skills, networks and capital pathways needed to compete globally.
              </p>
              <div className="grid gap-4 pt-6 sm:grid-cols-2">
                {[
                  { k: "Practical", v: "Real-world execution, not theory." },
                  { k: "Selective", v: "High-trust, application-only cohorts." },
                  { k: "Pan-African", v: "Operating across 18 countries." },
                  { k: "Globally competitive", v: "Built to a world-class standard." },
                ].map((i) => (
                  <div
                    key={i.k}
                    className="rounded-xl border border-black/5 bg-white p-4 transition-colors hover:border-black/10"
                  >
                    <div className="text-sm font-semibold text-[var(--ink)]">{i.k}</div>
                    <div className="mt-1 text-sm text-[var(--ink-soft)]">{i.v}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
