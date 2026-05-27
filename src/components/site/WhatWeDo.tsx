import { motion } from "framer-motion";
import {
  Cpu,
  Rocket,
  Trophy,
  Lightbulb,
  Users,
  Briefcase,
  GraduationCap,
  Code2,
  ArrowUpRight,
} from "lucide-react";

const services = [
  { icon: Cpu, title: "AI & Tech Training", body: "Hands-on AI, data and engineering programs designed for real-world deployment." },
  { icon: Rocket, title: "Startup Acceleration", body: "Capital-readiness, GTM and product sprints with operators who've built it before." },
  { icon: Trophy, title: "Founder Programs", body: "Selective cohorts that forge ambitious founders into investable operators." },
  { icon: Lightbulb, title: "Innovation Workshops", body: "Intensive sessions where teams ship prototypes, products and proofs." },
  { icon: Users, title: "Community & Networking", body: "An active pan-African network of builders, mentors and capital partners." },
  { icon: Briefcase, title: "Career Development", body: "Pathways into the most ambitious teams across Africa and globally." },
  { icon: GraduationCap, title: "Mentorship", body: "1:1 access to senior founders, investors and technologists across the continent." },
  { icon: Code2, title: "Digital Skills", body: "Modern, practical fundamentals — from software to design to product." },
];

export function WhatWeDo() {
  return (
    <section id="what" className="relative bg-[var(--secondary)]/40 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
              What we do
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
              The full stack for African builders.
            </h2>
          </div>
          <p className="max-w-md text-[var(--ink-soft)]">
            From first principles to first round — everything you need to learn, build and scale,
            wrapped in one premium ecosystem.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <motion.a
              key={s.title}
              href="#programs"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.05 }}
              className="group relative bg-white p-7 transition-all hover:bg-gradient-to-br hover:from-white hover:to-[var(--cyan-accent)]/[0.06]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white text-[var(--ink)] transition-all group-hover:border-[var(--cyan-accent)]/40 group-hover:text-[var(--cyan-accent)] group-hover:shadow-[0_8px_24px_-8px_rgba(56,189,248,0.4)]">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold tracking-tight text-[var(--ink)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{s.body}</p>
              <ArrowUpRight className="absolute right-6 top-6 h-4 w-4 text-[var(--ink-soft)]/30 transition-all group-hover:text-[var(--cyan-accent)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
