import React, { useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* =========================
   RGV CANVAS DECOR PLUGINS
   ========================= */

// Dark urban gradient + scanlines + grain
const rgvBackground = {
  id: 'rgvBackground',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, top, right, bottom, width, height } = chartArea;

    // Murky urban gradient (noir)
    const g = ctx.createRadialGradient(
      left + width * 0.55,
      top + height * 0.65,
      10,
      right,
      bottom,
      Math.max(width, height)
    );
    g.addColorStop(0, 'rgba(10,12,13,0.95)');
    g.addColorStop(0.55, 'rgba(2,3,3,0.98)');
    g.addColorStop(1, 'rgba(0,0,0,1)');

    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(left, top, width, height);

    // Subtle scanlines
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let y = top; y <= bottom; y += 3) {
      ctx.beginPath();
      ctx.moveTo(left, y + 0.5);
      ctx.lineTo(right, y + 0.5);
      ctx.stroke();
    }

    // Faint grid (barely visible)
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    const grid = 34;
    for (let x = left; x <= right; x += grid) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, top);
      ctx.lineTo(x + 0.5, bottom);
      ctx.stroke();
    }
    for (let y = top; y <= bottom; y += grid) {
      ctx.beginPath();
      ctx.moveTo(left, y + 0.5);
      ctx.lineTo(right, y + 0.5);
      ctx.stroke();
    }

    // Grain (procedural noise pass)
    ctx.globalAlpha = 0.12;
    const step = 6;
    for (let y = top; y < bottom; y += step) {
      for (let x = left; x < right; x += step) {
        const n = (Math.random() * 10) | 0;
        ctx.fillStyle = `rgba(255,255,255,${(n / 200).toFixed(3)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.globalAlpha = 1;

    // Hard vignette
    const vGrad = ctx.createLinearGradient(0, top, 0, bottom);
    vGrad.addColorStop(0, 'rgba(0,0,0,0.25)');
    vGrad.addColorStop(0.15, 'rgba(0,0,0,0)');
    vGrad.addColorStop(0.85, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(left, top, width, height);

    ctx.restore();
  }
};

// Neon glow shadow under the line
const rgvLineGlow = {
  id: 'rgvLineGlow',
  beforeDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = 'rgba(34,197,94,0.35)'; // green neon glow
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  }
};

ChartJS.register(rgvBackground, rgvLineGlow);

export default function StockChart({ analysis, currentPrice, symbol }) {
  const labels = ['Current', 'Intraday', 'Weekly', 'Monthly', 'Long-term'];
  const values = [
    currentPrice,
    analysis.intraday.target,
    analysis.weekly.target,
    analysis.monthly.target,
    analysis.longterm.target
  ];

  // Crimson current point, toxic-green projections
  const pointBg = [
    'rgb(239,68,68)',   // red-500 (current)
    'rgb(34,197,94)',   // green-500
    'rgb(34,197,94)',
    'rgb(34,197,94)',
    'rgb(34,197,94)'
  ];

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: 'Price Analysis',
        data: values,
        borderColor: 'rgba(34,197,94,0.95)', // neon green
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return 'rgba(34,197,94,0.10)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(34,197,94,0.22)');
          g.addColorStop(1, 'rgba(34,197,94,0.05)');
          return g;
        },
        tension: 0.35,
        fill: true,
        borderWidth: 2.5,
        pointRadius: [7, 5, 5, 5, 5],
        pointHoverRadius: [9, 7, 7, 7, 7],
        pointBackgroundColor: pointBg,
        pointBorderColor: ['#0b0d0e', '#0b0d0e', '#0b0d0e', '#0b0d0e', '#0b0d0e'],
        pointBorderWidth: 2,
        segment: {
          // solid from current to next, then dashed projections
          borderDash: (ctx) => (ctx.p0DataIndex < 1 ? [] : [6, 6]),
          borderColor: (ctx) =>
            ctx.p0DataIndex < 1 ? 'rgba(34,197,94,0.95)' : 'rgba(34,197,94,0.85)'
        }
      }
    ]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [currentPrice, analysis]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `${symbol} — AI Price Trajectory`,
        color: '#e5e7eb',
        font: { size: 16, weight: 'bold' },
        padding: { top: 8, bottom: 12 }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(239,68,68,0.6)', // crimson edge
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            const delta = v - currentPrice;
            const pct = currentPrice ? (delta / currentPrice) * 100 : 0;
            const sign = delta >= 0 ? '+' : '';
            return ` ₹${v.toFixed(2)}   (${sign}${delta.toFixed(2)}, ${sign}${pct.toFixed(2)}%)`;
          }
        }
      }
    },
    elements: {
      point: { hoverBorderWidth: 2 },
      line: { capBezierPoints: true }
    },
    scales: {
      y: {
        ticks: {
          color: '#9ca3af',
          padding: 8,
          callback: (value) => '₹' + Number(value).toFixed(0)
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
          drawBorder: false
        }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: {
          color: 'rgba(255,255,255,0.06)',
          drawBorder: false
        }
      }
    },
    animation: { duration: 600 }
  }), [symbol, currentPrice]);

  // Crimson baseline at current price
  const baselineRef = useRef({
    id: 'rgvBaseline',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const y = scales.y.getPixelForValue(currentPrice);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(239,68,68,0.8)'; // red-500
      ctx.moveTo(chartArea.left, y);
      ctx.lineTo(chartArea.right, y);
      ctx.stroke();

      // Label
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(239,68,68,0.95)';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      const label = `Current ₹${Number(currentPrice || 0).toFixed(2)}`;
      ctx.fillText(label, chartArea.right - Math.max(140, ctx.measureText(label).width + 12), y - 6);
      ctx.restore();
    }
  });

  return (
    <div className="h-80 rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <Line data={data} options={options} plugins={[baselineRef.current]} />
    </div>
  );
}
