"use client";

// Rings and toe rings in 3D (FR-05, D-25): every style, setting, band shape (profile) and shank.
// The band lies in the x–y plane with the top of the finger at +Y, its width along z.

import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CutOption, FinishOption, GemstoneOption } from "@/types";
import type { ModelProps } from "./models";
import { MetalMaterial } from "./metal";
import { cutKeyOf } from "./stones";
import {
  Accents,
  Beads,
  CurvedEngraving,
  Head,
  RaisedText,
  TAU,
  circleSection,
  halfLength,
  liftFor,
  perimeterPoints,
  profileSection,
  sweepBand,
  type Spot,
} from "./parts";

interface HeadSpec {
  /** angle around the band (0 = top) */
  theta: number;
  /** offset across the band */
  z?: number;
  r: number;
  /** turn the stone (east–west, toi et moi) */
  rotY?: number;
  main?: boolean;
}

const radial = (theta: number, radius: number, z = 0) => new THREE.Vector3(Math.sin(theta) * radius, Math.cos(theta) * radius, z);
const normalAt = (theta: number) => new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0);

function Band({
  R,
  T,
  W,
  profile,
  shank,
  gap,
  finish,
}: {
  R: number;
  T: number;
  W: number;
  profile?: string;
  shank?: string;
  gap: number;
  finish: FinishOption;
}) {
  const geometries = useMemo(() => {
    const from = gap;
    const to = TAU - gap;
    if (shank === "twisted") {
      const rope = circleSection(W * 0.26, 12, T / 2);
      const a = W * 0.2;
      return [0, Math.PI].map((phase) =>
        sweepBand(R, rope, { from, to, segs: 260, offset: (t) => [Math.cos(t * 14 + phase) * a * 0.6, Math.sin(t * 14 + phase) * a] }),
      );
    }
    if (shank === "split") {
      const strand = profileSection(profile, T, W * 0.5);
      const spread = (t: number) => W * 0.55 * Math.max(0, (Math.cos(t) - 0.35) / 0.65) ** 2;
      return [-1, 1].map((side) => sweepBand(R, strand, { from, to, offset: (t) => [0, side * (W * 0.24 + spread(t))] }));
    }
    if (shank === "bypass") {
      // the two ends pass each other on either side of the stone
      // (the band runs a little more than one full turn, its ends crossing at the top, one in front, one behind)
      const over = 0.32;
      const A = W * 0.9;
      return [sweepBand(R, profileSection(profile, T, W * 0.75), { from: -over, to: TAU + over, segs: 200, offset: (t) => [0, A * Math.cos(t / 2)] })];
    }
    return [sweepBand(R, profileSection(profile, T, W), { from, to })];
  }, [R, T, W, profile, shank, gap]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  return (
    <>
      {geometries.map((g, i) => (
        <mesh key={i} geometry={g} name="metal" castShadow>
          <MetalMaterial finish={finish} />
        </mesh>
      ))}
    </>
  );
}

function layout(style: string | undefined, stones: number, cut: CutOption | null, top: number): HeadSpec[] {
  if (stones <= 0) return [];
  const len = halfLength(cut);
  const along = (r: number) => (2 * r * len * 1.05) / top; // angle one stone takes up along the band
  switch (style) {
    case "three_stone": {
      const c = 0.23;
      const s = 0.17;
      const t = (along(c) + along(s)) / 2 + 0.03;
      return [
        { theta: -t, r: s },
        { theta: 0, r: c, main: true },
        { theta: t, r: s },
      ];
    }
    case "toi_et_moi":
      return [
        { theta: -0.19, z: 0.07, r: 0.21, rotY: 0.5, main: true },
        { theta: 0.19, z: -0.07, r: 0.21, rotY: 0.5 },
      ];
    case "east_west":
      return [{ theta: 0, r: 0.26, rotY: Math.PI / 2, main: true }];
    case "cocktail":
      return [{ theta: 0, r: 0.34, main: true }];
    case "halo":
      return [{ theta: 0, r: 0.22, main: true }];
    case "cluster":
      return [{ theta: 0, r: 0.16, main: true }];
    case "signet":
      return [];
    case "eternity":
      return [];
    case "solitaire":
    case undefined: {
      if (stones === 1) return [{ theta: 0, r: 0.3, main: true }];
      // older designs without a style: stones side by side along the top of the band
      const r = stones <= 3 ? 0.19 : 0.15;
      const step = along(r) + 0.02;
      return Array.from({ length: stones }, (_, i) => ({ theta: (i - (stones - 1) / 2) * step, r, main: i === Math.floor(stones / 2) }));
    }
    default:
      return [{ theta: 0, r: 0.26, main: true }];
  }
}

function RingBody({ finish, gem, cut, stones, sizeFactor, design, textFontFile, engraving, toe }: ModelProps & { toe?: boolean }) {
  const style = design?.style;
  const setting = stones > 0 ? (design?.setting ?? "prong") : undefined;
  const R = toe ? 0.62 + 0.08 * sizeFactor : 0.9 + 0.1 * sizeFactor;
  const T = toe ? 0.09 : 0.15;
  const W = toe ? 0.2 : style === "eternity" ? 0.34 : 0.3;
  const top = R + T;

  const heads = useMemo(
    () => (toe ? (stones > 0 ? [{ theta: 0, r: 0.14, main: true }] : []) : layout(style, stones, cut, top)),
    [toe, style, stones, cut, top],
  );
  const main = heads.find((h) => h.main);
  const isTension = setting === "tension" && heads.length === 1 && main && style !== "cocktail" && style !== "halo" && style !== "cluster";
  const gap = isTension && main ? Math.asin(Math.min(0.9, (main.r * halfLength(cut) * 0.92) / (R + T / 2))) : 0;
  const openGap = style === "open" ? 0.5 : 0;
  const headSetting = () => (setting === "tension" && !isTension ? "prong" : setting === "pave" || setting === "cathedral" ? "prong" : setting);

  // Accent stones and beads that belong to the style or setting.
  const extras = useMemo(() => {
    const accents: { spots: Spot[]; r: number }[] = [];
    const beads: { spots: Spot[]; r: number }[] = [];
    if (!gem) return { accents, beads };
    const c = main;
    const cy = c ? top + liftFor(setting, c.r) : top;
    if (style === "halo" && c) {
      const ra = c.r * 0.2;
      const pts = perimeterPoints(cutKeyOf(cut), 16, 1.32 * c.r);
      accents.push({
        r: ra,
        spots: pts.map((p) => ({ position: new THREE.Vector3(p.x, cy - c.r * 0.02, -p.y), normal: new THREE.Vector3(p.x * 0.4, 1, -p.y * 0.4) })),
      });
    }
    if (style === "cluster" && c) {
      const ra = 0.1;
      accents.push({
        r: ra,
        spots: Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * TAU;
          return {
            position: new THREE.Vector3(Math.cos(a) * 0.27, top + 0.1, Math.sin(a) * 0.27),
            normal: new THREE.Vector3(Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5),
          };
        }),
      });
    }
    if (style === "cocktail" && c) {
      const pts = perimeterPoints(cutKeyOf(cut), 18, 1.3 * c.r);
      accents.push({
        r: c.r * 0.15,
        spots: pts.map((p) => ({ position: new THREE.Vector3(p.x, cy - c.r * 0.45, -p.y), normal: new THREE.Vector3(p.x, 1.2, -p.y) })),
      });
    }
    if (style === "eternity") {
      const n = stones;
      const r = Math.min(0.16, ((Math.PI * top) / n) * 0.8);
      const rad = top + (setting === "channel" ? -r * 0.15 : r * 0.2);
      accents.push({
        r,
        spots: Array.from({ length: n }, (_, i) => {
          const t = (i / n) * TAU;
          return { position: radial(t, rad), normal: normalAt(t) };
        }),
      });
      if (setting !== "channel" && setting !== "bezel")
        beads.push({
          r: r * 0.22,
          spots: Array.from({ length: n * 2 }, (_, k) => {
            const t = ((Math.floor(k / 2) + 0.5) / n) * TAU;
            return { position: radial(t, rad + r * 0.15, (k % 2 ? 1 : -1) * r * 0.75), normal: normalAt(t) };
          }),
        });
    }
    if (setting === "pave" && style !== "eternity") {
      // tiny stones along the shoulders, both sides of the centre
      const ra = 0.045;
      const start = c ? (c.r * halfLength(cut) * 1.25) / top + 0.06 : 0.2;
      const step = (ra * 2.3) / top;
      const spots: Spot[] = [];
      for (let t = start; t < 1.3; t += step)
        for (const side of [-1, 1]) for (const z of [-0.06, 0.06]) spots.push({ position: radial(side * t, top + ra * 0.1, z), normal: normalAt(side * t) });
      accents.push({ r: ra, spots });
    }
    return { accents, beads };
  }, [gem, main, top, setting, style, cut, stones]);

  // Cathedral: metal arches from the shoulders up to the centre stone's cup.
  const arches = useMemo(() => {
    if (setting !== "cathedral" || !main) return [];
    const cy = top + liftFor(setting, main.r) - main.r * 0.6;
    return [-1, 1].flatMap((side) =>
      [-1, 1].map((zs) => {
        const start = radial(side * 0.6, top - T * 0.3, zs * W * 0.28);
        const mid = radial(side * 0.28, top + main.r * 0.2, zs * W * 0.34);
        const end = new THREE.Vector3(side * main.r * 0.35, cy, zs * main.r * 0.35);
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([start, mid, end]), 24, 0.032, 8, false);
      }),
    );
  }, [setting, main, top, T, W]);
  useEffect(() => () => arches.forEach((g) => g.dispose()), [arches]);

  const metal = <MetalMaterial finish={finish} />;

  return (
    // With an engraving the ring stands upright and the camera looks down into it (JewelryScene), so the text shows.
    <group name={toe ? "toe_ring" : "ring"} rotation={engraving ? [0.15, 0.35, 0] : [0.4, 0.6, 0]}>
      {openGap ? (
        <group rotation={[0, 0, Math.PI]}>
          <Band R={R} T={T} W={W} profile={design?.profile} gap={openGap} finish={finish} />
        </group>
      ) : (
        <Band R={R} T={T} W={W} profile={design?.profile} shank={toe ? undefined : design?.shank} gap={gap} finish={finish} />
      )}

      {/* the customer's engraving, inside the band (opposite an open toe ring's gap) */}
      {engraving && (
        <Suspense fallback={null}>
          <CurvedEngraving text={engraving} radius={R} size={Math.min(W * 0.45, 0.13)} finish={finish} centerAngle={openGap ? 0 : Math.PI} />
        </Suspense>
      )}

      {/* channel-set eternity: rails on both edges of the band */}
      {style === "eternity" &&
        setting === "channel" &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[0, 0, side * W * 0.47]} name="metal">
            <torusGeometry args={[top - 0.005, 0.03, 8, 160]} />
            {metal}
          </mesh>
        ))}
      {style === "eternity" &&
        setting === "bezel" &&
        gem &&
        extras.accents[0]?.spots.map((s, i) => (
          <mesh
            key={i}
            position={s.position.clone().addScaledVector(s.normal, -0.02)}
            quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), s.normal)}
          >
            <torusGeometry args={[extras.accents[0].r * 1.05, 0.018, 6, 20]} />
            {metal}
          </mesh>
        ))}

      {/* signet: a flat oval top, with raised initials and an optional small stone */}
      {style === "signet" && (
        <group position={[0, top - 0.02, 0]}>
          <mesh scale={[1, 1, 0.82]} name="metal">
            <cylinderGeometry args={[0.46, 0.36, 0.18, 48]} />
            {metal}
          </mesh>
          {design?.text?.trim() && (
            <group position={[0, 0.09, gem ? 0.08 : 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <Suspense fallback={null}>
                <RaisedText text={design.text.trim()} size={0.22} depth={0.03} fontFile={textFontFile} finish={finish} maxWidth={0.66} />
              </Suspense>
            </group>
          )}
          {gem && (
            <group position={[0, 0.09 + 0.05, design?.text?.trim() ? -0.22 : 0]}>
              <Head setting="bezel" r={0.07} gem={gem} cut={cut} finish={finish} />
            </group>
          )}
        </group>
      )}

      {/* cocktail: a domed mount; halo and cluster: a metal plate under the accent stones */}
      {gem && main && (style === "cocktail" || style === "halo" || style === "cluster") && (
        <mesh
          position={[0, style === "cluster" ? top - 0.01 : top + liftFor(setting, main.r) - main.r * (style === "cocktail" ? 0.6 : 0.3), 0]}
          scale={[style === "halo" ? halfLength(cut) : 1, style === "cocktail" ? 0.55 : 0.18, 1]}
        >
          <sphereGeometry args={[style === "cocktail" ? main.r * 1.35 : style === "halo" ? main.r * 1.5 : 0.4, 32, 16, 0, TAU, 0, Math.PI / 2]} />
          {metal}
        </mesh>
      )}

      {gem &&
        heads.map((h, i) => {
          const s = headSetting();
          const y = isTension ? R + T * 0.6 : top + liftFor(s, h.r);
          return (
            <group key={i} position={radial(h.theta, y, h.z ?? 0)} rotation={[0, 0, -h.theta]}>
              <group rotation={[0, h.rotY ?? 0, 0]}>
                <Head setting={s} r={h.r} gem={gem} cut={cut} finish={finish} />
              </group>
            </group>
          );
        })}

      {arches.map((g, i) => (
        <mesh key={i} geometry={g} name="metal">
          {metal}
        </mesh>
      ))}

      {/* open toe ring: small balls finish the two ends */}
      {style === "open" &&
        [-1, 1].map((side) => (
          <mesh key={side} position={radial(Math.PI + side * openGap, R + T / 2)}>
            <sphereGeometry args={[T * 0.75, 16, 12]} />
            {metal}
          </mesh>
        ))}

      {extras.accents.map((a, i) => (
        <Accents key={i} spots={a.spots} r={a.r} gem={style === "eternity" ? (gem as GemstoneOption) : undefined} />
      ))}
      {extras.beads.map((b, i) => (
        <Beads key={i} spots={b.spots} r={b.r} finish={finish} />
      ))}
    </group>
  );
}

export function RingModel(p: ModelProps) {
  return <RingBody {...p} />;
}

export function ToeRingModel(p: ModelProps) {
  return <RingBody {...p} toe />;
}
