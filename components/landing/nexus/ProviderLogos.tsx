"use client";

import type { CSSProperties } from "react";
import { PROVIDER_LOGO_DATA, type ProviderLogo as ProviderLogoData } from "./logoData";

// Logos OFFICIELS des places de marché (tracés Simple Icons, exacts).
// Par défaut : BLANC. Au survol du conteneur `.group` : couleur de marque.
// Les teintes trop sombres pour le fond « Nuit » sont éclaircies.

function hoverColor(hex: string): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (lum >= 0.42) return hex;
  const mix = (c: number) => Math.round(c + (255 - c) * 0.6);
  const h = (c: number) => mix(c).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function ProviderLogo({ name, brand, viewBox, path }: ProviderLogoData) {
  return (
    <svg
      viewBox={viewBox}
      height={44}
      role="img"
      aria-label={name}
      className="h-11 w-auto"
      style={{ "--hc": hoverColor(brand) } as CSSProperties}
    >
      <path d={path} className="fill-white transition-colors duration-300 group-hover:[fill:var(--hc)]" />
    </svg>
  );
}

export const PROVIDER_LOGOS = PROVIDER_LOGO_DATA;
