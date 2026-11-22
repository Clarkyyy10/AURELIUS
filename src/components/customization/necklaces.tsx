"use client";

// Necklace designs in 3D (FR-05, D-25): single chain, layered, lariat (Y), station, tennis, pearl
// strand, collar (torc) and bib. Chains use the chosen chain style; the necklace lies in the chest
// (x–y) plane facing the viewer, with the clasp at the back of the neck (the two top ends).

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ChainPattern, ClaspKind, CutOption, FinishOption, GemstoneOption } from "@/types";
import type { ModelProps } from "./models";
import { MetalMaterial } from "./metal";
import { ChainAlong, Clasp } from "./chains";
import { Accents, Beads, Head, type Spot } from "./parts";

const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
const facing = V(0, 0, 1);

/** The necklace path for a length factor: from one end at the back of the neck, around the front, to the other. */
export function necklaceCurve(sizeFactor: number, depth = 1) {
  const w = 1.2 * Math.sqrt(sizeFactor);
  const d = 1.7 * sizeFactor * depth;
  const c = new THREE.CatmullRomCurve3([
    V(-w, 1.0, 0),
    V(-w * 0.95, 0.2, 0.1),
    V(-w * 0.6, -d * 0.55, 0.15),
    V(0, -d * 0.8, 0.18),
    V(w * 0.6, -d * 0.55, 0.15),
    V(w * 0.95, 0.2, 0.1),
    V(w, 1.0, 0),
  ]);
  return { curve: c, length: c.getLength() };
}

function Strand({ sizeFactor, depth = 1, pattern, clasp, finish, z = 0 }: { sizeFactor: number; depth?: number; pattern: ChainPattern; clasp?: ClaspKind; finish: FinishOption; z?: number }) {
  const { curve, length } = useMemo(() => necklaceCurve(sizeFactor, depth), [sizeFactor, depth]);
  return (
    <group position={[0, 0, z]}>
      <ChainAlong pattern={pattern} curve={curve} length={length} finish={finish} />
      {clasp && <Clasp kind={clasp} start={curve.getPointAt(0)} end={curve.getPointAt(1)} finish={finish} />}
    </group>
  );
}

/** Evenly spaced points along a curve between u0 and u1. */
function along(curve: THREE.Curve<THREE.Vector3>, n: number, u0 = 0, u1 = 1): THREE.Vector3[] {
  return Array.from({ length: n }, (_, i) => curve.getPointAt(n === 1 ? (u0 + u1) / 2 : u0 + ((u1 - u0) * i) / (n - 1)));
}

function Collar({ sizeFactor, finish }: { sizeFactor: number; finish: FinishOption }) {
  // a rigid, polished torc: a thick round wire, open at the back with a ball at each end
  const { g, ends } = useMemo(() => {
    const w = 1.05 * Math.sqrt(sizeFactor);
    const curve = new THREE.CatmullRomCurve3([V(-w * 0.45, 0.85, -0.2), V(-w, 0.2, 0), V(-w * 0.7, -0.55, 0.12), V(0, -0.8, 0.18), V(w * 0.7, -0.55, 0.12), V(w, 0.2, 0), V(w * 0.45, 0.85, -0.2)]);
    return { g: new THREE.TubeGeometry(curve, 160, 0.06, 16, false), ends: [curve.getPointAt(0), curve.getPointAt(1)] };
  }, [sizeFactor]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <>
      <mesh geometry={g} name="metal" castShadow>
        <MetalMaterial finish={finish} />
      </mesh>
      {ends.map((p, i) => (
        <mesh key={i} position={p} name="metal">
          <sphereGeometry args={[0.1, 20, 14]} />
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
    </>
  );
}

function Lariat({ sizeFactor, pattern, clasp, finish, gem, cut }: { sizeFactor: number; pattern: ChainPattern; clasp: ClaspKind; finish: FinishOption; gem: GemstoneOption | null; cut: CutOption | null }) {
  const { curve } = useMemo(() => necklaceCurve(sizeFactor), [sizeFactor]);
  const { tail, tailLength, bottom } = useMemo(() => {
    const b = curve.getPointAt(0.5);
    const t = new THREE.CatmullRomCurve3([b, V(0.02, b.y - 0.45, b.z + 0.02), V(0, b.y - 0.95, b.z)]);
    return { tail: t, tailLength: t.getLength(), bottom: t.getPointAt(1) };
  }, [curve]);
  return (
    <>
      <Strand sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} />
      <ChainAlong pattern={pattern} curve={tail} length={tailLength} finish={finish} />
      {/* the ring where the drop meets the necklace */}
      <mesh position={curve.getPointAt(0.5)} name="metal">
        <torusGeometry args={[0.07, 0.022, 10, 28]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem ? (
        <group position={[bottom.x, bottom.y - 0.14, bottom.z]} rotation={[Math.PI / 2, 0, 0]}>
          <Head setting="bezel" r={0.12} gem={gem} cut={cut} finish={finish} />
        </group>
      ) : (
        <mesh position={[bottom.x, bottom.y - 0.08, bottom.z]} name="metal">
          <sphereGeometry args={[0.07, 20, 14]} />
          <MetalMaterial finish={finish} />
        </mesh>
      )}
    </>
  );
}

function Station({ sizeFactor, pattern, clasp, finish, gem, cut, stones }: { sizeFactor: number; pattern: ChainPattern; clasp: ClaspKind; finish: FinishOption; gem: GemstoneOption | null; cut: CutOption | null; stones: number }) {
  const { curve } = useMemo(() => necklaceCurve(sizeFactor), [sizeFactor]);
  const points = useMemo(() => along(curve, Math.max(stones, 1), 0.22, 0.78), [curve, stones]);
  return (
    <>
      <Strand sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} />
      {gem &&
        points.map((p, i) => (
          <group key={i} position={[p.x, p.y, p.z + 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <Head setting="bezel" r={0.075} gem={gem} cut={cut} finish={finish} />
          </group>
        ))}
    </>
  );
}

/** A continuous line of stones (tennis) or pearls (strand) along the necklace, with a clasp. */
function StoneLine({ sizeFactor, finish, gem, stones, clasp, pearls }: { sizeFactor: number; finish: FinishOption; gem: GemstoneOption | null; stones: number; clasp: ClaspKind; pearls?: boolean }) {
  const { curve, length } = useMemo(() => necklaceCurve(sizeFactor), [sizeFactor]);
  const n = Math.max(stones, 1);
  const r = Math.min(pearls ? 0.11 : 0.08, (length / n) * (pearls ? 0.49 : 0.42));
  const u0 = 0.025;
  const spots: Spot[] = useMemo(() => along(curve, n, u0, 1 - u0).map((p) => ({ position: p, normal: facing })), [curve, n]);
  const beads: Spot[] = useMemo(
    () =>
      pearls
        ? []
        : spots.slice(0, -1).flatMap((s, i) => {
            const m = s.position.clone().lerp(spots[i + 1].position, 0.5);
            const t = spots[i + 1].position.clone().sub(s.position).normalize();
            const across = new THREE.Vector3(-t.y, t.x, 0).multiplyScalar(r * 0.75);
            return [m.clone().add(across), m.clone().sub(across)].map((position) => ({ position: position.setZ(position.z + r * 0.35), normal: facing }));
          }),
    [spots, pearls, r],
  );
  return (
    <>
      {gem && <Accents spots={spots} r={r} gem={gem} />}
      {!pearls && (
        // the metal links under the stones
        <Beads spots={spots.map((s) => ({ position: s.position.clone().setZ(s.position.z - r * 0.4), normal: facing }))} r={r * 0.8} finish={finish} />
      )}
      <Beads spots={beads} r={r * 0.18} finish={finish} />
      <Clasp kind={clasp} start={curve.getPointAt(0)} end={curve.getPointAt(1)} finish={finish} />
    </>
  );
}

function Bib({ sizeFactor, pattern, clasp, finish }: { sizeFactor: number; pattern: ChainPattern; clasp: ClaspKind; finish: FinishOption }) {
  // several drapes hang between two points on the necklace and fan out over the chest
  const { curve } = useMemo(() => necklaceCurve(sizeFactor * 0.85), [sizeFactor]);
  const drapes = useMemo(() => {
    const a = curve.getPointAt(0.3);
    const b = curve.getPointAt(0.7);
    const bottom = curve.getPointAt(0.5);
    return [0.35, 0.7, 1.05, 1.4].map((drop) => {
      const c = new THREE.CatmullRomCurve3([a, V(a.x * 0.6, bottom.y - drop * 0.6, bottom.z + 0.02), V(0, bottom.y - drop, bottom.z + 0.03), V(b.x * 0.6, bottom.y - drop * 0.6, bottom.z + 0.02), b]);
      return { curve: c, length: c.getLength() };
    });
  }, [curve]);
  return (
    <>
      <Strand sizeFactor={sizeFactor * 0.85} pattern={pattern} clasp={clasp} finish={finish} />
      {drapes.map((d, i) => (
        <ChainAlong key={i} pattern={pattern} curve={d.curve} length={d.length} finish={finish} />
      ))}
      <Beads spots={[curve.getPointAt(0.3), curve.getPointAt(0.7)].map((position) => ({ position, normal: facing }))} r={0.06} finish={finish} />
    </>
  );
}

export function NecklaceModel({ finish, gem, cut, stones, sizeFactor, chainPattern, claspKind, design }: ModelProps) {
  const pattern = chainPattern ?? "cable";
  const clasp = claspKind ?? "lobster";
  const stone = gem && stones > 0 ? gem : null;
  let body: React.ReactNode;
  switch (design?.style) {
    case "layered":
      body = (
        <>
          <Strand sizeFactor={sizeFactor * 0.78} pattern={pattern} clasp={clasp} finish={finish} z={0.04} />
          <Strand sizeFactor={sizeFactor * 1.12} pattern={pattern} clasp={clasp} finish={finish} />
        </>
      );
      break;
    case "lariat":
      body = <Lariat sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} gem={stone} cut={cut} />;
      break;
    case "station":
      body = <Station sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} gem={stone} cut={cut} stones={stones} />;
      break;
    case "tennis":
      body = <StoneLine sizeFactor={sizeFactor} finish={finish} gem={stone} stones={stones} clasp={clasp} />;
      break;
    case "pearl_strand":
      body = <StoneLine sizeFactor={sizeFactor} finish={finish} gem={stone} stones={stones} clasp={clasp} pearls />;
      break;
    case "collar":
      body = <Collar sizeFactor={sizeFactor} finish={finish} />;
      break;
    case "bib":
      body = <Bib sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} />;
      break;
    default:
      body = <Strand sizeFactor={sizeFactor} pattern={pattern} clasp={clasp} finish={finish} />;
  }
  return (
    <group name="necklace" position={[0, 0.3, 0]}>
      {body}
    </group>
  );
}
