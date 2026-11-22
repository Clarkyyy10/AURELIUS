"use client";

// Necklace chain styles in 3D (FR-05). Each style follows its real construction (research notes in
// docs/decisions.md D-23): links are repeated along the necklace curve with instancing, so even dense
// chains (popcorn, wheat, herringbone) stay fast. One shared metal material per chain.

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ChainPattern, ClaspKind, FinishOption } from "@/types";
import { MetalMaterial } from "./models";

/** Base link size (chain gauge) in scene units. */
const G = 0.05;
const TAU = Math.PI * 2;

type V3 = [number, number, number];
interface Item {
  /** distance along the chain */
  s: number;
  /** offset in the link's local frame: x = along the chain, y = across (in the chest plane), z = out of the chest */
  offset?: V3;
  rot?: V3;
  scale?: V3;
}

/** Local frame along the curve. The chain lies in the chest (x–y) plane, so N = Z × T and B ≈ Z are stable. */
function frameAt(curve: THREE.Curve<THREE.Vector3>, t: number) {
  const p = curve.getPointAt(t);
  const T = curve.getTangentAt(t).normalize();
  const N = new THREE.Vector3(0, 0, 1).cross(T).normalize();
  const B = new THREE.Vector3().crossVectors(T, N).normalize();
  return { p, T, N, B };
}

function toMatrices(curve: THREE.Curve<THREE.Vector3>, length: number, items: Item[]): THREE.Matrix4[] {
  const basis = new THREE.Matrix4();
  const local = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  return items
    .filter((it) => it.s >= 0 && it.s <= length)
    .map((it) => {
      const { p, T, N, B } = frameAt(curve, it.s / length);
      basis.makeBasis(T, N, B).setPosition(p);
      const [rx, ry, rz] = it.rot ?? [0, 0, 0];
      q.setFromEuler(e.set(rx, ry, rz, "XYZ"));
      local.compose(new THREE.Vector3(...(it.offset ?? [0, 0, 0])), q, new THREE.Vector3(...(it.scale ?? [1, 1, 1])));
      return new THREE.Matrix4().multiplyMatrices(basis, local);
    });
}

function Instances({ geometry, matrices, finish }: { geometry: THREE.BufferGeometry; matrices: THREE.Matrix4[]; finish: FinishOption }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [matrices]);
  if (matrices.length === 0) return null;
  return (
    <instancedMesh key={matrices.length} ref={ref} args={[geometry, undefined, matrices.length]} name="metal">
      <MetalMaterial finish={finish} />
    </instancedMesh>
  );
}

/** A tube following a path offset from the chain centre line (rope / Singapore strands, snake and popcorn cores). */
function strand(curve: THREE.Curve<THREE.Vector3>, length: number, radius: number, offsetAt: (s: number) => [number, number]) {
  const steps = Math.max(200, Math.round(length / (G * 0.25)));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const s = (i / steps) * length;
    const { p, N, B } = frameAt(curve, s / length);
    const [a, b] = offsetAt(s);
    pts.push(p.clone().addScaledVector(N, a).addScaledVector(B, b));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, radius, 8, false);
}

/** V-shaped link (herringbone, Franco), tip pointing along +x, lying in the x–y plane. */
function chevron(arm: number, width: number, thick: number) {
  const a = new THREE.BoxGeometry(arm, width, thick).translate(-arm / 2, 0, 0).rotateZ(0.6);
  const b = new THREE.BoxGeometry(arm, width, thick).translate(-arm / 2, 0, 0).rotateZ(-0.6);
  return mergeGeometries([a, b])!;
}

const along = (length: number, spacing: number) => Array.from({ length: Math.floor(length / spacing) + 1 }, (_, i) => i * spacing);

interface Part {
  geometry: THREE.BufferGeometry;
  matrices?: THREE.Matrix4[];
}

/** Builds the meshes for one chain pattern. Returns geometries (plain or instanced). */
function buildChain(pattern: ChainPattern, curve: THREE.Curve<THREE.Vector3>, length: number): Part[] {
  const M = (items: Item[]) => toMatrices(curve, length, items);
  const flip = (i: number): V3 => (i % 2 ? [Math.PI / 2, 0, 0] : [0, 0, 0]);
  const twist = (i: number, a: number): V3 => [i % 2 ? a : -a, 0, 0];

  switch (pattern) {
    case "cable": {
      const sx = 1.4, tube = 0.28 * G;
      const sp = 2 * G * sx - 2 * tube;
      return [{ geometry: new THREE.TorusGeometry(G, tube, 8, 20), matrices: M(along(length, sp).map((s, i) => ({ s, rot: flip(i), scale: [sx, 1, 1] }))) }];
    }
    case "rolo": {
      const tube = 0.38 * G;
      const sp = 2 * G - 1.6 * tube;
      return [{ geometry: new THREE.TorusGeometry(G, tube, 10, 20), matrices: M(along(length, sp).map((s, i) => ({ s, rot: flip(i) }))) }];
    }
    case "paperclip": {
      const sx = 2.6, tube = 0.22 * G;
      const sp = 2 * G * sx - 2 * tube;
      return [{ geometry: new THREE.TorusGeometry(G, tube, 8, 28), matrices: M(along(length, sp).map((s, i) => ({ s, rot: flip(i), scale: [sx, 0.9, 1] }))) }];
    }
    case "mariner": {
      const sx = 1.5, tube = 0.3 * G;
      const sp = 2 * G * sx - 2 * tube;
      const items = along(length, sp).map((s, i) => ({ s, rot: flip(i), scale: [sx, 1.05, 1] as V3 }));
      return [
        { geometry: new THREE.TorusGeometry(G, tube, 8, 22), matrices: M(items) },
        // the anchor bar across the middle of every link
        { geometry: new THREE.CylinderGeometry(0.17 * G, 0.17 * G, 2 * G, 8), matrices: M(items.map((it) => ({ s: it.s, rot: it.rot }))) },
      ];
    }
    case "figaro": {
      // 3 short flat links, then 1 long one, repeated
      const tube = 0.3 * G;
      const lens = [1.3, 1.3, 1.3, 3.0];
      const items: Item[] = [];
      let s = 0;
      for (let i = 0; s <= length; i++) {
        const sx = lens[i % 4];
        items.push({ s, rot: twist(i, 0.4), scale: [sx, 1, 1] });
        s += G * sx + G * lens[(i + 1) % 4] - 2 * tube;
      }
      return [{ geometry: new THREE.TorusGeometry(G, tube, 8, 24), matrices: M(items) }];
    }
    case "satellite": {
      const g = G * 0.75, sx = 1.4, tube = 0.26 * g;
      const sp = 2 * g * sx - 2 * tube;
      const pos = along(length, sp);
      return [
        { geometry: new THREE.TorusGeometry(g, tube, 8, 18), matrices: M(pos.filter((_, i) => i % 8 !== 4).map((s, i) => ({ s, rot: flip(i), scale: [sx, 1, 1] }))) },
        { geometry: new THREE.SphereGeometry(1.25 * G, 16, 12), matrices: M(pos.filter((_, i) => i % 8 === 4).map((s) => ({ s }))) },
      ];
    }
    case "bead": {
      const sp = 2.3 * G;
      const pos = along(length, sp);
      return [
        { geometry: new THREE.SphereGeometry(0.85 * G, 16, 12), matrices: M(pos.map((s) => ({ s }))) },
        { geometry: new THREE.CylinderGeometry(0.12 * G, 0.12 * G, sp, 6), matrices: M(pos.map((s) => ({ s: s + sp / 2, rot: [0, 0, -Math.PI / 2] }))) },
      ];
    }
    case "curb": {
      const sx = 1.5, tube = 0.33 * G;
      return [{ geometry: new THREE.TorusGeometry(G, tube, 8, 22), matrices: M(along(length, 1.9 * G).map((s, i) => ({ s, rot: twist(i, 0.45), scale: [sx, 1, 1] }))) }];
    }
    case "cuban": {
      const r = 1.15 * G, tube = 0.5 * G;
      return [{ geometry: new THREE.TorusGeometry(r, tube, 10, 24), matrices: M(along(length, 1.9 * G).map((s, i) => ({ s, rot: twist(i, 0.4), scale: [1.35, 1, 0.8] }))) }];
    }
    case "herringbone": {
      // flat V-shaped links in alternating directions, packed tightly into a smooth tape
      return [{ geometry: chevron(1.9 * G, 0.45 * G, 0.3 * G), matrices: M(along(length, 0.38 * G).map((s, i) => ({ s, rot: [0, 0, i % 2 ? Math.PI : 0] }))) }];
    }
    case "omega": {
      return [{ geometry: new THREE.BoxGeometry(0.42 * G, 3.0 * G, 0.55 * G), matrices: M(along(length, 0.47 * G).map((s) => ({ s }))) }];
    }
    case "rope": {
      // three strands twisted around each other
      const R = 0.55 * G, pitch = 3.2 * G;
      return [0, 1, 2].map((k) => ({ geometry: strand(curve, length, 0.48 * G, (s) => { const a = (s / pitch) * TAU + (k * TAU) / 3; return [R * Math.cos(a), R * Math.sin(a)]; }) }));
    }
    case "singapore": {
      // one fine curb twisted along its length: two thin, flatter strands with a tight twist
      const R = 0.38 * G, pitch = 1.8 * G;
      return [0, 1].map((k) => ({ geometry: strand(curve, length, 0.3 * G, (s) => { const a = (s / pitch) * TAU + k * Math.PI; return [R * Math.cos(a), 0.6 * R * Math.sin(a)]; }) }));
    }
    case "wheat": {
      // four strands of twisted ovals braided: each step turns 90° around the chain and tilts forward
      return [{
        geometry: new THREE.SphereGeometry(G, 12, 8),
        matrices: M(along(length, 0.55 * G).map((s, i) => {
          const a = (i % 4) * (Math.PI / 2);
          return { s, rot: [a, 0, 0.6], offset: [0, 0.42 * G * Math.cos(a), 0.42 * G * Math.sin(a)], scale: [1.55, 0.6, 0.5] };
        })),
      }];
    }
    case "franco": {
      // V-links on all four sides of a square chain, all pointing the same way
      const v = chevron(1.25 * G, 0.42 * G, 0.3 * G).rotateX(Math.PI / 2);
      const items: Item[] = [];
      for (const s of along(length, 0.78 * G))
        for (let k = 0; k < 4; k++) {
          const a = k * (Math.PI / 2);
          items.push({ s, rot: [a, 0, 0], offset: [0, 0.72 * G * Math.cos(a), 0.72 * G * Math.sin(a)] });
        }
      return [{ geometry: v, matrices: M(items) }];
    }
    case "byzantine": {
      // 2-2-2 units of paired rings (flat pair, standing pair, flat pair); each unit turns 90° to the last
      const ring = 0.75 * G, tube = 0.26 * G, unit = 4.2 * G;
      const items: Item[] = [];
      for (const [u, s0] of along(length, unit).entries()) {
        const turn = u % 2 ? Math.PI / 2 : 0;
        [0, 1.05, 2.1].forEach((d, j) => {
          const standing = j === 1;
          for (const side of [-1, 1])
            items.push({
              s: s0 + d * G,
              rot: [turn + (standing ? Math.PI / 2 : 0), 0, 0],
              offset: [0, standing ? side * 0.3 * G : 0, standing ? 0 : side * 0.3 * G],
              scale: [1.15, 1, 1],
            });
        });
      }
      return [{ geometry: new THREE.TorusGeometry(ring, tube, 8, 18), matrices: M(items) }];
    }
    case "bismarck": {
      // two curb rows side by side, offset by half a link
      const items: Item[] = [];
      for (const side of [-1, 1])
        along(length, 1.6 * G).forEach((s, i) => items.push({ s: s + (side > 0 ? 0.8 * G : 0), rot: twist(i, 0.5), offset: [0, side * 0.95 * G, 0], scale: [1.4, 1, 1] }));
      return [{ geometry: new THREE.TorusGeometry(0.85 * G, 0.3 * G, 8, 20), matrices: M(items) }];
    }
    case "box":
    case "venetian": {
      // square links, each turned 90° — reads as a square tube
      const tight = pattern === "venetian";
      const geo = new THREE.TorusGeometry(G * (tight ? 1.05 : 1), G * (tight ? 0.34 : 0.3), 4, 4).rotateZ(Math.PI / 4);
      return [{ geometry: geo, matrices: M(along(length, (tight ? 0.82 : 0.95) * G).map((s, i) => ({ s, rot: flip(i) }))) }];
    }
    case "snake": {
      return [
        { geometry: strand(curve, length, 0.9 * G, () => [0, 0]) },
        // segment edges
        { geometry: new THREE.TorusGeometry(0.93 * G, 0.1 * G, 6, 20), matrices: M(along(length, 0.42 * G).map((s) => ({ s, rot: [0, Math.PI / 2, 0] }))) },
      ];
    }
    case "popcorn": {
      const items: Item[] = [];
      along(length, 0.55 * G).forEach((s, i) => {
        for (let k = 0; k < 4; k++) {
          const a = k * (Math.PI / 2) + (i % 2) * (Math.PI / 4);
          items.push({ s, offset: [0, 0.55 * G * Math.cos(a), 0.55 * G * Math.sin(a)] });
        }
      });
      return [
        { geometry: strand(curve, length, 0.5 * G, () => [0, 0]) },
        { geometry: new THREE.SphereGeometry(0.42 * G, 10, 8), matrices: M(items) },
      ];
    }
  }
}

/** The clasp at the two open ends of the necklace. */
export function Clasp({ kind, start, end, finish }: { kind: ClaspKind; start: THREE.Vector3; end: THREE.Vector3; finish: FinishOption }) {
  const jump = (p: THREE.Vector3) => (
    <mesh position={p} name="metal">
      <torusGeometry args={[1.3 * G, 0.3 * G, 10, 24]} />
      <MetalMaterial finish={finish} />
    </mesh>
  );
  const up = (p: THREE.Vector3, dy: number) => p.clone().add(new THREE.Vector3(0, dy, 0));
  switch (kind) {
    case "lobster":
      return (
        <group>
          {jump(up(start, 0.06))}
          <mesh position={up(end, 0.1)} rotation={[0, 0, 0.25]} name="metal">
            <capsuleGeometry args={[0.8 * G, 2.6 * G, 6, 14]} />
            <MetalMaterial finish={finish} />
          </mesh>
        </group>
      );
    case "spring_ring":
      return (
        <group>
          {jump(up(start, 0.06))}
          <mesh position={up(end, 0.08)} name="metal">
            <torusGeometry args={[1.5 * G, 0.42 * G, 12, 28]} />
            <MetalMaterial finish={finish} />
          </mesh>
        </group>
      );
    case "toggle":
      return (
        <group>
          <mesh position={up(start, 0.1)} name="metal">
            <torusGeometry args={[2.0 * G, 0.4 * G, 12, 32]} />
            <MetalMaterial finish={finish} />
          </mesh>
          <mesh position={up(end, 0.06)} rotation={[0, 0, Math.PI / 2]} name="metal">
            <capsuleGeometry args={[0.32 * G, 4.6 * G, 6, 12]} />
            <MetalMaterial finish={finish} />
          </mesh>
        </group>
      );
    case "box":
      return (
        <group>
          {jump(up(start, 0.06))}
          <mesh position={up(end, 0.09)} name="metal">
            <boxGeometry args={[2.6 * G, 1.9 * G, 1.3 * G]} />
            <MetalMaterial finish={finish} />
          </mesh>
        </group>
      );
  }
}

/** Any chain style laid along a curve that lies in the x–y plane (necklaces, bracelets, anklets). */
export function ChainAlong({ pattern, curve, length, finish }: { pattern: ChainPattern; curve: THREE.Curve<THREE.Vector3>; length: number; finish: FinishOption }) {
  const parts = useMemo(() => buildChain(pattern, curve, length), [pattern, curve, length]);
  useLayoutEffect(() => () => parts.forEach((p) => p.geometry.dispose()), [parts]);
  return (
    <>
      {parts.map((part, i) =>
        part.matrices ? (
          <Instances key={`${pattern}-${i}`} geometry={part.geometry} matrices={part.matrices} finish={finish} />
        ) : (
          <mesh key={`${pattern}-${i}`} geometry={part.geometry} name="metal">
            <MetalMaterial finish={finish} />
          </mesh>
        ),
      )}
    </>
  );
}
