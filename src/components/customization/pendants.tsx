"use client";

// Pendants in 3D (FR-05, D-25): solitaire drop, halo, birthstone, heart, cross, infinity, initial,
// bar, medallion, zodiac, locket and charm disc — each hanging from a bail on a fine chain.
// The pendant faces the viewer (+Z) with the bail at the top.

import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CutOption, FinishOption, GemstoneOption } from "@/types";
import type { ModelProps } from "./models";
import { MetalMaterial } from "./metal";
import { Accents, Beads, Head, RaisedText, TAU, perimeterPoints, type Spot } from "./parts";
import { cutKeyOf } from "./stones";

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const facing = V(0, 0, 1);

/** The chain rising from the bail (or from both ends of a bar) toward the neck. */
function Chain({ ends, finish, height = 1.1 }: { ends: THREE.Vector3[]; finish: FinishOption; height?: number }) {
  const tubes = useMemo(() => {
    const pairs = ends.length === 1 ? [ends[0], ends[0]] : ends;
    return pairs.map((p, i) => {
      const side = i === 0 ? -1 : 1;
      const top = V(side * 0.55, p.y + height, -0.15);
      const mid = V(p.x + side * 0.12, p.y + height * 0.45, -0.05);
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([p, mid, top]), 48, 0.014, 6, false);
    });
  }, [ends, height]);
  useEffect(() => () => tubes.forEach((t) => t.dispose()), [tubes]);
  return (
    <>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} name="metal">
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
    </>
  );
}

function Bail({ y, finish, r = 0.09 }: { y: number; finish: FinishOption; r?: number }) {
  return (
    <mesh position={[0, y + r, 0]} rotation={[0, Math.PI / 2, 0]} name="metal">
      <torusGeometry args={[r, r * 0.28, 12, 32]} />
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

/** A stone set facing the viewer. */
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

function heartShape(w: number) {
  const s = new THREE.Shape();
  const x = 0;
  const y = -w * 0.55;
  s.moveTo(x, y);
  s.bezierCurveTo(x - w * 0.15, y + w * 0.22, x - w * 0.62, y + w * 0.45, x - w * 0.55, y + w * 0.85);
  s.bezierCurveTo(x - w * 0.48, y + w * 1.2, x - w * 0.05, y + w * 1.2, x, y + w * 0.92);
  s.bezierCurveTo(x + w * 0.05, y + w * 1.2, x + w * 0.48, y + w * 1.2, x + w * 0.55, y + w * 0.85);
  s.bezierCurveTo(x + w * 0.62, y + w * 0.45, x + w * 0.15, y + w * 0.22, x, y);
  return s;
}

interface P {
  finish: FinishOption;
  gem: GemstoneOption | null;
  cut: CutOption | null;
  stones: number;
  s: number;
  setting?: string;
  text?: string;
  fontFile?: string;
}

/** Each style returns its shape plus where the chain attaches. */
function Body({ style, ...p }: P & { style?: string }): { node: React.ReactNode; ends: THREE.Vector3[] } {
  switch (style) {
    case "halo":
      return { node: <HaloP {...p} />, ends: [V(0, 0.42 * p.s + 0.18)] };
    case "birthstone":
      return { node: <BirthstoneP {...p} />, ends: [V(0, 0.2 * p.s + 0.17)] };
    case "heart":
      return { node: <HeartP {...p} />, ends: [V(0, 0.5 * p.s + 0.17)] };
    case "cross":
      return { node: <CrossP {...p} />, ends: [V(0, 0.62 * p.s + 0.17)] };
    case "infinity":
      return { node: <InfinityP {...p} />, ends: [V(-0.45 * p.s, 0.02), V(0.45 * p.s, 0.02)] };
    case "initial":
      return { node: <TextP {...p} size={0.62 * p.s} />, ends: [V(0, 0.42 * p.s + 0.17)] };
    case "bar":
      return { node: <BarP {...p} />, ends: [V(-0.66 * p.s - 0.05, 0), V(0.66 * p.s + 0.05, 0)] };
    case "medallion":
    case "zodiac":
      return { node: <MedallionP {...p} zodiac={style === "zodiac"} />, ends: [V(0, 0.5 * p.s + 0.17)] };
    case "locket":
      return { node: <LocketP {...p} />, ends: [V(0, 0.55 * p.s + 0.17)] };
    case "charm":
      return { node: <CharmP {...p} />, ends: [V(0, 0.3 * p.s + 0.17)] };
    default:
      return { node: <DropP {...p} />, ends: [V(0, 0.62 * p.s * 0.75 + 0.2)] };
  }
}

function DropP({ finish, gem, cut, stones, s, setting }: P) {
  const k = 0.75 * s;
  const r = 0.28 * k;
  const n = gem ? Math.max(stones, 0) : 0;
  return (
    <group>
      <Bail y={0.62 * k} finish={finish} />
      <mesh position={[0, 0, -0.03]} scale={[k * 0.78, k, 0.12]} name="metal">
        <sphereGeometry args={[0.62, 48, 32]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem &&
        Array.from({ length: n }, (_, i) => {
          const y = n === 1 ? 0 : (0.5 - i / (n - 1)) * k * 0.7;
          const rr = n === 1 ? r : r * 0.62;
          return <FrontStone key={i} gem={gem} cut={cut} r={rr} setting={setting ?? "bezel"} finish={finish} position={[0, y, 0.06]} />;
        })}
    </group>
  );
}

function HaloP({ finish, gem, cut, s, setting }: P) {
  const r = 0.2 * s;
  const ring: Spot[] = perimeterPoints(cutKeyOf(cut), 16, r * 1.38).map((p) => ({ position: V(p.x, p.y, 0.03), normal: facing }));
  return (
    <group>
      <Bail y={0.42 * s} finish={finish} />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.03]} name="metal">
        <cylinderGeometry args={[r * 1.65, r * 1.65, 0.06, 40]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem && <FrontStone gem={gem} cut={cut} r={r} setting={setting} finish={finish} position={[0, 0, 0.05]} />}
      <Accents spots={ring} r={r * 0.2} />
    </group>
  );
}

function BirthstoneP({ finish, gem, cut, s }: P) {
  const r = 0.17 * s;
  return (
    <group>
      <Bail y={0.2 * s} finish={finish} r={0.075} />
      {gem ? (
        <FrontStone gem={gem} cut={cut} r={r} setting="bezel" finish={finish} />
      ) : (
        <mesh name="metal">
          <sphereGeometry args={[r, 24, 16]} />
          <MetalMaterial finish={finish} />
        </mesh>
      )}
    </group>
  );
}

function HeartP({ finish, gem, cut, s, setting }: P) {
  const g = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(heartShape(0.85 * s), {
      depth: 0.08 * s,
      bevelEnabled: true,
      bevelThickness: 0.07 * s,
      bevelSize: 0.06 * s,
      bevelSegments: 6,
      curveSegments: 32,
    });
    geo.center();
    return geo;
  }, [s]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <group>
      <Bail y={0.5 * s} finish={finish} />
      <mesh geometry={g} name="metal">
        <MetalMaterial finish={finish} />
      </mesh>
      {gem && <FrontStone gem={gem} cut={cut} r={0.13 * s} setting={setting ?? "bezel"} finish={finish} position={[0, 0.02 * s, 0.12 * s]} />}
    </group>
  );
}

function CrossP({ finish, gem, cut, stones, s, setting }: P) {
  const w = 0.16 * s;
  const d = 0.07 * s;
  const spots: [number, number][] = [
    [0, 0.12],
    [0, -0.2],
    [-0.24, 0.12],
    [0.24, 0.12],
    [0, 0.42],
    [0, -0.48],
  ];
  return (
    <group>
      <Bail y={0.62 * s} finish={finish} />
      <mesh position={[0, -0.05 * s, 0]} name="metal">
        <boxGeometry args={[w, 1.25 * s, d]} />
        <MetalMaterial finish={finish} />
      </mesh>
      <mesh position={[0, 0.12 * s, 0]} name="metal">
        <boxGeometry args={[0.72 * s, w, d]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem &&
        spots
          .slice(0, stones)
          .map(([x, y], i) => (
            <FrontStone key={i} gem={gem} cut={cut} r={0.06 * s} setting={setting ?? "bezel"} finish={finish} position={[x * s, y * s, d / 2 + 0.01]} />
          ))}
    </group>
  );
}

function InfinityP({ finish, s }: P) {
  const g = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 96; i++) {
      const t = (i / 96) * TAU;
      const den = 1 + Math.sin(t) ** 2;
      // lemniscate of Bernoulli, with a slight crossing offset in z
      pts.push(V((0.5 * s * Math.cos(t)) / den, (0.5 * s * Math.sin(t) * Math.cos(t)) / den, 0.03 * Math.sin(t)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 200, 0.045 * s, 12, true);
  }, [s]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} name="metal">
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

function TextP({ finish, s, text, fontFile, size }: P & { size: number }) {
  const t = (text ?? "").trim() || "A";
  return (
    <group>
      <Bail y={0.42 * s} finish={finish} />
      <Suspense fallback={null}>
        <RaisedText text={t} size={size} depth={0.08 * s} fontFile={fontFile} finish={finish} maxWidth={1.1 * s} />
      </Suspense>
    </group>
  );
}

function BarP({ finish, s, text, fontFile, gem, cut }: P) {
  const t = (text ?? "").trim();
  return (
    <group>
      <mesh name="metal">
        <boxGeometry args={[1.3 * s, 0.2 * s, 0.05 * s]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (0.66 * s + 0.02), 0, 0]} rotation={[0, Math.PI / 2, 0]} name="metal">
          <torusGeometry args={[0.035, 0.01, 8, 20]} />
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
      {t && (
        <group position={[0, -0.005, 0.03 * s]}>
          <Suspense fallback={null}>
            <RaisedText text={t} size={0.12 * s} depth={0.012 * s} fontFile={fontFile} finish={finish} maxWidth={1.15 * s} />
          </Suspense>
        </group>
      )}
      {gem && <FrontStone gem={gem} cut={cut} r={0.05 * s} setting="bezel" finish={finish} position={[0.56 * s, 0, 0.03 * s]} />}
    </group>
  );
}

function MedallionP({ finish, s, text, fontFile, zodiac }: P & { zodiac?: boolean }) {
  const R = 0.45 * s;
  const t = (text ?? "").trim();
  const stars: Spot[] = zodiac
    ? Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * TAU;
        return { position: V(Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, 0.03 * s), normal: facing };
      })
    : [];
  return (
    <group>
      <Bail y={0.5 * s} finish={finish} />
      <mesh rotation={[Math.PI / 2, 0, 0]} name="metal">
        <cylinderGeometry args={[R, R, 0.05 * s, 64]} />
        <MetalMaterial finish={finish} />
      </mesh>
      <mesh position={[0, 0, 0]} name="metal">
        <torusGeometry args={[R, 0.03 * s, 12, 80]} />
        <MetalMaterial finish={finish} />
      </mesh>
      <Beads spots={stars} r={0.022 * s} finish={finish} />
      {t && (
        <group position={[0, 0, 0.03 * s]}>
          <Suspense fallback={null}>
            <RaisedText
              text={t}
              size={(zodiac ? 0.13 : t.length <= 3 ? 0.26 : 0.13) * s}
              depth={0.015 * s}
              fontFile={zodiac ? undefined : fontFile}
              finish={finish}
              maxWidth={R * 1.4}
            />
          </Suspense>
        </group>
      )}
    </group>
  );
}

function LocketP({ finish, s }: P) {
  return (
    <group>
      <Bail y={0.55 * s} finish={finish} />
      {[1, -1].map((side) => (
        <mesh key={side} position={[0, 0, side * 0.035 * s]} scale={[0.42 * s, 0.52 * s, 0.08 * s]} name="metal">
          <sphereGeometry args={[1, 48, 24, 0, TAU, side > 0 ? 0 : Math.PI / 2, Math.PI / 2]} />
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
      {/* the seam between the two halves and the hinge */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.42 * s, 1, 0.52 * s]} name="metal">
        <torusGeometry args={[1, 0.012 / (0.45 * s), 8, 64]} />
        <MetalMaterial finish={finish} />
      </mesh>
      <mesh position={[0.43 * s, 0, 0]} name="metal">
        <cylinderGeometry args={[0.02 * s, 0.02 * s, 0.22 * s, 10]} />
        <MetalMaterial finish={finish} />
      </mesh>
    </group>
  );
}

function CharmP({ finish, s, text, fontFile }: P) {
  const R = 0.28 * s;
  const t = (text ?? "").trim();
  return (
    <group>
      <Bail y={0.3 * s} finish={finish} r={0.07} />
      <mesh rotation={[Math.PI / 2, 0, 0]} name="metal">
        <cylinderGeometry args={[R, R, 0.04 * s, 48]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {t && (
        <group position={[0, 0, 0.025 * s]}>
          <Suspense fallback={null}>
            <RaisedText text={t} size={0.3 * s} depth={0.015 * s} fontFile={fontFile} finish={finish} maxWidth={R * 1.3} />
          </Suspense>
        </group>
      )}
    </group>
  );
}

export function PendantModel({ finish, gem, cut, stones, sizeFactor, design, textFontFile }: ModelProps) {
  const { node, ends } = Body({
    style: design?.style,
    finish,
    gem,
    cut,
    stones,
    s: sizeFactor,
    setting: design?.setting,
    text: design?.text,
    fontFile: textFontFile,
  });
  return (
    <group name="pendant" scale={[1.6, 1.6, 1.6]}>
      {node}
      <Chain ends={ends} finish={finish} />
    </group>
  );
}
