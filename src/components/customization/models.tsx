"use client";

// Procedural jewelry models (frontend-spec §5.4) — no external files needed in Phase 1.
// Every model reads only the resolved options, so the viewer always matches the selection (NFR).

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { CutOption, FinishOption, GemstoneOption } from "@/types";

export interface ModelProps {
  finish: FinishOption;
  gem: GemstoneOption | null;
  cut: CutOption | null;
  stones: number;
  sizeFactor: number;
}

// ---------------------------------------------------------------- materials

export function MetalMaterial({ finish }: { finish: FinishOption }) {
  return <meshPhysicalMaterial color={finish.colorHex} metalness={1} roughness={finish.roughness} clearcoat={0.3} clearcoatRoughness={0.2} envMapIntensity={1.2} />;
}

export function GemMaterial({ gem }: { gem: GemstoneOption }) {
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

// ---------------------------------------------------------------- stones per cut

/** A single stone with its table facing +Y. `r` is the girdle radius. */
export function Stone({ gem, cut, r }: { gem: GemstoneOption; cut: CutOption | null; r: number }) {
  const label = cut?.label.toLowerCase() ?? "round";
  const mat = <GemMaterial gem={gem} />;

  if (label === "princess") {
    // square pyramid shape
    return (
      <group rotation={[0, Math.PI / 4, 0]} name="stone">
        <mesh position={[0, r * 0.12, 0]}>
          <cylinderGeometry args={[r * 0.72, r, r * 0.25, 4, 1]} />
          {mat}
        </mesh>
        <mesh position={[0, -r * 0.4, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[r, r * 0.8, 4, 1]} />
          {mat}
        </mesh>
      </group>
    );
  }

  const brilliant = (
    <>
      <mesh position={[0, r * 0.12, 0]}>
        <cylinderGeometry args={[r * 0.58, r, r * 0.28, 8, 1]} />
        {mat}
      </mesh>
      <mesh position={[0, -r * 0.4, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[r, r * 0.85, 8, 1]} />
        {mat}
      </mesh>
    </>
  );

  if (label === "oval") {
    return (
      <group scale={[1.35, 1, 0.9]} name="stone">
        {brilliant}
      </group>
    );
  }

  if (label === "pear") {
    // round body + a tapered side
    return (
      <group name="stone">
        {brilliant}
        <mesh position={[r * 0.8, r * 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[0.4, 1, 1]}>
          <coneGeometry args={[r * 0.88, r * 0.85, 8, 1]} />
          {mat}
        </mesh>
      </group>
    );
  }

  return <group name="stone">{brilliant}</group>;
}

function Prongs({ r, finish, count = 4, height }: { r: number; finish: FinishOption; count?: number; height: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * r * 0.95, height / 2 - r * 0.2, Math.sin(a) * r * 0.95]} rotation={[Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15]}>
            <cylinderGeometry args={[r * 0.09, r * 0.12, height, 8]} />
            <MetalMaterial finish={finish} />
          </mesh>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------- ring

export function RingModel({ finish, gem, cut, stones, sizeFactor }: ModelProps) {
  const R = 0.9 + 0.1 * sizeFactor;
  const tube = 0.09 * sizeFactor;
  // One stone is a solitaire; more stones get smaller and sit side by side along the top of the band.
  const r = stones <= 1 ? 0.26 : stones <= 3 ? 0.19 : 0.15;
  const step = (2.25 * r) / R;
  const angles = stones > 0 ? Array.from({ length: stones }, (_, i) => (i - (stones - 1) / 2) * step) : [];
  return (
    <group name="ring" rotation={[-0.45, 0.55, 0]}>
      <mesh name="metal" castShadow scale={[1, 1, 1.7]}>
        <torusGeometry args={[R, tube, 48, 160]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem &&
        angles.map((t, i) => (
          <group key={i} position={[Math.sin(t) * (R + tube + r * 0.45), Math.cos(t) * (R + tube + r * 0.45), 0]} rotation={[0, 0, -t]}>
            {/* head / basket */}
            <mesh position={[0, -r * 0.35, 0]}>
              <cylinderGeometry args={[r * 0.75, r * 0.45, r * 0.5, 16, 1, true]} />
              <MetalMaterial finish={finish} />
            </mesh>
            <Prongs r={r} finish={finish} height={r * 0.8} />
            <group position={[0, r * 0.3, 0]}>
              <Stone gem={gem} cut={cut} r={r} />
            </group>
          </group>
        ))}
    </group>
  );
}

// ---------------------------------------------------------------- pendant

export function PendantModel({ finish, gem, cut, stones, sizeFactor }: ModelProps) {
  const s = 0.75 * sizeFactor;
  const r = 0.28 * s;
  const n = Math.max(stones, 0);
  return (
    <group name="pendant" scale={[1.6, 1.6, 1.6]}>
      {/* bail */}
      <mesh position={[0, 0.62 * s + 0.1, 0]} rotation={[0, Math.PI / 2, 0]} name="metal">
        <torusGeometry args={[0.1, 0.028, 16, 48]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {/* drop-shaped body */}
      <mesh position={[0, 0, -0.03]} scale={[s * 0.78, s, 0.12]} name="metal">
        <sphereGeometry args={[0.62, 48, 32]} />
        <MetalMaterial finish={finish} />
      </mesh>
      {gem &&
        Array.from({ length: n }, (_, i) => {
          const y = n === 1 ? 0 : (0.5 - i / (n - 1)) * s * 0.7;
          const rr = n === 1 ? r : r * 0.62;
          return (
            <group key={i} position={[0, y, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, -rr * 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[rr * 1.04, rr * 0.13, 12, 48]} />
                <MetalMaterial finish={finish} />
              </mesh>
              <group rotation={[0, 0, 0]}>
                <Stone gem={gem} cut={cut} r={rr} />
              </group>
            </group>
          );
        })}
    </group>
  );
}

// ---------------------------------------------------------------- necklace (instanced links)

export function NecklaceModel({ finish, sizeFactor }: ModelProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const { curve, count } = useMemo(() => {
    const w = 1.2 * sizeFactor;
    const d = 1.7 * sizeFactor;
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-w, 1.0, 0),
      new THREE.Vector3(-w * 0.95, 0.2, 0.1),
      new THREE.Vector3(-w * 0.6, -d * 0.55, 0.15),
      new THREE.Vector3(0, -d * 0.8, 0.18),
      new THREE.Vector3(w * 0.6, -d * 0.55, 0.15),
      new THREE.Vector3(w * 0.95, 0.2, 0.1),
      new THREE.Vector3(w, 1.0, 0),
    ]);
    return { curve: c, count: Math.round(c.getLength() / 0.085) };
  }, [sizeFactor]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const twist = new THREE.Quaternion();
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tan);
      twist.setFromAxisAngle(new THREE.Vector3(1, 0, 0), i % 2 ? Math.PI / 2 : 0);
      q.multiply(twist);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [curve, count]);

  const end = curve.getPointAt(1);
  const start = curve.getPointAt(0);
  return (
    <group name="necklace" position={[0, 0.3, 0]}>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} name="metal" key={count}>
        <torusGeometry args={[0.05, 0.016, 8, 20]} />
        <MetalMaterial finish={finish} />
      </instancedMesh>
      {/* clasp */}
      <mesh position={[start.x, start.y + 0.05, start.z]}>
        <torusGeometry args={[0.07, 0.022, 12, 32]} />
        <MetalMaterial finish={finish} />
      </mesh>
      <mesh position={[end.x, end.y + 0.06, end.z]}>
        <capsuleGeometry args={[0.035, 0.1, 6, 12]} />
        <MetalMaterial finish={finish} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- bracelet (flat band)

export function BraceletModel({ finish, sizeFactor }: ModelProps) {
  const geometry = useMemo(() => {
    const rIn = 1.0 * sizeFactor;
    const rOut = rIn + 0.09;
    const h = 0.32;
    const pts = [
      new THREE.Vector2(rIn, -h / 2),
      new THREE.Vector2(rOut, -h / 2 + 0.02),
      new THREE.Vector2(rOut + 0.015, 0),
      new THREE.Vector2(rOut, h / 2 - 0.02),
      new THREE.Vector2(rIn, h / 2),
      new THREE.Vector2(rIn, -h / 2),
    ];
    return new THREE.LatheGeometry(pts, 128);
  }, [sizeFactor]);
  return (
    <group name="bracelet" rotation={[1.1, 0, 0.15]}>
      <mesh geometry={geometry} name="metal" castShadow>
        <MetalMaterial finish={finish} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------- earrings (two studs)

export function EarringsModel({ finish, gem, cut, stones, sizeFactor }: ModelProps) {
  const r = 0.26 * sizeFactor;
  // Stones are counted per pair: with 2 stones each earring has one; with 1 stone only the left one does.
  const perEarring = [stones >= 1, stones >= 2];
  return (
    <group name="earrings" rotation={[0.15, 0, 0]}>
      {[-0.55, 0.55].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {/* post */}
          <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
            <MetalMaterial finish={finish} />
          </mesh>
          {gem && perEarring[i] ? (
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh position={[0, -r * 0.35, 0]} name="metal">
                <cylinderGeometry args={[r * 0.95, r * 0.55, r * 0.6, 24, 1]} />
                <MetalMaterial finish={finish} />
              </mesh>
              <Prongs r={r} finish={finish} height={r * 1.0} />
              <group position={[0, r * 0.25, 0]}>
                <Stone gem={gem} cut={cut} r={r} />
              </group>
            </group>
          ) : (
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]} name="metal">
              <sphereGeometry args={[r * 0.9, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <MetalMaterial finish={finish} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
