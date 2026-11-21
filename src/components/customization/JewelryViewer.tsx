"use client";

// FR-05 — 3D viewer that updates whenever an option changes.
// React Three Fiber canvas, limited OrbitControls, gentle auto-rotate that stops on interaction,
// Reset view, fullscreen, studio lighting built from Lightformers (no network download).

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomizationOptions, DesignConfig, ProductType } from "@/types";
import { BraceletModel, EarringsModel, NecklaceModel, PendantModel, RingModel, type ModelProps } from "./models";
import { usePrefersReducedMotion, useWebGL } from "./webgl";

export type CaptureFn = () => string | null;

const MODELS: Record<ProductType, React.ComponentType<ModelProps>> = {
  ring: RingModel,
  pendant: PendantModel,
  necklace: NecklaceModel,
  bracelet: BraceletModel,
  earrings: EarringsModel,
};

const CAMERA: Record<ProductType, [number, number, number]> = {
  ring: [0, 0.7, 6.6],
  pendant: [0, 0.2, 4.4],
  necklace: [0, 0, 6.2],
  bracelet: [0, 0.6, 5.6],
  earrings: [0, 0.3, 3.8],
};

/** Resolve the config into the options needed for drawing. Unknown IDs fall back safely. */
function useResolved(config: DesignConfig, options: CustomizationOptions) {
  return useMemo(() => {
    const finish = options.finishes.find((f) => f.id === config.finishId) ?? options.finishes[0];
    const g = options.gemstones.find((x) => x.id === config.gemstoneId);
    const gem = g && !g.isNone ? g : null;
    const cut = gem ? (options.cuts.find((c) => c.id === config.cutId) ?? null) : null;
    const size = options.sizes.find((s) => s.id === config.sizeId);
    const type = options.productTypes.find((p) => p.type === config.productType);
    return { finish, gem, cut, stones: gem ? config.stoneQuantity : 0, sizeFactor: size?.factor ?? 1, modelUrl: type?.modelUrl };
  }, [config, options]);
}

/** Exposes captureSnapshot() through a ref: PNG/JPEG data URL of the current view. */
function SnapshotBridge({ captureRef }: { captureRef?: React.RefObject<CaptureFn | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    if (!captureRef) return;
    captureRef.current = () => {
      try {
        gl.render(scene, camera);
        const src = gl.domElement;
        const max = 640;
        const scale = Math.min(1, max / Math.max(src.width, src.height));
        const c = document.createElement("canvas");
        c.width = Math.round(src.width * scale);
        c.height = Math.round(src.height * scale);
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#F6F1E9";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(src, 0, 0, c.width, c.height);
        return c.toDataURL("image/jpeg", 0.86);
      } catch {
        return null;
      }
    };
    return () => {
      captureRef.current = null;
    };
  }, [gl, scene, camera, captureRef]);
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

export interface JewelryViewerProps {
  config: DesignConfig;
  options: CustomizationOptions;
  captureRef?: React.RefObject<CaptureFn | null>;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  label?: string;
}

export function JewelryViewer({ config, options, captureRef, autoRotate = true, showControls = true, className, label = "3D preview of your design" }: JewelryViewerProps) {
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const resolved = useResolved(config, options);
  const controls = useRef<OrbitControlsImpl>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [interacted, setInteracted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  if (webgl === false) return <NoWebGL className={className} />;

  const Model = MODELS[config.productType];
  const cam = CAMERA[config.productType];

  return (
    <div ref={wrap} className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#EFE7DA]", className)} role="img" aria-label={label}>
      {webgl && (
        <Canvas
          key={config.productType}
          dpr={[1, 2]}
          camera={{ position: cam, fov: 35 }}
          gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          shadows={false}
        >
          <color attach="background" args={["#F6F1E9"]} />
          <ambientLight intensity={0.35} />
          <directionalLight position={[3, 5, 4]} intensity={1.4} />
          <Suspense fallback={null}>
            {resolved.modelUrl ? <GlbModel url={resolved.modelUrl} {...resolved} /> : <Model {...resolved} />}
          </Suspense>
          <ContactShadows position={[0, -1.35, 0]} opacity={0.28} scale={7} blur={2.6} far={3} resolution={256} frames={1} />
          <Environment resolution={256} frames={1}>
            <color attach="background" args={["#d9cfc0"]} />
            <Lightformer form="rect" intensity={6} position={[0, 4, 2]} scale={[6, 2, 1]} rotation={[Math.PI / 2.5, 0, 0]} color="#fff8ee" />
            <Lightformer form="rect" intensity={4} position={[-4, 1, 1]} scale={[2, 5, 1]} rotation={[0, Math.PI / 2, 0]} />
            <Lightformer form="rect" intensity={4} position={[4, 1, 1]} scale={[2, 5, 1]} rotation={[0, -Math.PI / 2, 0]} />
            <Lightformer form="ring" intensity={1.5} position={[0, 0, -5]} scale={3} color="#ffe9c4" />
            <Lightformer form="rect" intensity={0.8} position={[0, -3, 2]} scale={[6, 1, 1]} rotation={[-Math.PI / 2, 0, 0]} />
          </Environment>
          <OrbitControls
            ref={controls}
            enablePan={false}
            minDistance={2}
            maxDistance={8}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.75}
            autoRotate={autoRotate && !reduced && !interacted}
            autoRotateSpeed={1.2}
            onStart={() => setInteracted(true)}
            makeDefault
          />
          <SnapshotBridge captureRef={captureRef} />
        </Canvas>
      )}
      {showControls && webgl && (
        <div className="absolute right-3 bottom-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-paper/90"
            onClick={() => {
              controls.current?.reset();
              setInteracted(false);
            }}
          >
            <RotateCcw className="size-4" /> Reset view
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="bg-paper/90"
            aria-label={fullscreen ? "Exit full screen" : "View full screen"}
            onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void wrap.current?.requestFullscreen?.())}
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      )}
      {showControls && webgl && <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-paper/80 px-2.5 py-1 text-xs text-muted-foreground">Drag to rotate · scroll or pinch to zoom</p>}
    </div>
  );
}

/** NFR compatibility: clear message instead of a blank viewer. */
export function NoWebGL({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-paper p-6 text-center", className)} role="status">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/placeholders/no-webgl.svg" alt="Illustration of a ring" className="w-40 max-w-full rounded-xl" />
      <p className="max-w-sm text-sm text-muted-foreground">
        3D preview isn&apos;t supported on this device or browser. You can still choose your options and submit your design.
      </p>
    </div>
  );
}

