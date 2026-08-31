"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PixelSkyline — Above-ground only crop of the immutable HACKUJ pixel-art city panorama.
 *
 * Contains:
 * - Night sky with moon and stars
 * - Drifting procedural clouds
 * - City skyline (distant and mid-ground blocks, school, church spire with swinging bell, antenna tower)
 * - Warm flickering windows and street lamps with pavement glow
 * - Swaying grass tufts along the surface line
 *
 * Strictly ends at surface/street level (y = 108) with zero underground elements.
 */

const W = 384;
const H = 108; // Exact surface/street boundary
const HORIZON = 104;

type Palette = {
  sky: string[]; cloud: string; cloudShade: string;
  far: string; farRoof: string; mid: string; near: string; roof: string;
  win: string; win2: string; winOff: string; winFar: string;
  ink: string; crust: string; soil: string; soil2: string; soil3: string;
  rock: string; rockHi: string; root: string;
  metal: string; metalHi: string; screen: string;
  grass: string; grassDim: string;
  sig: string; sigHi: string; sigDim: string;
  lamp: string; lampGlow: string | null; bell: string; bellDim: string;
  night: boolean;
};

const DAY: Palette = {
  sky: ["#EDF0EA", "#E5E9E1", "#DCE0D9", "#D1D6CE", "#C4CAC1"],
  cloud: "#F4F6F1", cloudShade: "#D8DDD5",
  far: "#AAB3A8", farRoof: "#98A296", mid: "#808F85", near: "#55605A", roof: "#4E1B36",
  win: "#EDF0EA", win2: "#DFE5DC", winOff: "#BCC5BA", winFar: "#C6CEC4",
  ink: "#31081F", crust: "#4E1B36", soil: "#31081F", soil2: "#40122A", soil3: "#4A1730",
  rock: "#5A2440", rockHi: "#6E3253", root: "#5A2440",
  metal: "#4E1B36", metalHi: "#6A2B49", screen: "#240616",
  grass: "#808F85", grassDim: "#55605A",
  sig: "#D61F34", sigHi: "#F4707E", sigDim: "#8E1322",
  lamp: "#55605A", lampGlow: null, bell: "#B98F3A", bellDim: "#6E5525",
  night: false,
};

const NIGHT: Palette = {
  sky: ["#12030A", "#190410", "#210617", "#2B0A1E", "#380F27"],
  cloud: "#2E0C20", cloudShade: "#24081A",
  far: "#3E1229", farRoof: "#320E21", mid: "#4E1B36", near: "#5F2542", roof: "#2B0A1B",
  win: "#FFD98F", win2: "#F5BE62", winOff: "#2A1020", winFar: "#C79A55",
  ink: "#6B2C4B", crust: "#2B0A1B", soil: "#12030A", soil2: "#1E0512", soil3: "#1E0512",
  rock: "#361024", rockHi: "#481830", root: "#361024",
  metal: "#3A1227", metalHi: "#56213B", screen: "#0A0206",
  grass: "#55605A", grassDim: "#3D4842",
  sig: "#FF3247", sigHi: "#FFA0A9", sigDim: "#9E1526",
  lamp: "#FFC978", lampGlow: "rgba(255,201,120,.10)", bell: "#D8A748", bellDim: "#7A5C22",
  night: true,
};

function resolveTheme(): "light" | "dark" {
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark") return "dark";
  if (attr === "light") return "light";
  return "dark";
}

type Box = { x: number; w: number; h: number };

const FAR: Box[] = [
  { x: 2, w: 20, h: 26 }, { x: 24, w: 14, h: 34 }, { x: 40, w: 22, h: 22 }, { x: 86, w: 22, h: 24 },
  { x: 112, w: 16, h: 36 }, { x: 130, w: 18, h: 28 }, { x: 194, w: 16, h: 30 }, { x: 214, w: 18, h: 26 },
  { x: 236, w: 16, h: 34 }, { x: 256, w: 20, h: 22 }, { x: 306, w: 16, h: 28 }, { x: 324, w: 18, h: 32 },
  { x: 344, w: 16, h: 24 }, { x: 364, w: 18, h: 30 },
];
const MID: Box[] = [
  { x: 10, w: 28, h: 40 }, { x: 90, w: 30, h: 46 }, { x: 202, w: 26, h: 38 },
  { x: 234, w: 32, h: 44 }, { x: 328, w: 28, h: 36 },
];
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const BLEND = 7;

const SCHOOL = { x: 140, w: 52, h: 34 };
const SPIRE = { x: 64, w: 12, h: 46 };
const LAMPS = [32, 118, 208, 268, 352];

const OCCLUDERS: { x: number; w: number; top: number }[] = [
  ...MID.map(b => ({ x: b.x - 1, w: b.w + 2, top: HORIZON - 2 - b.h })),
  { x: SCHOOL.x - 3, w: SCHOOL.w + 6, top: HORIZON - SCHOOL.h - 13 },
  { x: SPIRE.x - 1, w: SPIRE.w + 2, top: HORIZON - SPIRE.h - 14 },
];
function hiddenBehindFront(x: number, y: number, w: number, h: number) {
  return OCCLUDERS.some(o => x + w > o.x && x < o.x + o.w && y + h > o.top);
}

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

function buildWindows(): Win[] {
  const out: Win[] = [];
  let i = 0;
  for (const b of FAR) {
    const top = HORIZON - 6 - b.h;
    for (let y = top + 4; y < HORIZON - 9; y += 5) {
      for (let x = b.x + 3; x <= b.x + b.w - 4; x += 4) {
        if (!hiddenBehindFront(x, y, 2, 2)) out.push({ x, y, w: 2, h: 2, i: i++, far: true });
      }
    }
  }
  for (const b of MID) {
    const top = HORIZON - 2 - b.h;
    for (let y = top + 6; y < HORIZON - 8; y += 7) {
      for (let x = b.x + 4; x <= b.x + b.w - 7; x += 7) out.push({ x, y, w: 3, h: 4, i: i++, far: false });
    }
  }
  const by = HORIZON - SCHOOL.h;
  for (let y = by + 7; y < HORIZON - 10; y += 10) {
    for (let x = SCHOOL.x + 5; x <= SCHOOL.x + SCHOOL.w - 9; x += 8) out.push({ x, y, w: 5, h: 6, i: i++, far: false });
  }
  for (let y = HORIZON - 28; y < HORIZON - 12; y += 9) {
    out.push({ x: SPIRE.x + 4, y, w: 3, h: 5, i: i++, far: false });
  }
  return out;
}
const WINDOWS = buildWindows();

function makeLayer() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return { canvas: c, ctx: c.getContext("2d")! };
}

function paintSky(g: CanvasRenderingContext2D, C: Palette) {
  const bands = C.sky.length;
  const step = HORIZON / bands;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = C.sky[i];
    g.fillRect(0, Math.floor(i * step), W, Math.ceil(step) + 1);
    if (i < bands - 1) {
      g.fillStyle = C.sky[i + 1];
      const edge = Math.floor((i + 1) * step);
      for (let dy = 0; dy < BLEND; dy++) {
        const y = edge - BLEND + dy;
        if (y < 0) continue;
        const level = (dy + 1) / (BLEND + 1);
        for (let x = 0; x < W; x++) if (BAYER[y & 3][x & 3] / 16 < level) g.fillRect(x, y, 1, 1);
      }
    }
  }
  if (!C.night) return;

  const r = rng(19);
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * (HORIZON - 26));
    const v = r();
    g.fillStyle = v > 0.84 ? "#F3E7CC" : v > 0.45 ? "#94799C" : "#5B4463";
    g.fillRect(x, y, 1, 1);
  }
  const mx = 320, my = 26, rad = 9;
  g.fillStyle = "#F5EBD2";
  for (let y = -rad; y <= rad; y++) {
    const half = Math.floor(Math.sqrt(rad * rad - y * y));
    g.fillRect(mx - half, my + y, half * 2 + 1, 1);
  }
  g.fillStyle = "#E0D2B4";
  g.fillRect(mx - 4, my - 3, 3, 2);
  g.fillRect(mx + 1, my + 2, 4, 3);
  g.fillRect(mx - 2, my + 5, 2, 2);
}

function gableRoof(g: CanvasRenderingContext2D, x: number, w: number, baseY: number, height: number) {
  for (let i = 0; i < height; i++) {
    const rowWidth = Math.max(2, Math.round((w * (i + 1)) / height));
    g.fillRect(x + Math.round((w - rowWidth) / 2), baseY - height + i, rowWidth, 1);
  }
}

function paintSkylineWorld(g: CanvasRenderingContext2D, C: Palette) {
  const r = rng(11);

  // Distant blocks
  for (const b of FAR) {
    const top = HORIZON - 6 - b.h;
    g.fillStyle = C.far;
    g.fillRect(b.x, top, b.w, b.h);
    g.fillStyle = C.farRoof;
    g.fillRect(b.x, top, b.w, 1);
  }

  // Front blocks
  for (const b of MID) {
    const top = HORIZON - 2 - b.h;
    g.fillStyle = C.mid;
    g.fillRect(b.x, top, b.w, b.h);
    g.fillStyle = C.roof;
    g.fillRect(b.x - 1, top, b.w + 2, 2);
    const fixture = r();
    if (fixture > 0.62) {
      g.fillRect(b.x + 5, top - 5, 3, 5);
      g.fillRect(b.x + 4, top - 6, 5, 1);
    } else if (fixture > 0.3) {
      g.fillRect(b.x + b.w - 10, top - 4, 7, 4);
      g.fillRect(b.x + b.w - 8, top - 7, 1, 3);
    } else {
      g.fillRect(b.x + b.w - 6, top - 8, 1, 8);
    }
  }

  // Church Spire
  const sx = SPIRE.x;
  g.fillStyle = C.near;
  g.fillRect(sx, HORIZON - SPIRE.h, SPIRE.w, SPIRE.h);
  g.fillStyle = C.roof;
  gableRoof(g, sx, SPIRE.w, HORIZON - SPIRE.h, 14);
  g.fillRect(sx + SPIRE.w / 2 - 1, HORIZON - SPIRE.h - 20, 2, 7);
  g.fillRect(sx + SPIRE.w / 2 - 3, HORIZON - SPIRE.h - 18, 6, 1);
  g.fillStyle = C.near;
  g.fillRect(sx - 1, HORIZON - SPIRE.h, SPIRE.w + 2, 2);
  const belfryX = sx + 2, belfryW = SPIRE.w - 4, belfryY = HORIZON - 42;
  g.fillStyle = C.screen;
  g.fillRect(belfryX + 2, belfryY, belfryW - 4, 1);
  g.fillRect(belfryX + 1, belfryY + 1, belfryW - 2, 1);
  g.fillRect(belfryX, belfryY + 2, belfryW, 10);
  g.fillStyle = C.roof;
  g.fillRect(belfryX - 1, belfryY + 12, belfryW + 2, 2);

  // School
  const bx = SCHOOL.x, bw = SCHOOL.w, bh = SCHOOL.h, by = HORIZON - bh;
  g.fillStyle = C.near;
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = C.roof;
  gableRoof(g, bx, bw, by, 13);
  g.fillRect(bx - 3, by - 1, bw + 6, 2);
  g.fillRect(bx + bw / 2 - 4, HORIZON - 10, 8, 10);
  g.fillStyle = C.near;
  g.fillRect(bx + bw / 2 - 2, HORIZON - 8, 4, 8);

  // Antenna Tower
  const ax = 292;
  g.fillStyle = C.near;
  for (let y = HORIZON - 1; y > HORIZON - 60; y -= 1) {
    const spread = Math.round(((y - (HORIZON - 60)) / 60) * 5);
    const step = (HORIZON - y) % 8;
    g.fillRect(ax - spread, y, 1, 1);
    g.fillRect(ax + spread, y, 1, 1);
    if (step === 0) g.fillRect(ax - spread, y, spread * 2 + 1, 1);
    else if (step === 4 && spread > 1) {
      g.fillRect(ax - Math.round(spread / 2), y, 1, 1);
      g.fillRect(ax + Math.round(spread / 2), y, 1, 1);
    }
  }
  g.fillRect(ax, HORIZON - 68, 1, 7);

  // Street Lamps
  g.fillStyle = C.night ? "#3D1B2E" : C.near;
  for (const x of LAMPS) {
    g.fillRect(x, HORIZON - 11, 1, 11);
    g.fillRect(x, HORIZON - 12, 3, 1);
  }

  // Surface street line (stopping cleanly at horizon/crust, no underground)
  g.fillStyle = C.ink;
  g.fillRect(0, HORIZON, W, 2);
  g.fillStyle = C.crust;
  g.fillRect(0, HORIZON + 2, W, 2);
}

const CLOUDS = [
  { x: 30, y: 16, s: 3, layer: 0 }, { x: 210, y: 22, s: 2, layer: 0 }, { x: 320, y: 12, s: 3, layer: 0 },
  { x: 110, y: 44, s: 2, layer: 1 }, { x: 268, y: 50, s: 3, layer: 1 },
];

function drawCloud(g: CanvasRenderingContext2D, x: number, y: number, s: number, C: Palette) {
  const u = s;
  g.fillStyle = C.cloud;
  g.fillRect(x, y + u, 7 * u, 2 * u);
  g.fillRect(x + 2 * u, y, 4 * u, u);
  g.fillRect(x + u, y + 3 * u, 5 * u, u);
  g.fillStyle = C.cloudShade;
  g.fillRect(x + u, y + 3 * u, 5 * u, 1);
}

export function PixelSkyline({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const sync = () => setTheme(resolveTheme());
    sync();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { mq.removeEventListener("change", sync); observer.disconnect(); };
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const C = theme === "dark" ? NIGHT : DAY;
    const sky = makeLayer();
    const world = makeLayer();
    paintSky(sky.ctx, C);
    paintSkylineWorld(world.ctx, C);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;

    const frame = (ms: number) => {
      const t = reduced ? 2.4 : ms / 1000;
      ctx.drawImage(sky.canvas, 0, 0);

      // Clouds
      for (const c of CLOUDS) {
        const speed = c.layer === 0 ? 2.4 : 5.2;
        const span = W + 40;
        const x = Math.round((((c.x + t * speed) % span) + span) % span) - 30;
        drawCloud(ctx, x, c.y, c.s, C);
      }

      ctx.drawImage(world.canvas, 0, 0);

      // Windows
      for (const w of WINDOWS) {
        if (C.night) {
          const slot = Math.floor(t / 7 + w.i * 0.41);
          const lit = hash2(w.i, slot) > (w.far ? 0.5 : 0.4);
          if (lit) ctx.fillStyle = w.far ? C.winFar : (hash2(w.i, slot + 977) > 0.55 ? C.win : C.win2);
          else ctx.fillStyle = C.winOff;
        } else {
          ctx.fillStyle = w.far ? C.winFar : (hash2(w.i, 3) > 0.75 ? C.win2 : C.win);
        }
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }

      // School clock
      ctx.fillStyle = C.night ? C.win : C.win2;
      ctx.fillRect(SCHOOL.x + SCHOOL.w / 2 - 2, HORIZON - SCHOOL.h - 9, 4, 4);
      ctx.fillStyle = C.night ? "#5A3A12" : C.ink;
      ctx.fillRect(SCHOOL.x + SCHOOL.w / 2, HORIZON - SCHOOL.h - 8, 1, 2);

      // Church bell
      const swing = Math.sin(t * 1.7);
      const tilt = Math.round(swing * 1.4);
      const half = Math.round(swing * 0.7);
      const bellX = SPIRE.x + 3, bellY = HORIZON - 39;
      ctx.fillStyle = C.bellDim;
      ctx.fillRect(SPIRE.x + 5, bellY - 1, 2, 1);
      ctx.fillStyle = C.bell;
      ctx.fillRect(bellX + 2 + half, bellY, 1, 1);
      ctx.fillRect(bellX + 1 + half, bellY + 1, 3, 2);
      ctx.fillRect(bellX + tilt, bellY + 3, 5, 2);
      ctx.fillStyle = C.bellDim;
      ctx.fillRect(bellX + tilt, bellY + 5, 5, 1);
      ctx.fillRect(bellX + 2 + tilt, bellY + 6, 1, 1);

      // Street lamps
      for (const x of LAMPS) {
        if (C.night && C.lampGlow) {
          ctx.fillStyle = C.lampGlow;
          for (let i = 0; i < 4; i++) ctx.fillRect(x - 1 - i * 2, HORIZON - 10 + i * 3, 5 + i * 4, 3);
        }
        ctx.fillStyle = C.lamp;
        ctx.fillRect(x + 1, HORIZON - 12, 2, 2);
      }

      // Grass tufts along surface
      for (let i = 0; i < 34; i++) {
        const x = 4 + i * 11 + ((i * 7) % 5);
        const sway = Math.round(Math.sin(t * 1.6 + i) * 1);
        ctx.fillStyle = i % 3 === 0 ? C.grass : C.grassDim;
        ctx.fillRect(x, HORIZON - 2, 1, 2);
        ctx.fillRect(x + sway, HORIZON - 4, 1, 2);
      }

      // Antenna beacon
      const beacon = Math.sin(t * 2.4) > 0;
      ctx.fillStyle = beacon ? C.sigHi : C.sigDim;
      ctx.fillRect(292, HORIZON - 69, 1, 2);
      if (beacon) {
        ctx.fillStyle = C.sig;
        ctx.fillRect(291, HORIZON - 68, 3, 1);
      }

      if (!reduced && visible) raf = requestAnimationFrame(frame);
    };

    frame(performance.now());

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    }, { threshold: 0 });
    io.observe(canvas);

    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [theme]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      className={className}
      role="img"
      aria-label="Pixel-art city skyline: night town silhouette with school, church spire, antenna mast, moon and stars."
    />
  );
}
