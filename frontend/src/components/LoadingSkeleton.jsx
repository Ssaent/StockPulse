import React from 'react';

/**
 * RGV-style base card shell: murky urban gradient, hard rim, scanlines,
 * rain streaks, neon ghosts (red/green), and gritty grain.
 */
function RgvShell({ className = '', children }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        // murky urban gradient
        'bg-[radial-gradient(140%_120%_at_50%_70%,#0a0c0d_0%,#020303_55%,#000_100%)]',
        // hard contrast rim + deep shadow
        'border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]',
        className,
      ].join(' ')}
    >
      {/* neon ghosts */}
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-screen">
        <div className="absolute -inset-1 blur-2xl"
             style={{ background: 'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.38) 0%, transparent 70%)' }} />
        <div className="absolute -inset-1 blur-2xl"
             style={{ background: 'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.30) 0%, transparent 70%)' }} />
      </div>

      {/* scanlines */}
      <div className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
           style={{ backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 2px, transparent 3px)` }} />

      {/* grain */}
      <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-soft-light rgv-grain" />

      {/* rain streaks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-[-20px] w-[2px] bg-gradient-to-b from-transparent to-[rgba(180,255,200,0.55)]"
            style={{
              left: `${Math.random() * 100}%`,
              height: `${18 + Math.random() * 22}px`,
              filter: 'blur(0.3px)',
              opacity: 0.22 + Math.random() * 0.38,
              animation: `rgvRain ${1.2 + Math.random() * 1.8}s linear ${Math.random() * 1.5}s infinite`,
            }}
          />
        ))}
      </div>

      {/* vignette */}
      <div className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)' }} />

      {/* content */}
      <div className="relative z-10">{children}</div>

      {/* local assets */}
      <style>{`
        .rgv-grain {
          background-image: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>\
<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter>\
<rect width='100%' height='100%' filter='url(%23n)' opacity='0.06'/></svg>");
          background-size: 180px 180px;
          animation: rgvGrain 9s linear infinite;
        }
        @keyframes rgvGrain { 0% { transform: translate(0,0) } 100% { transform: translate(-80px,-60px) } }
        @keyframes rgvRain { 0% { transform: translateY(-20px) translateX(0) } 100% { transform: translateY(110vh) translateX(-6px) } }
      `}</style>
    </div>
  );
}

/** A single shimmering line (RGV harsher pulse) */
function Line({ w = 'w-full', h = 'h-4', mb = 'mb-3', rounded = 'rounded-md' }) {
  return (
    <div
      className={[
        w,
        h,
        mb,
        rounded,
        'bg-white/10',
        'animate-rgv-pulse',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
      ].join(' ')}
    />
  );
}

/** Small chip placeholder (for mini pills/tags) */
function Chip({ w = 'w-24' }) {
  return (
    <div
      className={[
        w,
        'h-6',
        'rounded-md',
        'bg-[rgba(225,29,72,0.16)]',
        'border',
        'border-[rgba(225,29,72,0.30)]',
        'shadow-[0_0_0_1px_rgba(225,29,72,0.15),inset_0_1px_0_rgba(255,255,255,0.05)]',
        'animate-rgv-pulse-slow',
      ].join(' ')}
    />
  );
}

export function CardSkeleton() {
  return (
    <RgvShell className="min-h-[120px]">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <Line w="w-1/4" h="h-3.5" mb="mb-4" />
          <Line w="w-1/2" h="h-8" mb="mb-2" rounded="rounded-lg" />
          <Line w="w-3/4" />
        </div>
        {/* Icon tile placeholder with gritty glow */}
        <div className="shrink-0 w-14 h-14 rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_10px_34px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.08)] animate-rgv-float" />
      </div>
    </RgvShell>
  );
}

export function StockAnalysisSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header card */}
      <RgvShell className="min-h-[120px]">
        <div className="flex justify-between gap-8">
          <div className="flex-1">
            <Line w="w-40" h="h-6" mb="mb-3" rounded="rounded-lg" />
            <Line w="w-56" h="h-4" rounded="rounded-md" />
          </div>
          <div className="text-right">
            <Line w="w-28" h="h-8" mb="mb-2" rounded="rounded-lg" />
            <Line w="w-16" h="h-6" rounded="rounded-md" />
          </div>
        </div>
        {/* Sub chips */}
        <div className="mt-5 flex items-center gap-3">
          <Chip w="w-24" />
          <Chip w="w-20" />
          <Chip w="w-28" />
        </div>
      </RgvShell>

      {/* Four metric cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <RgvShell key={i} className="min-h-[120px]">
            <Line w="w-24" h="h-3.5" mb="mb-4" />
            <Line w="w-32" h="h-7" mb="mb-3" rounded="rounded-lg" />
            <Line w="w-2/3" h="h-3.5" />
          </RgvShell>
        ))}
      </div>

      {/* Big chart/section card */}
      <RgvShell className="min-h-[180px]">
        <Line w="w-32" h="h-4" mb="mb-4" rounded="rounded-lg" />
        <div className="h-36 w-full rounded-xl bg-white/5 overflow-hidden relative">
          {/* Faux chart brutal bars */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-2 p-3">
            {Array.from({ length: 24 }).map((_, idx) => (
              <div
                key={idx}
                className="w-3 bg-white/10 rounded-sm animate-rgv-scan"
                style={{
                  height: `${Math.floor(20 + Math.random() * 80)}%`,
                  animationDelay: `${idx * 70}ms`,
                }}
              />
            ))}
          </div>
          {/* top grime sheen */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </RgvShell>

      {/* Local keyframes (self-contained) */}
      <style>{`
        @keyframes rgvPulse {
          0%,100% { opacity: 0.40; }
          50%     { opacity: 0.95; }
        }
        .animate-rgv-pulse { animation: rgvPulse 1.1s ease-in-out infinite; }
        .animate-rgv-pulse-slow { animation: rgvPulse 2s ease-in-out infinite; }

        @keyframes rgvFloat {
          0%,100% { transform: translateY(0) rotate(-1.2deg) }
          50%     { transform: translateY(-3px) rotate(-1.8deg) }
        }
        .animate-rgv-float { animation: rgvFloat 2.8s ease-in-out infinite; }

        @keyframes rgvScan {
          0%   { filter: brightness(0.85) saturate(0.9); }
          40%  { filter: brightness(1.05) saturate(1); }
          100% { filter: brightness(0.85) saturate(0.9); }
        }
        .animate-rgv-scan { animation: rgvScan 1.8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
