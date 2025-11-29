import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from 'lucide-react';

/* ----------
   Helpers
---------- */

const getIST = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

const computeMarketStatus = () => {
  const t = getIST();
  const day = t.getDay(); // 0 Sun, 6 Sat
  const mins = t.getHours() * 60 + t.getMinutes();
  const open = 9 * 60 + 15;   // 09:15
  const close = 15 * 60 + 30; // 15:30
  const isWeekend = day === 0 || day === 6;
  const isOpen = !isWeekend && mins >= open && mins <= close;
  return isOpen ? 'Open' : 'Closed';
};

const formatINR = (num) =>
  (Number(num) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------------
   RGV Card Shell (no rain)
--------------- */

function RgvShell({ children }) {
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.04)]"
      style={{
        background: 'radial-gradient(140% 120% at 50% 70%, #0a0c0d 0%, #020303 55%, #000 100%)',
      }}
    >
      {/* Neon ghosts */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-30">
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.40) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -inset-1 blur-2xl"
          style={{
            background:
              'radial-gradient(60% 60% at 35% 70%, rgba(34,197,94,0.32) 0%, transparent 70%)',
          }}
        />
      </div>
      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 2px, transparent 3px)',
        }}
      />
      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-55 mix-blend-soft-light rgv-grain" />
      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      {/* Content */}
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
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
      `}</style>
    </div>
  );
}

/* -----------------
   RGV Market Cards
----------------- */

const NolanMarketCards = () => {
  const [marketData, setMarketData] = useState({
    status: computeMarketStatus(),
    nifty: { value: 0, change: 0, changePercent: 0 },
    sensex: { value: 0, change: 0, changePercent: 0 },
  });
  const [dataAge, setDataAge] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ ADDED: Loading state

  const isMarketOpen = marketData.status === 'Open';
  const refreshRef = useRef(null);

  const fetchMarketData = async () => {
    try {
      setIsUpdating(true);

      // NIFTY & SENSEX via Yahoo
      const [niftyRes, sensexRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?interval=1d&range=1d'),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?interval=1d&range=1d'),
      ]);

      const [niftyData, sensexData] = await Promise.all([niftyRes.json(), sensexRes.json()]);

      const nMeta = niftyData?.chart?.result?.[0]?.meta;
      const sMeta = sensexData?.chart?.result?.[0]?.meta;

      const nPrice = (nMeta?.regularMarketPrice ?? nMeta?.previousClose) ?? 0;
      const nPrev = (nMeta?.previousClose ?? nMeta?.chartPreviousClose) ?? nPrice;
      const sPrice = (sMeta?.regularMarketPrice ?? sMeta?.previousClose) ?? 0;
      const sPrev = (sMeta?.previousClose ?? sMeta?.chartPreviousClose) ?? sPrice;

      const nChg = nPrice - nPrev;
      const nPct = nPrev ? (nChg / nPrev) * 100 : 0;
      const sChg = sPrice - sPrev;
      const sPct = sPrev ? (sChg / sPrev) * 100 : 0;

      const statusNow = computeMarketStatus();

      setMarketData({
        status: statusNow,
        nifty: { value: nPrice, change: nChg, changePercent: nPct },
        sensex: { value: sPrice, change: sChg, changePercent: sPct },
      });

      setDataAge(0);
    } catch (err) {
      console.error('Fetch failed, trying backend fallback…', err);
      try {
        const r = await fetch('http://localhost:5000/api/market/live');
        const j = await r.json();
        setMarketData({
          status: j.status || computeMarketStatus(),
          nifty: j.nifty || { value: 0, change: 0, changePercent: 0 },
          sensex: j.sensex || { value: 0, change: 0, changePercent: 0 },
        });
        setDataAge(0);
      } catch (err2) {
        console.error('Backend fallback failed:', err2);
        // keep prior data; just stop spinner
      }
    } finally {
      setIsUpdating(false);
      setIsLoading(false); // ✅ ADDED: Stop loading when done
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMarketData();
  }, []);

  // Data age ticker
  useEffect(() => {
    const age = setInterval(() => setDataAge((p) => p + 1), 1000);
    return () => clearInterval(age);
  }, []);

  // ✅ UPDATED: Real-time refresh policy:
  // - Open: 3 seconds (ultra real-time)
  // - Closed: 30 seconds (frequent status checks)
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);

    const intervalMs = isMarketOpen ? 3_000 : 30_000; // 3s when open, 30s when closed
    refreshRef.current = setInterval(() => {
      fetchMarketData();
    }, intervalMs);

    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [isMarketOpen]);

  const MarketCard = ({ title, value, change, changePercent, icon: Icon, neon = '239,68,68' }) => {
    const isPositive = change >= 0;

    // ✅ ADDED: Show loading state
    if (isLoading) {
      return (
        <RgvShell>
          <div className="relative">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[13px] uppercase tracking-[1px] text-gray-400/80 mb-2">{title}</div>
                <div className="text-white text-[36px] font-bold leading-[1.2] tracking-[-.02em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] animate-pulse">
                  --
                </div>
              </div>
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center border animate-pulse"
                style={{
                  background: `rgba(${neon}, 0.1)`,
                  borderColor: `rgba(${neon}, 0.2)`,
                }}
              >
                <Loader2 size={28} className="animate-spin" style={{ color: `rgb(${neon})` }} />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border animate-pulse"
                style={{
                  background: 'rgba(100,100,100,0.12)',
                  borderColor: 'rgba(100,100,100,0.32)',
                }}
              >
                <div className="w-4 h-4 bg-gray-500 rounded"></div>
                <span className="font-semibold text-[15px] font-mono text-gray-500">
                  --%
                </span>
              </div>
              <div className="text-[13px] text-gray-400/80 font-medium font-mono animate-pulse">
                --
              </div>
            </div>
          </div>
        </RgvShell>
      );
    }

    return (
      <RgvShell>
        <div className="relative">
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="text-[13px] uppercase tracking-[1px] text-gray-400/80 mb-2">{title}</div>
              <div className="text-white text-[36px] font-bold leading-[1.2] tracking-[-.02em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {formatINR(value)}
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border"
              style={{
                background: `linear-gradient(135deg, rgba(${neon}, 0.15) 0%, rgba(${neon}, 0.05) 100%)`,
                borderColor: `rgba(${neon}, 0.28)`,
                boxShadow: `0 10px 28px rgba(${neon}, 0.18)`,
              }}
              title={title}
            >
              <Icon size={28} style={{ color: `rgb(${neon})`, filter: `drop-shadow(0 0 8px rgba(${neon}, 0.6))` }} />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border"
              style={{
                background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                borderColor: isPositive ? 'rgba(34,197,94,0.32)' : 'rgba(239,68,68,0.32)',
              }}
            >
              {isPositive ? (
                <TrendingUp size={16} style={{ color: '#22c55e' }} />
              ) : (
                <TrendingDown size={16} style={{ color: '#ef4444' }} />
              )}
              <span
                className="font-semibold text-[15px] font-mono"
                style={{ color: isPositive ? '#22c55e' : '#ef4444' }}
              >
                {isPositive ? '+' : ''}
                {(Number(changePercent) || 0).toFixed(2)}%
              </span>
            </div>
            <div className="text-[13px] text-gray-400/80 font-medium font-mono">
              {isPositive ? '+' : ''}
              {(Number(change) || 0).toFixed(2)}
            </div>

            {isUpdating && (
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-400/80 font-medium">
                <span className="inline-block w-[6px] h-[6px] rounded-full bg-green-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                updating
              </div>
            )}
          </div>
        </div>
      </RgvShell>
    );
  };

  const StatusCard = () => {
    const isOpen = isMarketOpen;

    // ✅ ADDED: Show loading state
    if (isLoading) {
      return (
        <RgvShell>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] uppercase tracking-[1px] text-gray-400/80 mb-2">Market Status</div>
              <div className="text-[36px] font-bold animate-pulse text-gray-500">
                --
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border animate-pulse"
              style={{
                background: 'rgba(100,100,100,0.1)',
                borderColor: 'rgba(100,100,100,0.2)',
              }}
            >
              <Loader2 size={28} className="animate-spin text-gray-500" />
            </div>
          </div>
          <div className="mt-4 text-[12px] text-gray-400/70 font-mono animate-pulse">Loading...</div>
        </RgvShell>
      );
    }

    return (
      <RgvShell>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] uppercase tracking-[1px] text-gray-400/80 mb-2">Market Status</div>
            <div
              className="text-[36px] font-bold"
              style={{
                color: isOpen ? '#22c55e' : '#ef4444',
                textShadow: isOpen ? '0 0 20px rgba(34,197,94,0.4)' : '0 0 20px rgba(239,68,68,0.4)',
              }}
            >
              {marketData.status}
            </div>
          </div>
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center border"
            style={{
              background: isOpen
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)'
                : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
              borderColor: isOpen ? 'rgba(34,197,94,0.32)' : 'rgba(239,68,68,0.32)',
              boxShadow: isOpen ? '0 10px 28px rgba(34,197,94,0.18)' : '0 10px 28px rgba(239,68,68,0.18)',
            }}
          >
            <TrendingUp size={28} style={{ color: isOpen ? '#22c55e' : '#ef4444' }} />
          </div>
        </div>
        <div className="mt-4 text-[12px] text-gray-400/70 font-mono">Updated {dataAge}s ago</div>
        <div className="mt-1 text-[11px] text-gray-500/80">
          Refresh: {isOpen ? 'every 3s (live)' : 'every 30s (status check)'}
        </div>
      </RgvShell>
    );
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <StatusCard />

      <MarketCard
        title="NIFTY 50"
        value={marketData.nifty.value}
        change={marketData.nifty.change}
        changePercent={marketData.nifty.changePercent}
        icon={BarChart3}
        neon="239,68,68" // red
      />

      <MarketCard
        title="SENSEX"
        value={marketData.sensex.value}
        change={marketData.sensex.change}
        changePercent={marketData.sensex.changePercent}
        icon={Activity}
        neon="34,197,94" // green
      />
    </div>
  );
};

export default NolanMarketCards;