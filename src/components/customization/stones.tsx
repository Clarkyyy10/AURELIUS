"use client";

// Gemstones for every cut (D-25). Each cut is built from its real outline (seen from above): a faceted
// crown with a flat table on top, and a pavilion that tapers to a point (culet) underneath.
// Table faces +Y. `r` is the girdle "radius" (half the stone's width).

import { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import type { CutOption, GemstoneOption } from "@/types";

/** The outline of each cut, as points around the girdle (unit size: width ≈ 2 along x). */
export function outline(cut: string): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const ring = (n: number, fx: (a: number) => number, fy: (a: number) => number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push(new THREE.Vector2(fx(a), fy(a)));
    }
  };
  const cutCorners = (w: number, h: number, c: number) =>
    [
      [w, h - c],
      [w - c, h],
      [-w + c, h],
      [-w, h - c],
      [-w, -h + c],
      [-w + c, -h],
      [w - c, -h],
      [w, -h + c],
    ].forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  switch (cut) {
    case "oval":
      ring(
        24,
        (a) => 1.3 * Math.cos(a),
        (a) => 0.9 * Math.sin(a),
      );
      break;
    case "princess":
      [
        [1, 1],
        [-1, 1],
        [-1, -1],
        [1, -1],
      ].forEach(([x, y]) => pts.push(new THREE.Vector2(x * 0.85, y * 0.85)));
      break;
    case "cushion":
      // a square with softly rounded corners
      ring(
        32,
        (a) => Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.55,
        (a) => Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.55,
      );
      pts.forEach((p) => p.multiplyScalar(0.92));
      break;
    case "emerald":
      cutCorners(1.2, 0.85, 0.28);
      break;
    case "asscher":
      cutCorners(0.9, 0.9, 0.32);
      break;
    case "radiant":
      cutCorners(1.1, 0.85, 0.2);
      break;
    case "baguette":
      cutCorners(1.35, 0.55, 0.04);
      break;
    case "marquise":
      // two arcs meeting in points at each end
      for (let i = 0; i <= 12; i++) {
        const t = -1 + (i / 12) * 2;
        pts.push(new THREE.Vector2(1.45 * t, 0.7 * (1 - t * t)));
      }
      for (let i = 11; i > 0; i--) {
        const t = -1 + (i / 12) * 2;
        pts.push(new THREE.Vector2(1.45 * t, -0.7 * (1 - t * t)));
      }
      break;
    case "pear":
      // round at one end, pointed at the other
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const x = Math.cos(a);
        const taper = x > 0 ? 1 - 0.65 * x * x : 1;
        pts.push(new THREE.Vector2(x * (x > 0 ? 1.45 : 1), Math.sin(a) * taper));
      }
      break;
    case "heart":
      for (let i = 0; i < 32; i++) {
        const t = (i / 32) * Math.PI * 2;
        // classic heart curve, point toward −y
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        pts.push(new THREE.Vector2(x / 16, y / 16 + 0.1));
      }
      break;
    default: // round brilliant
      ring(16, Math.cos, Math.sin);
  }
  return pts;
}

/** Faceted stone geometry: crown (girdle → smaller table) + pavilion (girdle → culet). */
export function stoneGeometry(cutKey: string, r: number): THREE.BufferGeometry {
  const pts = outline(cutKey);
  const step = ["emerald", "asscher", "baguette"].includes(cutKey);
  const crownH = r * (step ? 0.22 : 0.3);
  const table = step ? 0.72 : 0.6;
  const pavilionD = r * (step ? 0.7 : 0.85);
  const pos: number[] = [];
  const v = (p: THREE.Vector2, y: number, s = 1) => [p.x * r * s, y, -p.y * r * s];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    // crown side (girdle → table edge)
    pos.push(...v(a, 0), ...v(b, 0), ...v(b, crownH, table));
    pos.push(...v(a, 0), ...v(b, crownH, table), ...v(a, crownH, table));
    // table (fan to centre)
    pos.push(...v(a, crownH, table), ...v(b, crownH, table), 0, crownH, 0);
    // pavilion (girdle → culet)
    pos.push(...v(b, 0), ...v(a, 0), 0, -pavilionD, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

export function cutKeyOf(cut: CutOption | null | undefined): string {
  return (cut?.label ?? "round").toLowerCase();
}

/** Accent stones in halos, clusters and pavé are white (like small diamonds / CZ). */
export const ACCENT_GEM: GemstoneOption = { id: "accent", label: "Accent", basePrice: 0, colorHex: "#FFFFFF", ior: 2.4, active: true };

export function GemMaterial({ gem }: { gem: GemstoneOption }) {
  if (gem.surface === "pearl") {
    return (
      <meshPhysicalMaterial
        color={gem.colorHex}
        roughness={0.25}
        metalness={0}
        sheen={1}
        sheenColor="#ffe8f0"
        sheenRoughness={0.4}
        clearcoat={1}
        clearcoatRoughness={0.15}
        iridescence={0.5}
        envMapIntensity={1.2}
      />
    );
  }
  if (gem.surface === "opal") {
    return (
      <meshPhysicalMaterial
        color={gem.colorHex}
        roughness={0.15}
        metalness={0}
        transmission={0.25}
        thickness={0.5}
        iridescence={1}
        iridescenceIOR={1.6}
        clearcoat={1}
        envMapIntensity={1.6}
      />
    );
  }
  // Partly transparent with strong reflections and flat facets, so stones read as cut gems
  // (fully transparent glass looks empty against a light background).
  const clear = gem.colorHex.toLowerCase() === "#ffffff" || gem.colorHex.toLowerCase() === "#f4f6fa";
  return (
    <meshPhysicalMaterial
      color={gem.colorHex}
      metalness={clear ? 0.25 : 0.1}
      roughness={0}
      transmission={clear ? 0.55 : 0.4}
      thickness={0.6}
      ior={gem.ior}
      attenuationColor={gem.colorHex}
      attenuationDistance={0.4}
      specularIntensity={1}
      clearcoat={1}
      clearcoatRoughness={0}
      envMapIntensity={clear ? 3.5 : 2.5}
      iridescence={clear ? 0.35 : 0}
      flatShading
    />
  );
}

/** A single stone with its table facing +Y. Pearls are smooth spheres; long cuts point along +X. */
export function Stone({ gem, cut, r }: { gem: GemstoneOption; cut: CutOption | null; r: number }) {
  const key = cutKeyOf(cut);
  const geometry = useMemo(() => (gem.surface === "pearl" ? new THREE.SphereGeometry(r * 0.95, 32, 24) : stoneGeometry(key, r)), [gem.surface, key, r]);
  return (
    <mesh geometry={geometry} name="stone">
      <GemMaterial gem={gem} />
    </mesh>
  );
}

// ---------------------------------------------------------------- metal surface texture

/** Metal texture chosen for the whole piece (polished, satin, brushed, hammered…). */
export const TextureContext = createContext<string | undefined>(undefined);
export const useTextureKey = () => useContext(TextureContext);
