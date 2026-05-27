import { Counter } from "./Counter";

const stats = [
  { value: 12500, suffix: "+", label: "Learners trained" },
  { value: 340, suffix: "+", label: "Founders supported" },
  { value: 65, suffix: "+", label: "Startups incubated" },
  { value: 180, suffix: "+", label: "Workshops hosted" },
  { value: 18, label: "African countries" },
];

export function Stats() {
  return (
    <section className="relative border-y border-black/5 bg-white/50 py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-soft)]/70">
            The ecosystem in numbers
          </p>
          <p className="max-w-md text-sm text-[var(--ink-soft)]">
            Momentum built across the continent — and we're just getting started.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white p-6 sm:p-7">
              <div className="font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
                <Counter to={s.value} suffix={s.suffix ?? ""} />
              </div>
              <div className="mt-2 text-sm text-[var(--ink-soft)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
