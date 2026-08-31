"use client";

import { useEffect, useRef, useState } from "react";

const H = 108;
const HORIZON = 104;
const PERIOD = 384;

type Palette = {
  sky: string[];
  cloud: string;
  cloudShade: string;
  far: string;
  farRoof: string;
  mid: string;
  near: string;
  roof: string;
  win: string;
  win2: string;
  winOff: string;
  winFar: string;
  ink: string;
  crust: string;
  soil: string;
  metal: string;
  metalHi: string;
  screen: string;
  grass: string;
  grassDim: string;
  sig: string;
  sigHi: string;
  sigDim: string;
  lamp: string;
  lampGlow: string | null;
  bell: string;
  bellDim: string;
  night: boolean;
};

const NIGHT: Palette = {
  sky: ["#12030A", "#190410", "#210617", "#2B0A1E", "#380F27"],
  cloud: "#2E0C20",
  cloudShade: "#24081A",
  far: "#3E1229",
  farRoof: "#320E21",
  mid: "#4E1B36",
  near: "#5F2542",
  roof: "#2B0A1B",
  win: "#FFD98F",
  win2: "#F5BE62",
  winOff: "#2A1020",
  winFar: "#C79A55",
  ink: "#6B2C4B",
  crust: "#2B0A1B",
  soil: "#12030A",
  metal: "#3A1227",
  metalHi: "#56213B",
  screen: "#0A0206",
  grass: "#55605A",
  grassDim: "#3D4842",
  sig: "#FF3247",
  sigHi: "#FFA0A9",
  sigDim: "#9E1526",
  lamp: "#FFC978",
  lampGlow: "rgba(255,201,120,.12)",
  bell: "#D8A748",
  bellDim: "#7A5C22",
  night: true,
};

const DAY: Palette = {
  sky: ["#DCE0D9", "#D3D9CF", "#CAD1C6", "#C0C8BC", "#B5BEB1"],
  cloud: "#F4F6F1",
  cloudShade: "#CBD1C7",
  far: "#9CA699",
  farRoof: "#8C9689",
  mid: "#768277",
  near: "#525E56",
  roof: "#4E1B36",
  win: "#DCE0D9",
  win2: "#D1D8CE",
  winOff: "#AAB3A7",
  winFar: "#B7BFB4",
  ink: "#31081F",
  crust: "#4E1B36",
  soil: "#31081F",
  metal: "#4E1B36",
  metalHi: "#6A2B49",
  screen: "#240616",
  grass: "#768277",
  grassDim: "#525E56",
  sig: "#D61F34",
  sigHi: "#F4707E",
  sigDim: "#8E1322",
  lamp: "#525E56",
  lampGlow: null,
  bell: "#B98F3A",
  bellDim: "#6E5525",
  night: false,
};

function resolveTheme(): "light" | "dark" {
  const attr = typeof document !== "undefined" ? document.documentElement.dataset.theme : "dark";
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return "dark";
}

type Box = { x: number; w: number; h: number };

const FAR_TPL: Box[] = [
  { x: 2, w: 20, h: 26 },
  { x: 24, w: 14, h: 34 },
  { x: 40, w: 22, h: 22 },
  { x: 86, w: 22, h: 24 },
  { x: 112, w: 16, h: 36 },
  { x: 130, w: 18, h: 28 },
  { x: 194, w: 16, h: 30 },
  { x: 214, w: 18, h: 26 },
  { x: 236, w: 16, h: 34 },
  { x: 256, w: 20, h: 22 },
  { x: 306, w: 16, h: 28 },
  { x: 324, w: 18, h: 32 },
  { x: 344, w: 16, h: 24 },
  { x: 364, w: 18, h: 30 },
];

const MID_TPL: Box[] = [
  { x: 10, w: 28, h: 40 },
  { x: 90, w: 30, h: 46 },
  { x: 202, w: 26, h: 38 },
  { x: 234, w: 32, h: 44 },
  { x: 328, w: 28, h: 36 },
];

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
const BLEND = 7;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(a: number, b: number) {
  let h = Math.imul(a * 374761393 + b * 668265263, 1274126177);
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

type Win = { x: number; y: number; w: number; h: number; i: number; far: boolean };

function gableRoof(g: CanvasRenderingContext2D, x: number, w: number, baseY: number, height: number) {
  for (let i = 0; i < height; i++) {
    const rowWidth = Math.max(2, Math.round((w * (i + 1)) / height));
    g.fillRect(x + Math.round((w - rowWidth) / 2), baseY - height + i, rowWidth, 1);
  }
}

function drawCloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, C: Palette) {
  const u = s;
  g.fillStyle = C.cloud;
  g.fillRect(x, y + u, 7 * u, 2 * u);
  g.fillRect(x + 2 * u, y, 4 * u, u);
  g.fillRect(x + u, y + 3 * u, 5 * u, u);
  g.fillStyle = C.cloudShade;
  g.fillRect(x + u, y + 3 * u, 5 * u, 1);
}

export function PixelPanorama({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    setTheme(resolveTheme());
    const observer = new MutationObserver(() => setTheme(resolveTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0 && cr.height > 0) {
          setDimensions({ width: Math.round(cr.width), height: Math.round(cr.height) });
        }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let raf = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Calculate canvas internal resolution matching the container's height scale so pixels are strictly 1:1 square
    const displayWidth = container.clientWidth || dimensions.width || 1200;
    const displayHeight = container.clientHeight || dimensions.height || 180;
    const scale = Math.max(1.0, displayHeight / H);
    const W = Math.max(384, Math.round(displayWidth / scale));

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const C = theme === "dark" ? NIGHT : DAY;
    const numPeriods = Math.ceil(W / PERIOD) + 1;
    const spirePeriod = 0;

    let schoolPeriod = 0;
    let bestSchoolDiff = Infinity;
    for (let p = 0; p < numPeriods; p++) {
      const sx = p * PERIOD + 140;
      if (sx + 52 <= W + 10) {
        const diff = Math.abs(sx - W * 0.45);
        if (diff < bestSchoolDiff) {
          bestSchoolDiff = diff;
          schoolPeriod = p;
        }
      }
    }

    let antennaPeriod = 0;
    for (let p = numPeriods - 1; p >= 0; p--) {
      const ax = p * PERIOD + 292;
      if (ax <= W - 10) {
        antennaPeriod = p;
        break;
      }
    }

    const allFar: Box[] = [];
    const allMid: Box[] = [];
    const allLamps: number[] = [];
    const allAntennas: number[] = [];
    const allSpires: { x: number; w: number; h: number }[] = [];
    const allSchools: { x: number; w: number; h: number }[] = [];

    for (let p = 0; p < numPeriods; p++) {
      const ox = p * PERIOD;
      for (const b of FAR_TPL) {
        if (ox + b.x < W + 40) allFar.push({ x: ox + b.x, w: b.w, h: b.h });
      }
      for (const b of MID_TPL) {
        if (ox + b.x < W + 40) allMid.push({ x: ox + b.x, w: b.w, h: b.h });
      }

      // Slot 1 (x = 64): Spire or single mid building
      if (p === spirePeriod) {
        if (ox + 64 < W + 20) allSpires.push({ x: ox + 64, w: 12, h: 46 });
      } else {
        if (ox + 56 < W + 20) allMid.push({ x: ox + 56, w: 26, h: 42 });
      }

      // Slot 2 (x = 140): School or single mid building
      if (p === schoolPeriod) {
        if (ox + 140 < W + 20) allSchools.push({ x: ox + 140, w: 52, h: 34 });
      } else {
        if (ox + 148 < W + 20) allMid.push({ x: ox + 148, w: 36, h: 44 });
      }

      // Slot 3 (x = 292): Antenna or single mid building
      if (p === antennaPeriod) {
        if (ox + 292 < W + 20) allAntennas.push(ox + 292);
      } else {
        if (ox + 280 < W + 20) allMid.push({ x: ox + 280, w: 26, h: 40 });
      }

      // Lamps
      for (const lx of [32, 118, 208, 268, 352]) {
        if (ox + lx < W + 20) allLamps.push(ox + lx);
      }
    }

    // Build Occluders
    const occluders: { x: number; w: number; top: number }[] = [
      ...allMid.map(b => ({ x: b.x - 1, w: b.w + 2, top: HORIZON - 2 - b.h })),
      ...allSchools.map(s => ({ x: s.x - 3, w: s.w + 6, top: HORIZON - s.h - 13 })),
      ...allSpires.map(s => ({ x: s.x - 1, w: s.w + 2, top: HORIZON - s.h - 14 })),
    ];

    function isOccluded(x: number, y: number, w: number, h: number) {
      return occluders.some(o => x + w > o.x && x < o.x + o.w && y + h > o.top);
    }

    // Build Windows
    const windows: Win[] = [];
    let winIdx = 0;
    for (const b of allFar) {
      const top = HORIZON - 6 - b.h;
      for (let y = top + 4; y < HORIZON - 9; y += 5) {
        for (let x = b.x + 3; x <= b.x + b.w - 4; x += 4) {
          if (!isOccluded(x, y, 2, 2)) windows.push({ x, y, w: 2, h: 2, i: winIdx++, far: true });
        }
      }
    }
    for (const b of allMid) {
      const top = HORIZON - 2 - b.h;
      for (let y = top + 6; y < HORIZON - 8; y += 7) {
        for (let x = b.x + 4; x <= b.x + b.w - 7; x += 7) {
          windows.push({ x, y, w: 3, h: 4, i: winIdx++, far: false });
        }
      }
    }
    for (const s of allSchools) {
      const by = HORIZON - s.h;
      for (let y = by + 7; y < HORIZON - 10; y += 10) {
        for (let x = s.x + 5; x <= s.x + s.w - 9; x += 8) {
          windows.push({ x, y, w: 5, h: 6, i: winIdx++, far: false });
        }
      }
    }
    for (const s of allSpires) {
      for (let y = HORIZON - 28; y < HORIZON - 12; y += 9) {
        windows.push({ x: s.x + 4, y, w: 3, h: 5, i: winIdx++, far: false });
      }
    }

    // Static Sky canvas
    const skyCanvas = document.createElement("canvas");
    skyCanvas.width = W;
    skyCanvas.height = H;
    const skyCtx = skyCanvas.getContext("2d")!;

    // Paint Sky
    if (!C.night) {
      skyCtx.fillStyle = C.sky[0];
      skyCtx.fillRect(0, 0, W, HORIZON);
    } else {
      const bands = C.sky.length;
      const step = HORIZON / bands;
      for (let i = 0; i < bands; i++) {
        skyCtx.fillStyle = C.sky[i];
        skyCtx.fillRect(0, Math.floor(i * step), W, Math.ceil(step) + 1);
        if (i < bands - 1) {
          skyCtx.fillStyle = C.sky[i + 1];
          const edge = Math.floor((i + 1) * step);
          for (let dy = 0; dy < BLEND; dy++) {
            const y = edge - BLEND + dy;
            if (y < 0) continue;
            const level = (dy + 1) / (BLEND + 1);
            for (let x = 0; x < W; x++) {
              if (BAYER[y & 3][x & 3] / 16 < level) skyCtx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
    }

    if (C.night) {
      // Stars across full width
      const numStars = Math.floor((W / 384) * 80);
      const rStars = rng(42);
      for (let i = 0; i < numStars; i++) {
        const x = Math.floor(rStars() * W);
        const y = Math.floor(rStars() * (HORIZON - 26));
        const v = rStars();
        skyCtx.fillStyle = v > 0.84 ? "#F3E7CC" : v > 0.45 ? "#94799C" : "#5B4463";
        skyCtx.fillRect(x, y, 1, 1);
      }

      // Exactly ONE Moon with ambient radial glow positioned nicely at ~84% width
      const mx = Math.round(W * 0.84);
      const my = 26;
      const rad = 9;

      // Ambient lunar halo
      skyCtx.fillStyle = "rgba(255, 245, 220, 0.04)";
      skyCtx.beginPath();
      skyCtx.arc(mx, my, rad + 7, 0, Math.PI * 2);
      skyCtx.fill();

      skyCtx.fillStyle = "rgba(255, 245, 220, 0.09)";
      skyCtx.beginPath();
      skyCtx.arc(mx, my, rad + 3, 0, Math.PI * 2);
      skyCtx.fill();

      skyCtx.fillStyle = "#F5EBD2";
      for (let y = -rad; y <= rad; y++) {
        const half = Math.floor(Math.sqrt(rad * rad - y * y));
        skyCtx.fillRect(mx - half, my + y, half * 2 + 1, 1);
      }
      skyCtx.fillStyle = "#E0D2B4";
      skyCtx.fillRect(mx - 4, my - 3, 3, 2);
      skyCtx.fillRect(mx + 1, my + 2, 4, 3);
      skyCtx.fillRect(mx - 2, my + 5, 2, 2);
    }

    // Static Skyline Canvas
    const skylineCanvas = document.createElement("canvas");
    skylineCanvas.width = W;
    skylineCanvas.height = H;
    const skyLCtx = skylineCanvas.getContext("2d")!;

    const rBld = rng(11);
    // Paint Far buildings
    for (const b of allFar) {
      const top = HORIZON - 6 - b.h;
      skyLCtx.fillStyle = C.far;
      skyLCtx.fillRect(b.x, top, b.w, b.h);
      skyLCtx.fillStyle = C.farRoof;
      skyLCtx.fillRect(b.x, top, b.w, 1);
    }

    // Paint Mid buildings
    for (const b of allMid) {
      const top = HORIZON - 2 - b.h;
      skyLCtx.fillStyle = C.mid;
      skyLCtx.fillRect(b.x, top, b.w, b.h);
      skyLCtx.fillStyle = C.roof;
      skyLCtx.fillRect(b.x - 1, top, b.w + 2, 2);
      const fixture = rBld();
      if (fixture > 0.62) {
        skyLCtx.fillRect(b.x + 5, top - 5, 3, 5);
        skyLCtx.fillRect(b.x + 4, top - 6, 5, 1);
      } else if (fixture > 0.3) {
        skyLCtx.fillRect(b.x + b.w - 10, top - 4, 7, 4);
        skyLCtx.fillRect(b.x + b.w - 8, top - 7, 1, 3);
      } else {
        skyLCtx.fillRect(b.x + b.w - 6, top - 8, 1, 8);
      }
    }

    // Paint Spires
    for (const s of allSpires) {
      const sx = s.x;
      skyLCtx.fillStyle = C.near;
      skyLCtx.fillRect(sx, HORIZON - s.h, s.w, s.h);
      skyLCtx.fillStyle = C.roof;
      gableRoof(skyLCtx, sx, s.w, HORIZON - s.h, 14);
      skyLCtx.fillRect(sx + s.w / 2 - 1, HORIZON - s.h - 20, 2, 7);
      skyLCtx.fillRect(sx + s.w / 2 - 3, HORIZON - s.h - 18, 6, 1);
      skyLCtx.fillStyle = C.near;
      skyLCtx.fillRect(sx - 1, HORIZON - s.h, s.w + 2, 2);
      const belfryX = sx + 2,
        belfryW = s.w - 4,
        belfryY = HORIZON - 42;
      skyLCtx.fillStyle = C.screen;
      skyLCtx.fillRect(belfryX + 2, belfryY, belfryW - 4, 1);
      skyLCtx.fillRect(belfryX + 1, belfryY + 1, belfryW - 2, 1);
      skyLCtx.fillRect(belfryX, belfryY + 2, belfryW, 10);
      skyLCtx.fillStyle = C.roof;
      skyLCtx.fillRect(belfryX - 1, belfryY + 12, belfryW + 2, 2);
    }

    // Paint Schools
    for (const s of allSchools) {
      const bx = s.x,
        bw = s.w,
        bh = s.h,
        by = HORIZON - bh;
      skyLCtx.fillStyle = C.near;
      skyLCtx.fillRect(bx, by, bw, bh);
      skyLCtx.fillStyle = C.roof;
      gableRoof(skyLCtx, bx, bw, by, 13);
      skyLCtx.fillRect(bx - 3, by - 1, bw + 6, 2);
      skyLCtx.fillRect(bx + bw / 2 - 4, HORIZON - 10, 8, 10);
      skyLCtx.fillStyle = C.near;
      skyLCtx.fillRect(bx + bw / 2 - 2, HORIZON - 8, 4, 8);
    }

    // Paint Antennas
    for (const ax of allAntennas) {
      skyLCtx.fillStyle = C.near;
      for (let y = HORIZON - 1; y > HORIZON - 60; y -= 1) {
        const spread = Math.round(((y - (HORIZON - 60)) / 60) * 5);
        const step = (HORIZON - y) % 8;
        skyLCtx.fillRect(ax - spread, y, 1, 1);
        skyLCtx.fillRect(ax + spread, y, 1, 1);
        if (step === 0) skyLCtx.fillRect(ax - spread, y, spread * 2 + 1, 1);
        else if (step === 4 && spread > 1) {
          skyLCtx.fillRect(ax - Math.round(spread / 2), y, 1, 1);
          skyLCtx.fillRect(ax + Math.round(spread / 2), y, 1, 1);
        }
      }
      skyLCtx.fillRect(ax, HORIZON - 68, 1, 7);
    }

    // Street Lamps
    skyLCtx.fillStyle = C.night ? "#3D1B2E" : C.near;
    for (const x of allLamps) {
      skyLCtx.fillRect(x, HORIZON - 11, 1, 11);
      skyLCtx.fillRect(x, HORIZON - 12, 3, 1);
    }

    // Ground line
    skyLCtx.fillStyle = C.ink;
    skyLCtx.fillRect(0, HORIZON, W, 2);
    skyLCtx.fillStyle = C.crust;
    skyLCtx.fillRect(0, HORIZON + 2, W, 2);

    // Dynamic Clouds
    const numClouds = Math.max(5, Math.round((W / 384) * 5));
    const clouds: { x: number; y: number; s: number; speed: number; layer: number }[] = [];
    const rCloud = rng(77);
    for (let i = 0; i < numClouds; i++) {
      clouds.push({
        x: Math.floor(rCloud() * W),
        y: 12 + Math.floor(rCloud() * 40),
        s: rCloud() > 0.5 ? 3 : 2,
        speed: 0.15 + rCloud() * 0.25,
        layer: rCloud() > 0.5 ? 1 : 0,
      });
    }

    // Interactive Systems State
    type Star = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; len: number };
    const shootingStars: Star[] = [];
    let nextAmbientStar = performance.now() + 4000 + Math.random() * 5000;

    type Spark = { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string };
    const sparks: Spark[] = [];

    type Wave = { x: number; y: number; r: number; maxR: number; opacity: number };
    const signalWaves: Wave[] = [];
    let lastWaveSpawn = 0;

    let bellEnergy = 0.0;
    let lastProcessedClick = 0;

    const probedMap = new Float64Array(windows.length);

    // Star twinkling definitions
    const starsList: { x: number; y: number; bright: boolean; phase: number }[] = [];
    const rStars = rng(42);
    const numStars = Math.floor((W / 384) * 80);
    for (let i = 0; i < numStars; i++) {
      starsList.push({
        x: Math.floor(rStars() * W),
        y: Math.floor(rStars() * (HORIZON - 26)),
        bright: rStars() > 0.6,
        phase: rStars() * Math.PI * 2,
      });
    }

    const mousePos = { x: -1000, y: -1000, active: false, clickX: -1000, clickY: -1000, clickTime: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = (container.clientHeight || dimensions.height || 180) / H;
      mousePos.x = (e.clientX - rect.left) / s;
      mousePos.y = (e.clientY - rect.top) / s;
      mousePos.active = true;
    };

    const handleMouseLeave = () => {
      mousePos.x = -1000;
      mousePos.y = -1000;
      mousePos.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const s = (container.clientHeight || dimensions.height || 180) / H;
      mousePos.clickX = (e.clientX - rect.left) / s;
      mousePos.clickY = (e.clientY - rect.top) / s;
      mousePos.clickTime = performance.now();
    };

    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    container.addEventListener("click", handleClick, { passive: true });

    // Animation Loop
    const frame = (now: number) => {
      const t = now * 0.001;

      // Process Clicks
      if (mousePos.clickTime > lastProcessedClick) {
        lastProcessedClick = mousePos.clickTime;
        const cx = mousePos.clickX;
        const cy = mousePos.clickY;

        // Click in sky -> spawn shooting star radiating from click
        if (cy < HORIZON - 15) {
          shootingStars.push({
            x: cx,
            y: cy,
            vx: 3.8 + Math.random() * 1.4,
            vy: 1.8 + Math.random() * 0.8,
            life: 0,
            maxLife: 24,
            len: 12 + Math.floor(Math.random() * 8),
          });
          // Starburst sparks on launch
          for (let k = 0; k < 6; k++) {
            sparks.push({
              x: cx,
              y: cy,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              life: 0,
              maxLife: 12 + Math.floor(Math.random() * 8),
              color: Math.random() > 0.5 ? "#FFF5B8" : "#FFA0A9",
            });
          }
        }

        // Click near church spire -> excited bell chime
        for (const s of allSpires) {
          if (Math.abs(cx - (s.x + 6)) < 16 && cy < HORIZON) {
            bellEnergy = 3.2;
          }
        }

        // Click near antenna -> signal wave burst
        for (const ax of allAntennas) {
          if (Math.abs(cx - ax) < 18) {
            signalWaves.push({ x: ax, y: HORIZON - 68, r: 2, maxR: 44, opacity: 1.0 });
          }
        }
      }

      // Ambient Shooting Stars
      if (C.night && now > nextAmbientStar) {
        shootingStars.push({
          x: Math.floor(Math.random() * (W * 0.7)),
          y: 4 + Math.floor(Math.random() * 18),
          vx: 3.6 + Math.random() * 1.4,
          vy: 1.8 + Math.random() * 0.8,
          life: 0,
          maxLife: 26,
          len: 10 + Math.floor(Math.random() * 8),
        });
        nextAmbientStar = now + 7000 + Math.random() * 8000;
      }

      // Antenna hover signal broadcast
      for (const ax of allAntennas) {
        if (mousePos.active && Math.abs(mousePos.x - ax) < 14 && mousePos.y < HORIZON - 20) {
          if (now - lastWaveSpawn > 450) {
            signalWaves.push({ x: ax, y: HORIZON - 68, r: 3, maxR: 40, opacity: 1.0 });
            lastWaveSpawn = now;
          }
        }
      }

      // Spire hover bell excitement
      for (const s of allSpires) {
        if (mousePos.active && Math.abs(mousePos.x - (s.x + 6)) < 14 && mousePos.y < HORIZON) {
          bellEnergy = Math.min(3.0, bellEnergy + 0.12);
        }
      }
      bellEnergy = Math.max(0, bellEnergy * 0.965 - 0.003);

      ctx.drawImage(skyCanvas, 0, 0);

      // Star Twinkling
      if (C.night) {
        for (const st of starsList) {
          const tw = Math.sin(t * 2.2 + st.phase);
          if (tw > 0.45) {
            ctx.fillStyle = st.bright ? "#FFFFFF" : "#FFE7A3";
            ctx.fillRect(st.x, st.y, 1, 1);
          } else if (tw > -0.2) {
            ctx.fillStyle = st.bright ? "#F3E7CC" : "#94799C";
            ctx.fillRect(st.x, st.y, 1, 1);
          } else {
            ctx.fillStyle = "#5B4463";
            ctx.fillRect(st.x, st.y, 1, 1);
          }
        }
      }

      // Moon Aura Glow on hover
      if (C.night && mousePos.active) {
        const mx = Math.round(W * 0.84);
        const my = 26;
        const dMoon = Math.hypot(mousePos.x - mx, mousePos.y - my);
        if (dMoon < 32) {
          const auraPulse = Math.sin(t * 4) * 0.2 + 0.8;
          ctx.fillStyle = `rgba(255, 245, 220, ${0.16 * auraPulse})`;
          ctx.beginPath();
          ctx.arc(mx, my, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life++;
        if (sp.life > sp.maxLife || sp.x < 0 || sp.x >= W || sp.y >= HORIZON) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.fillStyle = sp.color;
        ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 1, 1);
      }

      // Draw Shooting Stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life++;
        if (star.life > star.maxLife || star.x > W + 20 || star.y > HORIZON - 10) {
          // Impact sparkle
          if (star.y <= HORIZON) {
            for (let k = 0; k < 4; k++) {
              sparks.push({
                x: star.x,
                y: star.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 0,
                maxLife: 10 + Math.floor(Math.random() * 6),
                color: "#FFF5B8",
              });
            }
          }
          shootingStars.splice(i, 1);
          continue;
        }
        const prog = star.life / star.maxLife;
        for (let l = 0; l < star.len; l++) {
          const sx = Math.round(star.x - (l * star.vx) / 3);
          const sy = Math.round(star.y - (l * star.vy) / 3);
          if (sx < 0 || sx >= W || sy < 0 || sy >= HORIZON) continue;
          if (l === 0) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(sx, sy, 1, 1);
          } else if (l < 4) {
            ctx.fillStyle = prog < 0.6 ? "#FFE7A3" : "#FFA0A9";
            ctx.fillRect(sx, sy, 1, 1);
          } else if (l % 2 === 0) {
            ctx.fillStyle = "#6B2C4B";
            ctx.fillRect(sx, sy, 1, 1);
          }
        }
      }

      // Clouds
      for (const cl of clouds) {
        const cx = Math.floor((cl.x + t * cl.speed * 20) % (W + 60)) - 30;
        drawCloud(ctx, cx, cl.y, cl.s, C);
      }

      ctx.drawImage(skylineCanvas, 0, 0);

      // Windows (with phosphor decay)
      const slot = Math.floor(t / 2.6);
      for (const w of windows) {
        const p = hash2(w.i, slot);

        if (mousePos.active) {
          const dScan = Math.hypot(w.x + w.w / 2 - mousePos.x, w.y + w.h / 2 - mousePos.y);
          if (dScan < 24) {
            probedMap[w.i] = now;
          }
        }

        const timeSinceProbed = now - (probedMap[w.i] || 0);
        const isProbed = timeSinceProbed < 350;

        if (isProbed) {
          const fade = 1 - timeSinceProbed / 350;
          ctx.fillStyle = C.night ? (fade > 0.5 ? "#FFF5B8" : "#E8A848") : "#D61F34";
          ctx.fillRect(w.x, w.y, w.w, w.h);
        } else if (C.night) {
          const lit = w.far ? p > 0.42 : p > 0.25;
          if (lit) {
            ctx.fillStyle = w.far ? C.winFar : p > 0.72 ? C.win2 : C.win;
            ctx.fillRect(w.x, w.y, w.w, w.h);
          } else {
            ctx.fillStyle = C.winOff;
            ctx.fillRect(w.x, w.y, w.w, w.h);
          }
        } else {
          const lit = p > 0.58;
          ctx.fillStyle = lit ? (w.far ? C.winFar : C.win) : C.winOff;
          ctx.fillRect(w.x, w.y, w.w, w.h);
        }
      }

      // School interactive entrance glow
      for (const s of allSchools) {
        if (mousePos.active && Math.abs(mousePos.x - (s.x + s.w / 2)) < s.w / 2 + 8 && mousePos.y < HORIZON) {
          ctx.fillStyle = C.night ? "rgba(255, 217, 143, 0.45)" : "rgba(214, 31, 52, 0.35)";
          ctx.fillRect(s.x + s.w / 2 - 4, HORIZON - 10, 8, 10);
        }
      }

      // Subtle rooftop steam particle drifts
      const steamPhase = (t * 1.2) % 3;
      for (const b of allMid) {
        const fixture = hash2(b.x, b.w);
        if (fixture > 0.62) {
          const vx = b.x + 6 + Math.round(Math.sin(t * 1.5 + b.x) * 1.5);
          const vy = Math.round(HORIZON - 2 - b.h - 8 - steamPhase * 3);
          const alpha = Math.max(0, 0.4 - steamPhase * 0.12);
          if (vy > 10) {
            ctx.fillStyle = C.night ? `rgba(148, 121, 156, ${alpha})` : `rgba(180, 190, 180, ${alpha})`;
            ctx.fillRect(vx, vy, 1, 1);
          }
        }
      }

      // Church bell swinging in belfry (with kinetic excitement)
      const bellSpeed = 1.8 + bellEnergy * 3.6;
      const bellAmp = 2 + Math.round(bellEnergy * 2.2);
      const phase = Math.sin(t * bellSpeed);
      const tilt = Math.round(phase * bellAmp);
      const half = Math.round(phase * Math.max(1, Math.round(bellAmp / 2)));

      for (const s of allSpires) {
        const bellX = s.x + 3,
          bellY = HORIZON - 39;
        ctx.fillStyle = C.bellDim;
        ctx.fillRect(s.x + 5, bellY - 1, 2, 1);
        ctx.fillStyle = C.bell;
        ctx.fillRect(bellX + 2 + half, bellY, 1, 1);
        ctx.fillRect(bellX + 1 + half, bellY + 1, 3, 2);
        ctx.fillRect(bellX + tilt, bellY + 3, 5, 2);
        ctx.fillStyle = C.bellDim;
        ctx.fillRect(bellX + tilt, bellY + 5, 5, 1);
        ctx.fillRect(bellX + 2 + tilt, bellY + 6, 1, 1);
      }

      // Chime waves when bell is excited
      if (bellEnergy > 0.6) {
        const chimeAlpha = Math.min(0.8, (bellEnergy - 0.6) * 0.5);
        ctx.fillStyle = C.night ? `rgba(255, 217, 143, ${chimeAlpha})` : `rgba(185, 143, 58, ${chimeAlpha})`;
        for (const s of allSpires) {
          const bx = s.x + 6;
          const by = HORIZON - 36;
          const chimeR = Math.round(((t * 8) % 1) * 16) + 4;
          for (let a = -Math.PI * 0.9; a <= -Math.PI * 0.1; a += 0.35) {
            const px = Math.round(bx + Math.cos(a) * chimeR);
            const py = Math.round(by + Math.sin(a) * chimeR);
            if (px >= 0 && px < W && py >= 0 && py < HORIZON) {
              ctx.fillRect(px, py, 1, 1);
            }
          }
        }
      }

      // Lamp Glows
      for (const x of allLamps) {
        if (C.night && C.lampGlow) {
          ctx.fillStyle = C.lampGlow;
          for (let i = 0; i < 4; i++) ctx.fillRect(x - 1 - i * 2, HORIZON - 10 + i * 3, 5 + i * 4, 3);
        }
        ctx.fillStyle = C.lamp;
        ctx.fillRect(x + 1, HORIZON - 12, 2, 2);
      }

      // Swaying Grass
      const numGrass = Math.floor(W / 11);
      for (let i = 0; i < numGrass; i++) {
        const x = 4 + i * 11 + ((i * 7) % 5);
        const sway = Math.round(Math.sin(t * 1.6 + i) * 1);
        ctx.fillStyle = i % 3 === 0 ? C.grass : C.grassDim;
        ctx.fillRect(x, HORIZON - 2, 1, 2);
        ctx.fillRect(x + sway, HORIZON - 4, 1, 2);
      }

      // Antenna Beacons & Signal Waves
      for (const ax of allAntennas) {
        const beacon = Math.sin(t * 2.4 + ax) > 0;
        ctx.fillStyle = beacon ? C.sigHi : C.sigDim;
        ctx.fillRect(ax, HORIZON - 69, 1, 2);
        if (beacon) {
          ctx.fillStyle = C.sig;
          ctx.fillRect(ax - 1, HORIZON - 68, 3, 1);
        }
      }

      // Draw Signal Waves
      for (let i = signalWaves.length - 1; i >= 0; i--) {
        const wave = signalWaves[i];
        wave.r += 1.2;
        wave.opacity = Math.max(0, 1 - wave.r / wave.maxR);
        if (wave.r >= wave.maxR || wave.opacity <= 0) {
          signalWaves.splice(i, 1);
          continue;
        }
        const rInt = Math.round(wave.r);
        ctx.fillStyle = C.night ? `rgba(255, 112, 128, ${wave.opacity * 0.85})` : `rgba(214, 31, 52, ${wave.opacity * 0.85})`;
        for (let a = -Math.PI * 0.85; a <= -Math.PI * 0.15; a += 0.22) {
          const px = Math.round(wave.x + Math.cos(a) * rInt);
          const py = Math.round(wave.y + Math.sin(a) * rInt);
          if (px >= 0 && px < W && py >= 0 && py < HORIZON) {
            ctx.fillRect(px, py, 1, 1);
          }
        }
      }

      if (!reduced && visible) raf = requestAnimationFrame(frame);
    };

    frame(performance.now());

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !reduced) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleClick);
    };
  }, [theme, dimensions.width, dimensions.height]);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          border: "none",
          margin: 0,
          padding: 0,
          background: "transparent",
        }}
        role="img"
        aria-label="Pixel-art city skyline: night town silhouette with school, church spire, antenna mast, moon and stars."
      />
    </div>
  );
}
