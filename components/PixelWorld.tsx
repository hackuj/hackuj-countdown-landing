"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Procedural pixel-art cross-section, drawn on a low-resolution canvas and scaled up with
 * image-rendering:pixelated. Above the ground line is the visible town; below it is the
 * infrastructure the platform actually teaches — conduits, a rack, and a buried flag.
 *
 * Rendered in code rather than shipped as a video: a few KB, crisp at any width, endlessly
 * loopable, and locked to the product palette. Static layers are pre-rendered once to offscreen
 * canvases; each frame composites those and draws only the moving parts.
 *
 * Light theme renders the town by day, dark theme by night — at night the windows light up and
 * switch over time, street lamps pool light on the ground, and a moon and stars come out.
 */

const W = 384;
const H = 176;
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

/** Day palette, derived from the product tokens: sage sky, aubergine earth, red signal. */
const DAY: Palette = {
  sky: ["#DCE0D9", "#D3D9CF", "#CAD1C6", "#C0C8BC", "#B5BEB1"],
  cloud: "#F4F6F1", cloudShade: "#CBD1C7",
  far: "#9CA699", farRoof: "#8C9689", mid: "#768277", near: "#525E56", roof: "#4E1B36",
  win: "#DCE0D9", win2: "#D1D8CE", winOff: "#AAB3A7", winFar: "#B7BFB4",
  ink: "#31081F", crust: "#4E1B36", soil: "#31081F", soil2: "#40122A", soil3: "#4A1730",
  rock: "#5A2440", rockHi: "#6E3253", root: "#5A2440",
  metal: "#4E1B36", metalHi: "#6A2B49", screen: "#240616",
  grass: "#768277", grassDim: "#525E56",
  sig: "#D61F34", sigHi: "#F4707E", sigDim: "#8E1322",
  lamp: "#525E56", lampGlow: null, bell: "#B98F3A", bellDim: "#6E5525",
  night: false,
};

/** Night palette: the same town after dark. Lit windows are warm yellow only — never blue. */
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

type Pt = { x: number; y: number };
type Box = { x: number; w: number; h: number };

// Back layer: distant blocks. They now carry sparse windows so the skyline is never bare.
const FAR: Box[] = [
  { x: 2, w: 20, h: 26 }, { x: 24, w: 14, h: 34 }, { x: 40, w: 22, h: 22 }, { x: 86, w: 22, h: 24 },
  { x: 112, w: 16, h: 36 }, { x: 130, w: 18, h: 28 }, { x: 194, w: 16, h: 30 }, { x: 214, w: 18, h: 26 },
  { x: 236, w: 16, h: 34 }, { x: 256, w: 20, h: 22 }, { x: 306, w: 16, h: 28 }, { x: 324, w: 18, h: 32 },
  { x: 344, w: 16, h: 24 }, { x: 364, w: 18, h: 30 },
];
// Front layer: taller blocks with a full window grid and a rooftop detail.
const MID: Box[] = [
  { x: 10, w: 28, h: 40 }, { x: 90, w: 30, h: 46 }, { x: 202, w: 26, h: 38 },
  { x: 234, w: 32, h: 44 }, { x: 328, w: 28, h: 36 },
];
// 4x4 ordered dither matrix: blends sky bands smoothly instead of leaving a dashed seam.
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const BLEND = 7;

const SCHOOL = { x: 140, w: 52, h: 34 };
const SPIRE = { x: 64, w: 12, h: 46 };
const LAMPS = [32, 118, 208, 268, 352];

/**
 * Front-layer silhouettes. Windows are painted after the buildings, so any distant window sitting
 * behind one of these must be dropped at build time or it shows through the block in front of it.
 */
const OCCLUDERS: { x: number; w: number; top: number }[] = [
  ...MID.map(b => ({ x: b.x - 1, w: b.w + 2, top: HORIZON - 2 - b.h })),
  { x: SCHOOL.x - 3, w: SCHOOL.w + 6, top: HORIZON - SCHOOL.h - 13 },
  { x: SPIRE.x - 1, w: SPIRE.w + 2, top: HORIZON - SPIRE.h - 14 },
];
function hiddenBehindFront(x: number, y: number, w: number, h: number) {
  return OCCLUDERS.some(o => x + w > o.x && x < o.x + o.w && y + h > o.top);
}

/** Deterministic PRNG so the town looks hand-placed and never changes between renders. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 2-argument hash — drives which windows are lit during which time slice. */
function hash2(a: number, b: number) {
  let h = Math.imul(a * 374761393 + b * 668265263, 1274126177);
  h = (h ^ (h >>> 13)) >>> 0;
  return h / 4294967296;
}

type Win = { x: number; y: number; w: number; h: number; i: number; far: boolean };

/**
 * Window positions live outside the static layer so each one can be lit independently per frame.
 * Distant blocks get small windows; front blocks, the school and the spire get real panes.
 */
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

// Cable runs: surface -> trunk -> rack, rack -> buried flag vault, and the junction box spur.
const PATH_A: Pt[] = [{ x: 166, y: HORIZON }, { x: 166, y: 120 }, { x: 264, y: 120 }, { x: 264, y: 130 }];
const PATH_B: Pt[] = [{ x: 292, y: HORIZON }, { x: 292, y: 120 }, { x: 264, y: 120 }];
const PATH_C: Pt[] = [{ x: 252, y: 148 }, { x: 108, y: 148 }, { x: 108, y: 140 }];
const PATH_D: Pt[] = [{ x: 194, y: 120 }, { x: 194, y: 132 }];

function pathLength(p: Pt[]) {
  let l = 0;
  for (let i = 1; i < p.length; i++) l += Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y);
  return l;
}
function pointAt(p: Pt[], d: number): Pt {
  for (let i = 1; i < p.length; i++) {
    const seg = Math.abs(p[i].x - p[i - 1].x) + Math.abs(p[i].y - p[i - 1].y);
    if (d <= seg) {
      const t = seg === 0 ? 0 : d / seg;
      return { x: Math.round(p[i - 1].x + (p[i].x - p[i - 1].x) * t), y: Math.round(p[i - 1].y + (p[i].y - p[i - 1].y) * t) };
    }
    d -= seg;
  }
  return p[p.length - 1];
}

function makeLayer() {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  return { canvas: c, ctx: c.getContext("2d")! };
}

/** Sky only — clouds are drawn between this layer and the town. */
function paintSky(g: CanvasRenderingContext2D, C: Palette) {
  if (!C.night) {
    // Day mode: clean solid paper background matching the hero seamlessly
    g.fillStyle = C.sky[0];
    g.fillRect(0, 0, W, HORIZON);
    return;
  }

  const bands = C.sky.length;
  const step = HORIZON / bands;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = C.sky[i];
    g.fillRect(0, Math.floor(i * step), W, Math.ceil(step) + 1);
    // Ordered dither across each boundary so the bands melt together.
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
  // Moon: a filled disc plus craters.
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

/** Narrow at the ridge, wide at the eaves — a real gable, not an inverted trapezoid. */
function gableRoof(g: CanvasRenderingContext2D, x: number, w: number, baseY: number, height: number) {
  for (let i = 0; i < height; i++) {
    const rowWidth = Math.max(2, Math.round((w * (i + 1)) / height));
    g.fillRect(x + Math.round((w - rowWidth) / 2), baseY - height + i, rowWidth, 1);
  }
}

function paintWorld(g: CanvasRenderingContext2D, C: Palette) {
  const r = rng(11);

  // --- Distant blocks -----------------------------------------------------
  for (const b of FAR) {
    const top = HORIZON - 6 - b.h;
    g.fillStyle = C.far;
    g.fillRect(b.x, top, b.w, b.h);
    g.fillStyle = C.farRoof;
    g.fillRect(b.x, top, b.w, 1);
  }

  // --- Front blocks: parapet plus a rooftop fixture ------------------------
  for (const b of MID) {
    const top = HORIZON - 2 - b.h;
    g.fillStyle = C.mid;
    g.fillRect(b.x, top, b.w, b.h);
    g.fillStyle = C.roof;
    g.fillRect(b.x - 1, top, b.w + 2, 2);
    const fixture = r();
    if (fixture > 0.62) {
      g.fillRect(b.x + 5, top - 5, 3, 5);                 // chimney
      g.fillRect(b.x + 4, top - 6, 5, 1);
    } else if (fixture > 0.3) {
      g.fillRect(b.x + b.w - 10, top - 4, 7, 4);          // roof tank
      g.fillRect(b.x + b.w - 8, top - 7, 1, 3);
    } else {
      g.fillRect(b.x + b.w - 6, top - 8, 1, 8);           // mast
    }
  }

  // --- Spire: a clean taper to a finial ------------------------------------
  const sx = SPIRE.x;
  g.fillStyle = C.near;
  g.fillRect(sx, HORIZON - SPIRE.h, SPIRE.w, SPIRE.h);
  g.fillStyle = C.roof;
  gableRoof(g, sx, SPIRE.w, HORIZON - SPIRE.h, 14);
  g.fillRect(sx + SPIRE.w / 2 - 1, HORIZON - SPIRE.h - 20, 2, 7);
  g.fillRect(sx + SPIRE.w / 2 - 3, HORIZON - SPIRE.h - 18, 6, 1);
  g.fillStyle = C.near;
  g.fillRect(sx - 1, HORIZON - SPIRE.h, SPIRE.w + 2, 2);
  // Belfry: an arched opening whose bell is drawn per frame so it can swing.
  const belfryX = sx + 2, belfryW = SPIRE.w - 4, belfryY = HORIZON - 42;
  g.fillStyle = C.screen;
  g.fillRect(belfryX + 2, belfryY, belfryW - 4, 1);
  g.fillRect(belfryX + 1, belfryY + 1, belfryW - 2, 1);
  g.fillRect(belfryX, belfryY + 2, belfryW, 10);
  g.fillStyle = C.roof;
  g.fillRect(belfryX - 1, belfryY + 12, belfryW + 2, 2);

  // --- School: the education anchor of the skyline ------------------------
  const bx = SCHOOL.x, bw = SCHOOL.w, bh = SCHOOL.h, by = HORIZON - bh;
  g.fillStyle = C.near;
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = C.roof;
  gableRoof(g, bx, bw, by, 13);
  g.fillRect(bx - 3, by - 1, bw + 6, 2);                  // eaves
  g.fillRect(bx + bw / 2 - 4, HORIZON - 10, 8, 10);       // doorway
  g.fillStyle = C.near;
  g.fillRect(bx + bw / 2 - 2, HORIZON - 8, 4, 8);

  // --- Antenna tower ------------------------------------------------------
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

  // --- Street lamp posts (their light is drawn per frame) -----------------
  g.fillStyle = C.night ? "#3D1B2E" : C.near;
  for (const x of LAMPS) {
    g.fillRect(x, HORIZON - 11, 1, 11);
    g.fillRect(x, HORIZON - 12, 3, 1);
  }

  // ========================= BELOW THE GROUND LINE ========================
  g.fillStyle = C.ink;
  g.fillRect(0, HORIZON, W, 2);
  g.fillStyle = C.crust;
  g.fillRect(0, HORIZON + 2, W, 5);

  // Three strata with dithered boundaries: topsoil, subsoil, bedrock.
  g.fillStyle = C.soil2;
  g.fillRect(0, HORIZON + 7, W, 22);
  g.fillStyle = C.soil;
  g.fillRect(0, HORIZON + 29, W, 24);
  g.fillStyle = C.soil3;
  g.fillRect(0, HORIZON + 53, W, H - HORIZON - 53);
  for (let x = 0; x < W; x += 2) {
    g.fillStyle = C.soil;
    g.fillRect(x, HORIZON + 27 + Math.round(Math.sin(x / 17) * 2), 2, 2);
    g.fillStyle = C.soil3;
    g.fillRect(x, HORIZON + 51 + Math.round(Math.sin(x / 23 + 2) * 2), 2, 2);
  }

  // Roots trailing down out of the crust.
  g.fillStyle = C.root;
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * W);
    const len = 5 + Math.floor(r() * 12);
    for (let d = 0; d < len; d++) g.fillRect(x + Math.round(Math.sin(d / 3 + i) * 1.5), HORIZON + 6 + d, 1, 1);
  }

  // Rocks: small in the soil, larger in the bedrock.
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(r() * (W - 10));
    const deep = r() > 0.35;
    const y = deep ? HORIZON + 56 + Math.floor(r() * 8) : HORIZON + 34 + Math.floor(r() * 14);
    const w = deep ? 5 + Math.floor(r() * 5) : 4 + Math.floor(r() * 3);
    g.fillStyle = C.rock;
    g.fillRect(x, y, w, 2);
    g.fillRect(x + 1, y + 2, w - 2, 1);
    g.fillStyle = C.rockHi;
    g.fillRect(x + 1, y, w - 2, 1);
  }

  // Utility main running the full width of the bedrock, with joint collars.
  g.fillStyle = C.metal;
  g.fillRect(0, 166, W, 5);
  g.fillStyle = C.metalHi;
  g.fillRect(0, 166, W, 1);
  for (let x = 6; x < W; x += 34) g.fillRect(x, 165, 3, 7);

  // --- Buried flag vault ---------------------------------------------------
  const vx = 58, vy = 122, vw = 66, vh = 42;
  g.fillStyle = C.soil3;
  g.fillRect(vx, vy, vw, vh);
  g.fillStyle = C.metal;
  g.fillRect(vx, vy, vw, 2);
  g.fillRect(vx, vy + vh - 2, vw, 2);
  g.fillRect(vx, vy, 2, vh);
  g.fillRect(vx + vw - 2, vy, 2, vh);
  g.fillStyle = C.metalHi;
  g.fillRect(vx + 2, vy + 2, vw - 4, 1);
  g.fillRect(vx + 4, vy + vh - 8, vw - 8, 1);             // floor plate
  for (let x = vx + 6; x < vx + vw - 6; x += 8) g.fillRect(x, vy + vh - 7, 1, 5);
  g.fillStyle = C.metal;
  g.fillRect(vx + 4, vy + 6, 9, vh - 14);                 // hatch on the left wall
  g.fillStyle = C.metalHi;
  g.fillRect(vx + 6, vy + 8, 5, 1);
  g.fillRect(vx + 6, vy + vh - 12, 5, 1);
  g.fillRect(vx + 10, vy + 18, 2, 2);                     // handle
  g.fillStyle = C.metal;                                  // wall terminal
  g.fillRect(vx + 18, vy + 9, 13, 10);
  g.fillStyle = C.screen;
  g.fillRect(vx + 20, vy + 11, 9, 6);
  g.fillStyle = C.metalHi;
  g.fillRect(vx + 22, vy + 19, 5, 1);
  g.fillRect(vx + 20, vy + vh - 13, 8, 5);                // crates
  g.fillRect(vx + 29, vy + vh - 10, 6, 2);
  g.fillRect(104, 130, 1, 27);                            // flag pole
  g.fillRect(99, 156, 11, 1);
  g.fillRect(101, 157, 7, 1);

  // --- Junction box in the middle run --------------------------------------
  const jx = 172, jy = 130, jw = 44, jh = 22;
  g.fillStyle = C.metal;
  g.fillRect(jx, jy, jw, jh);
  g.fillStyle = C.screen;
  g.fillRect(jx + 2, jy + 2, jw - 4, jh - 4);
  g.fillStyle = C.metalHi;
  g.fillRect(jx + 2, jy + 2, jw - 4, 1);
  for (let p = 0; p < 6; p++) g.fillRect(jx + 5 + p * 6, jy + jh - 7, 4, 3);   // ports
  g.fillStyle = C.metal;
  g.fillRect(jx + 6, jy - 3, 3, 3);
  g.fillRect(jx + jw - 9, jy - 3, 3, 3);

  // --- Server rack ---------------------------------------------------------
  const rx = 252, ry = 126, rw = 52, rh = 40;
  g.fillStyle = C.metal;
  g.fillRect(rx, ry, rw, rh);
  g.fillStyle = C.screen;
  g.fillRect(rx + 2, ry + 2, rw - 4, rh - 4);
  g.fillStyle = C.metalHi;
  for (let i = 0; i < 5; i++) g.fillRect(rx + 3, ry + 5 + i * 7, rw - 6, 5);
  g.fillRect(rx, ry, rw, 1);
  g.fillRect(rx - 2, ry + rh, rw + 4, 2);                 // plinth

  // --- Conduit sheaths ------------------------------------------------------
  const paths = [PATH_A, PATH_B, PATH_C, PATH_D];
  g.fillStyle = C.metal;
  for (const p of paths) {
    for (let i = 1; i < p.length; i++) {
      const x0 = Math.min(p[i - 1].x, p[i].x), y0 = Math.min(p[i - 1].y, p[i].y);
      const w = Math.abs(p[i].x - p[i - 1].x) || 3, h = Math.abs(p[i].y - p[i - 1].y) || 3;
      g.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    }
  }
  g.fillStyle = C.sigDim;
  for (const p of paths) {
    for (let i = 1; i < p.length; i++) {
      const x0 = Math.min(p[i - 1].x, p[i].x), y0 = Math.min(p[i - 1].y, p[i].y);
      const w = Math.abs(p[i].x - p[i - 1].x) || 1, h = Math.abs(p[i].y - p[i - 1].y) || 1;
      g.fillRect(x0, y0, w, h);
    }
  }
  // Cable-tray brackets along the main trunk.
  g.fillStyle = C.metalHi;
  for (let x = 176; x < 258; x += 16) g.fillRect(x, 117, 1, 3);
  // Splice box where the school feed, the antenna feed and the rack drop meet.
  g.fillStyle = C.metal;
  g.fillRect(260, 116, 9, 9);
  g.fillStyle = C.metalHi;
  g.fillRect(261, 117, 7, 1);
  g.fillRect(261, 123, 7, 1);
  g.fillStyle = C.sigDim;
  g.fillRect(263, 119, 3, 3);

  // In day mode, clean base line
  if (!C.night) {
    g.fillStyle = C.crust;
    g.fillRect(0, H - 1, W, 1);
  }
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

export function PixelWorld({ className }: { className?: string; labels?: { surface: string; below: string } }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  // Starts light to match the server's markup, then resolves on mount. The scene repaints whenever
  // the toggle flips data-theme or the OS preference changes.
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
    paintWorld(world.ctx, C);

    const lenA = pathLength(PATH_A), lenC = pathLength(PATH_C);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;

    const frame = (ms: number) => {
      const t = reduced ? 2.4 : ms / 1000;
      ctx.drawImage(sky.canvas, 0, 0);

      // Clouds drift at two speeds, wrapping across the sky.
      for (const c of CLOUDS) {
        const speed = c.layer === 0 ? 2.4 : 5.2;
        const span = W + 40;
        const x = Math.round((((c.x + t * speed) % span) + span) % span) - 30;
        drawCloud(ctx, x, c.y, c.s, C);
      }

      ctx.drawImage(world.canvas, 0, 0);

      // Windows. By day they are quiet glass; by night each keeps its own slow on/off rhythm, in
      // two shades of warm lamplight. No halo: the glow rectangle only muddied the wall behind it.
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

      // The school clock stays lit after dark.
      ctx.fillStyle = C.night ? C.win : C.win2;
      ctx.fillRect(SCHOOL.x + SCHOOL.w / 2 - 2, HORIZON - SCHOOL.h - 9, 4, 4);
      ctx.fillStyle = C.night ? "#5A3A12" : C.ink;
      ctx.fillRect(SCHOOL.x + SCHOOL.w / 2, HORIZON - SCHOOL.h - 8, 1, 2);

      // Church bell, pivoting from its headstock: the crown barely moves, the rim swings furthest.
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

      // Street lamps: a warm head and a soft pool of light on the pavement at night.
      for (const x of LAMPS) {
        if (C.night && C.lampGlow) {
          ctx.fillStyle = C.lampGlow;
          for (let i = 0; i < 4; i++) ctx.fillRect(x - 1 - i * 2, HORIZON - 10 + i * 3, 5 + i * 4, 3);
        }
        ctx.fillStyle = C.lamp;
        ctx.fillRect(x + 1, HORIZON - 12, 2, 2);
      }

      // Grass tufts catching the wind on the surface line.
      for (let i = 0; i < 34; i++) {
        const x = 4 + i * 11 + ((i * 7) % 5);
        const sway = Math.round(Math.sin(t * 1.6 + i) * 1);
        ctx.fillStyle = i % 3 === 0 ? C.grass : C.grassDim;
        ctx.fillRect(x, HORIZON - 2, 1, 2);
        ctx.fillRect(x + sway, HORIZON - 4, 1, 2);
      }

      // Antenna beacon.
      const beacon = Math.sin(t * 2.4) > 0;
      ctx.fillStyle = beacon ? C.sigHi : C.sigDim;
      ctx.fillRect(292, HORIZON - 69, 1, 2);
      if (beacon) {
        ctx.fillStyle = C.sig;
        ctx.fillRect(291, HORIZON - 68, 3, 1);
      }

      // Rack status LEDs.
      for (let row = 0; row < 5; row++) {
        for (let led = 0; led < 3; led++) {
          const on = ((t * 1.9 + row * 1.7 + led * 0.9) % 2) < 1.15;
          ctx.fillStyle = on ? C.sig : C.sigDim;
          ctx.fillRect(255 + led * 3, 128 + row * 7, 2, 2);
        }
      }
      ctx.fillStyle = C.sigHi;
      ctx.fillRect(288, 130, 12, 1);
      ctx.fillRect(288, 133, Math.round(6 + Math.sin(t * 3) * 5), 1);

      // Junction box port activity.
      for (let p = 0; p < 6; p++) {
        const on = ((t * 2.3 + p * 1.3) % 2) < 1;
        ctx.fillStyle = on ? C.sig : C.sigDim;
        ctx.fillRect(177 + p * 6, 134, 2, 2);
      }

      // The buried flag, waving column by column.
      for (let i = 0; i < 14; i++) {
        const off = Math.round(Math.sin(t * 3.4 + i * 0.55) * 1.3);
        ctx.fillStyle = i < 2 || i > 11 ? C.sigDim : C.sig;
        ctx.fillRect(105 + i, 131 + off, 1, 9);
      }

      // Packets travelling the conduits into the infrastructure.
      const send = (path: Pt[], len: number, speed: number, offsets: number[]) => {
        for (const o of offsets) {
          const d = (t * speed + o) % len;
          const p = pointAt(path, d);
          const tail = pointAt(path, Math.max(0, d - 3));
          ctx.fillStyle = C.sigDim;
          ctx.fillRect(tail.x, tail.y, 2, 2);
          ctx.fillStyle = C.sigHi;
          ctx.fillRect(p.x, p.y, 2, 2);
        }
      };
      send(PATH_A, lenA, 42, [0, lenA * 0.38, lenA * 0.71]);
      send(PATH_C, lenC, 34, [0, lenC * 0.5]);

      if (!reduced && visible) raf = requestAnimationFrame(frame);
    };

    // Paint one frame synchronously so the scene is present even where rAF never runs
    // (background tab, low-power mode, reduced motion); animation continues from there.
    frame(performance.now());

    // Stop burning frames when the plate is scrolled away or the tab is hidden.
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
      aria-label="Pixel-art cross-section: a town with a school, spire and antenna above ground; below it, conduits carrying data into a server rack and a buried capture-the-flag chamber."
    />
  );
}

export { PixelSkyline } from "./PixelSkyline";

