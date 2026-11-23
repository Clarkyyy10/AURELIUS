"use client";

// Earrings in 3D (FR-05, D-25): studs, huggies, hoops, drops, dangles, chandeliers, threaders,
// climbers, ear cuffs and jackets. Shown as a pair facing the viewer; stones are counted for the
// pair (the left earring gets the odd one).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CutOption, FinishOption, GemstoneOption } from "@/types";
import type { ModelProps } from "./models";
import { MetalMaterial } from "./metal";
import { Accents, Beads, Head, TAU, type Spot } from "./parts";

interface One {
  style?: string;
  setting?: string;
  finish: FinishOption;
  gem: GemstoneOption | null;
  cut: CutOption | null;
  stones: number;
  s: number;
}

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const facing = V(0, 0, 1);

function Tube({ points, radius, finish, closed = false }: { points: THREE.Vector3[]; radius: number; finish: FinishOption; closed?: boolean }) {
  const g = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), Math.max(24, points.length * 12), radius, 8, closed),
    [points, radius, closed],
  );
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} name="metal">
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

/** A hoop arc in the x–y plane (centre at origin). */
function Arc({ radius, tube, from = 0, to = TAU, finish }: { radius: number; tube: number; from?: number; to?: number; finish: FinishOption }) {
  return (
    <mesh rotation={[0, 0, from]} name="metal">
      <torusGeometry args={[radius, tube, 16, 96, to - from]} />
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

function Ball({ r, finish, position }: { r: number; finish: FinishOption; position?: THREE.Vector3 | [number, number, number] }) {
  return (
    <mesh position={position} name="metal">
      <sphereGeometry args={[r, 20, 14]} />
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

/** A stone set facing the viewer (table toward +Z). */
function FrontStone({
  gem,
  cut,
  r,
  setting,
  finish,
  position,
}: {
  gem: GemstoneOption;
  cut: CutOption | null;
  r: number;
  setting?: string;
  finish: FinishOption;
  position?: [number, number, number];
}) {
  return (
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <Head setting={setting === "bezel" ? "bezel" : "prong"} r={r} gem={gem} cut={cut} finish={finish} />
    </group>
  );
}

/** Post behind the earlobe (for pierced styles). */
function Post({ finish, z = -0.05 }: { finish: FinishOption; z?: number }) {
  return (
    <mesh position={[0, 0, z - 0.25]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.022, 0.022, 0.5, 8]} />
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

/** Small round drop at the end of a chain: the stone, or a polished metal bead. */
function DropEnd({
  gem,
  cut,
  r,
  setting,
  finish,
  position,
}: {
  gem: GemstoneOption | null;
  cut: CutOption | null;
  r: number;
  setting?: string;
  finish: FinishOption;
  position: [number, number, number];
}) {
  return gem ? (
    <FrontStone gem={gem} cut={cut} r={r} setting={setting} finish={finish} position={position} />
  ) : (
    <Ball r={r * 0.7} finish={finish} position={position} />
  );
}

function Earring({ style, setting, finish, gem, cut, stones, s }: One) {
  const stone = gem && stones > 0 ? gem : null;
  switch (style) {
    case "huggie": {
      const R = 0.26 * s;
      return (
        <group rotation={[0, 0.5, 0]}>
          <Arc radius={R} tube={0.065 * s} finish={finish} />
          {stone && <FrontStone gem={stone} cut={cut} r={0.08 * s} setting="bezel" finish={finish} position={[0, -R - 0.1 * s, 0.02]} />}
        </group>
      );
    }
    case "hoop": {
      const R = 0.55 * s;
      return (
        <group rotation={[0, 0.55, 0]} position={[0, -R + 0.1, 0]}>
          <Arc radius={R} tube={0.04 * s} from={Math.PI / 2 + 0.08} to={Math.PI / 2 + TAU - 0.08} finish={finish} />
          {stone && <FrontStone gem={stone} cut={cut} r={0.08 * s} setting="bezel" finish={finish} position={[0, -R - 0.02, 0.02]} />}
        </group>
      );
    }
    case "drop": {
      return (
        <group>
          <Ball r={0.07 * s} finish={finish} />
          <Post finish={finish} />
          <mesh position={[0, -0.13 * s, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.045 * s, 0.012 * s, 8, 24]} />
            <MetalMaterial finish={finish} />
          </mesh>
          {stone ? (
            <FrontStone gem={stone} cut={cut} r={0.17 * s} setting={setting} finish={finish} position={[0, -0.36 * s, 0]} />
          ) : (
            <mesh position={[0, -0.36 * s, 0]} scale={[0.75, 1.1, 0.4]} name="metal">
              <sphereGeometry args={[0.17 * s, 32, 20]} />
              <MetalMaterial finish={finish} />
            </mesh>
          )}
        </group>
      );
    }
    case "dangle": {
      const len = 0.7 * s;
      return (
        <group>
          <Ball r={0.065 * s} finish={finish} />
          <Post finish={finish} />
          <Tube points={[V(0, -0.05), V(0, -len / 2, 0.01), V(0, -len)]} radius={0.012 * s} finish={finish} />
          <Beads spots={[0.3, 0.55].map((t) => ({ position: V(0, -len * t), normal: facing }))} r={0.03 * s} finish={finish} />
          {stone ? (
            <FrontStone gem={stone} cut={cut} r={0.14 * s} setting={setting} finish={finish} position={[0, -len - 0.14 * s, 0]} />
          ) : (
            <mesh position={[0, -len - 0.18 * s, 0]} name="metal">
              <boxGeometry args={[0.06 * s, 0.36 * s, 0.03 * s]} />
              <MetalMaterial finish={finish} />
            </mesh>
          )}
        </group>
      );
    }
    case "chandelier": {
      // a top stud, a curved frame, and five strands of beads with a centre drop
      const w = 0.42 * s;
      const top = -0.22 * s;
      const strands = [-1, -0.5, 0, 0.5, 1];
      return (
        <group>
          {stone ? <FrontStone gem={stone} cut={cut} r={0.08 * s} setting={setting} finish={finish} /> : <Ball r={0.07 * s} finish={finish} />}
          <Post finish={finish} />
          <Tube points={[V(0, -0.06 * s), V(0, top)]} radius={0.014 * s} finish={finish} />
          <Tube
            points={[V(-w, top - 0.12 * s), V(-w * 0.5, top - 0.02 * s), V(0, top), V(w * 0.5, top - 0.02 * s), V(w, top - 0.12 * s)]}
            radius={0.02 * s}
            finish={finish}
          />
          <Tube points={[V(-w * 0.7, top - 0.3 * s), V(0, top - 0.42 * s), V(w * 0.7, top - 0.3 * s)]} radius={0.015 * s} finish={finish} />
          {strands.map((t) => {
            const x = t * w;
            const y0 = top - 0.02 * s - 0.1 * s * Math.abs(t);
            const len = (0.5 - 0.18 * Math.abs(t)) * s;
            return (
              <group key={t}>
                <Tube points={[V(x, y0), V(x * 0.95, y0 - len)]} radius={0.01 * s} finish={finish} />
                {t === 0 && stone ? (
                  <FrontStone gem={stone} cut={cut} r={0.12 * s} setting={setting} finish={finish} position={[x, y0 - len - 0.1 * s, 0]} />
                ) : (
                  <Ball r={(t === 0 ? 0.06 : 0.04) * s} finish={finish} position={[x * 0.95, y0 - len - 0.03 * s, 0]} />
                )}
              </group>
            );
          })}
          <Accents spots={strands.map((t) => ({ position: V(t * w * 0.7, top - (0.3 + 0.12 * (1 - Math.abs(t))) * s, 0.02), normal: facing }))} r={0.035 * s} />
        </group>
      );
    }
    case "threader": {
      return (
        <group rotation={[0, 0.7, 0]}>
          {/* the chain goes through the piercing: a short front strand and a longer back strand */}
          <Tube
            points={[V(0, -0.3 * s, 0.03), V(0, -0.08 * s, 0.05), V(0, 0, 0), V(0, -0.05 * s, -0.12), V(0.02, -0.8 * s, -0.16)]}
            radius={0.01 * s}
            finish={finish}
          />
          <DropEnd gem={stone} cut={cut} r={0.1 * s} setting={setting} finish={finish} position={[0, -0.38 * s, 0.03]} />
          <mesh position={[0.02, -0.86 * s, -0.16]} name="metal">
            <cylinderGeometry args={[0.018 * s, 0.018 * s, 0.14 * s, 8]} />
            <MetalMaterial finish={finish} />
          </mesh>
        </group>
      );
    }
    case "climber": {
      // stones climb up the ear along a gentle curve, getting smaller toward the top
      const n = Math.max(stones, 0);
      const count = n > 0 ? n : 5;
      const spots: Spot[] = [];
      const sizes: number[] = [];
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1);
        spots.push({ position: V(0.12 * s * Math.sin(t * 1.6), t * 0.85 * s, 0), normal: facing });
        sizes.push(0.075 * s * (1 - 0.35 * t));
      }
      const path = spots.map((p) => p.position.clone().add(V(0, 0, -0.04)));
      return (
        <group position={[0, -0.3 * s, 0]}>
          <Tube points={path.length > 1 ? path : [V(0, 0, -0.04), V(0, 0.1, -0.04)]} radius={0.025 * s} finish={finish} />
          <Post finish={finish} />
          {stone ? (
            spots.map((p, i) => (
              <group key={i} position={p.position} rotation={[Math.PI / 2, 0, 0]}>
                <Head setting="prong" r={sizes[i]} gem={stone} cut={cut} finish={finish} />
              </group>
            ))
          ) : (
            <Beads spots={spots} r={0.05 * s} finish={finish} />
          )}
        </group>
      );
    }
    case "ear_cuff": {
      const R = 0.3 * s;
      return (
        <group rotation={[0, 1.1, 0]}>
          {/* an open C that hugs the outer ear (no piercing) */}
          <Arc radius={R} tube={0.05 * s} from={0.6} to={TAU - 0.6} finish={finish} />
          <Arc radius={R} tube={0.025 * s} from={0.9} to={TAU - 0.9} finish={finish} />
          <Ball r={0.055 * s} finish={finish} position={[Math.cos(0.6) * R, Math.sin(0.6) * R, 0]} />
          <Ball r={0.055 * s} finish={finish} position={[Math.cos(-0.6) * R, Math.sin(-0.6) * R, 0]} />
          {stone && <FrontStone gem={stone} cut={cut} r={0.07 * s} setting="bezel" finish={finish} position={[-R - 0.02, 0, 0.03]} />}
        </group>
      );
    }
    case "jacket": {
      // a stud in front and a crescent that frames the lobe from behind
      const R = 0.3 * s;
      const accents: Spot[] = Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * 1.15 + (i / 8) * Math.PI * 0.7;
        return { position: V(Math.cos(a) * R, Math.sin(a) * R - 0.05 * s, -0.06), normal: facing };
      });
      return (
        <group>
          {stone ? <FrontStone gem={stone} cut={cut} r={0.12 * s} setting={setting} finish={finish} /> : <Ball r={0.09 * s} finish={finish} />}
          <Post finish={finish} />
          <group position={[0, -0.05 * s, -0.1]}>
            <Arc radius={R} tube={0.045 * s} from={Math.PI * 1.1} to={Math.PI * 1.9} finish={finish} />
          </group>
          <Accents spots={accents} r={0.035 * s} gem={stone ?? undefined} />
        </group>
      );
    }
    default: {
      // studs
      const r = 0.24 * s;
      return (
        <group>
          <Post finish={finish} />
          {stone ? (
            <FrontStone gem={stone} cut={cut} r={r} setting={setting} finish={finish} />
          ) : (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh scale={[1, 0.85, 1]} name="metal">
                <sphereGeometry args={[r * 0.9, 32, 24, 0, TAU, 0, Math.PI / 2]} />
                <MetalMaterial finish={finish} />
              </mesh>
              <mesh position={[0, -0.01, 0]} name="metal">
                <cylinderGeometry args={[r * 0.9, r * 0.9, 0.03, 32]} />
                <MetalMaterial finish={finish} />
              </mesh>
            </group>
          )}
        </group>
      );
    }
  }
}

const GAP: Record<string, number> = { hoop: 0.85, chandelier: 0.75, ear_cuff: 0.6, jacket: 0.6, climber: 0.5, huggie: 0.5 };

export function EarringsModel({ finish, gem, cut, stones, sizeFactor, design }: ModelProps) {
  const style = design?.style;
  const left = Math.ceil(stones / 2);
  const right = Math.floor(stones / 2);
  const x = GAP[style ?? ""] ?? 0.55;
  return (
    <group name="earrings" rotation={[0.12, 0, 0]}>
      {[
        [-x, left],
        [x, right],
      ].map(([px, n], i) => (
        // the right earring mirrors the left one
        <group key={i} position={[px * sizeFactor, 0, 0]} scale={[i ? -1 : 1, 1, 1]}>
          <Earring style={style} setting={design?.setting} finish={finish} gem={gem} cut={cut} stones={n} s={sizeFactor} />
        </group>
      ))}
    </group>
  );
}
