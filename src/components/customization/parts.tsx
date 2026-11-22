"use client";

// Building blocks shared by the 3D models (D-25): swept bands, stone heads for each setting,
// instanced accent stones and metal beads, and raised text in the chosen font.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { CutOption, FinishOption, GemstoneOption } from "@/types";
import { MetalMaterial } from "./metal";
import { ACCENT_GEM, GemMaterial, Stone, cutKeyOf, outline, stoneGeometry } from "./stones";

export const TAU = Math.PI * 2;
export const DEFAULT_TEXT_FONT = "/fonts/playfair-display.typeface.json";

/** A cross-section as (dr, dz) points, counter-clockwise: dr = outward from the band's inner edge, dz = across the band. */
export type Section = [number, number][];

/**
 * Sweeps a cross-section around a circle of radius R in the x–y plane (θ = 0 at +Y, going clockwise).
 * `offset(θ)` moves the section (radially, across) so strands can split, twist or pass each other.
 * Open sweeps (from/to not a full turn) get flat end caps.
 */
export function sweepBand(R: number, section: Section, opts: { from?: number; to?: number; segs?: number; offset?: (t: number) => [number, number] } = {}) {
  const { from = 0, to = TAU, segs = 160, offset } = opts;
  const m = section.length;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = from + ((to - from) * i) / segs;
    const [odr, odz] = offset ? offset(t) : [0, 0];
    const ux = Math.sin(t);
    const uy = Math.cos(t);
    for (let j = 0; j <= m; j++) {
      const [dr, dz] = section[j % m];
      const r = R + dr + odr;
      pos.push(ux * r, uy * r, dz + odz);
      uv.push(i / segs, j / m);
    }
  }
  const row = m + 1;
  for (let i = 0; i < segs; i++)
    for (let j = 0; j < m; j++) {
      const a = i * row + j;
      const b = a + row;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const open = Math.abs(to - from - TAU) > 1e-6;
  if (open) {
    // end caps: a fan from the section's centre
    const cdr = section.reduce((s, p) => s + p[0], 0) / m;
    const cdz = section.reduce((s, p) => s + p[1], 0) / m;
    for (const [i, flip] of [[0, true], [segs, false]] as const) {
      const t = from + ((to - from) * i) / segs;
      const [odr, odz] = offset ? offset(t) : [0, 0];
      const base = pos.length / 3;
      const r = R + cdr + odr;
      pos.push(Math.sin(t) * r, Math.cos(t) * r, cdz + odz);
      uv.push(0.5, 0.5);
      for (let j = 0; j < m; j++) {
        const a = i * row + j;
        const b = i * row + j + 1;
        if (flip) idx.push(base, b, a);
        else idx.push(base, a, b);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A circle cross-section (for wires, strands and twisted rope). */
export function circleSection(radius: number, n = 14, cdr = radius): Section {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    return [cdr + Math.cos(a) * radius, Math.sin(a) * radius] as [number, number];
  });
}

/** Band cross-sections (ring "profiles"): T = thickness, W = width. */
export function profileSection(key: string | undefined, T: number, W: number): Section {
  const h = W / 2;
  switch (key) {
    case "d_shape": {
      const pts: Section = [];
      for (let i = 0; i <= 16; i++) {
        const a = -Math.PI / 2 + (i / 16) * Math.PI;
        pts.push([T * 0.15 + T * 0.85 * Math.cos(a) ** 0.8, h * Math.sin(a)]);
      }
      pts.push([0, h * 0.98], [0, -h * 0.98]);
      return pts;
    }
    case "flat": {
      const b = Math.min(T, W) * 0.12;
      return [[b, -h], [T - b, -h], [T, -h + b], [T, h - b], [T - b, h], [b, h], [0, h - b], [0, -h + b]];
    }
    case "flat_court": {
      const b = Math.min(T, W) * 0.12;
      const pts: Section = [[T * 0.3, -h], [T - b, -h], [T, -h + b], [T, h - b], [T - b, h], [T * 0.3, h]];
      for (let i = 1; i < 12; i++) {
        const a = Math.PI / 2 + (i / 12) * Math.PI;
        pts.push([T * 0.3 + T * 0.3 * Math.cos(a), h * Math.sin(a)]);
      }
      return pts;
    }
    case "knife_edge":
      return [[T * 0.12, -h * 0.9], [T * 0.5, -h], [T, 0], [T * 0.5, h], [T * 0.12, h * 0.9], [0, h * 0.4], [0, -h * 0.4]];
    default: {
      // comfort (court): rounded inside and out
      const pts: Section = [];
      for (let i = 0; i < 28; i++) {
        const a = -Math.PI / 2 - (i / 28) * TAU;
        const c = Math.cos(a);
        const s = Math.sin(a);
        pts.push([T / 2 + (T / 2) * Math.sign(c) * Math.abs(c) ** 0.7, h * Math.sign(s) * Math.abs(s) ** 0.55]);
      }
      return pts.reverse();
    }
  }
}

/** Points spaced evenly along the outline of a cut, scaled by `s`. */
export function perimeterPoints(cutKey: string, n: number, s: number): THREE.Vector2[] {
  const pts = outline(cutKey);
  const lens = pts.map((p, i) => p.distanceTo(pts[(i + 1) % pts.length]));
  const total = lens.reduce((a, b) => a + b, 0);
  const out: THREE.Vector2[] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total;
    let i = 0;
    while (d > lens[i]) d -= lens[i++];
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    out.push(a.clone().lerp(b, d / lens[i]).multiplyScalar(s));
  }
  return out;
}

/** The outline point furthest in each diagonal direction — where prongs sit. */
function prongSpots(cutKey: string, count: number): THREE.Vector2[] {
  const pts = outline(cutKey);
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * TAU + Math.PI / count;
    const d = new THREE.Vector2(Math.cos(a), Math.sin(a));
    return pts.reduce((best, p) => (p.dot(d) > best.dot(d) ? p : best), pts[0]);
  });
}

/** Half the stone's length along x (long cuts are longer than they are wide). */
export function halfLength(cut: CutOption | null): number {
  return Math.max(...outline(cutKeyOf(cut)).map((p) => Math.abs(p.x)));
}

// ---------------------------------------------------------------- stone heads (settings)

export type SettingKey = "prong" | "bezel" | "basket" | "cathedral" | "tension" | "channel" | "pave" | string;

/** How high a stone's centre sits above the metal it is set on. */
export function liftFor(setting: SettingKey | undefined, r: number): number {
  if (setting === "bezel") return r * 0.5;
  if (setting === "channel") return r * 0.35;
  return r * 0.75;
}

function shapeRing(cutKey: string, outer: number, inner: number, depth: number) {
  const pts = outline(cutKey);
  const shape = new THREE.Shape(pts.map((p) => p.clone().multiplyScalar(outer)));
  shape.holes.push(new THREE.Path(pts.map((p) => p.clone().multiplyScalar(inner)).reverse()));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: depth * 0.15, bevelSize: (outer - inner) * 0.25, bevelSegments: 2, curveSegments: 4 });
  g.rotateX(-Math.PI / 2);
  return g;
}

/**
 * One stone in its setting. The stone's centre is the group origin, table up (+Y).
 * prong: claws; bezel: a metal rim following the cut's outline; basket: claws joined by a rail;
 * channel: two metal walls along x; tension / pavé centre: claws (the band does the rest).
 */
export function Head({ setting, r, gem, cut, finish, prongs = 4 }: { setting?: SettingKey; r: number; gem: GemstoneOption; cut: CutOption | null; finish: FinishOption; prongs?: number }) {
  const key = gem.surface === "pearl" ? "round" : cutKeyOf(cut);
  const bezel = useMemo(() => (setting === "bezel" ? shapeRing(key, r * 1.13, r * 0.98, r * 0.32) : null), [setting, key, r]);
  const rail = useMemo(() => (setting === "basket" ? shapeRing(key, r * 0.86, r * 0.74, r * 0.08) : null), [setting, key, r]);
  useEffect(() => () => [bezel, rail].forEach((g) => g?.dispose()), [bezel, rail]);
  const spots = useMemo(() => prongSpots(key, prongs), [key, prongs]);
  const len = halfLength(cut);
  const metal = <MetalMaterial finish={finish} />;

  if (gem.surface === "pearl") {
    // pearls sit on a small cup with a peg
    return (
      <group>
        <Stone gem={gem} cut={cut} r={r} />
        <mesh position={[0, -r * 0.85, 0]}>
          <sphereGeometry args={[r * 0.4, 20, 12, 0, TAU, Math.PI / 2, Math.PI / 2]} />
          {metal}
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <Stone gem={gem} cut={cut} r={r} />
      {setting === "bezel" && bezel ? (
        <>
          <mesh geometry={bezel} position={[0, -r * 0.2, 0]} name="metal">
            {metal}
          </mesh>
          <mesh position={[0, -r * 0.55, 0]} scale={[len, 1, 1]}>
            <cylinderGeometry args={[r * 0.98, r * 0.5, r * 0.55, 24, 1]} />
            {metal}
          </mesh>
        </>
      ) : setting === "channel" ? (
        [-1, 1].map((side) => (
          <mesh key={side} position={[0, -r * 0.12, side * r * 1.05]} name="metal">
            <boxGeometry args={[r * 2 * len + r * 0.3, r * 0.55, r * 0.16]} />
            {metal}
          </mesh>
        ))
      ) : setting === "tension" ? null : (
        <>
          {/* cup under the stone */}
          <mesh position={[0, -r * 0.62, 0]} scale={[len, 1, 1]}>
            <cylinderGeometry args={[r * 0.62, r * 0.32, r * 0.5, 20, 1]} />
            {metal}
          </mesh>
          {spots.map((p, i) => {
            const x = p.x * r * 0.97;
            const z = -p.y * r * 0.97;
            const tilt = new THREE.Vector3(x, 0, z).normalize();
            return (
              <group key={i}>
                <mesh position={[x * 0.85, -r * 0.3, z * 0.85]} rotation={[tilt.z * 0.22, 0, -tilt.x * 0.22]}>
                  <cylinderGeometry args={[r * 0.08, r * 0.1, r * 1.05, 8]} />
                  {metal}
                </mesh>
                <mesh position={[x, r * 0.2, z]}>
                  <sphereGeometry args={[r * 0.1, 10, 8]} />
                  {metal}
                </mesh>
              </group>
            );
          })}
          {rail && (
            <mesh geometry={rail} position={[0, -r * 0.5, 0]}>
              {metal}
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

// ---------------------------------------------------------------- instanced accents and beads

export interface Spot {
  position: THREE.Vector3;
  /** direction the stone's table (or the bead) faces */
  normal: THREE.Vector3;
}

function useInstanceMatrices(ref: React.RefObject<THREE.InstancedMesh | null>, spots: Spot[]) {
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    spots.forEach((s, i) => {
      q.setFromUnitVectors(up, s.normal.clone().normalize());
      m.compose(s.position, q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.count = spots.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [ref, spots]);
}

/** Small round accent stones (halos, pavé, clusters, eternity bands, tennis lines). */
export function Accents({ spots, r, gem = ACCENT_GEM, cutKey = "round" }: { spots: Spot[]; r: number; gem?: GemstoneOption; cutKey?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => (gem.surface === "pearl" ? new THREE.SphereGeometry(r * 0.95, 20, 14) : stoneGeometry(cutKey, r)), [r, cutKey, gem.surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useInstanceMatrices(ref, spots);
  if (!spots.length) return null;
  return (
    <instancedMesh key={spots.length} ref={ref} args={[geometry, undefined, spots.length]} name="stone">
      <GemMaterial gem={gem} />
    </instancedMesh>
  );
}

/** Small metal beads (shared prongs, millgrain, station beads). */
export function Beads({ spots, r, finish }: { spots: Spot[]; r: number; finish: FinishOption }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(r, 10, 8), [r]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useInstanceMatrices(ref, spots);
  if (!spots.length) return null;
  return (
    <instancedMesh key={spots.length} ref={ref} args={[geometry, undefined, spots.length]} name="metal">
      <MetalMaterial finish={finish} />
    </instancedMesh>
  );
}

// ---------------------------------------------------------------- text

/** Raised metal letters, centred on the origin, facing +Z. */
export function RaisedText({ text, size, depth, fontFile, finish, maxWidth }: { text: string; size: number; depth: number; fontFile?: string; finish: FinishOption; maxWidth?: number }) {
  const font = useLoader(FontLoader, fontFile ?? DEFAULT_TEXT_FONT);
  const geometry = useMemo(() => {
    const g = new TextGeometry(text, { font, size, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: depth * 0.2, bevelSize: size * 0.015, bevelSegments: 1 });
    g.center();
    if (maxWidth) {
      g.computeBoundingBox();
      const w = g.boundingBox!.max.x - g.boundingBox!.min.x;
      if (w > maxWidth) g.scale(maxWidth / w, maxWidth / w, 1);
    }
    return g;
  }, [font, text, size, depth, maxWidth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} name="metal">
      <MetalMaterial finish={finish} />
    </mesh>
  );
}
