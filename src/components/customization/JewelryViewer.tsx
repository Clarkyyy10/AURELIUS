"use client";

// FR-05 — 3D viewer that updates whenever an option changes.
// React Three Fiber canvas, limited OrbitControls, gentle auto-rotate that stops on interaction,
// Reset view, fullscreen, studio lighting built from Lightformers (no network download).

import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Maximize2, Minimize2, Minus, Plus, RotateCcw, RotateCw, Undo2 } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
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
        ctx.fillStyle = "#f5f5f5";
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

/** Camera moves for the buttons under the viewer: zoom in/out and turn left/right around the piece. */
function ViewBridge({ viewRef }: { viewRef: React.RefObject<{ zoom: (f: number) => void; turn: (a: number) => void } | null> }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    viewRef.current = {
      zoom: (factor) => {
        const { camera, controls } = get();
        const c = controls as OrbitControlsImpl | null;
        if (!c) return;
        const offset = camera.position.clone().sub(c.target);
        const d = THREE.MathUtils.clamp(offset.length() * factor, c.minDistance, c.maxDistance);
        camera.position.copy(c.target).add(offset.setLength(d));
        c.update();
      },
      turn: (angle) => {
        const { camera, controls } = get();
        const c = controls as OrbitControlsImpl | null;
        if (!c) return;
        const offset = camera.position
          .clone()
          .sub(c.target)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        camera.position.copy(c.target).add(offset);
        c.update();
      },
    };
    return () => {
      viewRef.current = null;
    };
  }, [get, viewRef]);
  return null;
}

export interface JewelryViewerProps {
  /** "below": square buttons under the view (storefront customizer); "overlay": small buttons on the view. */
  controlsPlacement?: "overlay" | "below";
  config: DesignConfig;
  options: CustomizationOptions;
  captureRef?: React.RefObject<CaptureFn | null>;
  autoRotate?: boolean;
  showControls?: boolean;
  className?: string;
  label?: string;
}

export function JewelryViewer({
  config,
  options,
  captureRef,
  autoRotate = true,
  showControls = true,
  controlsPlacement = "overlay",
  className,
  label = "3D preview of your design",
}: JewelryViewerProps) {
  const webgl = useWebGL();
  const reduced = usePrefersReducedMotion();
  const fitRef = useRef<(() => void) | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [interacted, setInteracted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const viewRef = useRef<{ zoom: (f: number) => void; turn: (a: number) => void } | null>(null);

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  if (webgl === false) return <NoWebGL className={className} />;

  if (controlsPlacement === "below") {
    const stop = () => setInteracted(true);
    const sq = "flex size-11 items-center justify-center border border-black bg-white text-black hover:bg-grey-100";
    return (
      <div>
        <div ref={wrap} className={cn("relative overflow-hidden rounded-none bg-grey-100", className)} role="img" aria-label={label}>
          {webgl && (
            <Canvas dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} shadows={false}>
              <JewelryScene config={config} options={options} autoRotate={autoRotate && !reduced && !interacted} onInteract={stop} fitRef={fitRef} />
              <SnapshotBridge captureRef={captureRef} />
              <ViewBridge viewRef={viewRef} />
            </Canvas>
          )}
        </div>
        {showControls && webgl && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="3D view controls">
              <button type="button" className={sq} aria-label="Zoom in" onClick={() => (stop(), viewRef.current?.zoom(0.8))}>
                <Plus className="size-5" aria-hidden />
              </button>
              <button type="button" className={sq} aria-label="Zoom out" onClick={() => (stop(), viewRef.current?.zoom(1.25))}>
                <Minus className="size-5" aria-hidden />
              </button>
              <button type="button" className={sq} aria-label="Turn left" onClick={() => (stop(), viewRef.current?.turn(-Math.PI / 8))}>
                <RotateCcw className="size-5" aria-hidden />
              </button>
              <button type="button" className={sq} aria-label="Turn right" onClick={() => (stop(), viewRef.current?.turn(Math.PI / 8))}>
                <RotateCw className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                className="ml-2 flex min-h-11 items-center gap-2 px-2 text-[17px] text-black hover:underline"
                onClick={() => {
                  fitRef.current?.();
                  setInteracted(false);
                }}
              >
                <Undo2 className="size-4" aria-hidden /> Reset view
              </button>
            </div>
            <p className="mt-2 text-[15px] text-grey-700">Drag to rotate. Scroll or pinch to zoom.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={wrap} className={cn("relative overflow-hidden rounded-none bg-grey-100", className)} role="img" aria-label={label}>
      {webgl && (
        <Canvas dpr={[1, 2]} gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} shadows={false}>
          <JewelryScene
            config={config}
            options={options}
            autoRotate={autoRotate && !reduced && !interacted}
            onInteract={() => setInteracted(true)}
            fitRef={fitRef}
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
      {showControls && webgl && (
        <p className="pointer-events-none absolute top-3 left-3 rounded-sm bg-paper/80 px-2.5 py-1 text-xs text-muted-foreground">
          Drag to rotate · scroll or pinch to zoom
        </p>
      )}
    </div>
  );
}

/** NFR compatibility: clear message instead of a blank viewer. */
export function NoWebGL({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-paper p-6 text-center", className)} role="status">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/placeholders/no-webgl.svg" alt="Illustration of a ring" className="w-40 max-w-full rounded-xl" />
      <p className="max-w-sm text-sm text-muted-foreground">
        3D preview isn&apos;t supported on this device or browser. You can still choose your options and submit your design.
      </p>
    </div>
  );
}
