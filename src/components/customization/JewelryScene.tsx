"use client";

// The 3D scene shared by every viewer (FR-05): the procedural piece, studio lighting, automatic
// framing, contact shadow, camera and orbit controls. It is used inside the customizer's own
// <Canvas> and inside each product card's <View> (one shared canvas for the whole shop grid).

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Center, ContactShadows, Environment, Lightformer, OrbitControls, PerspectiveCamera, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { CustomizationOptions, DesignConfig, ProductType } from "@/types";
import { NamePendantModel, type ModelProps } from "./models";
import { AnkletModel, BraceletModel } from "./bracelets";
import { PendantModel } from "./pendants";
import { EarringsModel } from "./earrings";
import { RingModel, ToeRingModel } from "./rings";
import { TextureContext } from "./stones";
import { chosenOption } from "@/lib/pricing/design";
import { NecklaceModel } from "./necklaces";

const MODELS: Record<ProductType, React.ComponentType<ModelProps>> = {
  ring: RingModel,
  pendant: PendantModel,
  name_pendant: NamePendantModel,
  necklace: NecklaceModel,
  bracelet: BraceletModel,
  earrings: EarringsModel,
  anklet: AnkletModel,
  toe_ring: ToeRingModel,
};

const CAMERA: Record<ProductType, [number, number, number]> = {
  ring: [0, 0.7, 6.6],
  pendant: [0, 0.2, 4.4],
  name_pendant: [0, 0.3, 5],
  necklace: [0, 0, 6.2],
  bracelet: [0, 0.6, 5.6],
  earrings: [0, 0.3, 3.8],
  anklet: [0, 0.6, 5.6],
  toe_ring: [0, 0.7, 5],
};

/** Resolve the config into what the models need. Unknown IDs fall back safely. */
export function useResolved(config: DesignConfig, options: CustomizationOptions) {
  return useMemo(() => {
    const finish = options.finishes.find((f) => f.id === config.finishId) ?? options.finishes[0];
    const g = options.gemstones.find((x) => x.id === config.gemstoneId);
    const gem = g && !g.isNone ? g : null;
    const cut = gem ? (options.cuts.find((c) => c.id === config.cutId) ?? null) : null;
    const size = options.sizes.find((s) => s.id === config.sizeId);
    const type = options.productTypes.find((p) => p.type === config.productType);
    const font = config.productType === "name_pendant" ? ((options.fonts ?? []).find((x) => x.id === config.fontId) ?? options.fonts?.[0]) : undefined;
    const key = (g: "style" | "setting" | "profile" | "shank" | "texture") => chosenOption(config, options, g)?.key;
    const textFont = (options.fonts ?? []).find((x) => x.id === config.fontId);
    return {
      finish,
      gem,
      cut,
      stones: gem ? config.stoneQuantity : 0,
      sizeFactor: size?.factor ?? 1,
      modelUrl: type?.modelUrl,
      nameText: config.nameText,
      fontFile: font?.file,
      scriptFont: font ? font.cssFamily.includes("cursive") : undefined,
      chainPattern: (options.chainStyles ?? []).find((c) => c.id === config.chainStyleId)?.pattern,
      claspKind: (options.clasps ?? []).find((c) => c.id === config.claspId)?.kind,
      design: { style: key("style"), setting: key("setting"), profile: key("profile"), shank: key("shank"), texture: key("texture"), text: config.styleText },
      textFontFile: textFont?.file,
    };
  }, [config, options]);
}

/**
 * Frames the piece: measures its bounding sphere and puts the camera at the distance where the
 * whole sphere fits the view (so it stays in frame while it turns), aimed at its center.
 * Runs when the shape changes and when "Reset view" is pressed.
 */
function AutoFit({
  target,
  fitRef,
  shapeKey,
}: {
  target: React.RefObject<THREE.Object3D | null>;
  fitRef?: React.RefObject<(() => void) | null>;
  shapeKey: string;
}) {
  const get = useThree((s) => s.get);
  // Re-run the fit once the orbit controls are registered or the view is resized.
  const controlsReady = useThree((s) => Boolean(s.controls));
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  const fit = useCallback(() => {
    const { camera, size } = get();
    const controls = get().controls as OrbitControlsImpl | null;
    const obj = target.current;
    if (!obj || !(camera instanceof THREE.PerspectiveCamera) || !size.width || !size.height) return;
    const box = new THREE.Box3().setFromObject(obj);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / size.height));
    const dist = (sphere.radius * 1.4) / Math.sin(Math.min(vFov, hFov) / 2);
    const dir = new THREE.Vector3(0, 0.18, 1).normalize();
    camera.position.copy(sphere.center).addScaledVector(dir, dist);
    camera.near = dist / 100;
    camera.far = dist * 20;
    camera.updateProjectionMatrix();
    camera.lookAt(sphere.center);
    if (controls) {
      controls.target.copy(sphere.center);
      controls.minDistance = dist * 0.3;
      controls.maxDistance = dist * 2.5;
      controls.update();
    }
  }, [target, get]);

  useEffect(() => {
    if (fitRef) fitRef.current = fit;
    // Wait two frames so every mesh (including the instanced necklace links) has its final size.
    const frame = { id: 0 };
    frame.id = requestAnimationFrame(() => (frame.id = requestAnimationFrame(fit)));
    return () => {
      cancelAnimationFrame(frame.id);
      if (fitRef) fitRef.current = null;
    };
  }, [fit, fitRef, shapeKey, controlsReady, width, height]);
  return null;
}

/** Optional .glb model (Phase 2/3): meshes named "metal" and "stone*" receive the selected materials. */
function GlbModel({ url, ...p }: ModelProps & { url: string }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const metal = useMemo(() => new THREE.MeshPhysicalMaterial({ color: p.finish.colorHex, metalness: 1, roughness: p.finish.roughness }), [p.finish]);
  const stone = useMemo(
    () => (p.gem ? new THREE.MeshPhysicalMaterial({ color: p.gem.colorHex, transmission: 1, ior: p.gem.ior, thickness: 0.5, roughness: 0 }) : null),
    [p.gem],
  );
  useEffect(() => {
    clone.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      if (o.name.startsWith("metal")) o.material = metal;
      if (o.name.startsWith("stone")) {
        o.visible = Boolean(stone);
        if (stone) o.material = stone;
      }
    });
  }, [clone, metal, stone]);
  return <primitive object={clone} />;
}

export interface JewelrySceneProps {
  config: DesignConfig;
  options: CustomizationOptions;
  /** Slow turntable rotation until the user touches the piece. */
  autoRotate: boolean;
  enableRotate?: boolean;
  enableZoom?: boolean;
  onInteract?: () => void;
  fitRef?: React.RefObject<(() => void) | null>;
  background?: string;
}

export function JewelryScene({
  config,
  options,
  autoRotate,
  enableRotate = true,
  enableZoom = true,
  onInteract,
  fitRef,
  background = "#F6F1E9",
}: JewelrySceneProps) {
  const resolved = useResolved(config, options);
  const [shadowY, setShadowY] = useState(-1.2);
  const fitKey = `${config.productType}|${config.sizeId}|${config.gemstoneId === "gem-none" ? 0 : config.stoneQuantity}|${config.nameText ?? ""}|${config.fontId ?? ""}|${config.chainStyleId ?? ""}|${config.claspId ?? ""}|${JSON.stringify(config.choices ?? {})}|${config.styleText ?? ""}`;
  const Model = MODELS[config.productType];
  const piece = useRef<THREE.Group>(null);

  return (
    <>
      <PerspectiveCamera key={config.productType} makeDefault position={CAMERA[config.productType]} fov={35} />
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <Suspense fallback={null}>
        <group ref={piece}>
          <TextureContext.Provider value={resolved.design.texture}>
            <Center onCentered={({ height }) => setShadowY(-height / 2 - 0.02)}>
              {resolved.modelUrl ? <GlbModel url={resolved.modelUrl} {...resolved} /> : <Model {...resolved} />}
            </Center>
          </TextureContext.Provider>
        </group>
      </Suspense>
      <AutoFit target={piece} fitRef={fitRef} shapeKey={fitKey} />
      <ContactShadows key={shadowY} position={[0, shadowY, 0]} opacity={0.32} scale={8} blur={2.4} far={4} resolution={256} frames={1} />
      {/* Studio reflections: a darker room with bright light strips gives metal and stones contrast. */}
      <Environment resolution={128} frames={1}>
        <color attach="background" args={["#2b2622"]} />
        <Lightformer form="rect" intensity={7} position={[0, 5, 1]} scale={[8, 1.5, 1]} rotation={[Math.PI / 2, 0, 0]} color="#fff7ea" />
        <Lightformer form="rect" intensity={5} position={[-5, 1.5, 1]} scale={[1.2, 6, 1]} rotation={[0, Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={5} position={[5, 1.5, 1]} scale={[1.2, 6, 1]} rotation={[0, -Math.PI / 2, 0]} />
        <Lightformer form="rect" intensity={3} position={[0, 1, 6]} scale={[6, 1, 1]} color="#ffffff" />
        {/* soft low front light so flat chains (herringbone, omega) and plates don't turn dark */}
        <Lightformer form="rect" intensity={2.2} position={[0, -1.5, 6]} scale={[8, 2, 1]} color="#fff6e8" />
        <Lightformer form="ring" intensity={2.5} position={[0, 2, -6]} scale={4} color="#ffe6bd" />
        <Lightformer form="rect" intensity={1.2} position={[0, -4, 0]} scale={[10, 10, 1]} rotation={[-Math.PI / 2, 0, 0]} color="#f3e8d8" />
      </Environment>
      <OrbitControls
        enablePan={false}
        enableRotate={enableRotate}
        enableZoom={enableZoom}
        minDistance={1.5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.75}
        autoRotate={autoRotate}
        autoRotateSpeed={1.2}
        onStart={onInteract}
        makeDefault
      />
    </>
  );
}
