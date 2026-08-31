import React from "react";

/**
 * Pixel-art red flag with pole and waving fabric.
 */
export function PixelFlagArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="72"
      height="72"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Pole */}
      <rect x="14" y="8" width="3" height="52" fill="#5A2440" />
      <rect x="12" y="6" width="7" height="3" fill="#D61F34" />
      <rect x="10" y="58" width="11" height="4" fill="#3D1226" />

      {/* Flag fabric with wave shading */}
      <rect x="17" y="10" width="34" height="24" fill="#D61F34" />
      <rect x="17" y="10" width="6" height="24" fill="#B31224" />
      <rect x="23" y="12" width="8" height="20" fill="#E83046" />
      <rect x="31" y="14" width="8" height="20" fill="#D61F34" />
      <rect x="39" y="12" width="8" height="22" fill="#FA4D62" />
      <rect x="47" y="14" width="4" height="18" fill="#B31224" />

      {/* Flag wave notches on edge */}
      <rect x="51" y="10" width="2" height="4" fill="transparent" />
      <rect x="49" y="32" width="4" height="4" fill="transparent" />
      <rect x="35" y="34" width="6" height="2" fill="transparent" />
    </svg>
  );
}

/**
 * Pixel-art trophy for the seasonal leaderboard.
 */
export function PixelTrophyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width="88"
      height="88"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Trophy cup base / silhouette in dark burgundy-purple */}
      <rect x="24" y="14" width="32" height="26" fill="#4E1B36" />
      <rect x="26" y="16" width="28" height="22" fill="#5F2444" />
      <rect x="28" y="40" width="24" height="6" fill="#4E1B36" />
      <rect x="32" y="46" width="16" height="8" fill="#3E122B" />
      <rect x="36" y="54" width="8" height="8" fill="#5F2444" />
      <rect x="26" y="62" width="28" height="6" fill="#4E1B36" />
      <rect x="22" y="68" width="36" height="4" fill="#31081F" />

      {/* Handles */}
      <rect x="16" y="18" width="8" height="4" fill="#4E1B36" />
      <rect x="14" y="22" width="4" height="12" fill="#4E1B36" />
      <rect x="18" y="34" width="6" height="4" fill="#4E1B36" />

      <rect x="56" y="18" width="8" height="4" fill="#4E1B36" />
      <rect x="62" y="22" width="4" height="12" fill="#4E1B36" />
      <rect x="56" y="34" width="6" height="4" fill="#4E1B36" />

      {/* Subtle glowing highlights */}
      <rect x="30" y="20" width="4" height="14" fill="#782E56" opacity="0.8" />
      <rect x="36" y="22" width="8" height="8" fill="#E8394D" opacity="0.4" />
      <rect x="38" y="24" width="4" height="4" fill="#FFD98F" opacity="0.6" />
    </svg>
  );
}

/**
 * Pixel-art hacker character with flag for the final CTA.
 */
export function PixelHackerArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width="130"
      height="130"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Flag pole on right */}
      <rect x="74" y="12" width="3" height="74" fill="#9AA398" />
      <rect x="72" y="10" width="7" height="3" fill="#B2B9AF" />
      {/* Waving flag in translucent grey/red */}
      <rect x="77" y="14" width="16" height="12" fill="#D61F34" opacity="0.7" />
      <rect x="77" y="14" width="4" height="12" fill="#A81628" opacity="0.7" />
      <rect x="81" y="16" width="6" height="8" fill="#E8394D" opacity="0.7" />

      {/* Pixel hacker character */}
      {/* Head & visor */}
      <rect x="34" y="30" width="14" height="14" fill="#808F85" />
      <rect x="36" y="34" width="12" height="4" fill="#31081F" />
      <rect x="38" y="35" width="4" height="2" fill="#D61F34" />

      {/* Body & torso */}
      <rect x="30" y="44" width="22" height="22" fill="#55605A" />
      <rect x="34" y="46" width="14" height="18" fill="#6A7770" />

      {/* Arms */}
      <rect x="24" y="46" width="6" height="16" fill="#55605A" />
      <rect x="52" y="44" width="16" height="5" fill="#55605A" />
      <rect x="68" y="44" width="7" height="6" fill="#808F85" />

      {/* Legs & feet */}
      <rect x="32" y="66" width="7" height="18" fill="#3E4742" />
      <rect x="43" y="66" width="7" height="18" fill="#3E4742" />
      <rect x="29" y="82" width="10" height="4" fill="#242B27" />
      <rect x="43" y="82" width="10" height="4" fill="#242B27" />
    </svg>
  );
}

/**
 * Pixel-art Target badge for Výzvy hero card.
 */
export function PixelTargetBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="36"
      height="36"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Outer crosshairs */}
      <rect x="15" y="4" width="2" height="4" fill="#D61F34" />
      <rect x="15" y="24" width="2" height="4" fill="#D61F34" />
      <rect x="4" y="15" width="4" height="2" fill="#D61F34" />
      <rect x="24" y="15" width="4" height="2" fill="#D61F34" />
      {/* Outer ring */}
      <rect x="12" y="8" width="8" height="2" fill="#E8EBE4" />
      <rect x="12" y="22" width="8" height="2" fill="#E8EBE4" />
      <rect x="8" y="12" width="2" height="8" fill="#E8EBE4" />
      <rect x="22" y="12" width="2" height="8" fill="#E8EBE4" />
      {/* Corner ring pixels */}
      <rect x="10" y="10" width="2" height="2" fill="#C4CAC1" />
      <rect x="20" y="10" width="2" height="2" fill="#C4CAC1" />
      <rect x="10" y="20" width="2" height="2" fill="#C4CAC1" />
      <rect x="20" y="20" width="2" height="2" fill="#C4CAC1" />
      {/* Inner red ring / center dot */}
      <rect x="14" y="14" width="4" height="4" fill="#D61F34" />
      <rect x="15" y="15" width="2" height="2" fill="#FFF" />
    </svg>
  );
}

/**
 * Pixel-art Swords badge for Podujatia hero card.
 */
export function PixelSwordsBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="36"
      height="36"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Diagonal Sword 1: Top-Left to Bottom-Right */}
      <rect x="23" y="7" width="2" height="2" fill="#FFF" />
      <rect x="21" y="9" width="2" height="2" fill="#E8EBE4" />
      <rect x="19" y="11" width="2" height="2" fill="#E8EBE4" />
      <rect x="17" y="13" width="2" height="2" fill="#C4CAC1" />
      <rect x="15" y="15" width="2" height="2" fill="#C4CAC1" />
      <rect x="13" y="17" width="2" height="2" fill="#A6959E" />
      <rect x="10" y="20" width="2" height="2" fill="#D61F34" />
      <rect x="12" y="18" width="2" height="2" fill="#D61F34" />
      <rect x="14" y="16" width="2" height="2" fill="#B31224" />
      <rect x="9" y="21" width="2" height="2" fill="#5A2440" />
      <rect x="7" y="23" width="2" height="2" fill="#D61F34" />

      {/* Diagonal Sword 2: Top-Right to Bottom-Left */}
      <rect x="7" y="7" width="2" height="2" fill="#FFF" />
      <rect x="9" y="9" width="2" height="2" fill="#E8EBE4" />
      <rect x="11" y="11" width="2" height="2" fill="#E8EBE4" />
      <rect x="13" y="13" width="2" height="2" fill="#C4CAC1" />
      <rect x="15" y="15" width="2" height="2" fill="#C4CAC1" />
      <rect x="17" y="17" width="2" height="2" fill="#A6959E" />
      <rect x="20" y="20" width="2" height="2" fill="#D61F34" />
      <rect x="18" y="18" width="2" height="2" fill="#D61F34" />
      <rect x="16" y="16" width="2" height="2" fill="#B31224" />
      <rect x="21" y="21" width="2" height="2" fill="#5A2440" />
      <rect x="23" y="23" width="2" height="2" fill="#D61F34" />
    </svg>
  );
}

/**
 * Pixel-art School badge for Triedy hero card.
 */
export function PixelSchoolBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="36"
      height="36"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* Roof pediment */}
      <rect x="15" y="6" width="2" height="2" fill="#D61F34" />
      <rect x="13" y="8" width="6" height="2" fill="#E8EBE4" />
      <rect x="10" y="10" width="12" height="2" fill="#E8EBE4" />
      <rect x="7" y="12" width="18" height="2" fill="#C4CAC1" />
      {/* Architrave */}
      <rect x="6" y="14" width="20" height="2" fill="#D61F34" />
      {/* Columns */}
      <rect x="8" y="16" width="2" height="8" fill="#E8EBE4" />
      <rect x="12" y="16" width="2" height="8" fill="#E8EBE4" />
      <rect x="18" y="16" width="2" height="8" fill="#E8EBE4" />
      <rect x="22" y="16" width="2" height="8" fill="#E8EBE4" />
      {/* Base steps */}
      <rect x="6" y="24" width="20" height="2" fill="#C4CAC1" />
      <rect x="5" y="26" width="22" height="2" fill="#D61F34" />
    </svg>
  );
}

/**
 * Pixel-art Chart badge for Rebríčky hero card.
 */
export function PixelChartBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="36"
      height="36"
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    >
      {/* 4 Vertical Bars */}
      <rect x="7" y="16" width="3" height="8" fill="#E8EBE4" />
      <rect x="7" y="15" width="3" height="1" fill="#D61F34" />
      <rect x="12" y="10" width="3" height="14" fill="#E8EBE4" />
      <rect x="12" y="9" width="3" height="1" fill="#D61F34" />
      <rect x="17" y="18" width="3" height="6" fill="#E8EBE4" />
      <rect x="17" y="17" width="3" height="1" fill="#D61F34" />
      <rect x="22" y="13" width="3" height="11" fill="#E8EBE4" />
      <rect x="22" y="12" width="3" height="1" fill="#D61F34" />
      {/* Base line */}
      <rect x="5" y="24" width="22" height="2" fill="#D61F34" />
    </svg>
  );
}

