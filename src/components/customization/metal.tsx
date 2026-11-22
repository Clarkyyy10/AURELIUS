"use client";

// Metal material with the chosen surface texture (D-25): polished, satin, brushed, hammered,
// sandblasted or florentine. Textures are small procedural normal maps made once in the browser
// (no image files), plus a roughness that matches the real finish.

import { useMemo } from "react";
import * as THREE from "three";
import type { FinishOption } from "@/types";
import { useTextureKey } from "./stones";

interface TextureLook {
  roughness: number;
  clearcoat: number;
  normal: number;
  map?: "brushed" | "hammered" | "sand" | "florentine";
  repeat: [number, number];
}

const LOOKS: Record<string, TextureLook> = {
  polished: { roughness: 0, clearcoat: 0.3, normal: 0, repeat: [1, 1] },
  satin: { roughness: 0.38, clearcoat: 0, normal: 0, repeat: [1, 1] },
  brushed: { roughness: 0.3, clearcoat: 0, normal: 0.35, map: "brushed", repeat: [6, 2] },
  hammered: { roughness: 0.08, clearcoat: 0.2, normal: 0.9, map: "hammered", repeat: [5, 2] },
  sandblasted: { roughness: 0.6, clearcoat: 0, normal: 0.25, map: "sand", repeat: [6, 3] },
  florentine: { roughness: 0.25, clearcoat: 0, normal: 0.55, map: "florentine", repeat: [8, 3] },
};

const SIZE = 256;
const cache = new Map<string, THREE.Texture>();

/** Deterministic pseudo-random numbers, so every viewer shows the same texture. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function heightField(kind: NonNullable<TextureLook["map"]>): Float32Array {
  const h = new Float32Array(SIZE * SIZE);
  const rand = rng(7);
  const at = (x: number, y: number) => ((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE);
  if (kind === "brushed") {
    // long horizontal streaks
    for (let y = 0; y < SIZE; y++) {
      let v = rand();
      for (let x = 0; x < SIZE; x++) {
        v = v * 0.97 + rand() * 0.03;
        h[at(x, y)] = v + rand() * 0.04;
      }
    }
  } else if (kind === "sand") {
    for (let i = 0; i < h.length; i++) h[i] = rand();
  } else if (kind === "florentine") {
    // fine cross-hatch: two sets of diagonal grooves
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const a = Math.abs(Math.sin(((x + y) / SIZE) * Math.PI * 24));
        const b = Math.abs(Math.sin(((x - y) / SIZE) * Math.PI * 24));
        h[at(x, y)] = Math.min(a, b) ** 0.5 + rand() * 0.05;
      }
  } else {
    // hammered: overlapping shallow round dents (wrap around so the texture tiles)
    h.fill(1);
    for (let k = 0; k < 70; k++) {
      const cx = rand() * SIZE;
      const cy = rand() * SIZE;
      const r = 14 + rand() * 18;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const d2 = (dx * dx + dy * dy) / (r * r);
          if (d2 >= 1) continue;
          const i = at(Math.round(cx + dx), Math.round(cy + dy));
          h[i] = Math.min(h[i], 0.2 + 0.8 * d2);
        }
    }
  }
  return h;
}

function normalMap(kind: NonNullable<TextureLook["map"]>): THREE.Texture {
  const hit = cache.get(kind);
  if (hit) return hit;
  const h = heightField(kind);
  const data = new Uint8Array(SIZE * SIZE * 4);
  const at = (x: number, y: number) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  const k = kind === "hammered" ? 6 : 3;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * k;
      const dy = (at(x, y + 1) - at(x, y - 1)) * k;
      const n = new THREE.Vector3(-dx, -dy, 1).normalize();
      const i = (y * SIZE + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  cache.set(kind, tex);
  return tex;
}

export function MetalMaterial({ finish }: { finish: FinishOption }) {
  const key = useTextureKey() ?? "polished";
  const look = LOOKS[key] ?? LOOKS.polished;
  const map = useMemo(() => {
    if (!look.map) return null;
    const t = normalMap(look.map).clone();
    t.repeat.set(...look.repeat);
    t.needsUpdate = true;
    return t;
  }, [look]);
  return (
    <meshPhysicalMaterial
      // A different texture needs a new shader, so the material is rebuilt when it changes.
      key={key}
      color={finish.colorHex}
      metalness={1}
      roughness={Math.min(1, finish.roughness + look.roughness)}
      clearcoat={look.clearcoat}
      clearcoatRoughness={0.2}
      envMapIntensity={1.2}
      normalMap={map ?? undefined}
      normalScale={new THREE.Vector2(look.normal, look.normal)}
    />
  );
}
