// frontend/src/components/CorporateActions.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Clock,
  Gift,
  Award,
  Briefcase,
} from 'lucide-react';
import { corporateAPI } from '../services/api';

/* ---------- RGV primitives (neon-noir, no rain) ---------- */

function RgvPanel({ children, className = '' }) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-2xl p-6',
        'border border-white/10',
        'shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.05)]',
        className,
      ].join(' ')}
      style={{
        background:
          'radial-gradient(140% 120% at 50% 70%, #0a0c0d 0%, #020303 55%, #000 100%)',
      }}
    >
      {/* neon ghosts */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-30">
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.38) 0%, transparent 70%)', // crimson
          }}
        />
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.28) 0%, transparent 70%)', // toxic green
          }}
        />
      </div>

      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 2px, transparent 3px)',
        }}
      />

      {/* grain */}
      <div className="pointer-events-none absolute inset-0 opacity-50 mix-blend-soft-light rgv-grain" />

      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      <div className="relative z-10">{children}</div>

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
        @keyframes rgvShimmer { 0% { transform: translateX(-120%);} 100% { transform: translateX(120%);} }
        .animate-rgv-shimmer { animation: rgvShimmer 3.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

function Kpi({ icon: Icon, value, label, color }) {
  const map = {
    yellow: {
      text: 'text-yellow-300',
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/10',
      tile: 'bg-yellow-500/15 border-yellow-500/30',
      glow: '0 10px 28px rgba(250,204,21,0.22)',
    },
    green: {
      text: 'text-green-300',
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
      tile: 'bg-green-500/15 border-green-500/30',
      glow: '0 10px 28px rgba(34,197,94,0.22)',
    },
    blue: {
      text: 'text-blue-300',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      tile: 'bg-blue-500/15 border-blue-500/30',
      glow: '0 10px 28px rgba(59,130,246,0.22)',
    },
  }[color];

  return (
    <div className={`rounded-xl p-4 border ${map.border} ${map.bg} shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg border ${map.tile} flex items-center justify-center`}
          style={{ boxShadow: map.glow }}
        >
          <Icon className={`w-5 h-5 ${map.text}`} />
        </div>
        <div>
          <div className={`text-2xl font-extrabold ${map.text}`}>{value}</div>
          <div className="text-[11px] tracking-wide uppercase text-gray-400">{label}</div>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
        active
          ? 'bg-white/10 text-white border border-white/20 shadow-[0_10px_30px_rgba(255,255,255,0.06)]'
          : 'bg-white/[0.04] hover:bg-white/10 text-gray-300 border border-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function TypePill({ type, status }) {
  const colors = getActionColor(type, status);
  return (
    <span
      className={[
        'text-xs px-2 py-1 rounded-md border',
        colors.bg,
        colors.text,
        colors.border,
        'shadow-[0_0_0_1px_rgba(255,255,255,0.05)]',
      ].join(' ')}
    >
      {status || type}
    </span>
  );
}

/* ---------- Visual helpers ---------- */

function getActionIcon(type) {
  const t = type?.toLowerCase() || '';
  if (t.includes('dividend')) return <Gift className="w-5 h-5" />;
  if (t.includes('split')) return <BarChart3 className="w-5 h-5" />;
  if (t.includes('earning')) return <Award className="w-5 h-5" />;
  return <Calendar className="w-5 h-5" />;
}

function getActionColor(type, status) {
  const t = (type || '').toLowerCase();
  if (status === 'Upcoming')
    return {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-300',
      iconBg: 'bg-yellow-500/20',
    };
  if (t.includes('dividend'))
    return {
      border: 'border-green-500/30',
      bg: 'bg-green-500/10',
      text: 'text-green-300',
      iconBg: 'bg-green-500/20',
    };
  if (t.includes('split'))
    return {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      iconBg: 'bg-blue-500/20',
    };
  if (t.includes('earning'))
    return {
      border: 'border-fuchsia-500/30',
      bg: 'bg-fuchsia-500/10',
      text: 'text-fuchsia-300',
      iconBg: 'bg-fuchsia-500/20',
    };
  return {
    border: 'border-gray-500/30',
    bg: 'bg-gray-500/10',
    text: 'text-gray-300',
    iconBg: 'bg-gray-500/20',
  };
}

/* ---------- Main Component (RGV-styled) ---------- */

export default function CorporateActions({ symbol, exchange = 'NSE' }) {
  const [actions, setActions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await corporateAPI.getActions(symbol, exchange);
        if (!mounted) return;
        setActions(res.data.actions);
      } catch (err) {
        console.error('Error loading corporate actions:', err);
        if (mounted) setError('Failed to load corporate actions');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [symbol, exchange]);

  const allActions = useMemo(
    () => [
      ...(actions?.dividends || []),
      ...(actions?.splits || []),
      ...(actions?.earnings || []),
      ...(actions?.upcoming_events || []),
    ],
    [actions]
  );

  const upcomingCount = actions?.upcoming_events?.length || 0;
  const dividendCount = actions?.dividends?.length || 0;
  const splitCount = actions?.splits?.length || 0;

  /* ---------- Loading / Error ---------- */

  if (loading) {
    return (
      <RgvPanel>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(255,255,255,0.04))',
              borderColor: 'rgba(236,72,153,0.35)',
              boxShadow: '0 10px 28px rgba(236,72,153,0.22)',
            }}
          >
            <Briefcase className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Corporate Actions</h4>
            <p className="text-xs text-gray-400">Fetching latest events…</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 border border-white/10 bg-white/5 animate-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            >
              <div className="h-4 bg-white/10 rounded w-2/3 mb-3" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </RgvPanel>
    );
  }

  if (error) {
    return (
      <RgvPanel>
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(255,255,255,0.04))',
              borderColor: 'rgba(236,72,153,0.35)',
              boxShadow: '0 10px 28px rgba(236,72,153,0.22)',
            }}
          >
            <Briefcase className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <h4 className="text-xl font-bold">Corporate Actions</h4>
            <p className="text-xs text-gray-400">We’ll try again shortly</p>
          </div>
        </div>
        <div className="text-center py-10 text-gray-400">{error}</div>
      </RgvPanel>
    );
  }

  /* ---------- Content ---------- */

  return (
    <RgvPanel>
      {/* header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl border flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(236,72,153,0.18), rgba(255,255,255,0.04))',
              borderColor: 'rgba(236,72,153,0.35)',
              boxShadow: '0 10px 28px rgba(236,72,153,0.22)',
            }}
          >
            <Briefcase className="w-6 h-6 text-pink-300" />
          </div>
          <div>
            <h4 className="text-xl font-bold tracking-tight">Corporate Actions</h4>
            <p className="text-xs text-gray-400">{allActions.length} total events</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          <span className="opacity-70">Symbol:</span>{' '}
          <span className="font-semibold">{symbol}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Kpi icon={Clock} value={upcomingCount} label="Upcoming" color="yellow" />
        <Kpi icon={Gift} value={dividendCount} label="Dividends" color="green" />
        <Kpi icon={BarChart3} value={splitCount} label="Splits" color="blue" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {['all', 'upcoming', 'dividends', 'splits', 'earnings'].map((tab) => (
          <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Tab>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {(activeTab === 'all' || activeTab === 'upcoming') && actions?.upcoming_events?.length > 0 && (
          <Section title="Upcoming Events" icon={<Clock className="w-4 h-4" />} accent="text-yellow-300">
            {actions.upcoming_events.map((event, i) => (
              <TimelineItem
                key={`up-${i}`}
                type={event.type}
                status={event.status}
                amount={event.amount}
                ratio={event.ratio}
                date={event.date}
              />
            ))}
          </Section>
        )}

        {(activeTab === 'all' || activeTab === 'dividends') && actions?.dividends?.length > 0 && (
          <Section title="Dividend History" icon={<Gift className="w-4 h-4" />} accent="text-green-300">
            {actions.dividends.map((d, i) => (
              <TimelineItem
                key={`div-${i}`}
                type={d.type || 'Dividend'}
                status={d.status}
                amount={d.amount}
                date={d.date}
                rightTop={`${new Date(d.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                rightBottom={d.relative_time}
              />
            ))}
          </Section>
        )}

        {(activeTab === 'all' || activeTab === 'splits') && actions?.splits?.length > 0 && (
          <Section title="Stock Split History" icon={<BarChart3 className="w-4 h-4" />} accent="text-blue-300">
            {actions.splits.map((s, i) => (
              <TimelineItem
                key={`spl-${i}`}
                type={s.type || 'Split'}
                status={s.status}
                ratio={s.ratio}
                date={s.date}
                rightTop={`${new Date(s.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`}
                rightBottom={s.relative_time}
              />
            ))}
          </Section>
        )}

        {(activeTab === 'all' || activeTab === 'earnings') && actions?.earnings?.length > 0 && (
          <Section title="Earnings Calendar" icon={<Award className="w-4 h-4" />} accent="text-fuchsia-300">
            {actions.earnings.map((e, i) => (
              <TimelineItem
                key={`ear-${i}`}
                type={e.type || 'Earnings'}
                status={e.status}
                date={e.date}
                leftTop={e.quarter}
                rightTop={`${new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`}
              />
            ))}
          </Section>
        )}

        {allActions.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No corporate actions available for {symbol}</p>
          </div>
        )}
      </div>
    </RgvPanel>
  );
}

/* ---------- Section & Timeline ---------- */

function Section({ title, icon, accent, children }) {
  return (
    <div className="mb-2">
      <div className={`text-sm font-semibold ${accent} mb-2 flex items-center gap-2`}>
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TimelineItem({ type, status, amount, ratio, date, leftTop, rightTop, rightBottom }) {
  const colors = getActionColor(type, status);
  const icon = getActionIcon(type);

  return (
    <div
      className={[
        'relative p-4 rounded-xl border transition-transform',
        colors.border,
        colors.bg,
        'hover:scale-[1.01] shadow-[0_16px_44px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06)]',
      ].join(' ')}
    >
      {/* neon orb */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-20"
        style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.28) 0%, transparent 70%)' }}
      />
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colors.iconBg} flex-shrink-0 border border-white/10`}>
          <div className={colors.text}>{icon}</div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h6 className="font-bold">{type}</h6>
                <TypePill type={type} status={status} />
              </div>

              {(amount || ratio || leftTop) && (
                <div className="mt-1 flex items-center gap-3 text-sm text-gray-300 flex-wrap">
                  {leftTop && <span className="font-medium text-fuchsia-300">{leftTop}</span>}
                  {typeof amount === 'number' && (
                    <span className="font-semibold text-green-300">₹{amount.toFixed(2)}</span>
                  )}
                  {ratio && <span className="font-semibold text-blue-300">{ratio}</span>}
                </div>
              )}

              {date && (
                <div className="mt-1 text-sm text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              {rightTop && <div className="text-sm text-gray-300">{rightTop}</div>}
              {rightBottom && <div className="text-xs text-gray-400">{rightBottom}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
