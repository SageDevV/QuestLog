/**
 * CyberpunkCity — Mega Man X-style pixel art city skyline.
 * Three variants: morning, afternoon, night.
 * Buildings with rooftop details, varied shapes, neon signs.
 */

interface CyberpunkCityProps {
  timeOfDay: 'morning' | 'afternoon' | 'night';
  layer?: 'horizon' | 'far' | 'near';
}

/* ── colour palettes per time-of-day ────────────────────────── */
const palettes = {
  morning: {
    bldgDark:   '#3a4a6b',
    bldgMid:    '#4e6490',
    bldgLight:  '#6882b0',
    bldgAccent: '#8ea8d4',
    windowLit:  '#ffe9a0',
    windowDim:  '#9ab0d4',
    neon1:      '#78d6ff',
    neon2:      '#a0e8ff',
    neonGlow:   'rgba(120,214,255,0.4)',
    antenna:    '#5a7299',
    antennaLed: '#ff6060',
    roofAccent: '#70b8e8',
    roofDetail: '#506888',
    horizonFog: 'rgba(187,222,251,0.35)',
    hzDark: '#8a9abb', hzMid: '#9aaccc', hzLight: '#aabbdd',
  },
  afternoon: {
    bldgDark:   '#3b2252',
    bldgMid:    '#5a3472',
    bldgLight:  '#744a8c',
    bldgAccent: '#8e62a6',
    windowLit:  '#ffcc44',
    windowDim:  '#6a4880',
    neon1:      '#ff6b9d',
    neon2:      '#ffa040',
    neonGlow:   'rgba(255,107,157,0.4)',
    antenna:    '#5a3470',
    antennaLed: '#ff4444',
    roofAccent: '#e85d75',
    roofDetail: '#4a2a60',
    horizonFog: 'rgba(245,203,167,0.3)',
    hzDark: '#6a4478', hzMid: '#7a5488', hzLight: '#8a6498',
  },
  night: {
    bldgDark:   '#0a0e1a',
    bldgMid:    '#141830',
    bldgLight:  '#1e2545',
    bldgAccent: '#252e55',
    windowLit:  '#00e5ff',
    windowDim:  '#0d1228',
    neon1:      '#e040fb',
    neon2:      '#00e5ff',
    neonGlow:   'rgba(224,64,251,0.5)',
    antenna:    '#1a2040',
    antennaLed: '#ff2244',
    roofAccent: '#e040fb',
    roofDetail: '#0e1425',
    horizonFog: 'rgba(20,25,60,0.4)',
    hzDark: '#0e1225', hzMid: '#151a35', hzLight: '#1c2240',
  },
};

type Pal = typeof palettes.morning;

/* ── pixel-art window grid ──────────────────────────────────── */
function windows(
  bx: number, by: number, bw: number, bh: number,
  cols: number, rows: number,
  litColor: string, dimColor: string,
  seed: number, winSize: number = 4,
) {
  const rects: JSX.Element[] = [];
  const ww = winSize, wh = winSize;
  const gx = Math.max(2, Math.floor((bw - cols * ww) / (cols + 1)));
  const gy = Math.max(3, Math.floor((bh - rows * wh) / (rows + 1)));
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = bx + gx + c * (ww + gx);
      const y = by + gy + r * (wh + gy);
      if (x + ww > bx + bw || y + wh > by + bh) continue;
      const lit = ((seed * 7 + idx * 13 + r * 3 + c * 5) % 11) > 4;
      rects.push(
        <rect key={`w${idx}`} x={x} y={y} width={ww} height={wh}
              fill={lit ? litColor : dimColor} />
      );
      idx++;
    }
  }
  return rects;
}

/* ── rooftop details (water tanks, AC units, satellite dishes) ─ */
function roofDetails(x: number, y: number, w: number, pal: Pal, seed: number) {
  const els: JSX.Element[] = [];
  const detail = seed % 5;

  if (detail === 0 && w >= 20) {
    // Water tank (cylinder-ish pixel art)
    const tx = x + 3;
    els.push(<rect key="wt1" x={tx} y={y - 8} width={6} height={8} fill={pal.roofDetail} />);
    els.push(<rect key="wt2" x={tx - 1} y={y - 9} width={8} height={2} fill={pal.roofDetail} />);
    els.push(<rect key="wt3" x={tx + 1} y={y - 6} width={2} height={2} fill={pal.windowLit} opacity={0.4} />);
  }
  if (detail === 1 && w >= 16) {
    // AC unit boxes
    const ax = x + w - 10;
    els.push(<rect key="ac1" x={ax} y={y - 5} width={5} height={5} fill={pal.roofDetail} />);
    els.push(<rect key="ac2" x={ax + 1} y={y - 4} width={3} height={1} fill={pal.antenna} />);
    if (w >= 24) {
      els.push(<rect key="ac3" x={ax - 7} y={y - 4} width={4} height={4} fill={pal.roofDetail} />);
    }
  }
  if (detail === 2 && w >= 18) {
    // Satellite dish (pixel art)
    const dx = x + Math.floor(w / 2) - 3;
    els.push(<rect key="sd1" x={dx + 2} y={y - 8} width={2} height={5} fill={pal.antenna} />);
    els.push(<rect key="sd2" x={dx} y={y - 10} width={6} height={3} fill={pal.roofDetail} />);
    els.push(<rect key="sd3" x={dx + 1} y={y - 11} width={4} height={1} fill={pal.roofDetail} />);
  }
  if (detail === 3 && w >= 22) {
    // Pipes / vents
    els.push(<rect key="pp1" x={x + 4} y={y - 6} width={2} height={6} fill={pal.roofDetail} />);
    els.push(<rect key="pp2" x={x + 8} y={y - 4} width={2} height={4} fill={pal.roofDetail} />);
    if (w >= 28) {
      els.push(<rect key="pp3" x={x + 12} y={y - 7} width={2} height={7} fill={pal.roofDetail} />);
    }
  }
  if (detail === 4 && w >= 14) {
    // Small antenna array
    els.push(<rect key="aa1" x={x + w - 5} y={y - 6} width={1} height={6} fill={pal.antenna} />);
    els.push(<rect key="aa2" x={x + w - 3} y={y - 8} width={1} height={8} fill={pal.antenna} />);
    els.push(<rect key="aa3" x={x + w - 4} y={y - 5} width={3} height={1} fill={pal.antenna} />);
  }

  return els;
}

/* ── one building ───────────────────────────────────────────── */
function building(
  x: number, w: number, h: number,
  pal: Pal, variant: number,
  baseY: number, seed: number,
  hasSpire?: boolean,
  winSize: number = 4,
  hasLedge?: boolean,
) {
  const fills = [pal.bldgDark, pal.bldgMid, pal.bldgLight, pal.bldgAccent];
  const fill = fills[variant % 4];
  const y = baseY - h;
  const cols = Math.max(1, Math.floor(w / (winSize + 6)));
  const rows = Math.max(1, Math.floor(h / (winSize + 8)));
  const els: JSX.Element[] = [];

  // main body
  els.push(<rect key="body" x={x} y={y} width={w} height={h} fill={fill} />);
  // darker side edge (pixel depth)
  els.push(<rect key="edge" x={x + w - 2} y={y} width={2} height={h} fill="rgba(0,0,0,0.15)" />);
  // lighter left edge
  els.push(<rect key="edgeL" x={x} y={y} width={1} height={h} fill="rgba(255,255,255,0.04)" />);
  // roof stripe
  els.push(<rect key="roof" x={x} y={y} width={w} height={3} fill={pal.roofAccent} />);

  // ledge (step-back on one side)
  if (hasLedge && w >= 20) {
    const lw = Math.floor(w * 0.4);
    const lh = Math.floor(h * 0.3);
    const lx = x + w; // extends right
    els.push(<rect key="ldg" x={lx} y={baseY - lh} width={lw} height={lh} fill={fills[(variant + 1) % 4]} />);
    els.push(<rect key="ldg-r" x={lx} y={baseY - lh} width={lw} height={2} fill={pal.roofAccent} />);
    els.push(<rect key="ldg-e" x={lx + lw - 1} y={baseY - lh} width={1} height={lh} fill="rgba(0,0,0,0.15)" />);
    els.push(...windows(lx, baseY - lh + 4, lw, lh - 6,
      Math.max(1, Math.floor(lw / (winSize + 6))),
      Math.max(1, Math.floor(lh / (winSize + 8))),
      pal.windowLit, pal.windowDim, seed + 77, winSize));
  }

  // spire on tall buildings
  if (hasSpire) {
    const sw = Math.floor(w * 0.35);
    const sh = Math.floor(h * 0.25);
    const sx = x + Math.floor((w - sw) / 2);
    els.push(<rect key="sp" x={sx} y={y - sh} width={sw} height={sh} fill={fill} />);
    els.push(<rect key="sp-r" x={sx} y={y - sh} width={sw} height={2} fill={pal.roofAccent} />);
    els.push(<rect key="sp-e" x={sx + sw - 1} y={y - sh} width={1} height={sh} fill="rgba(0,0,0,0.15)" />);
    els.push(...windows(sx, y - sh + 4, sw, sh - 6,
      Math.max(1, Math.floor(sw / (winSize + 6))),
      Math.max(1, Math.floor(sh / (winSize + 8))),
      pal.windowLit, pal.windowDim, seed + 99, winSize));
    // rooftop details on the spire
    els.push(...roofDetails(sx, y - sh, sw, pal, seed + 50));
  } else {
    // rooftop details on main roof
    els.push(...roofDetails(x, y, w, pal, seed));
  }

  // windows
  els.push(...windows(x, y + 6, w, h - 8, cols, rows, pal.windowLit, pal.windowDim, seed, winSize));

  return els;
}

/* ── antenna ────────────────────────────────────────────────── */
function antenna(x: number, topY: number, h: number, pal: Pal) {
  return (
    <g key={`ant-${x}-${topY}`}>
      <rect x={x} y={topY} width={2} height={h} fill={pal.antenna} />
      <rect x={x - 1} y={topY - 3} width={4} height={4} fill={pal.antennaLed}>
        <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
      </rect>
    </g>
  );
}

/* ── neon sign (horizontal bar) ─────────────────────────────── */
function neonSign(x: number, y: number, w: number, color: string, glowColor: string, vertical?: boolean) {
  const sw = vertical ? 3 : w;
  const sh = vertical ? w : 3;
  return (
    <g key={`n-${x}-${y}-${vertical ? 'v' : 'h'}`}>
      <rect x={x} y={y} width={sw} height={sh} fill={color} opacity={0.9}>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
      </rect>
      <rect x={x} y={y} width={sw} height={sh} fill={glowColor} filter="url(#neonBlur)">
        <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
      </rect>
    </g>
  );
}

/* ── Building layouts per layer ─────────────────────────────── */

const horizonLayout = [
  { x: 0,   w: 16, h: 40 }, { x: 18,  w: 10, h: 55 }, { x: 30,  w: 20, h: 35 },
  { x: 52,  w: 12, h: 65 }, { x: 66,  w: 18, h: 45 }, { x: 86,  w: 14, h: 70 },
  { x: 102, w: 10, h: 38 }, { x: 114, w: 22, h: 58 }, { x: 138, w: 12, h: 80 },
  { x: 152, w: 16, h: 42 }, { x: 170, w: 20, h: 60 }, { x: 192, w: 10, h: 48 },
  { x: 204, w: 14, h: 72 }, { x: 220, w: 18, h: 36 }, { x: 240, w: 12, h: 55 },
  { x: 254, w: 22, h: 85 }, { x: 278, w: 10, h: 40 }, { x: 290, w: 16, h: 62 },
  { x: 308, w: 14, h: 46 }, { x: 324, w: 20, h: 75 }, { x: 346, w: 12, h: 38 },
  { x: 360, w: 18, h: 50 }, { x: 380, w: 10, h: 68 }, { x: 392, w: 14, h: 42 },
  { x: 408, w: 22, h: 58 }, { x: 432, w: 16, h: 78 }, { x: 450, w: 12, h: 34 },
  { x: 464, w: 20, h: 52 }, { x: 486, w: 14, h: 65 }, { x: 502, w: 18, h: 44 },
  { x: 522, w: 10, h: 72 }, { x: 534, w: 16, h: 38 }, { x: 552, w: 24, h: 60 },
  { x: 578, w: 12, h: 48 }, { x: 592, w: 8,  h: 55 },
];

const farLayout = [
  { x: 0,   w: 24, h: 60,  sp: false, ldg: false },
  { x: 28,  w: 16, h: 110, sp: true,  ldg: false },
  { x: 48,  w: 30, h: 75,  sp: false, ldg: true  },
  { x: 82,  w: 20, h: 150, sp: true,  ldg: false },
  { x: 106, w: 14, h: 50,  sp: false, ldg: false },
  { x: 124, w: 26, h: 95,  sp: false, ldg: true  },
  { x: 154, w: 18, h: 170, sp: true,  ldg: false },
  { x: 176, w: 22, h: 65,  sp: false, ldg: false },
  { x: 202, w: 28, h: 130, sp: true,  ldg: false },
  { x: 234, w: 14, h: 55,  sp: false, ldg: false },
  { x: 252, w: 20, h: 100, sp: false, ldg: true  },
  { x: 276, w: 24, h: 160, sp: true,  ldg: false },
  { x: 304, w: 16, h: 70,  sp: false, ldg: false },
  { x: 324, w: 30, h: 120, sp: false, ldg: true  },
  { x: 358, w: 18, h: 45,  sp: false, ldg: false },
  { x: 380, w: 22, h: 140, sp: true,  ldg: false },
  { x: 406, w: 26, h: 80,  sp: false, ldg: false },
  { x: 436, w: 14, h: 110, sp: true,  ldg: false },
  { x: 454, w: 20, h: 55,  sp: false, ldg: false },
  { x: 478, w: 28, h: 135, sp: false, ldg: true  },
  { x: 510, w: 16, h: 90,  sp: false, ldg: false },
  { x: 530, w: 24, h: 155, sp: true,  ldg: false },
  { x: 558, w: 18, h: 60,  sp: false, ldg: false },
  { x: 580, w: 20, h: 105, sp: false, ldg: false },
];

// Near layer: dramatic height variation — from tiny 30px to 240px mega-towers
const nearLayout = [
  { x: 0,   w: 28, h: 70,  sp: false, ldg: true  },
  { x: 32,  w: 16, h: 30,  sp: false, ldg: false },
  { x: 52,  w: 34, h: 180, sp: true,  ldg: false },
  { x: 90,  w: 20, h: 55,  sp: false, ldg: false },
  { x: 114, w: 14, h: 35,  sp: false, ldg: false },
  { x: 132, w: 26, h: 120, sp: false, ldg: true  },
  { x: 162, w: 18, h: 240, sp: true,  ldg: false },
  { x: 184, w: 24, h: 45,  sp: false, ldg: false },
  { x: 212, w: 20, h: 90,  sp: false, ldg: true  },
  { x: 236, w: 30, h: 200, sp: true,  ldg: false },
  { x: 270, w: 14, h: 40,  sp: false, ldg: false },
  { x: 288, w: 22, h: 100, sp: false, ldg: false },
  { x: 314, w: 18, h: 160, sp: true,  ldg: false },
  { x: 336, w: 26, h: 50,  sp: false, ldg: true  },
  { x: 366, w: 16, h: 30,  sp: false, ldg: false },
  { x: 386, w: 32, h: 210, sp: true,  ldg: false },
  { x: 422, w: 20, h: 75,  sp: false, ldg: false },
  { x: 446, w: 14, h: 130, sp: false, ldg: true  },
  { x: 464, w: 28, h: 35,  sp: false, ldg: false },
  { x: 496, w: 22, h: 190, sp: true,  ldg: false },
  { x: 522, w: 18, h: 60,  sp: false, ldg: false },
  { x: 544, w: 24, h: 145, sp: true,  ldg: false },
  { x: 572, w: 16, h: 40,  sp: false, ldg: false },
  { x: 592, w: 8,  h: 80,  sp: false, ldg: false },
];

/* ── MAIN COMPONENT ─────────────────────────────────────────── */
export default function CyberpunkCity({ timeOfDay, layer = 'near' }: CyberpunkCityProps) {
  const pal = palettes[timeOfDay];
  const vw = 600, vh = 280;
  const ground = vh;

  // Horizon layer: silhouette blocks only
  if (layer === 'horizon') {
    const hzFills = [pal.hzDark, pal.hzMid, pal.hzLight];
    return (
      <svg className="cyberpunk-city-svg" xmlns="http://www.w3.org/2000/svg"
           viewBox={`0 0 ${vw} 100`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
        {horizonLayout.map((b, i) => (
          <rect key={i} x={b.x} y={100 - b.h} width={b.w} height={b.h}
                fill={hzFills[i % 3]} />
        ))}
      </svg>
    );
  }

  const isNear = layer === 'near';
  const layout = isNear ? nearLayout : farLayout;
  const winSize = isNear ? 4 : 3;

  return (
    <svg className="cyberpunk-city-svg" xmlns="http://www.w3.org/2000/svg"
         viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges">
      <defs>
        <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* horizon fog */}
      <rect x={0} y={ground - 12} width={vw} height={14} fill={pal.horizonFog} />

      {/* buildings */}
      {layout.map((b, i) => (
        <g key={i}>
          {building(b.x, b.w, b.h, pal, i % 4, ground, i + 1, b.sp, winSize, b.ldg)}
        </g>
      ))}

      {/* antennas on spire buildings */}
      {layout.filter(b => b.sp).map((b, i) => {
        const topY = ground - b.h - Math.floor(b.h * 0.25);
        return <g key={`a${i}`}>{antenna(b.x + Math.floor(b.w / 2), topY, 18 + i * 2, pal)}</g>;
      })}

      {/* neon signs — horizontal and vertical */}
      {isNear && <>
        {neonSign(56,  ground - 80,  28, pal.neon1, pal.neonGlow)}
        {neonSign(136, ground - 55,  22, pal.neon2, pal.neonGlow)}
        {neonSign(216, ground - 42,  18, pal.neon1, pal.neonGlow)}
        {neonSign(292, ground - 48,  24, pal.neon2, pal.neonGlow)}
        {neonSign(340, ground - 30,  16, pal.neon1, pal.neonGlow)}
        {neonSign(426, ground - 36,  20, pal.neon2, pal.neonGlow)}
        {neonSign(500, ground - 65,  26, pal.neon1, pal.neonGlow)}
        {neonSign(168, ground - 120, 14, pal.neon2, pal.neonGlow)}
        {neonSign(390, ground - 100, 28, pal.neon1, pal.neonGlow)}
        {neonSign(548, ground - 70,  18, pal.neon2, pal.neonGlow)}
        {/* vertical neon strips */}
        {neonSign(60,  ground - 110, 20, pal.neon2, pal.neonGlow, true)}
        {neonSign(245, ground - 150, 30, pal.neon1, pal.neonGlow, true)}
        {neonSign(395, ground - 160, 35, pal.neon2, pal.neonGlow, true)}
        {neonSign(505, ground - 130, 25, pal.neon1, pal.neonGlow, true)}
      </>}
    </svg>
  );
}
