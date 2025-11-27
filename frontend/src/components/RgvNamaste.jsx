/**
 * ===============================================
 * RGV (Ram Gopal Varma) INSPIRED NAMASTE SCREEN
 * ===============================================
 *
 * Motifs:
 * - Handheld camera shake / Dutch angles
 * - Neon-noir reds & sickly greens
 * - Rain-streaked lens + grime
 * - Flicker, scanlines, CCTV vibe
 * - Glitch typography + urban hum
 *
 * Stages (same as your original):
 * void -> emerging -> reveal -> climax -> collapse -> complete
 */

import React, { useEffect, useRef, useState } from 'react';

const RgvNamaste = ({ onComplete }) => {
  const [stage, setStage] = useState('void');
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(22);
  const [glow, setGlow] = useState(0.2);
  const containerRef = useRef(null);

  useEffect(() => {
    console.log('🎬 RGV Namaste animation started');
    console.log('📞 onComplete callback:', onComplete ? 'Present ✅' : 'Missing ❌');

    // Stage timings mirror your Nolan version (total ~6s)
    // 0–500ms: Void
    const t0 = setTimeout(() => {
      console.log('Stage: void');
      setStage('void');
    }, 0);

    // 500–2000ms: Emerging — neon flicker starts, camera wakes
    const t1 = setTimeout(() => {
      console.log('Stage: emerging');
      setStage('emerging');
      setOpacity(0.35);
      setScale(1.25);
    }, 500);

    // 2000–3500ms: Reveal — letters lock in with glitch
    const t2 = setTimeout(() => {
      console.log('Stage: reveal');
      setStage('reveal');
      setOpacity(1);
      setScale(1);
      setLetterSpacing(6);
      setGlow(0.65);
    }, 2000);

    // 3500–5000ms: Climax — hard flicker, heavy shake, neon blast
    const t3 = setTimeout(() => {
      console.log('Stage: climax');
      setStage('climax');
      setGlow(1.15);
    }, 3500);

    // 5000–6000ms: Collapse — lights die, rain remains
    const t4 = setTimeout(() => {
      console.log('Stage: collapse');
      setStage('collapse');
      setOpacity(0);
      setScale(0.82);
      setLetterSpacing(0);
      setGlow(0.15);
    }, 5000);

    // 6000ms: Complete
    const t5 = setTimeout(() => {
      console.log('✅ Animation complete!');
      console.log('📞 Calling onComplete...');
      if (onComplete) {
        onComplete();
        console.log('✅ onComplete called successfully');
      } else {
        console.error('❌ onComplete is undefined!');
      }
    }, 6000);

    return () => {
      console.log('🧹 Cleaning up RGV Namaste');
      [t0, t1, t2, t3, t4, t5].forEach(clearTimeout);
    };
  }, [onComplete]);

  /* -------------------- Layers -------------------- */

  // Rain streaks (CCTV lens)
  const renderRain = () => {
    if (stage === 'void') return null;
    const drops = Array.from({ length: 80 });
    return (
      <div aria-hidden className="rgv-rain">
        {drops.map((_, i) => {
          const left = Math.random() * 100;
          const delay = Math.random() * 2;
          const dur = 1.4 + Math.random() * 1.8;
          const h = 18 + Math.random() * 22;
          return (
            <span
              key={i}
              style={{
                left: `${left}%`,
                height: `${h}px`,
                animationDelay: `${delay}s`,
                animationDuration: `${dur}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
              className="rgv-rain-drop"
            />
          );
        })}
      </div>
    );
  };

  // Neon sign ghosts (red/green opposing glows)
  const renderNeonGhosts = () => {
    if (stage === 'void') return null;
    return (
      <>
        <div className="rgv-neon red" style={{ opacity: 0.18 + glow * 0.2 }} />
        <div className="rgv-neon green" style={{ opacity: 0.14 + glow * 0.18 }} />
      </>
    );
  };

  // Scanlines + grain overlay
  const Overlays = () => (
    <>
      <div className="rgv-scanlines" />
      <div className="rgv-grain" />
      <div className="rgv-vignette" style={{ opacity: stage === 'collapse' ? 0.85 : 0.6 }} />
    </>
  );

  // City haze / light pollution
  const PollutionGlow = () => (
    <div className="rgv-pollution" style={{ opacity: 0.12 + glow * 0.15 }} />
  );

  // Handheld / Dutch tilt container class by stage
  const cameraClass =
    stage === 'climax'
      ? 'rgv-cam rgv-cam-shake-strong'
      : stage === 'reveal'
      ? 'rgv-cam rgv-cam-shake-soft'
      : 'rgv-cam';

  /* -------------------- Styles -------------------- */

  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 999999, // SUPER HIGH - Above everything
    background:
      'radial-gradient(120% 120% at 50% 70%, #0a0c0d 0%, #020303 60%, #000000 100%)',
    overflow: 'hidden',
    margin: 0,
    padding: 0,
  };

  const stageStyle = {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
  };

  const titleCommon = {
    fontFamily: "'Bebas Neue', 'Impact', 'Oswald', system-ui, sans-serif",
    textTransform: 'uppercase',
    margin: 0,
    padding: 0,
    userSelect: 'none',
    WebkitFontSmoothing: 'antialiased',
    letterSpacing: `${letterSpacing}px`,
    transform: `scale(${scale})`,
    transition:
      'opacity 900ms cubic-bezier(0.4,0,0.2,1), transform 900ms cubic-bezier(0.4,0,0.2,1), letter-spacing 1100ms cubic-bezier(0.4,0,0.2,1)',
    filter: `saturate(${0.9 + glow * 0.2}) contrast(${1.1 + glow * 0.15})`,
  };

  const titleMain = {
    ...titleCommon,
    fontSize: 'clamp(4rem, 18vw, 13rem)',
    color: '#e11d48', // neon red-600
    opacity,
    textShadow: `
      0 0 ${6 + glow * 8}px rgba(225,29,72,0.9),
      0 0 ${18 + glow * 24}px rgba(225,29,72,0.55),
      0 0 ${34 + glow * 36}px rgba(34,197,94,0.2)
    `,
    // subtle skew for menace
    transform: `${titleCommon.transform} skewX(${stage === 'emerging' ? '-6deg' : stage === 'climax' ? '-2deg' : '-3deg'})`,
  };

  const titleGhost = {
    ...titleCommon,
    fontSize: 'clamp(4rem, 18vw, 13rem)',
    position: 'absolute',
    opacity: Math.min(0.28 + glow * 0.25, 0.6),
    mixBlendMode: 'screen',
  };

  // Word split for glitch layers
  const word = 'NAMASTE';

  return (
    <div ref={containerRef} style={containerStyle} className={cameraClass}>
      {/* Pollution / city glow */}
      <PollutionGlow />

      {/* Neon ghosts */}
      {renderNeonGhosts()}

      {/* Rain */}
      {renderRain()}

      {/* Central title */}
      <div style={stageStyle}>
        {/* Green offset ghost */}
        {stage !== 'void' && (
          <h1
            aria-hidden
            style={{
              ...titleGhost,
              color: '#22c55e',
              transform: `${titleGhost.transform} translate(-6px, -2px)`,
              textShadow: `
                0 0 8px rgba(34,197,94,0.6),
                0 0 24px rgba(34,197,94,0.35)
              `,
            }}
            className={stage === 'climax' ? 'rgv-flicker-hard' : 'rgv-flicker-soft'}
          >
            {word}
          </h1>
        )}

        {/* Red offset ghost */}
        {stage !== 'void' && (
          <h1
            aria-hidden
            style={{
              ...titleGhost,
              color: '#ef4444',
              transform: `${titleGhost.transform} translate(6px, 2px)`,
              textShadow: `
                0 0 8px rgba(239,68,68,0.6),
                0 0 24px rgba(239,68,68,0.35)
              `,
            }}
            className={stage === 'climax' ? 'rgv-flicker-hard' : 'rgv-flicker-soft'}
          >
            {word}
          </h1>
        )}

        {/* Main title with per-letter glitch spans */}
        <h1
          style={titleMain}
          className={stage === 'reveal' ? 'rgv-glitch-in' : stage === 'climax' ? 'rgv-glitch-loop' : ''}
        >
          {word.split('').map((ch, i) => (
            <span key={i} className={`rgv-letter rgv-letter-${i}`}>
              {ch}
            </span>
          ))}
        </h1>
      </div>

      {/* Overlays last */}
      <Overlays />

      {/* Local CSS */}
      <style>{`
        /* Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        /* CRITICAL: Ensure camera container covers EVERYTHING */
        .rgv-cam {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          min-height: 100vh !important;
          transform: rotate(-1.4deg) scale(1.08);
          transform-origin: 50% 60%;
          z-index: 999999 !important;
        }
        .rgv-cam-shake-soft { animation: camSoft 1800ms ease-in-out infinite; }
        .rgv-cam-shake-strong { animation: camHard 320ms steps(2,end) infinite; }

        @keyframes camSoft {
          0%,100% { transform: rotate(-1.4deg) translate(0,0) scale(1.08); }
          50%     { transform: rotate(-2.1deg) translate(-2px,1px) scale(1.08); }
        }
        @keyframes camHard {
          0%   { transform: rotate(-1.8deg) translate(-2px,1px) scale(1.08); }
          50%  { transform: rotate(-0.8deg) translate(2px,-1px) scale(1.08); }
          100% { transform: rotate(-1.8deg) translate(-2px,1px) scale(1.08); }
        }

        /* Rain */
        .rgv-rain {
          position: absolute;
          inset: -10% !important;
          pointer-events: none;
          overflow: hidden;
        }
        .rgv-rain-drop {
          position: absolute;
          top: -30px;
          width: 2px;
          background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(180,255,200,0.55));
          filter: blur(0.3px);
          animation-name: rainFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes rainFall {
          0% { transform: translateY(-30px) translateX(0); }
          100% { transform: translateY(110vh) translateX(-6px); }
        }

        /* Neon ghosts */
        .rgv-neon {
          position: absolute;
          inset: -30% !important;
          filter: blur(32px);
          mix-blend-mode: screen;
        }
        .rgv-neon.red {
          background: radial-gradient(60% 60% at 65% 45%, rgba(225,29,72,0.65) 0%, transparent 70%);
        }
        .rgv-neon.green {
          background: radial-gradient(50% 50% at 35% 60%, rgba(34,197,94,0.55) 0%, transparent 70%);
        }

        /* Scanlines / grain / vignette / pollution */
        .rgv-scanlines {
          position: absolute;
          inset: 0;
          pointer-events:none;
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 2px,
            transparent 3px
          );
          mix-blend-mode: overlay;
          opacity: 0.25;
        }
        .rgv-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>");
          background-size: 180px 180px;
          animation: grainMove 9s linear infinite;
          opacity: 0.55;
          mix-blend-mode: soft-light;
        }
        @keyframes grainMove {
          0% { transform: translate(0,0) }
          100% { transform: translate(-80px,-60px) }
        }
        .rgv-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%);
          transition: opacity 600ms ease-out;
        }
        .rgv-pollution {
          position: absolute;
          inset: -25%;
          background: radial-gradient(120% 80% at 50% 100%, rgba(255,0,80,0.15) 0%, rgba(0,0,0,0) 60%);
          filter: blur(28px);
          mix-blend-mode: screen;
          pointer-events: none;
        }

        /* Flicker / glitch */
        .rgv-flicker-soft { animation: flickerSoft 1800ms ease-in-out infinite; }
        .rgv-flicker-hard { animation: flickerHard 220ms steps(2,end) infinite; }
        @keyframes flickerSoft {
          0%,100% { opacity: 0.35; }
          40% { opacity: 0.55; }
          60% { opacity: 0.25; }
          80% { opacity: 0.6; }
        }
        @keyframes flickerHard {
          0% { opacity: 0.25; transform: translate(-1px, 0); }
          50% { opacity: 0.65; transform: translate(1px, 0); }
          100% { opacity: 0.25; transform: translate(-1px, 0); }
        }

        .rgv-glitch-in {
          animation: glitchIn 650ms ease-out both, neonPulse 2.6s ease-in-out infinite 800ms;
        }
        .rgv-glitch-loop {
          animation: glitchLoop 1.4s steps(2,end) infinite, neonPulse 2.2s ease-in-out infinite;
        }

        @keyframes glitchIn {
          0%   { opacity: 0; filter: blur(6px) hue-rotate(45deg); transform: scale(1.2) skewX(-8deg); }
          60%  { opacity: 1; filter: blur(1px) hue-rotate(0deg); transform: scale(1.02) skewX(-3deg); }
          100% { opacity: 1; filter: blur(0); transform: scale(1) skewX(-3deg); }
        }
        @keyframes glitchLoop {
          0%   { transform: translate(0,0) skewX(-3deg); }
          10%  { transform: translate(-2px,1px) skewX(-2deg); }
          20%  { transform: translate(2px,-1px) skewX(-3deg); }
          30%  { transform: translate(-1px,2px) skewX(-4deg); }
          40%  { transform: translate(1px,-2px) skewX(-2deg); }
          100% { transform: translate(0,0) skewX(-3deg); }
        }
        @keyframes neonPulse {
          0%,100% { text-shadow: 0 0 6px rgba(225,29,72,0.9), 0 0 18px rgba(225,29,72,0.55), 0 0 34px rgba(34,197,94,0.2); }
          50%     { text-shadow: 0 0 10px rgba(225,29,72,1), 0 0 28px rgba(225,29,72,0.7), 0 0 44px rgba(34,197,94,0.28); }
        }

        /* Per-letter micro jitter (subtle randomness) */
        .rgv-letter { display:inline-block; }
        .rgv-letter-0 { animation: jitter 1.8s ease-in-out infinite 0ms; }
        .rgv-letter-1 { animation: jitter 1.8s ease-in-out infinite 60ms; }
        .rgv-letter-2 { animation: jitter 1.8s ease-in-out infinite 120ms; }
        .rgv-letter-3 { animation: jitter 1.8s ease-in-out infinite 180ms; }
        .rgv-letter-4 { animation: jitter 1.8s ease-in-out infinite 240ms; }
        .rgv-letter-5 { animation: jitter 1.8s ease-in-out infinite 300ms; }
        .rgv-letter-6 { animation: jitter 1.8s ease-in-out infinite 360ms; }

        @keyframes jitter {
          0%,100% { transform: translate(0,0); }
          50% { transform: translate(0.6px,-0.6px); }
        }

        /* Disable scroll and prevent any background bleed */
        body {
          overflow: hidden !important;
        }

        html, body {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default RgvNamaste;