"use client";

// Bracelets and anklets in 3D (FR-05, D-25): bangle, cuff, chain (any of the 21 chain styles),
// tennis, station, charm and ID bracelets; chain, station and charm anklets. The piece lies in the
// x–y plane and is tilted toward the viewer.

import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ChainPattern, ClaspKind, CutOption, FinishOption, GemstoneOption } from "@/types";
import type { ModelProps } from "./models";
import { MetalMaterial } from "./metal";
import { ChainAlong, Clasp } from "./chains";
import { Accents, Beads, Head, RaisedText, TAU, circleSection, profileSection, sweepBand, type Spot } from "./parts";

const out = (t: number) => new THREE.Vector3(Math.sin(t), Math.cos(t), 0);
const at = (t: number, r: number, z = 0) => out(t).multiplyScalar(r).setZ(z);
/** Turns local +Y (a stone's table) to face outward at angle t. */
const outward = (t: number): [number, number, number] => [0, 0, -t];

function Band({ R, section, gap = 0, finish }: { R: number; section: [number, number][]; gap?: number; finish: FinishOption }) {
  const g = useMemo(() => sweepBand(R, section, { from: Math.PI + gap, to: Math.PI + TAU - gap, segs: 180 }), [R, section, gap]);
  useEffect(() => () => g.dispose(), [g]);
  return (
    <mesh geometry={g} name="metal" castShadow>
      <MetalMaterial finish={finish} />
    </mesh>
  );
}

/** A chain loop with its clasp at the back (θ = π). */
function ChainLoop({ R, pattern, clasp, finish }: { R: number; pattern: ChainPattern; clasp: ClaspKind; finish: FinishOption }) {
  const { curve, length } = useMemo(() => {
    const gap = 0.14;
    const pts = Array.from({ length: 49 }, (_, i) => at(Math.PI + gap + ((TAU - 2 * gap) * i) / 48, R));
    const c = new THREE.CatmullRomCurve3(pts);
    return { curve: c, length: c.getLength() };
  }, [R]);
  return (
    <>
      <ChainAlong pattern={pattern} curve={curve} length={length} finish={finish} />
      <Clasp kind={clasp} start={curve.getPointAt(0)} end={curve.getPointAt(1)} finish={finish} />
    </>
  );
}

function Charms({ R, finish, gem, cut }: { R: number; finish: FinishOption; gem: GemstoneOption | null; cut: CutOption | null }) {
  // five charms hang from the front half: disc, heart-shaped drop, star bead, stone, disc
  const angles = [-0.9, -0.45, 0, 0.45, 0.9];
  return (
    <>
      {angles.map((t, i) => {
        const p = at(t, R + 0.09);
        return (
          <group key={t} position={p} rotation={outward(t)}>
            <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.03, 0.008, 6, 16]} />
              <MetalMaterial finish={finish} />
            </mesh>
            {i === 3 && gem ? (
              <group position={[0, 0.12, 0]}>
                <Head setting="bezel" r={0.07} gem={gem} cut={cut} finish={finish} />
              </group>
            ) : i === 1 ? (
              <mesh position={[0, 0.13, 0]} scale={[1, 1.25, 0.45]}>
                <sphereGeometry args={[0.08, 20, 14]} />
                <MetalMaterial finish={finish} />
              </mesh>
            ) : i === 2 ? (
              <mesh position={[0, 0.12, 0]}>
                <octahedronGeometry args={[0.08, 0]} />
                <MetalMaterial finish={finish} />
              </mesh>
            ) : (
              <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.02, 28]} />
                <MetalMaterial finish={finish} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

interface Props {
  style?: string;
  finish: FinishOption;
  gem: GemstoneOption | null;
  cut: CutOption | null;
  stones: number;
  R: number;
  pattern: ChainPattern;
  clasp: ClaspKind;
  setting?: string;
  text?: string;
  fontFile?: string;
}

function Piece({ style, finish, gem, cut, stones, R, pattern, clasp, setting, text, fontFile }: Props) {
  switch (style) {
    case "cuff":
      return (
        <group>
          <Band R={R} section={profileSection("flat_court", 0.09, 0.5)} gap={0.55} finish={finish} />
          {[-1, 1].map((side) => (
            <mesh key={side} position={at(Math.PI + side * 0.55, R + 0.045)} scale={[1, 1, 2.6]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <MetalMaterial finish={finish} />
            </mesh>
          ))}
        </group>
      );
    case "tennis": {
      const n = Math.max(stones, 1);
      const r = Math.min(0.11, ((Math.PI * R) / n) * 0.8);
      const spots: Spot[] = Array.from({ length: n }, (_, i) => {
        const t = (i / n) * TAU;
        return { position: at(t, R + r * 0.35), normal: out(t) };
      });
      const prongs: Spot[] = Array.from({ length: n * 2 }, (_, k) => {
        const t = ((Math.floor(k / 2) + 0.5) / n) * TAU;
        return { position: at(t, R + r * 0.45, (k % 2 ? 1 : -1) * r * 0.7), normal: out(t) };
      });
      return (
        <group>
          {/* the links under the stones */}
          <Band R={R} section={profileSection("flat", 0.06, r * 2.1)} finish={finish} />
          {gem && <Accents spots={spots} r={r} gem={gem} />}
          <Beads spots={prongs} r={r * 0.2} finish={finish} />
        </group>
      );
    }
    case "station": {
      const n = Math.max(stones, 1);
      return (
        <group>
          <ChainLoop R={R} pattern={pattern} clasp={clasp} finish={finish} />
          {gem &&
            Array.from({ length: n }, (_, i) => {
              const t = (i - (n - 1) / 2) * (TAU / (n + 2));
              return (
                <group key={i} position={at(t, R + 0.05)} rotation={outward(t)}>
                  <Head setting={setting === "prong" ? "prong" : "bezel"} r={0.07} gem={gem} cut={cut} finish={finish} />
                </group>
              );
            })}
        </group>
      );
    }
    case "charm":
      return (
        <group>
          <ChainLoop R={R} pattern={pattern} clasp={clasp} finish={finish} />
          <Charms R={R} finish={finish} gem={gem} cut={cut} />
        </group>
      );
    case "id_bar": {
      const t = (text ?? "").trim();
      return (
        <group>
          <ChainLoop R={R} pattern={pattern} clasp={clasp} finish={finish} />
          {/* the plate sits on the front of the wrist, curved to follow it */}
          <Band R={R + 0.02} section={profileSection("flat", 0.05, 0.28)} gap={Math.PI - 0.42} finish={finish} />
          {t && (
            <group position={at(0, R + 0.09)} rotation={[-Math.PI / 2, 0, 0]}>
              <group rotation={[0, 0, 0]}>
                <Suspense fallback={null}>
                  <RaisedText text={t} size={0.11} depth={0.015} fontFile={fontFile} finish={finish} maxWidth={0.72} />
                </Suspense>
              </group>
            </group>
          )}
        </group>
      );
    }
    case "chain_bracelet":
    case "chain":
      return <ChainLoop R={R} pattern={pattern} clasp={clasp} finish={finish} />;
    default:
      // bangle: a solid round band
      return <Band R={R} section={circleSection(0.075, 20)} finish={finish} />;
  }
}

export function BraceletModel({ finish, gem, cut, stones, sizeFactor, design, chainPattern, claspKind, textFontFile }: ModelProps) {
  return (
    <group name="bracelet" rotation={[-0.85, 0, Math.PI + 0.1]}>
      <Piece style={design?.style} finish={finish} gem={gem} cut={cut} stones={stones} R={1.0 * sizeFactor} pattern={chainPattern ?? "cable"} clasp={claspKind ?? "lobster"} setting={design?.setting} text={design?.text} fontFile={textFontFile} />
    </group>
  );
}

export function AnkletModel({ finish, gem, cut, stones, sizeFactor, design, chainPattern, claspKind }: ModelProps) {
  return (
    <group name="anklet" rotation={[-0.85, 0, Math.PI + 0.1]}>
      <Piece style={design?.style ?? "chain"} finish={finish} gem={gem} cut={cut} stones={stones} R={1.3 * sizeFactor} pattern={chainPattern ?? "cable"} clasp={claspKind ?? "lobster"} setting={design?.setting} />
    </group>
  );
}
