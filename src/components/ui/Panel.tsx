import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Panel({ title, eyebrow, children, className = "", action }: PanelProps) {
  return (
    <section
      className={`border border-white/10 bg-[#0a0f14]/90 shadow-[0_0_0_1px_rgba(80,255,190,0.04),0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur ${className}`}
    >
      {(title || eyebrow || action) && (
        <header className="flex min-h-11 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            {eyebrow && <p className="text-[10px] font-semibold uppercase text-cyan-200/70">{eyebrow}</p>}
            {title && (
              <h2 className="truncate text-sm font-semibold uppercase text-zinc-100">
                {title}
              </h2>
            )}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
