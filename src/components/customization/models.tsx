"use client";

// Procedural jewelry models (frontend-spec §5.4) — no external files needed in Phase 1.
// Every model reads only the resolved options, so the viewer always matches the selection (NFR).

import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { ChainPattern, ClaspKind, CutOption, FinishOption, GemstoneOption } from "@/types";
import { MetalMaterial } from "./metal";
import { safeText } from "./parts";

export interface ModelProps {
  finish: FinishOption;
  gem: GemstoneOption | null;
  cut: CutOption | null;
  stones: number;
  sizeFactor: number;
  /** Name pendants only */
  nameText?: string;
  fontFile?: string;
  /** Script fonts join their letters; other fonts get a connecting bar. */
  scriptFont?: boolean;
  /** Necklaces only */
  chainPattern?: ChainPattern;
  claspKind?: ClaspKind;
  /** Chosen design options (D-25), by key: e.g. style "halo", setting "bezel", profile "d_shape". */
  design?: DesignKeys;
  /** Font for style text (initial, signet, bar, ID plate). */
  textFontFile?: string;
}

export interface DesignKeys {
  style?: string;
  setting?: string;
  profile?: string;
  shank?: string;
  texture?: string;
  /** Short text for initial, signet, bar, medallion, zodiac and ID styles. */
  text?: string;
}

// ---------------------------------------------------------------- materials (shared)

export { MetalMaterial } from "./metal";
export { GemMaterial, Stone } from "./stones";

export function Prongs({ r, finish, count = 4, height }: { r: number; finish: FinishOption; count?: number; height: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r * 0.95, height / 2 - r * 0.2, Math.sin(a) * r * 0.95]}
            rotation={[Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15]}
          >
            <cylinderGeometry args={[r * 0.09, r * 0.12, height, 8]} />
            <MetalMaterial finish={finish} />
          </mesh>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- name pendant

/**
 * The customer's name as solid 3D metal in the chosen font, with jump rings at both ends and the
 * chain rising to the neck. Size changes the letter height. An empty name shows a faint "Your name".
 */
export function NamePendantModel({ finish, sizeFactor, nameText, fontFile, scriptFont }: ModelProps) {
  const font = useLoader(FontLoader, fontFile ?? "/fonts/great-vibes.typeface.json");
  const typed = (nameText ?? "").trim();
  const text = typed || "Your name";
  const letter = 0.62 * sizeFactor;
  const depth = 0.07 * sizeFactor;

  const ringR = 0.06 * sizeFactor;

  const { geometry, width, height, rings } = useMemo(() => {
    const g = new TextGeometry(safeText(font, text) || "?", {
      font,
      size: letter,
      depth,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.01,
      bevelSegments: 2,
    });
    g.center();
    g.computeBoundingBox();
    const b = g.boundingBox!;
    const h = b.max.y - b.min.y;

    // Attach the jump rings to the real metal: the outermost point of the first and last letters,
    // looking only at their upper part so the chain hangs evenly (e.g. a "c" curves inward and a
    // "k" ends low, so the bounding box edge would leave the rings floating).
    const pos = g.attributes.position;
    const minY = b.min.y + h * 0.35;
    let left: [number, number] = [b.min.x, 0];
    let right: [number, number] = [b.max.x, 0];
    let lx = Infinity;
    let rx = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      if (y < minY) continue;
      if (x < lx) [lx, left] = [x, [x, y]];
      if (x > rx) [rx, right] = [x, [x, y]];
    }
    // Each ring overlaps its letter by half a ring, so it is visibly joined to the metal.
    const overlap = ringR * 0.75;
    return {
      geometry: g,
      width: b.max.x - b.min.x,
      height: h,
      rings: [
        [left[0] - overlap, left[1]],
        [right[0] + overlap, right[1]],
      ] as [number, number][],
    };
  }, [font, text, letter, depth, ringR]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // The chain starts at the top of each ring and rises to the wearer's neck.
  const chain = useMemo(() => {
    const topY = Math.max(rings[0][1], rings[1][1]) + width * 0.55;
    return rings.map(([x, y]) => {
      const start = new THREE.Vector3(x, y + ringR, 0);
      const mid = new THREE.Vector3(x + Math.sign(x) * width * 0.04, y + width * 0.25, -0.02);
      const top = new THREE.Vector3(Math.sign(x) * width * 0.18, topY, -0.05);
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, top]), 48, 0.012 * Math.max(1, sizeFactor), 6, false);
    });
  }, [rings, width, ringR, sizeFactor]);
  useEffect(() => () => chain.forEach((c) => c.dispose()), [chain]);

  return (
    <group name="name_pendant" rotation={[0.08, 0, 0]}>
      <mesh geometry={geometry} name="metal" castShadow>
        {typed ? <MetalMaterial finish={finish} /> : <meshStandardMaterial color="#b9b2a6" transparent opacity={0.35} />}
      </mesh>
      {!scriptFont && typed && (
        <mesh position={[0, -height / 2 + 0.03 * sizeFactor, 0]} name="metal">
          <boxGeometry args={[width * 0.98, 0.05 * sizeFactor, depth * 0.9]} />
          <MetalMaterial finish={finish} />
        </mesh>
      )}
      {rings.map(([x, y]) => (
        <mesh key={x} position={[x, y, 0]} name="metal">
          <torusGeometry args={[ringR, ringR * 0.28, 12, 28]} />
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
      {chain.map((g, i) => (
        <mesh key={i} geometry={g} name="metal">
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
    </group>
  );
}
