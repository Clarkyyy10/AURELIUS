"use client";

// FR-05 — 3D viewer that updates whenever an option changes.
// React Three Fiber canvas, limited OrbitControls, gentle auto-rotate that stops on interaction,
// Reset view, fullscreen, studio lighting built from Lightformers (no network download).

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CustomizationOptions, DesignConfig } from "@/types";
import { JewelryScene } from "./JewelryScene";
import { usePrefersReducedMotion, useWebGL } from "./webgl";

export type CaptureFn = () => string | null;

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
  const fitRef = useRef<(() => void) | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [interacted, setInteracted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  if (webgl === false) return <NoWebGL className={className} />;

  return (
    <div ref={wrap} className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF9] to-[#EFE7DA]", className)} role="img" aria-label={label}>
      {webgl && (
        <Canvas
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          shadows={false}
        >
          <JewelryScene config={config} options={options} autoRotate={autoRotate && !reduced && !interacted} onInteract={() => setInteracted(true)} fitRef={fitRef} />
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
              fitRef.current?.();
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

