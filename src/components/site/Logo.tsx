export function Logo({ className = "", mark = true }: { className?: string; mark?: boolean }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-2.5 ${className}`}>
      {mark && (
        <img
          src="/logo.png"
          alt="SkillyMe Africa"
          className="h-9 w-auto object-contain"
        />
      )}
      <span className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink)]">
        SkillyMe<span className="text-[var(--cyan-accent)]">.</span>Africa
      </span>
    </a>
  );
}
